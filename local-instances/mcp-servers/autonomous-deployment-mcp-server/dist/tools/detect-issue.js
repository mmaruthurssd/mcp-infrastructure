/**
 * detect-issue.ts
 *
 * Scans error logs for unresolved errors and matches them against pattern library
 * to calculate confidence scores for autonomous resolution.
 */
import { promises as fs } from "fs";
import path from "path";
import { fileURLToPath } from "url";
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
/**
 * Main detect_issue tool function
 * Scans error logs, matches patterns, and calculates confidence scores
 */
export async function detectIssue(args) {
    try {
        const source = args.source || "error-log";
        const limit = args.limit || 10;
        const minConfidence = args.minConfidence || 0.5;
        // Load patterns library
        const patternsPath = path.join(__dirname, "../data/patterns.json");
        const patternsData = await fs.readFile(patternsPath, "utf-8");
        const { patterns } = JSON.parse(patternsData);
        // Load error log from workspace root
        const errorLogPath = path.join(__dirname, "../../../../../../.ai-planning/issues/error-log.json");
        let errorLog = [];
        // Try to read error log, create empty if doesn't exist
        try {
            const errorLogData = await fs.readFile(errorLogPath, "utf-8");
            const parsed = JSON.parse(errorLogData);
            errorLog = parsed.errors || [];
        }
        catch (error) {
            // If file doesn't exist, return empty result
            if (error.code === "ENOENT") {
                return {
                    content: [
                        {
                            type: "text",
                            text: JSON.stringify({
                                detectedIssues: [],
                                summary: {
                                    totalScanned: 0,
                                    unresolvedCount: 0,
                                    matchedCount: 0,
                                    highConfidenceCount: 0,
                                },
                                message: "No error log found. Error log will be created when issues are detected.",
                            }, null, 2),
                        },
                    ],
                };
            }
            throw error;
        }
        // Filter unresolved errors
        const unresolvedErrors = errorLog.filter((entry) => !entry.resolved);
        // Match patterns against each error
        const detectedIssues = [];
        for (const error of unresolvedErrors) {
            // Try to match each pattern
            for (const pattern of patterns) {
                try {
                    const regex = new RegExp(pattern.regex, "i");
                    const match = error.errorMessage.match(regex);
                    if (match) {
                        // Calculate confidence score
                        let confidence = pattern.baseConfidence;
                        // Apply confidence multiplier if present
                        if (pattern.confidenceMultiplier) {
                            confidence *= pattern.confidenceMultiplier;
                        }
                        // Boost confidence based on historical success rate
                        if (pattern.successRate !== null && pattern.successRate > 0) {
                            confidence = confidence * 0.7 + pattern.successRate * 0.3;
                        }
                        // Cap confidence at 1.0
                        confidence = Math.min(confidence, 1.0);
                        // Filter by minimum confidence
                        if (confidence < minConfidence) {
                            continue;
                        }
                        const detectedIssue = {
                            issueId: error.id,
                            errorMessage: error.errorMessage,
                            timestamp: error.timestamp,
                            source: error.source,
                            component: error.component,
                            severity: error.severity || pattern.severity,
                            matchedPattern: {
                                id: pattern.id,
                                name: pattern.name,
                                type: pattern.type,
                                regex: pattern.regex,
                            },
                            confidence,
                            suggestedApproaches: pattern.suggestedApproaches,
                            requiresApproval: pattern.requiresApproval || false,
                            canResolveAutonomously: confidence >= 0.95 && !pattern.requiresApproval,
                        };
                        detectedIssues.push(detectedIssue);
                        break; // Stop checking patterns once we find a match
                    }
                }
                catch (regexError) {
                    // Invalid regex, skip this pattern
                    console.error(`Invalid regex in pattern ${pattern.id}:`, regexError);
                    continue;
                }
            }
        }
        // Sort by confidence (highest first)
        detectedIssues.sort((a, b) => b.confidence - a.confidence);
        // Limit results
        const limitedIssues = detectedIssues.slice(0, limit);
        // Generate summary statistics
        const highConfidenceCount = detectedIssues.filter((issue) => issue.canResolveAutonomously).length;
        const summary = {
            totalScanned: unresolvedErrors.length,
            unresolvedCount: unresolvedErrors.length,
            matchedCount: detectedIssues.length,
            highConfidenceCount,
            autonomousEligible: highConfidenceCount,
            assistedEligible: detectedIssues.filter((issue) => issue.confidence >= 0.7 && issue.confidence < 0.95).length,
            lowConfidence: detectedIssues.filter((issue) => issue.confidence < 0.7).length,
        };
        return {
            content: [
                {
                    type: "text",
                    text: JSON.stringify({
                        detectedIssues: limitedIssues,
                        summary,
                        message: `Found ${detectedIssues.length} issues matching patterns. ${highConfidenceCount} eligible for autonomous resolution.`,
                    }, null, 2),
                },
            ],
        };
    }
    catch (error) {
        return {
            content: [
                {
                    type: "text",
                    text: `Error detecting issues: ${error.message}\n\nStack: ${error.stack}`,
                },
            ],
            isError: true,
        };
    }
}
//# sourceMappingURL=detect-issue.js.map