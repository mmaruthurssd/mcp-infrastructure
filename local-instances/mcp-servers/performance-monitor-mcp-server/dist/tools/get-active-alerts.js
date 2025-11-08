/**
 * Get Active Alerts Tool
 *
 * Get all currently active alerts
 */
import { AlertManager } from '../lib/alert-manager.js';
const alertManager = new AlertManager();
export async function getActiveAlerts(args) {
    try {
        const mcpServer = args.mcpServer;
        const severity = args.severity;
        const status = args.status;
        const alerts = await alertManager.getActiveAlerts({
            mcpServer,
            severity,
            status,
        });
        const criticalCount = alerts.filter(a => a.severity === 'critical').length;
        const warningCount = alerts.filter(a => a.severity === 'warning').length;
        const activeCount = alerts.filter(a => a.status === 'active').length;
        const acknowledgedCount = alerts.filter(a => a.status === 'acknowledged').length;
        return {
            content: [
                {
                    type: 'text',
                    text: JSON.stringify({
                        success: true,
                        data: {
                            alerts,
                            count: alerts.length,
                            criticalCount,
                            warningCount,
                            activeCount,
                            acknowledgedCount,
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
//# sourceMappingURL=get-active-alerts.js.map