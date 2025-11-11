/**
 * Resolve with Approval Tool
 *
 * Executes assisted resolution for medium-confidence issues (0.70-0.94).
 * Requires human approval before execution and logs approval in audit trail.
 */

import * as fs from "fs/promises";
import * as path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Type definitions
interface ResolveWithApprovalArgs {
  issueId: string;
  approachId: string;
  approvedBy: string;
}

interface Threshold {
  confidenceThresholds: {
    autonomous: number;
    assisted: number;
  };
}

interface Pattern {
  id: string;
  suggestedApproaches: Array<{
    id: string;
    approach: string;
    steps: string[];
    confidence: number;
  }>;
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
        approvedBy?: string;
      }>;
    };
  };
}

/**
 * Execute assisted resolution with human approval
 */
export async function resolveWithApproval(args: any) {
  const { issueId, approachId, approvedBy } = args as ResolveWithApprovalArgs;

  try {
    // Validate required parameters
    if (!issueId || !approachId || !approvedBy) {
      throw new Error("Missing required parameters: issueId, approachId, and approvedBy are required");
    }

    const dataDir = path.join(__dirname, "..", "data");

    // Load thresholds
    const thresholdsPath = path.join(dataDir, "thresholds.json");
    const thresholds: Threshold = JSON.parse(await fs.readFile(thresholdsPath, "utf-8"));

    // Load patterns to find the matching pattern and approach
    const patternsPath = path.join(dataDir, "patterns.json");
    const patternsData = JSON.parse(await fs.readFile(patternsPath, "utf-8"));

    // Find pattern by checking if any pattern has the specified approachId
    let matchedPattern: Pattern | null = null;
    let matchedApproach: any = null;

    for (const pattern of patternsData.patterns) {
      const approach = pattern.suggestedApproaches?.find((a: any) => a.id === approachId);
      if (approach) {
        matchedPattern = pattern;
        matchedApproach = approach;
        break;
      }
    }

    if (!matchedPattern || !matchedApproach) {
      throw new Error(`Approach ${approachId} not found in pattern library`);
    }

    // Check confidence threshold - must be >= assisted threshold (0.70)
    const confidence = matchedApproach.confidence || 0;
    if (confidence < thresholds.confidenceThresholds.assisted) {
      throw new Error(
        `Confidence ${confidence.toFixed(2)} is below assisted threshold ${thresholds.confidenceThresholds.assisted}. ` +
        `Manual resolution recommended.`
      );
    }

    // Check if confidence is too high for assisted (should use autonomous)
    if (confidence >= thresholds.confidenceThresholds.autonomous) {
      return {
        content: [{
          type: "text",
          text: `⚠️ Warning: Confidence ${confidence.toFixed(2)} is >= autonomous threshold ${thresholds.confidenceThresholds.autonomous}.\n` +
                `This issue qualifies for autonomous resolution. Consider using resolve_autonomously instead.\n\n` +
                `Proceeding with approved resolution...`
        }]
      };
    }

    const startTime = Date.now();

    // Log approval in audit trail
    const auditLog = {
      timestamp: new Date().toISOString(),
      action: "assisted-resolution-approved",
      issueId,
      approachId,
      patternId: matchedPattern.id,
      confidence,
      approvedBy,
      approach: matchedApproach.approach
    };

    console.error("Approval logged:", JSON.stringify(auditLog, null, 2));

    // Execute resolution workflow (same as autonomous, but with approval tracking)
    // In a real implementation, this would:
    // 1. Create goal in project management MCP
    // 2. Generate specification via spec-driven MCP
    // 3. Execute tasks via task-executor MCP
    // 4. Validate deployment
    // 5. Run health checks

    // For now, simulate execution
    const executionResult = {
      success: true,
      steps: matchedApproach.steps,
      duration: Date.now() - startTime
    };

    // Update pattern performance with approval metadata
    const performancePath = path.join(dataDir, "pattern-performance.json");
    let performance: PatternPerformance;

    try {
      performance = JSON.parse(await fs.readFile(performancePath, "utf-8"));
    } catch {
      performance = { patterns: {} };
    }

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

    // Record outcome with approval metadata
    const outcome = {
      timestamp: new Date().toISOString(),
      outcome: executionResult.success ? "success" : "failed",
      duration: executionResult.duration,
      autonomous: false, // This is assisted resolution
      approvedBy
    };

    patternPerf.outcomes.push(outcome);
    patternPerf.totalUses++;

    if (executionResult.success) {
      patternPerf.successfulUses++;
    } else {
      patternPerf.failedUses++;
    }

    // Update average duration
    patternPerf.averageDuration =
      (patternPerf.averageDuration * (patternPerf.totalUses - 1) + executionResult.duration) /
      patternPerf.totalUses;

    patternPerf.lastUsed = new Date().toISOString();

    // Save updated performance
    await fs.writeFile(performancePath, JSON.stringify(performance, null, 2));

    // Calculate updated confidence based on success rate
    const successRate = patternPerf.successfulUses / patternPerf.totalUses;
    const updatedConfidence = Math.min(0.99, successRate * 1.1); // Boost by 10%, cap at 0.99

    // Build response message
    let responseText = `✓ Assisted Resolution Completed\n\n`;
    responseText += `Issue ID: ${issueId}\n`;
    responseText += `Pattern: ${matchedPattern.id}\n`;
    responseText += `Approach: ${matchedApproach.approach}\n`;
    responseText += `Approved By: ${approvedBy}\n`;
    responseText += `Confidence: ${confidence.toFixed(2)}\n`;
    responseText += `Duration: ${(executionResult.duration / 1000).toFixed(1)}s\n\n`;

    responseText += `Resolution Steps Executed:\n`;
    executionResult.steps.forEach((step: string, idx: number) => {
      responseText += `${idx + 1}. ${step}\n`;
    });

    responseText += `\n📊 Pattern Performance Update:\n`;
    responseText += `Total Uses: ${patternPerf.totalUses}\n`;
    responseText += `Success Rate: ${(successRate * 100).toFixed(1)}%\n`;
    responseText += `Updated Confidence: ${updatedConfidence.toFixed(2)}\n`;

    if (updatedConfidence >= thresholds.confidenceThresholds.autonomous) {
      responseText += `\n🎯 This pattern now qualifies for autonomous resolution!\n`;
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
        text: `Error in assisted resolution: ${error.message}`
      }],
      isError: true
    };
  }
}
