/**
 * Generate Performance Report Tool
 *
 * Generate comprehensive performance report
 */

import { Reporter } from '../lib/reporter.js';
import type { ReportFormat } from '../types/index.js';

const reporter = new Reporter();

export async function generatePerformanceReport(args: Record<string, unknown>) {
  try {
    const startTime = args.startTime as string;
    const endTime = args.endTime as string;

    if (!startTime || !endTime) {
      throw new Error('Missing required parameters: startTime, endTime');
    }

    const mcpServer = args.mcpServer as string | undefined;
    const format = (args.format as ReportFormat) || 'markdown';
    const includeRecommendations = args.includeRecommendations !== false;

    const report = await reporter.generateReport(
      startTime,
      endTime,
      mcpServer,
      format,
      includeRecommendations
    );

    return {
      content: [
        {
          type: 'text',
          text: format === 'json' ? report : JSON.stringify(
            {
              success: true,
              data: {
                report,
                format,
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
