/**
 * Track Performance Tool
 *
 * Records MCP tool execution performance metrics
 */
import { DataStore } from '../lib/data-store.js';
import { MetricsCollector } from '../lib/metrics-collector.js';
const dataStore = new DataStore();
const collector = new MetricsCollector();
export async function trackPerformance(args) {
    const startTime = Date.now();
    try {
        // Validate required parameters
        const mcpServer = args.mcpServer;
        const toolName = args.toolName;
        const duration = args.duration;
        const success = args.success;
        if (!mcpServer || !toolName || duration === undefined || success === undefined) {
            throw new Error('Missing required parameters: mcpServer, toolName, duration, success');
        }
        // Build metric object
        const metric = {
            timestamp: new Date().toISOString(),
            mcpServer,
            toolName,
            duration,
            success,
            errorMessage: args.errorMessage,
            resourceUsage: args.resourceUsage,
        };
        // Validate and write metric
        const validatedMetric = collector.validateMetric(metric);
        await dataStore.writeMetric(validatedMetric);
        // Calculate overhead
        const overhead = Date.now() - startTime;
        return {
            content: [
                {
                    type: 'text',
                    text: JSON.stringify({
                        success: true,
                        data: {
                            message: 'Performance metric tracked successfully',
                            timestamp: validatedMetric.timestamp,
                            overhead: `${overhead}ms`,
                        },
                    }, null, 2),
                },
            ],
        };
    }
    catch (error) {
        const overhead = Date.now() - startTime;
        const errorMessage = error instanceof Error ? error.message : String(error);
        return {
            content: [
                {
                    type: 'text',
                    text: JSON.stringify({
                        success: false,
                        error: errorMessage,
                        overhead: `${overhead}ms`,
                    }, null, 2),
                },
            ],
            isError: true,
        };
    }
}
//# sourceMappingURL=track-performance.js.map