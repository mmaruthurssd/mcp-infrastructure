/**
 * Acknowledge Alert Tool
 *
 * Acknowledge an alert to stop notifications
 */
import { AlertManager } from '../lib/alert-manager.js';
const alertManager = new AlertManager();
export async function acknowledgeAlert(args) {
    try {
        const alertId = args.alertId;
        const acknowledgedBy = args.acknowledgedBy;
        const notes = args.notes;
        if (!alertId || !acknowledgedBy) {
            throw new Error('Missing required parameters: alertId, acknowledgedBy');
        }
        await alertManager.acknowledgeAlert(alertId, acknowledgedBy, notes);
        return {
            content: [
                {
                    type: 'text',
                    text: JSON.stringify({
                        success: true,
                        data: {
                            message: 'Alert acknowledged successfully',
                            alertId,
                            acknowledgedBy,
                            acknowledgedAt: new Date().toISOString(),
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
//# sourceMappingURL=acknowledge-alert.js.map