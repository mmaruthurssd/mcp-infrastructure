/**
 * Tests for Task Analysis Engine
 */
import { TaskAnalysisEngine } from '../../engines/task-analysis-engine.js';
describe('TaskAnalysisEngine', () => {
    describe('analyze()', () => {
        it('should return non-parallelizable for empty subtasks', () => {
            const result = TaskAnalysisEngine.analyze({
                taskDescription: 'Test task',
                subtasks: [],
            });
            expect(result.parallelizable).toBe(false);
            expect(result.confidence).toBe(0);
            expect(result.reasoning).toContain('No subtasks');
            expect(result.estimatedSpeedup).toBe(1.0);
        });
        it('should return non-parallelizable for single subtask', () => {
            const subtasks = [
                { id: '1', description: 'Single task', estimatedMinutes: 10 },
            ];
            const result = TaskAnalysisEngine.analyze({
                taskDescription: 'Test task',
                subtasks,
            });
            expect(result.parallelizable).toBe(false);
            expect(result.confidence).toBe(100);
            expect(result.reasoning).toContain('Only one subtask');
            expect(result.estimatedSpeedup).toBe(1.0);
            expect(result.suggestedBatches).toHaveLength(1);
        });
        it('should detect circular dependencies', () => {
            const subtasks = [
                { id: '1', description: 'Task 1', dependsOn: ['2'] },
                { id: '2', description: 'Task 2', dependsOn: ['1'] },
            ];
            const result = TaskAnalysisEngine.analyze({
                taskDescription: 'Test task',
                subtasks,
            });
            expect(result.parallelizable).toBe(false);
            expect(result.reasoning).toContain('Circular dependencies');
            expect(result.risks).toHaveLength(1);
            expect(result.risks[0].severity).toBe('critical');
        });
        it('should analyze independent tasks as fully parallelizable', () => {
            const subtasks = [
                { id: '1', description: 'Task 1', estimatedMinutes: 10 },
                { id: '2', description: 'Task 2', estimatedMinutes: 15 },
                { id: '3', description: 'Task 3', estimatedMinutes: 20 },
            ];
            const result = TaskAnalysisEngine.analyze({
                taskDescription: 'Test task',
                subtasks,
            });
            expect(result.parallelizable).toBe(true);
            expect(result.confidence).toBeGreaterThan(0);
            expect(result.estimatedSpeedup).toBeGreaterThan(1);
            expect(result.suggestedBatches).toHaveLength(1); // All in one batch
            expect(result.suggestedBatches[0].tasks).toHaveLength(3);
        });
        it('should create multiple batches for dependent tasks', () => {
            const subtasks = [
                { id: '1', description: 'Task 1', estimatedMinutes: 10 },
                { id: '2', description: 'Task 2', estimatedMinutes: 10, dependsOn: ['1'] },
                { id: '3', description: 'Task 3', estimatedMinutes: 10, dependsOn: ['1'] },
            ];
            const result = TaskAnalysisEngine.analyze({
                taskDescription: 'Test task',
                subtasks,
            });
            expect(result.parallelizable).toBe(true);
            expect(result.suggestedBatches.length).toBeGreaterThan(1);
            // Batch 1 should have task 1
            expect(result.suggestedBatches[0].tasks).toContainEqual(expect.objectContaining({ id: '1' }));
            // Batch 2 should have tasks 2 and 3
            expect(result.suggestedBatches[1].tasks).toHaveLength(2);
        });
        it('should calculate reasonable speedup for parallel tasks', () => {
            const subtasks = [
                { id: '1', description: 'Task 1', estimatedMinutes: 20 },
                { id: '2', description: 'Task 2', estimatedMinutes: 20 },
                { id: '3', description: 'Task 3', estimatedMinutes: 20 },
            ];
            const result = TaskAnalysisEngine.analyze({
                taskDescription: 'Test task',
                subtasks,
            });
            // Sequential: 60 minutes, Parallel: 20 minutes -> 3x speedup
            expect(result.estimatedSpeedup).toBeCloseTo(3, 1);
        });
        it('should identify risks for implicit dependencies', () => {
            const subtasks = [
                { id: '1', description: 'Read database records', estimatedMinutes: 10 },
                { id: '2', description: 'Update database records', estimatedMinutes: 10 },
                { id: '3', description: 'Query database', estimatedMinutes: 10 },
            ];
            const result = TaskAnalysisEngine.analyze({
                taskDescription: 'Test task',
                subtasks,
            });
            // Should detect potential implicit dependencies due to "database" keyword
            expect(result.risks.length).toBeGreaterThan(0);
        });
        it('should not parallelize when score is too low', () => {
            const subtasks = [
                { id: '1', description: 'Task 1', estimatedMinutes: 1 },
                { id: '2', description: 'Task 2', estimatedMinutes: 1, dependsOn: ['1'] },
                { id: '3', description: 'Task 3', estimatedMinutes: 1, dependsOn: ['2'] },
            ];
            const result = TaskAnalysisEngine.analyze({
                taskDescription: 'Test task',
                subtasks,
            });
            // Long chain of dependencies with short tasks = low parallelization value
            // Should recommend against parallelization
            expect(result.parallelizable).toBe(false);
        });
        it('should handle tasks without estimated minutes', () => {
            const subtasks = [
                { id: '1', description: 'Task 1' },
                { id: '2', description: 'Task 2' },
            ];
            const result = TaskAnalysisEngine.analyze({
                taskDescription: 'Test task',
                subtasks,
            });
            // Should use default 10 minutes per task
            expect(result.estimatedSpeedup).toBeCloseTo(2, 1);
        });
        it('should provide detailed reasoning', () => {
            const subtasks = [
                { id: '1', description: 'Task 1', estimatedMinutes: 30 },
                { id: '2', description: 'Task 2', estimatedMinutes: 30 },
            ];
            const result = TaskAnalysisEngine.analyze({
                taskDescription: 'Test task',
                subtasks,
            });
            expect(result.reasoning).toBeTruthy();
            expect(result.reasoning.length).toBeGreaterThan(0);
            expect(result.reasoning).toContain('speedup');
        });
        it('should identify unbalanced batch risk', () => {
            const subtasks = [
                { id: '1', description: 'Short task', estimatedMinutes: 5 },
                { id: '2', description: 'Long task', estimatedMinutes: 60, dependsOn: ['1'] },
            ];
            const result = TaskAnalysisEngine.analyze({
                taskDescription: 'Test task',
                subtasks,
            });
            const unbalancedRisk = result.risks.find(r => r.description.includes('Unbalanced'));
            expect(unbalancedRisk).toBeDefined();
        });
        it('should identify large batch risk', () => {
            const subtasks = Array.from({ length: 15 }, (_, i) => ({
                id: `${i + 1}`,
                description: `Task ${i + 1}`,
                estimatedMinutes: 10,
            }));
            const result = TaskAnalysisEngine.analyze({
                taskDescription: 'Test task',
                subtasks,
            });
            const largeBatchRisk = result.risks.find(r => r.description.includes('>10 tasks'));
            expect(largeBatchRisk).toBeDefined();
        });
        it('should handle complex dependency chains', () => {
            const subtasks = [
                { id: '1', description: 'Task 1', estimatedMinutes: 10 },
                { id: '2', description: 'Task 2', estimatedMinutes: 10, dependsOn: ['1'] },
                { id: '3', description: 'Task 3', estimatedMinutes: 10, dependsOn: ['1'] },
                { id: '4', description: 'Task 4', estimatedMinutes: 10, dependsOn: ['2', '3'] },
            ];
            const result = TaskAnalysisEngine.analyze({
                taskDescription: 'Test task',
                subtasks,
            });
            expect(result.parallelizable).toBe(true);
            expect(result.suggestedBatches.length).toBe(3); // Level 0: [1], Level 1: [2,3], Level 2: [4]
        });
    });
});
//# sourceMappingURL=task-analysis-engine.test.js.map