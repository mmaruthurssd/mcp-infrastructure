/**
 * Tests for Progress Aggregation Engine
 */
import { ProgressAggregationEngine } from '../../engines/progress-aggregation-engine.js';
describe('ProgressAggregationEngine', () => {
    describe('aggregate()', () => {
        it('should aggregate progress with simple-average strategy', () => {
            const progresses = [
                { agentId: 'agent-1', currentTask: 'task-1', percentComplete: 50, status: 'working' },
                { agentId: 'agent-2', currentTask: 'task-2', percentComplete: 75, status: 'working' },
                { agentId: 'agent-3', currentTask: 'task-3', percentComplete: 25, status: 'working' },
            ];
            const result = ProgressAggregationEngine.aggregate({
                agentProgresses: progresses,
                aggregationStrategy: 'simple-average',
            });
            expect(result.overallProgress).toBeCloseTo(50, 0); // (50 + 75 + 25) / 3
            expect(result.method).toBe('simple-average');
        });
        it('should aggregate progress with weighted strategy', () => {
            const progresses = [
                {
                    agentId: 'agent-1',
                    currentTask: 'task-1',
                    percentComplete: 50,
                    taskWeight: 2,
                    status: 'working',
                },
                {
                    agentId: 'agent-2',
                    currentTask: 'task-2',
                    percentComplete: 100,
                    taskWeight: 1,
                    status: 'complete',
                },
            ];
            const result = ProgressAggregationEngine.aggregate({
                agentProgresses: progresses,
                aggregationStrategy: 'weighted',
            });
            // (50 * 2 + 100 * 1) / (2 + 1) = 200 / 3 = 66.67
            expect(result.overallProgress).toBeCloseTo(66.67, 0);
            expect(result.method).toBe('weighted');
        });
        it('should aggregate progress with critical-path strategy', () => {
            const progresses = [
                { agentId: 'agent-1', currentTask: 'task-1', percentComplete: 30, status: 'working' },
                { agentId: 'agent-2', currentTask: 'task-2', percentComplete: 80, status: 'working' },
            ];
            const result = ProgressAggregationEngine.aggregate({
                agentProgresses: progresses,
                aggregationStrategy: 'critical-path',
            });
            expect(result.method).toBe('critical-path');
            expect(result.criticalPath).toBeDefined();
        });
        it('should detect bottlenecks - blocked agent', () => {
            const progresses = [
                { agentId: 'agent-1', currentTask: 'task-1', percentComplete: 10, status: 'blocked' },
                { agentId: 'agent-2', currentTask: 'task-2', percentComplete: 90, status: 'working' },
            ];
            const result = ProgressAggregationEngine.aggregate({
                agentProgresses: progresses,
                aggregationStrategy: 'simple-average',
            });
            expect(result.bottlenecks.length).toBeGreaterThan(0);
            const blockedBottleneck = result.bottlenecks.find(b => b.reason.includes('blocked'));
            expect(blockedBottleneck).toBeDefined();
        });
        it('should detect bottlenecks - slow progress', () => {
            const progresses = [
                { agentId: 'agent-1', currentTask: 'task-1', percentComplete: 5, status: 'working' },
                { agentId: 'agent-2', currentTask: 'task-2', percentComplete: 95, status: 'working' },
            ];
            const result = ProgressAggregationEngine.aggregate({
                agentProgresses: progresses,
                aggregationStrategy: 'simple-average',
            });
            // Agent 1 is significantly behind
            const slowBottleneck = result.bottlenecks.find(b => b.reason.includes('significantly behind') || b.reason.includes('slow'));
            expect(slowBottleneck).toBeDefined();
        });
        it('should estimate completion time', () => {
            const progresses = [
                {
                    agentId: 'agent-1',
                    currentTask: 'task-1',
                    percentComplete: 50,
                    status: 'working',
                    estimatedTimeRemaining: 30,
                },
                {
                    agentId: 'agent-2',
                    currentTask: 'task-2',
                    percentComplete: 75,
                    status: 'working',
                    estimatedTimeRemaining: 10,
                },
            ];
            const result = ProgressAggregationEngine.aggregate({
                agentProgresses: progresses,
                aggregationStrategy: 'simple-average',
            });
            expect(result.estimatedCompletion).toBeInstanceOf(Date);
            expect(result.estimatedCompletion.getTime()).toBeGreaterThan(Date.now());
        });
        it('should handle all agents complete', () => {
            const progresses = [
                { agentId: 'agent-1', currentTask: 'task-1', percentComplete: 100, status: 'complete' },
                { agentId: 'agent-2', currentTask: 'task-2', percentComplete: 100, status: 'complete' },
            ];
            const result = ProgressAggregationEngine.aggregate({
                agentProgresses: progresses,
                aggregationStrategy: 'simple-average',
            });
            expect(result.overallProgress).toBe(100);
            expect(result.bottlenecks).toHaveLength(0);
        });
        it('should handle empty progress list', () => {
            const result = ProgressAggregationEngine.aggregate({
                agentProgresses: [],
                aggregationStrategy: 'simple-average',
            });
            expect(result.overallProgress).toBe(0);
            expect(result.bottlenecks).toHaveLength(0);
        });
        it('should handle single agent', () => {
            const progresses = [
                { agentId: 'agent-1', currentTask: 'task-1', percentComplete: 60, status: 'working' },
            ];
            const result = ProgressAggregationEngine.aggregate({
                agentProgresses: progresses,
                aggregationStrategy: 'simple-average',
            });
            expect(result.overallProgress).toBe(60);
        });
        it('should use default weight of 1 when not specified', () => {
            const progresses = [
                { agentId: 'agent-1', currentTask: 'task-1', percentComplete: 50, status: 'working' },
                { agentId: 'agent-2', currentTask: 'task-2', percentComplete: 100, status: 'complete' },
            ];
            const result = ProgressAggregationEngine.aggregate({
                agentProgresses: progresses,
                aggregationStrategy: 'weighted',
            });
            // Both have default weight 1, so average = (50 + 100) / 2 = 75
            expect(result.overallProgress).toBeCloseTo(75, 0);
        });
        it('should detect failed agents', () => {
            const progresses = [
                { agentId: 'agent-1', currentTask: 'task-1', percentComplete: 40, status: 'failed' },
                { agentId: 'agent-2', currentTask: 'task-2', percentComplete: 80, status: 'working' },
            ];
            const result = ProgressAggregationEngine.aggregate({
                agentProgresses: progresses,
                aggregationStrategy: 'simple-average',
            });
            const failedBottleneck = result.bottlenecks.find(b => b.reason.includes('failed'));
            expect(failedBottleneck).toBeDefined();
        });
        it('should provide agent status map', () => {
            const progresses = [
                { agentId: 'agent-1', currentTask: 'task-1', percentComplete: 50, status: 'working' },
                { agentId: 'agent-2', currentTask: 'task-2', percentComplete: 75, status: 'working' },
            ];
            const result = ProgressAggregationEngine.aggregate({
                agentProgresses: progresses,
                aggregationStrategy: 'simple-average',
            });
            expect(result.agentStatuses).toBeInstanceOf(Map);
            expect(result.agentStatuses.size).toBe(2);
            expect(result.agentStatuses.get('agent-1')).toBeDefined();
        });
        it('should provide suggestions for bottlenecks', () => {
            const progresses = [
                { agentId: 'agent-1', currentTask: 'task-1', percentComplete: 10, status: 'blocked' },
                { agentId: 'agent-2', currentTask: 'task-2', percentComplete: 90, status: 'working' },
            ];
            const result = ProgressAggregationEngine.aggregate({
                agentProgresses: progresses,
                aggregationStrategy: 'simple-average',
            });
            const bottleneck = result.bottlenecks[0];
            expect(bottleneck.suggestion).toBeTruthy();
            expect(bottleneck.suggestion.length).toBeGreaterThan(0);
        });
        it('should assess bottleneck impact', () => {
            const progresses = [
                { agentId: 'agent-1', currentTask: 'task-1', percentComplete: 5, status: 'working' },
                { agentId: 'agent-2', currentTask: 'task-2', percentComplete: 95, status: 'working' },
            ];
            const result = ProgressAggregationEngine.aggregate({
                agentProgresses: progresses,
                aggregationStrategy: 'simple-average',
            });
            if (result.bottlenecks.length > 0) {
                const bottleneck = result.bottlenecks[0];
                expect(['low', 'medium', 'high']).toContain(bottleneck.impact);
            }
        });
    });
});
//# sourceMappingURL=progress-aggregation-engine.test.js.map