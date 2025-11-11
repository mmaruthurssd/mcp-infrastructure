/**
 * Threshold Adjustment Tool
 * Manages confidence thresholds with validation and audit trail
 */
import * as fs from 'fs/promises';
import * as path from 'path';
import { fileURLToPath } from 'url';
import { dirname } from 'path';
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
// Path to thresholds file
const THRESHOLDS_FILE = path.join(__dirname, '../data/thresholds.json');
// Path to audit log (create if doesn't exist)
const AUDIT_LOG_FILE = path.join(__dirname, '../data/threshold-audit.jsonl');
/**
 * Load thresholds data
 */
async function loadThresholds() {
    const data = await fs.readFile(THRESHOLDS_FILE, 'utf-8');
    return JSON.parse(data);
}
/**
 * Save thresholds data
 */
async function saveThresholds(data) {
    await fs.writeFile(THRESHOLDS_FILE, JSON.stringify(data, null, 2), 'utf-8');
}
/**
 * Log threshold change to audit trail
 */
async function logAuditTrail(changes, reason, reviewedBy) {
    const auditEntry = {
        timestamp: new Date().toISOString(),
        changes,
        reason,
        reviewedBy,
    };
    const logLine = JSON.stringify(auditEntry) + '\n';
    try {
        await fs.appendFile(AUDIT_LOG_FILE, logLine, 'utf-8');
    }
    catch (error) {
        // If file doesn't exist, create it
        await fs.writeFile(AUDIT_LOG_FILE, logLine, 'utf-8');
    }
}
/**
 * Validate threshold values
 */
function validateThresholds(current, params) {
    const errors = [];
    // Get proposed values
    const autonomousThreshold = params.autonomousThreshold ?? current.confidenceThresholds.autonomous;
    const assistedThreshold = params.assistedThreshold ?? current.confidenceThresholds.assisted;
    const maxAutonomousPerDay = params.maxAutonomousPerDay ?? current.safetyLimits.maxAutonomousPerDay;
    const maxAutonomousPerHour = params.maxAutonomousPerHour ?? current.safetyLimits.maxAutonomousPerHour;
    // Validate autonomous threshold
    if (autonomousThreshold < 0.70 || autonomousThreshold > 1.0) {
        errors.push('Autonomous threshold must be between 0.70 and 1.0');
    }
    // Validate assisted threshold
    if (assistedThreshold < 0.50 || assistedThreshold >= autonomousThreshold) {
        errors.push('Assisted threshold must be between 0.50 and less than autonomous threshold');
    }
    // Validate max autonomous per day
    if (maxAutonomousPerDay < 1) {
        errors.push('Max autonomous per day must be at least 1');
    }
    // Validate max autonomous per hour
    if (maxAutonomousPerHour < 1) {
        errors.push('Max autonomous per hour must be at least 1');
    }
    // Validate hour limit doesn't exceed day limit
    if (maxAutonomousPerHour * 24 < maxAutonomousPerDay) {
        errors.push('Max autonomous per hour * 24 should be >= max autonomous per day');
    }
    return {
        valid: errors.length === 0,
        errors,
    };
}
/**
 * Calculate changes between current and proposed thresholds
 */
function calculateChanges(current, params) {
    const changes = [];
    if (params.autonomousThreshold !== undefined &&
        params.autonomousThreshold !== current.confidenceThresholds.autonomous) {
        changes.push({
            field: 'confidenceThresholds.autonomous',
            oldValue: current.confidenceThresholds.autonomous,
            newValue: params.autonomousThreshold,
        });
    }
    if (params.assistedThreshold !== undefined &&
        params.assistedThreshold !== current.confidenceThresholds.assisted) {
        changes.push({
            field: 'confidenceThresholds.assisted',
            oldValue: current.confidenceThresholds.assisted,
            newValue: params.assistedThreshold,
        });
    }
    if (params.maxAutonomousPerDay !== undefined &&
        params.maxAutonomousPerDay !== current.safetyLimits.maxAutonomousPerDay) {
        changes.push({
            field: 'safetyLimits.maxAutonomousPerDay',
            oldValue: current.safetyLimits.maxAutonomousPerDay,
            newValue: params.maxAutonomousPerDay,
        });
    }
    if (params.maxAutonomousPerHour !== undefined &&
        params.maxAutonomousPerHour !== current.safetyLimits.maxAutonomousPerHour) {
        changes.push({
            field: 'safetyLimits.maxAutonomousPerHour',
            oldValue: current.safetyLimits.maxAutonomousPerHour,
            newValue: params.maxAutonomousPerHour,
        });
    }
    return changes;
}
/**
 * Apply threshold changes
 */
function applyChanges(current, params) {
    const updated = JSON.parse(JSON.stringify(current)); // Deep clone
    if (params.autonomousThreshold !== undefined) {
        updated.confidenceThresholds.autonomous = params.autonomousThreshold;
    }
    if (params.assistedThreshold !== undefined) {
        updated.confidenceThresholds.assisted = params.assistedThreshold;
    }
    if (params.maxAutonomousPerDay !== undefined) {
        updated.safetyLimits.maxAutonomousPerDay = params.maxAutonomousPerDay;
    }
    if (params.maxAutonomousPerHour !== undefined) {
        updated.safetyLimits.maxAutonomousPerHour = params.maxAutonomousPerHour;
    }
    updated.metadata.lastUpdated = new Date().toISOString();
    if (params.reviewedBy) {
        updated.metadata.lastReviewedBy = params.reviewedBy;
    }
    return updated;
}
/**
 * Format comparison report
 */
function formatComparison(changes, current, updated, dryRun) {
    let report = '=== THRESHOLD ADJUSTMENT ' + (dryRun ? '(DRY RUN)' : '') + ' ===\n\n';
    if (changes.length === 0) {
        report += 'No changes detected.\n';
        return report;
    }
    report += '--- CHANGES ---\n';
    changes.forEach(change => {
        report += `  ${change.field}: ${change.oldValue} → ${change.newValue}\n`;
    });
    report += '\n';
    report += '--- BEFORE ---\n';
    report += `  Autonomous Threshold: ${current.confidenceThresholds.autonomous}\n`;
    report += `  Assisted Threshold: ${current.confidenceThresholds.assisted}\n`;
    report += `  Max Autonomous Per Day: ${current.safetyLimits.maxAutonomousPerDay}\n`;
    report += `  Max Autonomous Per Hour: ${current.safetyLimits.maxAutonomousPerHour}\n\n`;
    report += '--- AFTER ---\n';
    report += `  Autonomous Threshold: ${updated.confidenceThresholds.autonomous}\n`;
    report += `  Assisted Threshold: ${updated.confidenceThresholds.assisted}\n`;
    report += `  Max Autonomous Per Day: ${updated.safetyLimits.maxAutonomousPerDay}\n`;
    report += `  Max Autonomous Per Hour: ${updated.safetyLimits.maxAutonomousPerHour}\n\n`;
    if (dryRun) {
        report += 'NOTE: This is a dry run. No changes have been applied.\n';
    }
    else {
        report += 'Changes have been applied and logged to audit trail.\n';
    }
    return report;
}
/**
 * Main tool handler
 */
export async function adjustThresholds(params) {
    try {
        const current = await loadThresholds();
        // Validate proposed changes
        const validation = validateThresholds(current, params);
        if (!validation.valid) {
            return {
                content: [
                    {
                        type: 'text',
                        text: `Validation failed:\n${validation.errors.map(e => `  - ${e}`).join('\n')}`,
                    },
                ],
            };
        }
        // Calculate changes
        const changes = calculateChanges(current, params);
        if (changes.length === 0) {
            return {
                content: [
                    {
                        type: 'text',
                        text: 'No threshold changes specified.',
                    },
                ],
            };
        }
        // Apply changes
        const updated = applyChanges(current, params);
        // Format comparison report
        const report = formatComparison(changes, current, updated, params.dryRun || false);
        // If not dry run, save changes and log to audit trail
        if (!params.dryRun) {
            await saveThresholds(updated);
            await logAuditTrail(changes, params.reason || 'Manual threshold adjustment', params.reviewedBy || 'system');
        }
        return {
            content: [
                {
                    type: 'text',
                    text: report,
                },
            ],
        };
    }
    catch (error) {
        const errorMessage = error instanceof Error ? error.message : String(error);
        return {
            content: [
                {
                    type: 'text',
                    text: `Error: ${errorMessage}`,
                },
            ],
        };
    }
}
//# sourceMappingURL=adjust-thresholds.js.map