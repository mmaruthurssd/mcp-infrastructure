/**
 * Performance Monitoring and Metrics Collection
 *
 * Monitors system performance, tracks metrics, and alerts on performance issues.
 * Target: < 5 seconds for progress calculation with 100+ goals
 *
 * Created: 2025-10-27
 */
import { EventEmitter } from 'events';
import { writeFile, appendFile, mkdir } from 'fs/promises';
import { join } from 'path';
const DEFAULT_THRESHOLDS = {
    maxQueryTime: 5000, // 5 seconds - project requirement
    maxLoadTime: 10000,
    maxUpdateTime: 2000,
    minCacheHitRate: 0.7,
    maxCacheMemoryMB: 50,
    maxErrorRate: 0.05,
    maxActiveAlerts: 10,
};
// ============================================================================
// PERFORMANCE MONITOR
// ============================================================================
export class PerformanceMonitor extends EventEmitter {
    projectPath;
    metrics = new Map();
    timings = new Map(); // For percentile calculations
    alerts = new Map();
    startTime = Date.now();
    thresholds;
    metricsLogPath;
    logInterval;
    constructor(projectPath, thresholds = {}, options = {}) {
        super();
        this.projectPath = projectPath;
        this.thresholds = { ...DEFAULT_THRESHOLDS, ...thresholds };
        if (options.enableMetricsLog !== false) {
            this.metricsLogPath = join(projectPath, '.mcp-progress/metrics');
            // Log metrics periodically
            const interval = (options.logIntervalSeconds ?? 60) * 1000;
            this.logInterval = setInterval(() => this.logMetrics(), interval);
        }
    }
    // ==========================================================================
    // OPERATION TRACKING
    // ==========================================================================
    /**
     * Start tracking an operation
     */
    startOperation(operationName) {
        const startTime = Date.now();
        return {
            operationName,
            startTime,
            complete: (success = true) => {
                const duration = Date.now() - startTime;
                this.recordOperation(operationName, duration, success);
            },
            fail: (error) => {
                const duration = Date.now() - startTime;
                this.recordOperation(operationName, duration, false, error);
            },
        };
    }
    /**
     * Record operation completion
     */
    recordOperation(operationName, durationMs, success, error) {
        // Get or create metrics for this operation
        let metrics = this.metrics.get(operationName);
        if (!metrics) {
            metrics = {
                operationName,
                totalExecutions: 0,
                successCount: 0,
                errorCount: 0,
                averageDurationMs: 0,
                minDurationMs: Infinity,
                maxDurationMs: 0,
                p50DurationMs: 0,
                p95DurationMs: 0,
                p99DurationMs: 0,
                violationCount: 0,
                violationRate: 0,
            };
            this.metrics.set(operationName, metrics);
        }
        // Update execution counts
        metrics.totalExecutions++;
        if (success) {
            metrics.successCount++;
        }
        else {
            metrics.errorCount++;
        }
        // Update timing stats
        metrics.lastExecutionAt = Date.now();
        metrics.lastDurationMs = durationMs;
        metrics.lastSuccess = success;
        metrics.minDurationMs = Math.min(metrics.minDurationMs, durationMs);
        metrics.maxDurationMs = Math.max(metrics.maxDurationMs, durationMs);
        // Update average (running average)
        const prevTotal = metrics.averageDurationMs * (metrics.totalExecutions - 1);
        metrics.averageDurationMs = (prevTotal + durationMs) / metrics.totalExecutions;
        // Store timing for percentile calculation
        let timings = this.timings.get(operationName);
        if (!timings) {
            timings = [];
            this.timings.set(operationName, timings);
        }
        timings.push(durationMs);
        // Keep only last 1000 timings for percentiles
        if (timings.length > 1000) {
            timings.shift();
        }
        // Recalculate percentiles
        this.updatePercentiles(metrics, timings);
        // Check for threshold violations
        const targetMs = this.getTargetDuration(operationName);
        if (targetMs && durationMs > targetMs) {
            metrics.violationCount++;
            metrics.violationRate = metrics.violationCount / metrics.totalExecutions;
            this.raiseAlert({
                severity: durationMs > targetMs * 2 ? 'critical' : 'warning',
                category: 'target-violation',
                message: `Operation "${operationName}" exceeded target: ${durationMs}ms > ${targetMs}ms`,
                details: { operationName, durationMs, targetMs },
            });
        }
        // Check error rate
        const errorRate = metrics.errorCount / metrics.totalExecutions;
        if (errorRate > this.thresholds.maxErrorRate) {
            this.raiseAlert({
                severity: 'critical',
                category: 'error-rate',
                message: `High error rate for "${operationName}": ${(errorRate * 100).toFixed(1)}%`,
                details: { operationName, errorRate, errorCount: metrics.errorCount },
            });
        }
        // Emit event
        this.emit('operation-complete', {
            operationName,
            durationMs,
            success,
            error: error?.message,
        });
    }
    /**
     * Update percentile calculations
     */
    updatePercentiles(metrics, timings) {
        const sorted = [...timings].sort((a, b) => a - b);
        metrics.p50DurationMs = this.calculatePercentile(sorted, 0.50);
        metrics.p95DurationMs = this.calculatePercentile(sorted, 0.95);
        metrics.p99DurationMs = this.calculatePercentile(sorted, 0.99);
    }
    /**
     * Calculate specific percentile
     */
    calculatePercentile(sortedValues, percentile) {
        if (sortedValues.length === 0)
            return 0;
        const index = Math.ceil(sortedValues.length * percentile) - 1;
        return sortedValues[Math.max(0, Math.min(index, sortedValues.length - 1))];
    }
    /**
     * Get target duration for operation
     */
    getTargetDuration(operationName) {
        // Map operation names to thresholds
        if (operationName.includes('query')) {
            return this.thresholds.maxQueryTime;
        }
        if (operationName.includes('load')) {
            return this.thresholds.maxLoadTime;
        }
        if (operationName.includes('update')) {
            return this.thresholds.maxUpdateTime;
        }
        return undefined;
    }
    // ==========================================================================
    // METRICS QUERIES
    // ==========================================================================
    /**
     * Get metrics for specific operation
     */
    getOperationMetrics(operationName) {
        return this.metrics.get(operationName);
    }
    /**
     * Get all operation metrics
     */
    getAllOperationMetrics() {
        return new Map(this.metrics);
    }
    /**
     * Get system-wide metrics
     */
    getSystemMetrics() {
        const allMetrics = Array.from(this.metrics.values());
        const totalQueries = allMetrics
            .filter(m => m.operationName.includes('query'))
            .reduce((sum, m) => sum + m.totalExecutions, 0);
        const totalUpdates = allMetrics
            .filter(m => m.operationName.includes('update'))
            .reduce((sum, m) => sum + m.totalExecutions, 0);
        const hierarchyLoadMetrics = this.metrics.get('hierarchy-load');
        const uptimeSeconds = (Date.now() - this.startTime) / 1000;
        const queriesPerSecond = totalQueries / uptimeSeconds;
        const averageQueryTime = this.calculateAverageForCategory('query');
        const averageUpdateTime = this.calculateAverageForCategory('update');
        const averageLoadTime = hierarchyLoadMetrics?.averageDurationMs ?? 0;
        const activeAlerts = Array.from(this.alerts.values()).filter(a => !a.resolved).length;
        const criticalAlerts = Array.from(this.alerts.values())
            .filter(a => !a.resolved && a.severity === 'critical').length;
        // Calculate health score (0-100)
        const healthScore = this.calculateHealthScore();
        return {
            cacheHitRate: 0, // Would be populated from cache manager
            cacheSize: 0,
            cacheMemoryMB: 0,
            totalQueries,
            queriesPerSecond,
            averageQueryTimeMs: averageQueryTime,
            hierarchyLoadCount: hierarchyLoadMetrics?.totalExecutions ?? 0,
            averageLoadTimeMs: averageLoadTime,
            entitiesLoaded: 0, // Would be populated from loader
            totalUpdates,
            cascadeUpdateCount: 0, // Would be populated from update system
            averageUpdateTimeMs: averageUpdateTime,
            activeAlerts,
            criticalAlerts,
            healthScore,
            uptimeSeconds,
            lastResetAt: this.startTime,
        };
    }
    /**
     * Calculate average duration for operation category
     */
    calculateAverageForCategory(category) {
        const categoryMetrics = Array.from(this.metrics.values())
            .filter(m => m.operationName.includes(category));
        if (categoryMetrics.length === 0)
            return 0;
        const totalDuration = categoryMetrics.reduce((sum, m) => sum + m.averageDurationMs, 0);
        return totalDuration / categoryMetrics.length;
    }
    /**
     * Calculate overall health score
     */
    calculateHealthScore() {
        let score = 100;
        // Deduct for active alerts
        const activeAlerts = Array.from(this.alerts.values()).filter(a => !a.resolved);
        score -= activeAlerts.length * 5; // -5 per alert
        score -= activeAlerts.filter(a => a.severity === 'critical').length * 10; // Additional -10 for critical
        // Deduct for high error rates
        for (const metrics of this.metrics.values()) {
            const errorRate = metrics.errorCount / metrics.totalExecutions;
            if (errorRate > this.thresholds.maxErrorRate) {
                score -= 10;
            }
        }
        // Deduct for slow operations
        for (const metrics of this.metrics.values()) {
            if (metrics.violationRate > 0.1) { // More than 10% violations
                score -= 5;
            }
        }
        return Math.max(0, Math.min(100, score));
    }
    // ==========================================================================
    // ALERTS
    // ==========================================================================
    /**
     * Raise performance alert
     */
    raiseAlert(alert) {
        const alertId = `${alert.category}-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
        const fullAlert = {
            alertId,
            timestamp: new Date().toISOString(),
            resolved: false,
            ...alert,
        };
        this.alerts.set(alertId, fullAlert);
        this.emit('alert', fullAlert);
        // Check if we have too many alerts
        const activeAlerts = Array.from(this.alerts.values()).filter(a => !a.resolved).length;
        if (activeAlerts > this.thresholds.maxActiveAlerts) {
            this.emit('alert-overflow', { activeAlerts, threshold: this.thresholds.maxActiveAlerts });
        }
    }
    /**
     * Resolve alert
     */
    resolveAlert(alertId) {
        const alert = this.alerts.get(alertId);
        if (alert && !alert.resolved) {
            alert.resolved = true;
            alert.resolvedAt = new Date().toISOString();
            this.emit('alert-resolved', alert);
        }
    }
    /**
     * Get active alerts
     */
    getActiveAlerts() {
        return Array.from(this.alerts.values()).filter(a => !a.resolved);
    }
    /**
     * Get all alerts
     */
    getAllAlerts() {
        return Array.from(this.alerts.values());
    }
    // ==========================================================================
    // LOGGING
    // ==========================================================================
    /**
     * Log metrics to file
     */
    async logMetrics() {
        if (!this.metricsLogPath)
            return;
        await mkdir(this.metricsLogPath, { recursive: true });
        const timestamp = new Date().toISOString();
        const date = timestamp.split('T')[0];
        const logFile = join(this.metricsLogPath, `metrics-${date}.ndjson`);
        const systemMetrics = this.getSystemMetrics();
        const logEntry = {
            timestamp,
            system: systemMetrics,
            operations: Array.from(this.metrics.entries()).map(([name, metrics]) => ({
                name,
                ...metrics,
            })),
        };
        const line = JSON.stringify(logEntry) + '\n';
        await appendFile(logFile, line, 'utf-8');
    }
    /**
     * Export metrics as JSON
     */
    async exportMetrics(outputPath) {
        const systemMetrics = this.getSystemMetrics();
        const operations = Array.from(this.metrics.entries()).map(([name, metrics]) => ({
            name,
            ...metrics,
        }));
        const alerts = this.getAllAlerts();
        const exportData = {
            exportedAt: new Date().toISOString(),
            system: systemMetrics,
            operations,
            alerts,
        };
        await writeFile(outputPath, JSON.stringify(exportData, null, 2), 'utf-8');
    }
    // ==========================================================================
    // RESET
    // ==========================================================================
    /**
     * Reset all metrics
     */
    reset() {
        this.metrics.clear();
        this.timings.clear();
        this.alerts.clear();
        this.startTime = Date.now();
        this.emit('reset');
    }
    /**
     * Cleanup
     */
    destroy() {
        if (this.logInterval) {
            clearInterval(this.logInterval);
        }
        this.removeAllListeners();
    }
}
// ============================================================================
// GLOBAL MONITOR INSTANCE
// ============================================================================
let globalMonitor = null;
/**
 * Initialize global performance monitor
 */
export function initializePerformanceMonitor(projectPath, thresholds, options) {
    if (globalMonitor) {
        globalMonitor.destroy();
    }
    globalMonitor = new PerformanceMonitor(projectPath, thresholds, options);
    return globalMonitor;
}
/**
 * Get global performance monitor
 */
export function getPerformanceMonitor() {
    if (!globalMonitor) {
        throw new Error('Performance monitor not initialized. Call initializePerformanceMonitor first.');
    }
    return globalMonitor;
}
/**
 * Destroy global monitor
 */
export function destroyPerformanceMonitor() {
    if (globalMonitor) {
        globalMonitor.destroy();
        globalMonitor = null;
    }
}
//# sourceMappingURL=performance-monitor.js.map