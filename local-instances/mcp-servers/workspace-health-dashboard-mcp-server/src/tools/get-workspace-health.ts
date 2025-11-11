/**
 * Get overall workspace health score
 */

import { calculateHealthScore } from '../lib/health-scoring.js';
import { cacheGet, cacheSet } from '../lib/cache.js';

const CACHE_KEY = 'workspace-health';
const CACHE_TTL = 60000; // 60 seconds

export async function getWorkspaceHealth(_args: any) {
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
                ...cached,
              },
              null,
              2
            ),
          },
        ],
      };
    }

    // Calculate fresh health score
    const health = await calculateHealthScore();

    // Cache the result
    cacheSet(CACHE_KEY, health, CACHE_TTL);

    return {
      content: [
        {
          type: 'text',
          text: JSON.stringify(
            {
              success: true,
              ...health,
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
