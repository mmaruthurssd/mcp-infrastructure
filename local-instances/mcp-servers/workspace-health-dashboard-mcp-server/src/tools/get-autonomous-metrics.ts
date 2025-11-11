/**
 * Get autonomous resolution metrics
 */

import { getAutonomousResolutionMetrics } from '../lib/data-clients.js';
import { cacheGet, cacheSet } from '../lib/cache.js';

const CACHE_KEY = 'autonomous-metrics';
const CACHE_TTL = 60000; // 60 seconds

export async function getAutonomousMetrics(_args: any) {
  try {
    // Check cache first
    const cached = cacheGet(CACHE_KEY);
    if (cached) {
      return {
        content: [
          {
            type: 'text',
            text: JSON.stringify(
              {
                success: true,
                cached: true,
                metrics: cached,
              },
              null,
              2
            ),
          },
        ],
      };
    }

    // Get fresh autonomous metrics
    const metrics = await getAutonomousResolutionMetrics();

    const result = {
      success: true,
      metrics: {
        totalResolutions: metrics.totalResolutions,
        successRate7d: parseFloat(metrics.successRate7d.toFixed(2)),
        successRate30d: parseFloat(metrics.successRate30d.toFixed(2)),
        avgResolutionTime: parseFloat(metrics.avgResolutionTime.toFixed(1)),
        trend: metrics.trend,
        recentResolutions: metrics.recentResolutions,
        // Placeholders for ROI and calibration - will be populated when Agent 2/3 complete
        roiMetrics: {
          totalValue: 0,
          totalCost: 0,
          netValue: 0,
          roi: 0,
          note: 'ROI metrics will be available after Agent 2 completes the autonomous framework',
        },
        confidenceCalibration: {
          status: 'uncalibrated',
          accuracy: 0,
          lastCalibrated: 'N/A',
          note: 'Calibration metrics will be available after Agent 3 completes confidence calibration',
        },
      },
    };

    // Cache the result
    cacheSet(CACHE_KEY, result, CACHE_TTL);

    return {
      content: [
        {
          type: 'text',
          text: JSON.stringify(result, null, 2),
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
