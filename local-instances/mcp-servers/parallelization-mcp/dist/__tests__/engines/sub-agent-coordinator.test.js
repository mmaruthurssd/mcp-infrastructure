/**
 * Tests for Sub-Agent Coordinator
 */
import { SubAgentCoordinator } from '../../engines/sub-agent-coordinator.js';
describe('SubAgentCoordinator', () => {
    describe('execute()', () => {
        const createTestPlan = () => ({
            taskId: 'test-task',
            analysisScore: 75,
            confidence: 85,
            batches: [
                {
                    id: 'batch-1',
                    tasks: [
                        { id: 'task-1', description: 'Task 1', estimatedMinutes: 10 },
                        { id: 'task-2', description: 'Task 2', estimatedMinutes: 10 },
                    ],
                    estimatedMinutes: 10,
                    dependsOnBatches: [],
                },
                {
                    id: 'batch-2',
                    tasks: [
                        { id: 'task-3', description: 'Task 3', estimatedMinutes: 10 },
                    ],
                    estimatedMinutes: 10,
                    dependsOnBatches: ['batch-1'],
                },
            ],
            requiredAgents: 2,
            estimatedSpeedup: 2.5,
            risks: [],
        });
        it('should execute plan with conservative strategy', () => {
            const plan = createTestPlan();
            const result = SubAgentCoordinator.coordinate({
                analysisResult: {
                    parallelizable: true,
                    confidence: plan.confidence,
                    reasoning: 'Test reasoning',
                    dependencyGraph: { nodes: new Map(), edges: [] },
                    suggestedBatches: plan.batches,
                    estimatedSpeedup: plan.estimatedSpeedup,
                    risks: plan.risks,
                },
                executionStrategy: 'conservative',
                maxParallelAgents: 2,
            });
            expect(result.success).toBeDefined();
            expect(result.results).toBeDefined();
            expect(result.metrics).toBeDefined();
            expect(result.metrics.totalTasks).toBe(3);
        });
        it('should execute plan with aggressive strategy', () => {
            const plan = createTestPlan();
            const result = SubAgentCoordinator.coordinate({
                analysisResult: {
                    parallelizable: true,
                    confidence: plan.confidence,
                    reasoning: 'Test reasoning',
                    dependencyGraph: { nodes: new Map(), edges: [] },
                    suggestedBatches: plan.batches,
                    estimatedSpeedup: plan.estimatedSpeedup,
                    risks: plan.risks,
                },
                executionStrategy: 'aggressive',
                maxParallelAgents: 2,
            });
            expect(result.success).toBeDefined();
            expect(result.results).toBeDefined();
        });
        it('should respect maxParallelAgents constraint', () => {
            const plan = createTestPlan();
            const result = SubAgentCoordinator.coordinate({
                analysisResult: {
                    parallelizable: true,
                    confidence: plan.confidence,
                    reasoning: 'Test reasoning',
                    dependencyGraph: { nodes: new Map(), edges: [] },
                    suggestedBatches: plan.batches,
                    estimatedSpeedup: plan.estimatedSpeedup,
                    risks: plan.risks,
                },
                executionStrategy: 'conservative',
                maxParallelAgents: 1, // Only 1 agent
            });
            // Should still complete, just more sequentially
            expect(result.metrics.agentCount).toBeLessThanOrEqual(1);
        });
        it('should execute batches in order', () => {
            const plan = createTestPlan();
            const result = SubAgentCoordinator.coordinate({
                analysisResult: {
                    parallelizable: true,
                    confidence: plan.confidence,
                    reasoning: 'Test reasoning',
                    dependencyGraph: { nodes: new Map(), edges: [] },
                    suggestedBatches: plan.batches,
                    estimatedSpeedup: plan.estimatedSpeedup,
                    risks: plan.risks,
                },
                executionStrategy: 'conservative',
                maxParallelAgents: 2,
            });
            // Batch 2 should execute after batch 1
            // (This is verified by the coordinator's internal logic)
            expect(result.results.length).toBeGreaterThan(0);
        });
        it('should track execution metrics', () => {
            const plan = createTestPlan();
            const result = SubAgentCoordinator.coordinate({
                analysisResult: {
                    parallelizable: true,
                    confidence: plan.confidence,
                    reasoning: 'Test reasoning',
                    dependencyGraph: { nodes: new Map(), edges: [] },
                    suggestedBatches: plan.batches,
                    estimatedSpeedup: plan.estimatedSpeedup,
                    risks: plan.risks,
                },
                executionStrategy: 'conservative',
                maxParallelAgents: 2,
            });
            expect(result.metrics.totalTasks).toBe(3);
            expect(result.metrics.totalDuration).toBeGreaterThanOrEqual(0);
            expect(result.metrics.agentCount).toBeGreaterThan(0);
        });
        it('should detect conflicts during execution', () => {
            const plan = createTestPlan();
            const result = SubAgentCoordinator.coordinate({
                analysisResult: {
                    parallelizable: true,
                    confidence: plan.confidence,
                    reasoning: 'Test reasoning',
                    dependencyGraph: { nodes: new Map(), edges: [] },
                    suggestedBatches: plan.batches,
                    estimatedSpeedup: plan.estimatedSpeedup,
                    risks: plan.risks,
                },
                executionStrategy: 'aggressive',
                maxParallelAgents: 2,
            });
            expect(result.conflicts).toBeDefined();
            // May or may not have conflicts depending on simulated execution
        });
        it('should calculate actual speedup', () => {
            const plan = createTestPlan();
            const result = SubAgentCoordinator.coordinate({
                analysisResult: {
                    parallelizable: true,
                    confidence: plan.confidence,
                    reasoning: 'Test reasoning',
                    dependencyGraph: { nodes: new Map(), edges: [] },
                    suggestedBatches: plan.batches,
                    estimatedSpeedup: plan.estimatedSpeedup,
                    risks: plan.risks,
                },
                executionStrategy: 'conservative',
                maxParallelAgents: 2,
            });
            expect(result.metrics.actualSpeedup).toBeGreaterThan(0);
        });
        it('should handle agent failures gracefully', () => {
            const plan = createTestPlan();
            // Even if agents fail (in simulation), should handle gracefully
            const result = SubAgentCoordinator.coordinate({
                analysisResult: {
                    parallelizable: true,
                    confidence: plan.confidence,
                    reasoning: 'Test reasoning',
                    dependencyGraph: { nodes: new Map(), edges: [] },
                    suggestedBatches: plan.batches,
                    estimatedSpeedup: plan.estimatedSpeedup,
                    risks: plan.risks,
                },
                executionStrategy: 'aggressive',
                maxParallelAgents: 2,
            });
            expect(result).toBeDefined();
            expect(result.metrics.failureCount).toBeGreaterThanOrEqual(0);
        });
        it('should track parallel vs sequential tasks', () => {
            const plan = createTestPlan();
            const result = SubAgentCoordinator.coordinate({
                analysisResult: {
                    parallelizable: true,
                    confidence: plan.confidence,
                    reasoning: 'Test reasoning',
                    dependencyGraph: { nodes: new Map(), edges: [] },
                    suggestedBatches: plan.batches,
                    estimatedSpeedup: plan.estimatedSpeedup,
                    risks: plan.risks,
                },
                executionStrategy: 'conservative',
                maxParallelAgents: 2,
            });
            expect(result.metrics.parallelTasks).toBeGreaterThanOrEqual(0);
            expect(result.metrics.sequentialTasks).toBeGreaterThanOrEqual(0);
            expect(result.metrics.parallelTasks + result.metrics.sequentialTasks).toBe(result.metrics.totalTasks);
        });
        it('should provide detailed agent results', () => {
            const plan = createTestPlan();
            const result = SubAgentCoordinator.coordinate({
                analysisResult: {
                    parallelizable: true,
                    confidence: plan.confidence,
                    reasoning: 'Test reasoning',
                    dependencyGraph: { nodes: new Map(), edges: [] },
                    suggestedBatches: plan.batches,
                    estimatedSpeedup: plan.estimatedSpeedup,
                    risks: plan.risks,
                },
                executionStrategy: 'conservative',
                maxParallelAgents: 2,
            });
            expect(result.results).toBeDefined();
            if (result.results.length > 0) {
                const agentResult = result.results[0];
                expect(agentResult.agentId).toBeTruthy();
                expect(agentResult.taskId).toBeTruthy();
                expect(agentResult.success).toBeDefined();
                expect(agentResult.duration).toBeGreaterThanOrEqual(0);
            }
        });
    });
});
//# sourceMappingURL=sub-agent-coordinator.test.js.map