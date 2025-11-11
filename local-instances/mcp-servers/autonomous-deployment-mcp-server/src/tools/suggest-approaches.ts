/**
 * suggest-approaches.ts
 *
 * Analyzes an issue/error message and returns ranked resolution approaches
 * based on pattern matching and historical success rates.
 */

import { promises as fs } from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Type definitions
interface Approach {
  id: string;
  approach: string;
  description: string;
  steps: string[];
  estimatedDuration: number;
  confidence: number;
}

interface Pattern {
  id: string;
  name: string;
  regex: string;
  type: "broken" | "missing" | "improvement";
  severity: "low" | "medium" | "high" | "critical";
  baseConfidence: number;
  confidenceMultiplier?: number;
  suggestedApproaches: Approach[];
  requiresApproval?: boolean;
  successRate: number | null;
  usageCount: number;
  lastUsed: string | null;
}

interface PatternPerformance {
  totalExecutions: number;
  successfulExecutions: number;
  failedExecutions: number;
  successRate: number;
  averageDuration: number;
  lastUsed: string;
}

interface SuggestApproachesArgs {
  issueId?: string;
  errorMessage: string;
  context?: {
    component?: string;
    severity?: string;
    stackTrace?: string;
  };
}

interface SuggestedApproach extends Approach {
  patternId: string;
  patternName: string;
  adjustedConfidence: number;
  historicalSuccessRate?: number;
  usageCount?: number;
}

/**
 * Main suggest_approaches tool function
 * Takes an error message and returns ranked resolution approaches
 */
export async function suggestApproaches(args: SuggestApproachesArgs) {
  try {
    const { errorMessage, context } = args;

    if (!errorMessage) {
      throw new Error("errorMessage is required");
    }

    // Load patterns library
    const patternsPath = path.join(__dirname, "../data/patterns.json");
    const patternsData = await fs.readFile(patternsPath, "utf-8");
    const { patterns } = JSON.parse(patternsData);

    // Load pattern performance data
    const performancePath = path.join(__dirname, "../data/pattern-performance.json");
    const performanceData = await fs.readFile(performancePath, "utf-8");
    const { patterns: patternPerformance } = JSON.parse(performanceData);

    // Match patterns against error message
    const suggestedApproaches: SuggestedApproach[] = [];

    for (const pattern of patterns) {
      try {
        const regex = new RegExp(pattern.regex, "i");
        const match = errorMessage.match(regex);

        if (match) {
          // Get performance data for this pattern
          const performance: PatternPerformance | undefined = patternPerformance[pattern.id];

          // Calculate adjusted confidence based on historical data
          let adjustedConfidence = pattern.baseConfidence;

          // Apply confidence multiplier if present
          if (pattern.confidenceMultiplier) {
            adjustedConfidence *= pattern.confidenceMultiplier;
          }

          // Factor in historical success rate (weighted 30%)
          if (performance && performance.successRate !== undefined) {
            adjustedConfidence = adjustedConfidence * 0.7 + performance.successRate * 0.3;
          } else if (pattern.successRate !== null && pattern.successRate > 0) {
            adjustedConfidence = adjustedConfidence * 0.7 + pattern.successRate * 0.3;
          }

          // Cap at 1.0
          adjustedConfidence = Math.min(adjustedConfidence, 1.0);

          // Add each suggested approach from the pattern
          for (const approach of pattern.suggestedApproaches) {
            const suggestedApproach: SuggestedApproach = {
              ...approach,
              patternId: pattern.id,
              patternName: pattern.name,
              adjustedConfidence,
              historicalSuccessRate: performance?.successRate,
              usageCount: performance?.totalExecutions || pattern.usageCount,
            };

            suggestedApproaches.push(suggestedApproach);
          }

          // Only match the first pattern that matches
          break;
        }
      } catch (regexError) {
        // Invalid regex, skip this pattern
        console.error(`Invalid regex in pattern ${pattern.id}:`, regexError);
        continue;
      }
    }

    // Sort by adjusted confidence (highest first)
    suggestedApproaches.sort((a, b) => b.adjustedConfidence - a.adjustedConfidence);

    // Generate response
    if (suggestedApproaches.length === 0) {
      return {
        content: [
          {
            type: "text",
            text: JSON.stringify(
              {
                suggestedApproaches: [],
                message: "No matching patterns found for this error. Consider using record_manual_resolution to teach the system after manually resolving this issue.",
                errorMessage,
              },
              null,
              2
            ),
          },
        ],
      };
    }

    const topApproach = suggestedApproaches[0];

    return {
      content: [
        {
          type: "text",
          text: JSON.stringify(
            {
              suggestedApproaches,
              recommendation: {
                approachId: topApproach.id,
                patternId: topApproach.patternId,
                confidence: topApproach.adjustedConfidence,
                canResolveAutonomously: topApproach.adjustedConfidence >= 0.95,
                requiresApproval: topApproach.adjustedConfidence >= 0.7 && topApproach.adjustedConfidence < 0.95,
                estimatedDuration: `${topApproach.estimatedDuration} minutes`,
              },
              message: `Found ${suggestedApproaches.length} approach(es). Top recommendation: ${topApproach.approach} (confidence: ${(topApproach.adjustedConfidence * 100).toFixed(1)}%)`,
            },
            null,
            2
          ),
        },
      ],
    };
  } catch (error: any) {
    return {
      content: [
        {
          type: "text",
          text: `Error suggesting approaches: ${error.message}\n\nStack: ${error.stack}`,
        },
      ],
      isError: true,
    };
  }
}
