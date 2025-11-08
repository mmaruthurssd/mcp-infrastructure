/**
 * Get status of all MCPs
 */

import { getMcpStatuses } from '../lib/health-scoring.js';
import { cacheGet, cacheSet } from '../lib/cache.js';

const CACHE_KEY = 'mcp-status';
const CACHE_TTL = 60000; // 60 seconds

export async function getMcpStatus(_args: any) {
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
                statuses: cached,
              },
              null,
              2
            ),
          },
        ],
      };
    }

    // Get fresh MCP statuses
    const statuses = await getMcpStatuses();

    // Calculate summary stats
    const summary = {
      total: statuses.length,
      healthy: statuses.filter(s => s.status === 'healthy').length,
      warning: statuses.filter(s => s.status === 'warning').length,
      critical: statuses.filter(s => s.status === 'critical').length,
      inactive: statuses.filter(s => s.status === 'inactive').length,
    };

    // Identify deprecated candidates (inactive for 30+ days)
    const deprecationCandidates = statuses
      .filter(s => s.status === 'inactive' || s.requestCount24h === 0)
      .map(s => s.name);

    // Identify high error rate MCPs
    const needsInvestigation = statuses
      .filter(s => s.errorRate > 5)
      .map(s => ({ name: s.name, errorRate: s.errorRate }));

    const result = {
      success: true,
      summary,
      statuses,
      deprecationCandidates,
      needsInvestigation,
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
