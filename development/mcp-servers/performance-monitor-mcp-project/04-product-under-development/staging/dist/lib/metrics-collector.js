/**
 * Metrics Collector
 *
 * Captures and validates performance data
 */
export class MetricsCollector {
    /**
     * Validate and normalize a performance metric
     */
    validateMetric(metric) {
        // Implementation will be added in Task 7
        const validated = {
            timestamp: metric.timestamp || new Date().toISOString(),
            mcpServer: metric.mcpServer || '',
            toolName: metric.toolName || '',
            duration: metric.duration || 0,
            success: metric.success ?? true,
            errorMessage: metric.errorMessage,
            resourceUsage: metric.resourceUsage,
        };
        return validated;
    }
    /**
     * Calculate metric collection overhead
     */
    measureOverhead(startTime) {
        return Date.now() - startTime;
    }
}
//# sourceMappingURL=metrics-collector.js.map