/**
 * Set Alert Threshold Tool
 *
 * Configure alerting thresholds for metrics
 */

import { AlertManager } from '../lib/alert-manager.js';
import type { MetricType, AlertSeverity } from '../types/index.js';

const alertManager = new AlertManager();

export async function setAlertThreshold(args: Record<string, unknown>) {
  try {
    const metric = args.metric as MetricType;
    const threshold = args.threshold as number;
    const severity = args.severity as AlertSeverity;

    if (!metric || threshold === undefined || !severity) {
      throw new Error('Missing required parameters: metric, threshold, severity');
    }

    const mcpServer = args.mcpServer as string | undefined;
    const toolName = args.toolName as string | undefined;
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
          text: JSON.stringify(
            {
              success: true,
              data: {
                message: 'Alert threshold configured successfully',
                threshold: alertThreshold,
              },
            },
            null,
            2
          ),
        },
      ],
    };
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);

    return {
      content: [
        {
          type: 'text',
          text: JSON.stringify(
            {
              success: false,
              error: errorMessage,
            },
            null,
            2
          ),
        },
      ],
      isError: true,
    };
  }
}
