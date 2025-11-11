/**
 * Record Manual Resolution Tool
 *
 * Learn from human-resolved issues to improve pattern matching and confidence scoring.
 * Extracts patterns, updates success rates, and provides learning insights.
 */

import * as fs from "fs/promises";
import * as path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Type definitions
interface RecordManualResolutionArgs {
  issueId?: string;
  errorMessage: string;
  solution: string;
  solutionSteps?: string[];
  duration?: number;
  outcome: "success" | "partial" | "failed";
}

interface Pattern {
  id: string;
  name: string;
  regex: string;
  type: string;
  baseConfidence: number;
  suggestedApproaches?: any[];
}

interface PatternPerformance {
  patterns: {
    [key: string]: {
      totalUses: number;
      successfulUses: number;
      failedUses: number;
      averageDuration: number;
      lastUsed: string;
      outcomes: Array<{
        timestamp: string;
        outcome: string;
        duration: number;
        autonomous: boolean;
        manual?: boolean;
      }>;
    };
  };
}

/**
 * Calculate similarity between error message and pattern regex
 */
function calculatePatternSimilarity(errorMessage: string, pattern: Pattern): number {
  try {
    const regex = new RegExp(pattern.regex, "i");
    if (regex.test(errorMessage)) {
      return 1.0; // Exact match
    }

    // Fuzzy matching based on keyword overlap
    const errorWords = errorMessage.toLowerCase().split(/\s+/);
    const patternWords = pattern.name.toLowerCase().split(/\s+/);

    const commonWords = errorWords.filter(word =>
      patternWords.some(pw => pw.includes(word) || word.includes(pw))
    );

    return commonWords.length / Math.max(errorWords.length, patternWords.length);
  } catch {
    return 0;
  }
}

/**
 * Record manual resolution and learn from it
 */
export async function recordManualResolution(args: any) {
  const { issueId, errorMessage, solution, solutionSteps, duration, outcome } = args as RecordManualResolutionArgs;

  try {
    // Validate required parameters
    if (!errorMessage || !solution || !outcome) {
      throw new Error("Missing required parameters: errorMessage, solution, and outcome are required");
    }

    const dataDir = path.join(__dirname, "..", "data");

    // Load existing patterns
    const patternsPath = path.join(dataDir, "patterns.json");
    const patternsData = JSON.parse(await fs.readFile(patternsPath, "utf-8"));
    const patterns: Pattern[] = patternsData.patterns;

    // Try to match error message to existing patterns
    let matchedPattern: Pattern | null = null;
    let maxSimilarity = 0;

    for (const pattern of patterns) {
      const similarity = calculatePatternSimilarity(errorMessage, pattern);
      if (similarity > maxSimilarity) {
        maxSimilarity = similarity;
        matchedPattern = pattern;
      }
    }

    // Load pattern performance
    const performancePath = path.join(dataDir, "pattern-performance.json");
    let performance: PatternPerformance;

    try {
      performance = JSON.parse(await fs.readFile(performancePath, "utf-8"));
    } catch {
      performance = { patterns: {} };
    }

    const resolutionDuration = duration ? duration * 60000 : 300000; // Convert minutes to ms, default 5min
    let learningInsights: string[] = [];

    // If pattern exists and similarity is high enough, update its performance
    if (matchedPattern && maxSimilarity >= 0.6) {
      // Initialize pattern performance if not exists
      if (!performance.patterns[matchedPattern.id]) {
        performance.patterns[matchedPattern.id] = {
          totalUses: 0,
          successfulUses: 0,
          failedUses: 0,
          averageDuration: 0,
          lastUsed: new Date().toISOString(),
          outcomes: []
        };
      }

      const patternPerf = performance.patterns[matchedPattern.id];

      // Record manual resolution outcome
      const outcomeRecord = {
        timestamp: new Date().toISOString(),
        outcome: outcome === "success" ? "success" : "failed",
        duration: resolutionDuration,
        autonomous: false,
        manual: true
      };

      patternPerf.outcomes.push(outcomeRecord);
      patternPerf.totalUses++;

      if (outcome === "success") {
        patternPerf.successfulUses++;
      } else {
        patternPerf.failedUses++;
      }

      // Update average duration
      patternPerf.averageDuration =
        (patternPerf.averageDuration * (patternPerf.totalUses - 1) + resolutionDuration) /
        patternPerf.totalUses;

      patternPerf.lastUsed = new Date().toISOString();

      // Calculate new confidence based on success rate
      const successRate = patternPerf.successfulUses / patternPerf.totalUses;
      const baseConfidence = matchedPattern.baseConfidence || 0.5;
      const learnedConfidence = Math.min(0.99, successRate * 0.9 + baseConfidence * 0.1); // Weighted average

      learningInsights.push(`✓ Pattern match found: ${matchedPattern.name} (${(maxSimilarity * 100).toFixed(0)}% similarity)`);
      learningInsights.push(`Updated success rate: ${(successRate * 100).toFixed(1)}% (${patternPerf.successfulUses}/${patternPerf.totalUses})`);
      learningInsights.push(`New confidence score: ${learnedConfidence.toFixed(2)}`);

      // Check if pattern now qualifies for different resolution levels
      if (learnedConfidence >= 0.95) {
        learningInsights.push(`🎯 This pattern now qualifies for AUTONOMOUS resolution!`);
      } else if (learnedConfidence >= 0.70) {
        learningInsights.push(`📋 This pattern now qualifies for ASSISTED resolution (requires approval)`);
      } else {
        learningInsights.push(`📝 Pattern needs more data before autonomous/assisted resolution (${(patternPerf.totalUses)} uses so far)`);
      }

    } else {
      // No matching pattern found - suggest creating a new pattern
      learningInsights.push(`⚠️ No existing pattern matched this error (best match: ${(maxSimilarity * 100).toFixed(0)}%)`);
      learningInsights.push(`Consider creating a new pattern for:`);
      learningInsights.push(`  Error: ${errorMessage.substring(0, 100)}${errorMessage.length > 100 ? "..." : ""}`);
      learningInsights.push(`  Solution: ${solution.substring(0, 100)}${solution.length > 100 ? "..." : ""}`);

      // Suggest pattern creation
      const suggestedPatternId = errorMessage
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, "-")
        .substring(0, 30);

      learningInsights.push(`\nSuggested pattern ID: ${suggestedPatternId}`);
      learningInsights.push(`Use manage_patterns tool to add this pattern for future learning.`);
    }

    // Save updated performance
    await fs.writeFile(performancePath, JSON.stringify(performance, null, 2));

    // Build response
    let responseText = `✓ Manual Resolution Recorded\n\n`;
    responseText += `Error: ${errorMessage}\n`;
    responseText += `Outcome: ${outcome.toUpperCase()}\n`;
    if (duration) {
      responseText += `Duration: ${duration} minutes\n`;
    }
    responseText += `\n📚 Learning Insights:\n`;
    learningInsights.forEach(insight => {
      responseText += `${insight}\n`;
    });

    if (solutionSteps && solutionSteps.length > 0) {
      responseText += `\n📝 Solution Steps Recorded:\n`;
      solutionSteps.forEach((step, idx) => {
        responseText += `${idx + 1}. ${step}\n`;
      });
    }

    return {
      content: [{
        type: "text",
        text: responseText
      }]
    };

  } catch (error: any) {
    return {
      content: [{
        type: "text",
        text: `Error recording manual resolution: ${error.message}`
      }],
      isError: true
    };
  }
}
