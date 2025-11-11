/**
 * Tests for Learning & Optimization Layer
 */
import { LearningOptimizer } from '../../utils/learning-optimizer.js';
describe('LearningOptimizer', () => {
    describe('recordExecution()', () => {
        const createTestRecord = () => ({
            executionId: 'exec-1',
            timestamp: new Date(),
            taskDescription: 'Test task',
            analysis: {
                parallelizable: true,
                confidence: 80,
                reasoning: 'Good parallelization potential',
                dependencyGraph: { nodes: new Map(), edges: [] },
                suggestedBatches: [
                    {
                        id: 'batch-1',
                        tasks: [{ id: '1', description: 'Task 1' }],
                        estimatedMinutes: 10,
                        dependsOnBatches: [],
                    },
                ],
                estimatedSpeedup: 2.5,
                risks: [],
            },
            outcome: {
                success: true,
                results: [],
                conflicts: [],
                aggregatedProgress: {
                    percentComplete: 100,
                    method: 'simple-average',
                },
                metrics: {
                    totalTasks: 3,
                    parallelTasks: 2,
                    sequentialTasks: 1,
                    totalDuration: 100,
                    sequentialDuration: 250,
                    actualSpeedup: 2.5,
                    agentCount: 2,
                    conflictCount: 0,
                    failureCount: 0,
                    retryCount: 0,
                },
            },
            actualSpeedup: 2.5,
            metrics: {
                totalTasks: 3,
                parallelTasks: 2,
                sequentialTasks: 1,
                totalDuration: 100,
                sequentialDuration: 250,
                actualSpeedup: 2.5,
                agentCount: 2,
                conflictCount: 0,
                failureCount: 0,
                retryCount: 0,
            },
            conflicts: [],
            batches: [],
        });
        it('should record execution successfully', () => {
            const record = createTestRecord();
            LearningOptimizer.recordExecution(record);
            const history = LearningOptimizer.getHistory();
            expect(history.length).toBeGreaterThan(0);
        });
        it('should learn patterns from multiple executions', () => {
            const record1 = createTestRecord();
            record1.executionId = 'exec-1';
            record1.actualSpeedup = 2.5;
            const record2 = createTestRecord();
            record2.executionId = 'exec-2';
            record2.actualSpeedup = 3.0;
            LearningOptimizer.recordExecution(record1);
            LearningOptimizer.recordExecution(record2);
            const patterns = LearningOptimizer.getLearnedPatterns();
            expect(patterns).toBeDefined();
        });
    });
    describe('recordFailure()', () => {
        it('should record execution failure', () => {
            LearningOptimizer.recordFailure({
                executionId: 'failed-1',
                timestamp: new Date(),
                taskDescription: 'Failed task',
                rootCause: 'Circular dependency',
                category: 'dependency',
                context: {},
            });
            const failures = LearningOptimizer.getFailures();
            expect(failures.length).toBeGreaterThan(0);
        });
        it('should categorize failures', () => {
            LearningOptimizer.recordFailure({
                executionId: 'failed-2',
                timestamp: new Date(),
                taskDescription: 'Conflict task',
                rootCause: 'File conflict',
                category: 'conflict',
                context: {},
            });
            const analysis = LearningOptimizer.analyzeFailures();
            expect(analysis).toBeDefined();
        });
    });
    describe('getSuggestions()', () => {
        it('should provide suggestions based on task description', () => {
            const tasks = [
                { id: '1', description: 'Read database' },
                { id: '2', description: 'Update database' },
            ];
            const suggestions = LearningOptimizer.getSuggestions(tasks);
            expect(suggestions).toBeDefined();
            expect(Array.isArray(suggestions)).toBe(true);
        });
        it('should suggest caution for risky patterns', () => {
            const tasks = [
                { id: '1', description: 'Delete user data' },
                { id: '2', description: 'Create user data' },
            ];
            const suggestions = LearningOptimizer.getSuggestions(tasks);
            expect(suggestions.length).toBeGreaterThan(0);
        });
    });
    describe('generateBenchmark()', () => {
        it('should generate benchmark from history', () => {
            const record = {
                executionId: 'exec-bench-1',
                timestamp: new Date(),
                taskDescription: 'Benchmark task',
                analysis: {
                    parallelizable: true,
                    confidence: 80,
                    reasoning: 'Test',
                    dependencyGraph: { nodes: new Map(), edges: [] },
                    suggestedBatches: [],
                    estimatedSpeedup: 2.0,
                    risks: [],
                },
                outcome: {
                    success: true,
                    results: [],
                    conflicts: [],
                    aggregatedProgress: { percentComplete: 100, method: 'simple-average' },
                    metrics: {
                        totalTasks: 5,
                        parallelTasks: 4,
                        sequentialTasks: 1,
                        totalDuration: 100,
                        sequentialDuration: 200,
                        actualSpeedup: 2.0,
                        agentCount: 2,
                        conflictCount: 0,
                        failureCount: 0,
                        retryCount: 0,
                    },
                },
                actualSpeedup: 2.0,
                metrics: {
                    totalTasks: 5,
                    parallelTasks: 4,
                    sequentialTasks: 1,
                    totalDuration: 100,
                    sequentialDuration: 200,
                    actualSpeedup: 2.0,
                    agentCount: 2,
                    conflictCount: 0,
                    failureCount: 0,
                    retryCount: 0,
                },
                conflicts: [],
                batches: [],
            };
            LearningOptimizer.recordExecution(record);
            const benchmark = LearningOptimizer.generateBenchmark();
            expect(benchmark).toBeDefined();
            expect(benchmark.averageSpeedup).toBeGreaterThan(0);
        });
        it('should calculate average metrics', () => {
            const benchmark = LearningOptimizer.generateBenchmark();
            expect(benchmark.averageSpeedup).toBeGreaterThanOrEqual(0);
            expect(benchmark.totalExecutions).toBeGreaterThanOrEqual(0);
        });
    });
    describe('getLearnedPatterns()', () => {
        it('should return learned patterns', () => {
            const patterns = LearningOptimizer.getLearnedPatterns();
            expect(Array.isArray(patterns)).toBe(true);
        });
    });
    describe('analyzeFailures()', () => {
        it('should analyze failure patterns', () => {
            LearningOptimizer.recordFailure({
                executionId: 'fail-1',
                timestamp: new Date(),
                taskDescription: 'Test',
                rootCause: 'Timeout',
                category: 'performance',
                context: {},
            });
            const analysis = LearningOptimizer.analyzeFailures();
            expect(analysis).toBeDefined();
        });
    });
    describe('getHistory()', () => {
        it('should return execution history', () => {
            const history = LearningOptimizer.getHistory();
            expect(Array.isArray(history)).toBe(true);
        });
    });
    describe('getFailures()', () => {
        it('should return failure history', () => {
            const failures = LearningOptimizer.getFailures();
            expect(Array.isArray(failures)).toBe(true);
        });
    });
    describe('clearHistory()', () => {
        it('should clear all history', () => {
            LearningOptimizer.clearHistory();
            const history = LearningOptimizer.getHistory();
            const failures = LearningOptimizer.getFailures();
            expect(history).toHaveLength(0);
            expect(failures).toHaveLength(0);
        });
    });
});
//# sourceMappingURL=learning-optimizer.test.js.map