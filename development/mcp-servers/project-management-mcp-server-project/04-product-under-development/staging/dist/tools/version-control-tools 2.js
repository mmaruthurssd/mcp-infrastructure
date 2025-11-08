/**
 * Version Control Tools for Hierarchical Planning System
 *
 * MCP Tools: Complete version-aware document management
 *
 * Created: 2025-10-28
 * Goal: 002 - Implement Version-Aware Document System
 */
import { readFile, writeFile } from 'fs/promises';
import { join, dirname } from 'path';
import { existsSync } from 'fs';
import { z } from 'zod';
import { glob } from 'glob';
// ============================================================================
// TYPES & SCHEMAS
// ============================================================================
export const DocumentTypeSchema = z.enum([
    'project-overview',
    'roadmap',
    'component',
    'major-goal',
    'sub-goal',
]);
export const VersionHistoryEntrySchema = z.object({
    version: z.number(),
    date: z.string(),
    changes: z.string(),
    author: z.string(),
});
export const ImpactedDocumentSchema = z.object({
    documentType: DocumentTypeSchema,
    documentPath: z.string(),
    currentVersion: z.number(),
    impactLevel: z.enum(['low', 'medium', 'high']),
    impactReason: z.string(),
    requiresReview: z.boolean(),
});
/**
 * Analyze impact of proposed version changes before committing
 */
export async function analyzeVersionImpact(input) {
    const warnings = [];
    const recommendations = [];
    const impactedDocuments = [];
    try {
        // Read current document
        const fullPath = join(input.projectPath, input.documentPath);
        if (!existsSync(fullPath)) {
            return {
                success: false,
                currentVersion: 0,
                proposedVersion: 0,
                impactSummary: {
                    totalDocumentsAffected: 0,
                    highImpactCount: 0,
                    mediumImpactCount: 0,
                    lowImpactCount: 0,
                    requiresReviewCount: 0,
                },
                impactedDocuments: [],
                recommendations: [],
                warnings: [],
                error: `Document not found: ${input.documentPath}`,
            };
        }
        const content = await readFile(fullPath, 'utf-8');
        const currentVersion = extractVersion(content);
        const proposedVersion = calculateNewVersion(currentVersion, input.changeType);
        // Analyze impact based on document type
        switch (input.documentType) {
            case 'project-overview':
                await analyzeProjectOverviewImpact(input.projectPath, input.proposedChanges, impactedDocuments, recommendations, warnings);
                break;
            case 'component':
                await analyzeComponentImpact(input.projectPath, input.documentPath, input.proposedChanges, impactedDocuments, recommendations, warnings);
                break;
            case 'major-goal':
                await analyzeMajorGoalImpact(input.projectPath, input.documentPath, input.proposedChanges, impactedDocuments, recommendations, warnings);
                break;
            case 'roadmap':
                await analyzeRoadmapImpact(input.projectPath, input.proposedChanges, impactedDocuments, recommendations, warnings);
                break;
            default:
                warnings.push(`Impact analysis not yet implemented for ${input.documentType}`);
        }
        // Calculate summary statistics
        const impactSummary = {
            totalDocumentsAffected: impactedDocuments.length,
            highImpactCount: impactedDocuments.filter(d => d.impactLevel === 'high').length,
            mediumImpactCount: impactedDocuments.filter(d => d.impactLevel === 'medium').length,
            lowImpactCount: impactedDocuments.filter(d => d.impactLevel === 'low').length,
            requiresReviewCount: impactedDocuments.filter(d => d.requiresReview).length,
        };
        // Generate recommendations
        if (impactSummary.highImpactCount > 0) {
            recommendations.push(`${impactSummary.highImpactCount} high-impact documents will be affected. Consider creating a backup before proceeding.`);
        }
        if (input.changeType === 'major' && impactSummary.totalDocumentsAffected > 5) {
            recommendations.push('Major version change affecting many documents. Consider breaking into smaller updates.');
        }
        if (impactSummary.requiresReviewCount > 0) {
            recommendations.push(`${impactSummary.requiresReviewCount} documents require manual review after update.`);
        }
        return {
            success: true,
            currentVersion,
            proposedVersion,
            impactSummary,
            impactedDocuments,
            recommendations,
            warnings,
        };
    }
    catch (error) {
        return {
            success: false,
            currentVersion: 0,
            proposedVersion: 0,
            impactSummary: {
                totalDocumentsAffected: 0,
                highImpactCount: 0,
                mediumImpactCount: 0,
                lowImpactCount: 0,
                requiresReviewCount: 0,
            },
            impactedDocuments: [],
            recommendations: [],
            warnings: [],
            error: error.message,
        };
    }
}
/**
 * Get version history for a document
 */
export async function getVersionHistory(input) {
    try {
        const fullPath = join(input.projectPath, input.documentPath);
        if (!existsSync(fullPath)) {
            return {
                success: false,
                documentPath: input.documentPath,
                currentVersion: 0,
                totalVersions: 0,
                history: [],
                error: `Document not found: ${input.documentPath}`,
            };
        }
        const content = await readFile(fullPath, 'utf-8');
        const currentVersion = extractVersion(content);
        const history = extractVersionHistory(content);
        // Apply limit if specified
        const limitedHistory = input.limit ? history.slice(0, input.limit) : history;
        return {
            success: true,
            documentPath: input.documentPath,
            currentVersion,
            totalVersions: history.length,
            history: limitedHistory,
        };
    }
    catch (error) {
        return {
            success: false,
            documentPath: input.documentPath,
            currentVersion: 0,
            totalVersions: 0,
            history: [],
            error: error.message,
        };
    }
}
/**
 * Rollback document to a previous version
 */
export async function rollbackVersion(input) {
    const warnings = [];
    const cascadedRollbacks = [];
    try {
        const fullPath = join(input.projectPath, input.documentPath);
        if (!existsSync(fullPath)) {
            return {
                success: false,
                previousVersion: 0,
                restoredVersion: 0,
                cascadedRollbacks: [],
                warnings: [],
                error: `Document not found: ${input.documentPath}`,
            };
        }
        const content = await readFile(fullPath, 'utf-8');
        const currentVersion = extractVersion(content);
        const history = extractVersionHistory(content);
        // Check if target version exists in history
        const targetEntry = history.find(h => h.version === input.targetVersion);
        if (!targetEntry) {
            return {
                success: false,
                previousVersion: currentVersion,
                restoredVersion: 0,
                cascadedRollbacks: [],
                warnings: [],
                error: `Version ${input.targetVersion} not found in history`,
            };
        }
        // Create backup if requested
        let backupPath;
        if (input.createBackup !== false) {
            const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
            backupPath = `${fullPath}.backup-${timestamp}`;
            await writeFile(backupPath, content, 'utf-8');
            warnings.push(`Backup created: ${backupPath}`);
        }
        // Update document version
        const updatedContent = updateVersionInContent(content, input.targetVersion, `Rollback to v${input.targetVersion}: ${input.reason}`);
        await writeFile(fullPath, updatedContent, 'utf-8');
        // Handle cascade rollback
        if (input.cascadeRollback) {
            warnings.push('Cascade rollback requested but not fully implemented. Manual review of dependent documents recommended.');
        }
        return {
            success: true,
            previousVersion: currentVersion,
            restoredVersion: input.targetVersion,
            backupPath,
            cascadedRollbacks,
            warnings,
        };
    }
    catch (error) {
        return {
            success: false,
            previousVersion: 0,
            restoredVersion: 0,
            cascadedRollbacks: [],
            warnings: [],
            error: error.message,
        };
    }
}
/**
 * Update component with version tracking and cascade
 */
export async function updateComponentVersion(input) {
    const warnings = [];
    const changes = [];
    const cascadedUpdates = [];
    try {
        // Find component OVERVIEW.md
        const componentPattern = join(input.projectPath, '02-goals-and-roadmap/components', input.componentId, 'OVERVIEW.md');
        const componentFiles = await glob(componentPattern);
        if (componentFiles.length === 0) {
            return {
                success: false,
                componentPath: '',
                previousVersion: 0,
                newVersion: 0,
                changes: [],
                cascadedUpdates: [],
                warnings: [],
                error: `Component not found: ${input.componentId}`,
            };
        }
        const componentPath = componentFiles[0];
        const content = await readFile(componentPath, 'utf-8');
        const currentVersion = extractVersion(content);
        // Detect changes
        const currentData = parseComponentDocument(content);
        for (const [key, newValue] of Object.entries(input.updates)) {
            const oldValue = currentData[key];
            if (JSON.stringify(oldValue) !== JSON.stringify(newValue)) {
                changes.push({
                    field: key,
                    previousValue: oldValue,
                    newValue,
                });
            }
        }
        // Calculate new version
        const changeType = input.versionChangeType || determineChangeType(changes);
        const newVersion = calculateNewVersion(currentVersion, changeType);
        // Dry run - preview only
        if (input.dryRun) {
            warnings.push('Dry run - no changes written');
            return {
                success: true,
                componentPath,
                previousVersion: currentVersion,
                newVersion,
                changes,
                cascadedUpdates: [], // Would be computed but not executed
                warnings,
            };
        }
        // Update version in document
        const updatedContent = applyUpdatesToComponent(content, input.updates, newVersion, changes);
        await writeFile(componentPath, updatedContent, 'utf-8');
        // Cascade to major goals if requested
        if (input.cascadeToGoals !== false) {
            const goalPattern = join(input.projectPath, '02-goals-and-roadmap/components', input.componentId, '*/major-goals/*/GOAL-STATUS.md');
            const goalFiles = await glob(goalPattern);
            for (const goalFile of goalFiles) {
                cascadedUpdates.push({
                    documentPath: goalFile,
                    updateDescription: `Component ${input.componentId} updated to v${newVersion}`,
                    executed: false, // Would need goal-specific update logic
                });
            }
            if (cascadedUpdates.length > 0) {
                warnings.push(`${cascadedUpdates.length} goals depend on this component. Review recommended.`);
            }
        }
        return {
            success: true,
            componentPath,
            previousVersion: currentVersion,
            newVersion,
            changes,
            cascadedUpdates,
            warnings,
        };
    }
    catch (error) {
        return {
            success: false,
            componentPath: '',
            previousVersion: 0,
            newVersion: 0,
            changes: [],
            cascadedUpdates: [],
            warnings: [],
            error: error.message,
        };
    }
}
// ============================================================================
// IMPACT ANALYSIS HELPERS
// ============================================================================
async function analyzeProjectOverviewImpact(projectPath, proposedChanges, impactedDocuments, recommendations, warnings) {
    // PROJECT OVERVIEW changes affect all components and roadmap
    const componentsPattern = join(projectPath, '02-goals-and-roadmap/components/*/OVERVIEW.md');
    const componentFiles = await glob(componentsPattern);
    for (const componentFile of componentFiles) {
        const content = await readFile(componentFile, 'utf-8');
        const version = extractVersion(content);
        impactedDocuments.push({
            documentType: 'component',
            documentPath: componentFile.replace(projectPath + '/', ''),
            currentVersion: version,
            impactLevel: 'high',
            impactReason: 'Project vision or scope changed',
            requiresReview: true,
        });
    }
    // Check roadmap
    const roadmapPath = join(projectPath, '02-goals-and-roadmap/ROADMAP.md');
    if (existsSync(roadmapPath)) {
        const content = await readFile(roadmapPath, 'utf-8');
        const version = extractVersion(content);
        impactedDocuments.push({
            documentType: 'roadmap',
            documentPath: '02-goals-and-roadmap/ROADMAP.md',
            currentVersion: version,
            impactLevel: 'high',
            impactReason: 'Timeline or milestones may need adjustment',
            requiresReview: true,
        });
    }
    recommendations.push('PROJECT OVERVIEW changes are high-impact. Schedule stakeholder review.');
}
async function analyzeComponentImpact(projectPath, documentPath, proposedChanges, impactedDocuments, recommendations, warnings) {
    // Component changes affect its major goals
    const componentDir = dirname(documentPath);
    const goalsPattern = join(projectPath, componentDir, '*/major-goals/*/GOAL-STATUS.md');
    const goalFiles = await glob(goalsPattern);
    for (const goalFile of goalFiles) {
        const content = await readFile(goalFile, 'utf-8');
        const version = extractVersion(content);
        impactedDocuments.push({
            documentType: 'major-goal',
            documentPath: goalFile.replace(projectPath + '/', ''),
            currentVersion: version,
            impactLevel: 'medium',
            impactReason: 'Parent component changed',
            requiresReview: true,
        });
    }
}
async function analyzeMajorGoalImpact(projectPath, documentPath, proposedChanges, impactedDocuments, recommendations, warnings) {
    // Major goal changes affect its sub-goals
    const goalDir = dirname(documentPath);
    const subGoalsPattern = join(projectPath, goalDir, 'sub-goals/*/SUB-GOAL-STATUS.md');
    const subGoalFiles = await glob(subGoalsPattern);
    for (const subGoalFile of subGoalFiles) {
        const content = await readFile(subGoalFile, 'utf-8');
        const version = extractVersion(content);
        impactedDocuments.push({
            documentType: 'sub-goal',
            documentPath: subGoalFile.replace(projectPath + '/', ''),
            currentVersion: version,
            impactLevel: 'low',
            impactReason: 'Parent goal updated',
            requiresReview: false,
        });
    }
}
async function analyzeRoadmapImpact(projectPath, proposedChanges, impactedDocuments, recommendations, warnings) {
    // Roadmap changes might affect component timelines
    warnings.push('Roadmap impact analysis not fully implemented');
}
// ============================================================================
// VERSION UTILITIES
// ============================================================================
function extractVersion(content) {
    // Try YAML frontmatter
    const yamlMatch = content.match(/^---\n[\s\S]*?version:\s*(\d+(?:\.\d+)?)/);
    if (yamlMatch) {
        return parseFloat(yamlMatch[1]);
    }
    // Try Version section
    const sectionMatch = content.match(/##\s*Version(?:\s+Info)?[\s\S]*?Version:\s*(\d+(?:\.\d+)?)/i);
    if (sectionMatch) {
        return parseFloat(sectionMatch[1]);
    }
    return 1.0;
}
function extractVersionHistory(content) {
    const history = [];
    // Look for Version History section
    const historyMatch = content.match(/##\s*Version History[\s\S]*?(?=\n##\s|\n---\n|$)/i);
    if (!historyMatch) {
        return history;
    }
    const historySection = historyMatch[0];
    // Parse table rows (skip header)
    const rows = historySection.split('\n').filter(line => line.trim().startsWith('|'));
    for (let i = 2; i < rows.length; i++) {
        // Skip header and separator
        const cells = rows[i].split('|').map(cell => cell.trim()).filter(Boolean);
        if (cells.length >= 4) {
            history.push({
                version: parseFloat(cells[0]) || 0,
                date: cells[1],
                changes: cells[2],
                author: cells[3],
            });
        }
    }
    return history;
}
function calculateNewVersion(currentVersion, changeType) {
    switch (changeType) {
        case 'major':
            return Math.ceil(currentVersion + 1);
        case 'minor':
            return Math.round((currentVersion + 0.1) * 10) / 10;
        case 'patch':
            return Math.round((currentVersion + 0.01) * 100) / 100;
        default:
            return currentVersion + 0.01;
    }
}
function updateVersionInContent(content, newVersion, changeNote) {
    const date = new Date().toISOString().split('T')[0];
    // Update YAML frontmatter version
    let updated = content.replace(/^(---\n[\s\S]*?version:\s*)(\d+(?:\.\d+)?)/m, `$1${newVersion}`);
    // Add to version history table
    const historyMatch = updated.match(/##\s*Version History[\s\S]*?\n\|/);
    if (historyMatch) {
        const insertPos = historyMatch.index + historyMatch[0].length;
        const headerEnd = updated.indexOf('\n', insertPos);
        const separatorEnd = updated.indexOf('\n', headerEnd + 1);
        const newEntry = `\n| ${newVersion} | ${date} | ${changeNote} | Project Management MCP |`;
        updated = updated.slice(0, separatorEnd + 1) + newEntry + updated.slice(separatorEnd + 1);
    }
    return updated;
}
function parseComponentDocument(content) {
    // Simplified parser - would be more comprehensive in production
    return {
        name: extractFieldValue(content, 'Component'),
        purpose: extractFieldValue(content, 'Purpose'),
        status: extractFieldValue(content, 'Status'),
    };
}
function extractFieldValue(content, fieldName) {
    const match = content.match(new RegExp(`\\*\\*${fieldName}:\\*\\*\\s*(.+?)(?=\\n|$)`));
    return match ? match[1].trim() : '';
}
function determineChangeType(changes) {
    const majorFields = ['name', 'purpose', 'scope'];
    const hasMajorChange = changes.some(c => majorFields.includes(c.field));
    if (hasMajorChange) {
        return 'major';
    }
    const minorFields = ['status', 'timeline', 'goals'];
    const hasMinorChange = changes.some(c => minorFields.includes(c.field));
    return hasMinorChange ? 'minor' : 'patch';
}
function applyUpdatesToComponent(content, updates, newVersion, changes) {
    let updated = content;
    const date = new Date().toISOString().split('T')[0];
    // Update version in frontmatter
    updated = updated.replace(/^(---\n[\s\S]*?version:\s*)(\d+(?:\.\d+)?)/m, `$1${newVersion}`);
    // Update fields
    for (const [key, value] of Object.entries(updates)) {
        const fieldPattern = new RegExp(`(\\*\\*${key}:\\*\\*)\\s*(.+?)(?=\\n|$)`, 'i');
        updated = updated.replace(fieldPattern, `$1 ${value}`);
    }
    // Add version history entry
    const changesSummary = changes.map(c => c.field).join(', ');
    const historyEntry = `\n| ${newVersion} | ${date} | Updated: ${changesSummary} | Project Management MCP |`;
    const historyMatch = updated.match(/##\s*Version History[\s\S]*?\n\|/);
    if (historyMatch) {
        const insertPos = historyMatch.index + historyMatch[0].length;
        const headerEnd = updated.indexOf('\n', insertPos);
        const separatorEnd = updated.indexOf('\n', headerEnd + 1);
        updated = updated.slice(0, separatorEnd + 1) + historyEntry + updated.slice(separatorEnd + 1);
    }
    return updated;
}
// ============================================================================
// MCP TOOL DEFINITIONS
// ============================================================================
export const analyzeVersionImpactTool = {
    name: 'analyze_version_impact',
    description: 'Analyze the impact of proposed version changes before committing. Shows affected documents, impact levels, and recommendations.',
    inputSchema: z.object({
        projectPath: z.string().describe('Absolute path to project directory'),
        documentType: DocumentTypeSchema.describe('Type of document being changed'),
        documentPath: z.string().describe('Relative path to document from project root'),
        proposedChanges: z
            .record(z.string(), z.any())
            .describe('Object with proposed changes (field: newValue)'),
        changeType: z
            .enum(['major', 'minor', 'patch'])
            .describe('Type of version change (major/minor/patch)'),
    }),
};
export const getVersionHistoryTool = {
    name: 'get_version_history',
    description: 'Get version history for a document. Returns list of versions with dates, changes, and authors.',
    inputSchema: z.object({
        projectPath: z.string().describe('Absolute path to project directory'),
        documentType: DocumentTypeSchema.describe('Type of document'),
        documentPath: z.string().describe('Relative path to document from project root'),
        limit: z.number().optional().describe('Maximum number of history entries to return'),
    }),
};
export const rollbackVersionTool = {
    name: 'rollback_version',
    description: 'Rollback a document to a previous version. Creates backup and optionally cascades rollback to dependent documents.',
    inputSchema: z.object({
        projectPath: z.string().describe('Absolute path to project directory'),
        documentType: DocumentTypeSchema.describe('Type of document'),
        documentPath: z.string().describe('Relative path to document from project root'),
        targetVersion: z.number().describe('Version number to rollback to'),
        cascadeRollback: z
            .boolean()
            .optional()
            .describe('Whether to rollback dependent documents (default: false)'),
        createBackup: z
            .boolean()
            .optional()
            .describe('Whether to create backup before rollback (default: true)'),
        reason: z.string().describe('Reason for rollback'),
    }),
};
export const updateComponentVersionTool = {
    name: 'update_component_version',
    description: 'Update a component with version tracking and cascade to dependent goals. Supports dry-run mode for preview.',
    inputSchema: z.object({
        projectPath: z.string().describe('Absolute path to project directory'),
        componentId: z.string().describe('Component ID'),
        updates: z.record(z.string(), z.any()).describe('Object with updates (field: newValue)'),
        versionChangeType: z
            .enum(['major', 'minor', 'patch'])
            .optional()
            .describe('Type of version change (auto-detected if not provided)'),
        cascadeToGoals: z
            .boolean()
            .optional()
            .describe('Whether to cascade updates to dependent goals (default: true)'),
        dryRun: z.boolean().optional().describe('Preview changes without writing (default: false)'),
    }),
};
//# sourceMappingURL=version-control-tools%202.js.map