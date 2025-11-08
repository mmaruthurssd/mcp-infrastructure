/**
 * Set Alert Threshold Tool
 *
 * Configure alerting thresholds for metrics
 */
import { AlertManager } from '../lib/alert-manager.js';
const alertManager = new AlertManager();
export async function setAlertThreshold(args) {
    try {
        const metric = args.metric;
        const threshold = args.threshold;
        const severity = args.severity;
        if (!metric || threshold === undefined || !severity) {
            throw new Error('Missing required parameters: metric, threshold, severity');
        }
        const mcpServer = args.mcpServer;
        const toolName = args.toolName;
        const enabled = args.enabled !== false; // Default to true
        const alertThreshold = await alertManager.createThreshold({
            metric,
            threshold,
            severity,
            mcpServer,
            toolName,
            enabled,
        });
        return {
            content: [
                {
                    type: 'text',
                    text: JSON.stringify({
                        success: true,
                        data: {
                            message: 'Alert threshold configured successfully',
                            threshold: alertThreshold,
                        },
                    }, null, 2),
                },
            ],
        };
    }
    catch (error) {
        const errorMessage = error instanceof Error ? error.message : String(error);
        return {
            content: [
                {
                    type: 'text',
                    text: JSON.stringify({
                        success: false,
                        error: errorMessage,
                    }, null, 2),
                },
            ],
            isError: true,
        };
    }
}
//# sourceMappingURL=set-alert-threshold.js.map