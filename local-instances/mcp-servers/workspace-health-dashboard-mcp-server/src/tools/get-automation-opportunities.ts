/**
 * Get automation opportunities from workspace patterns
 */

import { getAutomationOpportunities as getOpportunities } from '../lib/data-clients.js';
import { cacheGet, cacheSet } from '../lib/cache.js';

const CACHE_KEY = 'automation-opportunities';
const CACHE_TTL = 300000; // 5 minutes (less frequently changing)

export async function getAutomationOpportunities(args: { minRoi?: number; limit?: number }) {
  try {
    const minRoi = args.minRoi || 0;
    const limit = args.limit || 10;

    // Check cache first
    const cached = cacheGet<any[]>(CACHE_KEY);
    if (cached && Array.isArray(cached)) {
      const filtered = cached.filter((opp: any) => opp.potentialRoi >= minRoi).slice(0, limit);
      return {
        content: [
          {
            type: 'text',
            text: JSON.stringify(
              {
                success: true,
                cached: true,
                count: filtered.length,
                opportunities: filtered,
              },
              null,
              2
            ),
          },
        ],
      };
    }

    // Get fresh opportunities
    const opportunities = await getOpportunities();

    // Filter and limit
    const filtered = opportunities
      .filter(opp => opp.potentialRoi >= minRoi)
      .slice(0, limit);

    // Calculate total potential value
    const totalPotentialValue = filtered.reduce((sum, opp) => sum + opp.potentialRoi, 0);

    const result = {
      success: true,
      count: filtered.length,
      totalPotentialValue,
      opportunities: filtered,
    };

    // Cache the result
    cacheSet(CACHE_KEY, opportunities, CACHE_TTL);

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
