/**
 * Tests for Performance Tracker
 */
import { PerformanceTracker } from '../../utils/performance-tracker.js';
describe('PerformanceTracker', () => {
    describe('snapshot()', () => {
        it('should create performance snapshot', () => {
            PerformanceTracker.snapshot('test-operation', {
                duration: 100,
                tasksProcessed: 5,
                agentsUsed: 2,
            });
            const stats = PerformanceTracker.getStatistics('test-operation');
            expect(stats).toBeDefined();
        });
        it('should track multiple snapshots for same operation', () => {
            PerformanceTracker.snapshot('multi-test', {
                duration: 100,
                tasksProcessed: 5,
            });
            PerformanceTracker.snapshot('multi-test', {
                duration: 120,
                tasksProcessed: 6,
            });
            const stats = PerformanceTracker.getStatistics('multi-test');
            expect(stats.count).toBeGreaterThanOrEqual(2);
        });
    });
    describe('getStatistics()', () => {
        it('should return statistics for operation', () => {
            PerformanceTracker.snapshot('stats-test', {
                duration: 100,
                tasksProcessed: 10,
            });
            const stats = PerformanceTracker.getStatistics('stats-test');
            expect(stats.count).toBeGreaterThan(0);
            expect(stats.avgDuration).toBeGreaterThanOrEqual(0);
        });
        it('should calculate average metrics', () => {
            PerformanceTracker.snapshot('avg-test', { duration: 100 });
            PerformanceTracker.snapshot('avg-test', { duration: 200 });
            const stats = PerformanceTracker.getStatistics('avg-test');
            expect(stats.avgDuration).toBeCloseTo(150, 0);
        });
        it('should return undefined for unknown operation', () => {
            const stats = PerformanceTracker.getStatistics('non-existent-operation');
            expect(stats).toBeUndefined();
        });
    });
    describe('compareStrategies()', () => {
        it('should compare two strategies', () => {
            PerformanceTracker.snapshot('conservative', {
                duration: 100,
                tasksProcessed: 5,
            });
            PerformanceTracker.snapshot('aggressive', {
                duration: 80,
                tasksProcessed: 5,
            });
            const comparison = PerformanceTracker.compareStrategies('conservative', 'aggressive');
            expect(comparison).toBeDefined();
            expect(comparison.strategy1).toBe('conservative');
            expect(comparison.strategy2).toBe('aggressive');
        });
        it('should identify faster strategy', () => {
            PerformanceTracker.snapshot('slow-strategy', { duration: 200 });
            PerformanceTracker.snapshot('fast-strategy', { duration: 100 });
            const comparison = PerformanceTracker.compareStrategies('slow-strategy', 'fast-strategy');
            expect(comparison.fasterStrategy).toBe('fast-strategy');
        });
    });
    describe('detectRegression()', () => {
        it('should detect performance regression', () => {
            // Add baseline snapshots
            PerformanceTracker.snapshot('regression-test', { duration: 100 });
            PerformanceTracker.snapshot('regression-test', { duration: 105 });
            // Add regressed snapshot
            PerformanceTracker.snapshot('regression-test', { duration: 200 });
            const regression = PerformanceTracker.detectRegression('regression-test', 1.5);
            expect(regression).toBe(true);
        });
        it('should not detect regression for stable performance', () => {
            PerformanceTracker.snapshot('stable-test', { duration: 100 });
            PerformanceTracker.snapshot('stable-test', { duration: 105 });
            PerformanceTracker.snapshot('stable-test', { duration: 102 });
            const regression = PerformanceTracker.detectRegression('stable-test', 1.5);
            expect(regression).toBe(false);
        });
        it('should handle operations with insufficient data', () => {
            PerformanceTracker.snapshot('insufficient-data', { duration: 100 });
            const regression = PerformanceTracker.detectRegression('insufficient-data', 1.5);
            expect(regression).toBe(false);
        });
    });
    describe('getAllOperations()', () => {
        it('should return list of all tracked operations', () => {
            PerformanceTracker.snapshot('op1', { duration: 100 });
            PerformanceTracker.snapshot('op2', { duration: 200 });
            const operations = PerformanceTracker.getAllOperations();
            expect(operations).toContain('op1');
            expect(operations).toContain('op2');
        });
    });
    describe('clearData()', () => {
        it('should clear all performance data', () => {
            PerformanceTracker.snapshot('clear-test', { duration: 100 });
            PerformanceTracker.clearData();
            const operations = PerformanceTracker.getAllOperations();
            expect(operations).toHaveLength(0);
        });
        it('should clear data for specific operation', () => {
            PerformanceTracker.snapshot('clear-specific', { duration: 100 });
            PerformanceTracker.snapshot('keep-this', { duration: 200 });
            PerformanceTracker.clearData('clear-specific');
            const stats1 = PerformanceTracker.getStatistics('clear-specific');
            const stats2 = PerformanceTracker.getStatistics('keep-this');
            expect(stats1).toBeUndefined();
            expect(stats2).toBeDefined();
        });
    });
    describe('exportData()', () => {
        it('should export all performance data', () => {
            PerformanceTracker.snapshot('export-test', {
                duration: 100,
                tasksProcessed: 5,
            });
            const exported = PerformanceTracker.exportData();
            expect(exported).toBeDefined();
            expect(typeof exported).toBe('object');
        });
    });
});
//# sourceMappingURL=performance-tracker.test.js.map