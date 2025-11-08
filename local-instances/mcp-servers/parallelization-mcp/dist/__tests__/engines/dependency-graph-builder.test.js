/**
 * Tests for Dependency Graph Builder
 */
import { DependencyGraphBuilder } from '../../engines/dependency-graph-builder.js';
describe('DependencyGraphBuilder', () => {
    describe('build()', () => {
        it('should build graph for independent tasks', () => {
            const tasks = [
                { id: '1', description: 'Task 1' },
                { id: '2', description: 'Task 2' },
                { id: '3', description: 'Task 3' },
            ];
            const result = DependencyGraphBuilder.build({ tasks, detectImplicit: false });
            expect(result.graph.nodes.size).toBe(3);
            expect(result.graph.edges).toHaveLength(0);
            expect(result.hasCycles).toBe(false);
            expect(result.implicitDependencies).toHaveLength(0);
        });
        it('should build graph with explicit dependencies', () => {
            const tasks = [
                { id: '1', description: 'Task 1' },
                { id: '2', description: 'Task 2', dependsOn: ['1'] },
                { id: '3', description: 'Task 3', dependsOn: ['1', '2'] },
            ];
            const result = DependencyGraphBuilder.build({ tasks, detectImplicit: false });
            expect(result.graph.nodes.size).toBe(3);
            expect(result.graph.edges).toHaveLength(3);
            expect(result.hasCycles).toBe(false);
            // Verify edges
            const edge1to2 = result.graph.edges.find(e => e.from === '1' && e.to === '2');
            expect(edge1to2).toBeDefined();
            expect(edge1to2?.type).toBe('explicit');
        });
        it('should detect simple cycles', () => {
            const tasks = [
                { id: '1', description: 'Task 1', dependsOn: ['2'] },
                { id: '2', description: 'Task 2', dependsOn: ['1'] },
            ];
            const result = DependencyGraphBuilder.build({ tasks, detectImplicit: false });
            expect(result.hasCycles).toBe(true);
            expect(result.cycles).toBeDefined();
            expect(result.cycles.length).toBeGreaterThan(0);
        });
        it('should detect complex cycles', () => {
            const tasks = [
                { id: '1', description: 'Task 1', dependsOn: ['3'] },
                { id: '2', description: 'Task 2', dependsOn: ['1'] },
                { id: '3', description: 'Task 3', dependsOn: ['2'] },
            ];
            const result = DependencyGraphBuilder.build({ tasks, detectImplicit: false });
            expect(result.hasCycles).toBe(true);
        });
        it('should detect self-referencing cycles', () => {
            const tasks = [
                { id: '1', description: 'Task 1', dependsOn: ['1'] },
            ];
            const result = DependencyGraphBuilder.build({ tasks, detectImplicit: false });
            expect(result.hasCycles).toBe(true);
        });
        it('should detect implicit dependencies when enabled', () => {
            const tasks = [
                { id: '1', description: 'Read config file' },
                { id: '2', description: 'Update config file' },
                { id: '3', description: 'Validate config' },
            ];
            const result = DependencyGraphBuilder.build({ tasks, detectImplicit: true });
            // Should detect implicit dependencies due to shared "config" keyword
            expect(result.implicitDependencies.length).toBeGreaterThan(0);
            const implicit = result.implicitDependencies[0];
            expect(implicit.confidence).toBeGreaterThan(0);
            expect(implicit.reasoning).toBeTruthy();
        });
        it('should not detect implicit dependencies when disabled', () => {
            const tasks = [
                { id: '1', description: 'Read config file' },
                { id: '2', description: 'Update config file' },
            ];
            const result = DependencyGraphBuilder.build({ tasks, detectImplicit: false });
            expect(result.implicitDependencies).toHaveLength(0);
        });
        it('should ignore invalid dependency references', () => {
            const tasks = [
                { id: '1', description: 'Task 1', dependsOn: ['999'] }, // Non-existent
                { id: '2', description: 'Task 2' },
            ];
            const result = DependencyGraphBuilder.build({ tasks, detectImplicit: false });
            // Should ignore the invalid dependency
            expect(result.graph.edges).toHaveLength(0);
        });
        it('should handle empty task list', () => {
            const result = DependencyGraphBuilder.build({ tasks: [], detectImplicit: false });
            expect(result.graph.nodes.size).toBe(0);
            expect(result.graph.edges).toHaveLength(0);
            expect(result.hasCycles).toBe(false);
        });
        it('should detect file-based implicit dependencies', () => {
            const tasks = [
                { id: '1', description: 'Create user.ts file' },
                { id: '2', description: 'Import from user.ts' },
            ];
            const result = DependencyGraphBuilder.build({ tasks, detectImplicit: true });
            const fileImplicit = result.implicitDependencies.find(d => d.reasoning.includes('file') || d.reasoning.includes('user.ts'));
            expect(fileImplicit).toBeDefined();
        });
        it('should detect action-based implicit dependencies', () => {
            const tasks = [
                { id: '1', description: 'Create database table' },
                { id: '2', description: 'Query database table' },
            ];
            const result = DependencyGraphBuilder.build({ tasks, detectImplicit: true });
            expect(result.implicitDependencies.length).toBeGreaterThan(0);
        });
    });
    describe('getTopologicalLevels()', () => {
        it('should return single level for independent tasks', () => {
            const tasks = [
                { id: '1', description: 'Task 1' },
                { id: '2', description: 'Task 2' },
                { id: '3', description: 'Task 3' },
            ];
            const graph = DependencyGraphBuilder.build({ tasks, detectImplicit: false }).graph;
            const levels = DependencyGraphBuilder.getTopologicalLevels(graph);
            expect(levels).toHaveLength(1);
            expect(levels[0]).toHaveLength(3);
        });
        it('should return multiple levels for dependent tasks', () => {
            const tasks = [
                { id: '1', description: 'Task 1' },
                { id: '2', description: 'Task 2', dependsOn: ['1'] },
                { id: '3', description: 'Task 3', dependsOn: ['2'] },
            ];
            const graph = DependencyGraphBuilder.build({ tasks, detectImplicit: false }).graph;
            const levels = DependencyGraphBuilder.getTopologicalLevels(graph);
            expect(levels).toHaveLength(3);
            expect(levels[0]).toHaveLength(1); // Task 1
            expect(levels[1]).toHaveLength(1); // Task 2
            expect(levels[2]).toHaveLength(1); // Task 3
        });
        it('should group parallel tasks in same level', () => {
            const tasks = [
                { id: '1', description: 'Task 1' },
                { id: '2', description: 'Task 2', dependsOn: ['1'] },
                { id: '3', description: 'Task 3', dependsOn: ['1'] },
                { id: '4', description: 'Task 4', dependsOn: ['2', '3'] },
            ];
            const graph = DependencyGraphBuilder.build({ tasks, detectImplicit: false }).graph;
            const levels = DependencyGraphBuilder.getTopologicalLevels(graph);
            expect(levels).toHaveLength(3);
            expect(levels[0]).toHaveLength(1); // Task 1
            expect(levels[1]).toHaveLength(2); // Tasks 2 and 3 (parallel)
            expect(levels[2]).toHaveLength(1); // Task 4
        });
        it('should handle complex DAG', () => {
            const tasks = [
                { id: '1', description: 'Task 1' },
                { id: '2', description: 'Task 2' },
                { id: '3', description: 'Task 3', dependsOn: ['1'] },
                { id: '4', description: 'Task 4', dependsOn: ['1', '2'] },
                { id: '5', description: 'Task 5', dependsOn: ['3', '4'] },
            ];
            const graph = DependencyGraphBuilder.build({ tasks, detectImplicit: false }).graph;
            const levels = DependencyGraphBuilder.getTopologicalLevels(graph);
            expect(levels.length).toBeGreaterThan(0);
            // Verify task 1 and 2 are in level 0
            expect(levels[0]).toEqual(expect.arrayContaining([
                expect.objectContaining({ id: '1' }),
                expect.objectContaining({ id: '2' }),
            ]));
        });
        it('should return empty array for empty graph', () => {
            const graph = DependencyGraphBuilder.build({ tasks: [], detectImplicit: false }).graph;
            const levels = DependencyGraphBuilder.getTopologicalLevels(graph);
            expect(levels).toHaveLength(0);
        });
    });
});
//# sourceMappingURL=dependency-graph-builder.test.js.map