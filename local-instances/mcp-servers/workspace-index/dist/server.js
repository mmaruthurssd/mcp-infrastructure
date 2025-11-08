#!/usr/bin/env node
import { Server } from '@modelcontextprotocol/sdk/server/index.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import { CallToolRequestSchema, ListResourcesRequestSchema, ListToolsRequestSchema, ReadResourceRequestSchema, ErrorCode, McpError } from '@modelcontextprotocol/sdk/types.js';
import { IndexGenerator } from './index-generator.js';
import { DocumentationValidator } from './documentation-validator.js';
import { DriftTracker } from './drift-tracker.js';
import { DocumentationUpdater } from './documentation-updater.js';
import { ConfigurableWorkspaceAdapter } from './adapters/workspace-adapter.js';
import { DocumentationHealthAnalyzer } from './phase4/documentation-health-analyzer.js';
import * as fs from 'fs/promises';
import * as path from 'path';
const PROJECT_ROOT = process.env.WORKSPACE_INDEX_PROJECT_ROOT ||
    process.env.PROJECT_INDEX_GENERATOR_PROJECT_ROOT ||
    process.cwd();
// Helper: Log telemetry events for workspace-brain
async function logTelemetry(eventType, eventData) {
    try {
        const telemetryDir = path.join(PROJECT_ROOT, '.telemetry');
        await fs.mkdir(telemetryDir, { recursive: true });
        const event = {
            timestamp: new Date().toISOString(),
            event_type: eventType,
            event_data: eventData,
            source: 'workspace-index-mcp'
        };
        const logFile = path.join(telemetryDir, 'workspace-index-events.jsonl');
        await fs.appendFile(logFile, JSON.stringify(event) + '\n');
    }
    catch (error) {
        // Silent fail - telemetry shouldn't break the tool
        console.error('[Telemetry] Failed to log event:', error);
    }
}
let indexGenerator;
let documentationValidator;
let driftTracker;
let documentationUpdater;
let workspaceAdapter;
let healthAnalyzer;
// Initialize MCP server
const server = new Server({
    name: 'workspace-index',
    version: '1.1.0',
}, {
    capabilities: {
        resources: {},
        tools: {},
    },
});
// Register resources
server.setRequestHandler(ListResourcesRequestSchema, async () => {
    return {
        resources: [
            {
                uri: 'index-generator://project-index',
                name: 'Current Project Index',
                description: 'The current complete project index',
                mimeType: 'text/markdown',
            },
            {
                uri: 'index-generator://stale-indexes',
                name: 'Stale Indexes',
                description: 'List of outdated indexes that need updating',
                mimeType: 'application/json',
            },
            {
                uri: 'index-generator://statistics',
                name: 'Index Statistics',
                description: 'Statistics about project files and folders',
                mimeType: 'application/json',
            },
        ],
    };
});
server.setRequestHandler(ReadResourceRequestSchema, async (request) => {
    const uri = request.params.uri;
    if (uri === 'index-generator://project-index') {
        // Return current project index
        const fs = await import('fs/promises');
        const path = await import('path');
        try {
            const indexPath = path.join(PROJECT_ROOT, 'PROJECT_INDEX.md');
            const content = await fs.readFile(indexPath, 'utf-8');
            return {
                contents: [
                    {
                        uri,
                        mimeType: 'text/markdown',
                        text: content,
                    },
                ],
            };
        }
        catch (error) {
            throw new McpError(ErrorCode.InternalError, `No index found. Run generate_project_index first.`);
        }
    }
    if (uri === 'index-generator://stale-indexes') {
        const staleIndexes = await indexGenerator.checkIndexFreshness();
        return {
            contents: [
                {
                    uri,
                    mimeType: 'application/json',
                    text: JSON.stringify(staleIndexes, null, 2),
                },
            ],
        };
    }
    if (uri === 'index-generator://statistics') {
        const index = await indexGenerator.generateProjectIndex();
        const stats = {
            totalFiles: index.totalFiles,
            totalFolders: index.totalFolders,
            categoryCounts: Object.fromEntries(Array.from(index.filesByCategory.entries()).map(([k, v]) => [k, v.length])),
            recentFileCount: index.recentFiles.length,
            lastGenerated: index.generated
        };
        return {
            contents: [
                {
                    uri,
                    mimeType: 'application/json',
                    text: JSON.stringify(stats, null, 2),
                },
            ],
        };
    }
    throw new McpError(ErrorCode.InvalidRequest, `Unknown resource: ${uri}`);
});
// Register tools
server.setRequestHandler(ListToolsRequestSchema, async () => {
    return {
        tools: [
            {
                name: 'generate_project_index',
                description: 'Generate complete project index with searchable file catalog',
                inputSchema: {
                    type: 'object',
                    properties: {},
                },
            },
            {
                name: 'update_indexes_for_paths',
                description: 'Update indexes for specific paths (efficient targeted update)',
                inputSchema: {
                    type: 'object',
                    properties: {
                        paths: {
                            type: 'array',
                            items: { type: 'string' },
                            description: 'Array of paths (relative to project root) to re-index',
                        },
                    },
                    required: ['paths'],
                },
            },
            {
                name: 'check_index_freshness',
                description: 'Check if indexes are stale and need updating',
                inputSchema: {
                    type: 'object',
                    properties: {
                        path: {
                            type: 'string',
                            description: 'Optional: specific path to check (relative to project root)',
                        },
                    },
                },
            },
            {
                name: 'validate_workspace_documentation',
                description: 'Validate workspace documentation consistency against filesystem reality',
                inputSchema: {
                    type: 'object',
                    properties: {
                        checks: {
                            type: 'array',
                            items: {
                                type: 'string',
                                enum: ['mcp_counts', 'template_inventory', 'status_accuracy', 'cross_references', 'all']
                            },
                            description: 'Validation checks to perform (default: all)',
                        },
                        targets: {
                            type: 'array',
                            items: { type: 'string' },
                            description: 'Specific docs to validate (default: all key docs)',
                        },
                        reportFormat: {
                            type: 'string',
                            enum: ['summary', 'detailed', 'actionable'],
                            description: 'Report format (default: detailed)',
                        },
                        autoFix: {
                            type: 'boolean',
                            description: 'Auto-fix issues (default: false, just report)',
                        },
                    },
                },
            },
            {
                name: 'track_documentation_drift',
                description: 'Compare current workspace state against last validation to detect changes',
                inputSchema: {
                    type: 'object',
                    properties: {
                        since: {
                            type: 'string',
                            description: 'ISO date or "last-validation" to compare against (default: last-validation)',
                        },
                        categories: {
                            type: 'array',
                            items: {
                                type: 'string',
                                enum: ['mcps', 'templates', 'projects', 'all']
                            },
                            description: 'Categories to check for drift (default: all)',
                        },
                        includeMinorChanges: {
                            type: 'boolean',
                            description: 'Include trivial changes like date updates (default: false)',
                        },
                    },
                },
            },
            {
                name: 'update_workspace_docs_for_reality',
                description: 'Auto-correct documentation to match filesystem reality (counts, status, inventory)',
                inputSchema: {
                    type: 'object',
                    properties: {
                        targets: {
                            type: 'array',
                            items: { type: 'string' },
                            description: 'Specific docs to update (default: all with issues)',
                        },
                        dryRun: {
                            type: 'boolean',
                            description: 'Preview changes without applying (default: true)',
                        },
                        createBackup: {
                            type: 'boolean',
                            description: 'Backup before changes (default: true)',
                        },
                    },
                },
            },
            {
                name: 'analyze_documentation_health',
                description: 'Phase 4: Analyze documentation health to detect superseded, redundant, and stale files with confidence scoring',
                inputSchema: {
                    type: 'object',
                    properties: {},
                },
            },
            {
                name: 'generate_compliance_audit',
                description: 'Generate workspace-wide compliance audit report for all MCPs with scores and recommendations',
                inputSchema: {
                    type: 'object',
                    properties: {},
                },
            },
        ],
    };
});
server.setRequestHandler(CallToolRequestSchema, async (request) => {
    const { name, arguments: args } = request.params;
    try {
        if (name === 'generate_project_index') {
            const index = await indexGenerator.generateProjectIndex();
            // Phase II: Smart Signaling - return metadata for AI coordination
            return {
                content: [
                    {
                        type: 'text',
                        text: `✅ Project index generated successfully!\n\n` +
                            `📊 Statistics:\n` +
                            `- Total Files: ${index.totalFiles}\n` +
                            `- Total Folders: ${index.totalFolders}\n` +
                            `- Categories: ${index.filesByCategory.size}\n` +
                            `- Recent Files: ${index.recentFiles.length}\n\n` +
                            `📝 Index saved to: PROJECT_INDEX.md\n\n` +
                            `🔍 Top Categories:\n` +
                            Array.from(index.filesByCategory.entries())
                                .sort((a, b) => b[1].length - a[1].length)
                                .slice(0, 5)
                                .map(([cat, files]) => `  - ${cat}: ${files.length} files`)
                                .join('\n'),
                    },
                ],
                // Phase II: Include metadata for coordination
                _meta: {
                    indexGenerated: true,
                    indexPath: 'PROJECT_INDEX.md',
                    affectedPaths: [PROJECT_ROOT],
                    totalFiles: index.totalFiles,
                    timestamp: index.generated
                }
            };
        }
        if (name === 'update_indexes_for_paths') {
            const paths = args?.paths;
            if (!paths || !Array.isArray(paths)) {
                throw new McpError(ErrorCode.InvalidParams, 'paths array is required');
            }
            const result = await indexGenerator.updateIndexesForPaths(paths);
            // Phase II: Smart Signaling with detailed results
            return {
                content: [
                    {
                        type: 'text',
                        text: `✅ Index update complete!\n\n` +
                            `📁 Updated Paths (${result.updated.length}):\n` +
                            result.updated.map(p => `  - ${p}`).join('\n') +
                            (result.errors.length > 0
                                ? `\n\n⚠️ Errors (${result.errors.length}):\n` +
                                    result.errors.map(e => `  - ${e}`).join('\n')
                                : ''),
                    },
                ],
                // Phase II: Return metadata for AI coordination
                _meta: {
                    indexUpdated: true,
                    updatedPaths: result.updated,
                    errorCount: result.errors.length,
                    timestamp: new Date().toISOString()
                }
            };
        }
        if (name === 'check_index_freshness') {
            const pathToCheck = args?.path;
            const staleIndexes = await indexGenerator.checkIndexFreshness(pathToCheck);
            if (staleIndexes.length === 0) {
                return {
                    content: [
                        {
                            type: 'text',
                            text: `✅ All indexes are fresh!${pathToCheck ? ` (checked: ${pathToCheck})` : ''}`,
                        },
                    ],
                    _meta: {
                        allFresh: true,
                        checkedPath: pathToCheck,
                        timestamp: new Date().toISOString()
                    }
                };
            }
            return {
                content: [
                    {
                        type: 'text',
                        text: `⚠️ Found ${staleIndexes.length} stale index${staleIndexes.length > 1 ? 'es' : ''}:\n\n` +
                            staleIndexes.map(idx => `📁 ${idx.path}\n` +
                                `  Last Indexed: ${idx.lastIndexed}\n` +
                                `  Last Modified: ${idx.lastModified}\n` +
                                `  Age: ${idx.staleDays} days`).join('\n\n') +
                            `\n\nRecommendation: Run update_indexes_for_paths with these paths to refresh.`,
                    },
                ],
                // Phase II & IV: Metadata for proactive coordination
                _meta: {
                    staleIndexes: staleIndexes.map(idx => idx.path),
                    staleCount: staleIndexes.length,
                    suggestUpdate: true,
                    timestamp: new Date().toISOString()
                }
            };
        }
        if (name === 'validate_workspace_documentation') {
            const checks = args?.checks;
            const reportFormat = args?.reportFormat || 'detailed';
            const result = await documentationValidator.validate({
                checks: checks,
                reportFormat: reportFormat,
            });
            // Format report based on requested format
            let reportText = '';
            if (reportFormat === 'summary') {
                reportText = result.valid
                    ? `✅ All documentation is consistent!\n\n` +
                        `📊 Summary:\n` +
                        `- Total Checks: ${result.summary.totalChecks}\n` +
                        `- Passed: ${result.summary.passed}\n` +
                        `- Failed: ${result.summary.failed}\n`
                    : `⚠️ Found ${result.issues.length} documentation inconsistenc${result.issues.length > 1 ? 'ies' : 'y'}\n\n` +
                        `📊 Summary:\n` +
                        `- Total Checks: ${result.summary.totalChecks}\n` +
                        `- Passed: ${result.summary.passed}\n` +
                        `- Failed: ${result.summary.failed}\n`;
            }
            else {
                // Detailed or actionable format
                if (result.valid) {
                    reportText = `✅ All documentation is consistent!\n\n` +
                        `📊 Summary:\n` +
                        `- Total Checks: ${result.summary.totalChecks}\n` +
                        `- Passed: ${result.summary.passed}\n` +
                        `- Last Validated: ${result.lastValidated}\n\n` +
                        `All documentation accurately reflects workspace reality.`;
                }
                else {
                    reportText = `⚠️ Found ${result.issues.length} documentation inconsistenc${result.issues.length > 1 ? 'ies' : 'y'}\n\n`;
                    // Group issues by severity
                    const criticalIssues = result.issues.filter(i => i.severity === 'critical');
                    const warningIssues = result.issues.filter(i => i.severity === 'warning');
                    const infoIssues = result.issues.filter(i => i.severity === 'info');
                    if (criticalIssues.length > 0) {
                        reportText += `🔴 Critical Issues (${criticalIssues.length}):\n\n`;
                        criticalIssues.forEach(issue => {
                            reportText += `  📄 ${issue.file}${issue.line ? `:${issue.line}` : ''}\n`;
                            reportText += `     Expected: ${issue.expected}\n`;
                            reportText += `     Actual: ${issue.actual}\n`;
                            if (reportFormat === 'actionable') {
                                reportText += `     ➜ ${issue.suggestion}\n`;
                            }
                            reportText += `\n`;
                        });
                    }
                    if (warningIssues.length > 0) {
                        reportText += `🟡 Warnings (${warningIssues.length}):\n\n`;
                        warningIssues.forEach(issue => {
                            reportText += `  📄 ${issue.file}${issue.line ? `:${issue.line}` : ''}\n`;
                            reportText += `     Expected: ${issue.expected}\n`;
                            reportText += `     Actual: ${issue.actual}\n`;
                            if (reportFormat === 'actionable') {
                                reportText += `     ➜ ${issue.suggestion}\n`;
                            }
                            reportText += `\n`;
                        });
                    }
                    if (infoIssues.length > 0 && reportFormat === 'detailed') {
                        reportText += `ℹ️  Info (${infoIssues.length}):\n\n`;
                        infoIssues.forEach(issue => {
                            reportText += `  📄 ${issue.file}${issue.line ? `:${issue.line}` : ''}\n`;
                            reportText += `     ${issue.suggestion}\n\n`;
                        });
                    }
                    reportText += `\n📊 Summary:\n`;
                    reportText += `- Total Checks: ${result.summary.totalChecks}\n`;
                    reportText += `- Passed: ${result.summary.passed}\n`;
                    reportText += `- Failed: ${result.summary.failed}\n`;
                    reportText += `- Last Validated: ${result.lastValidated}\n`;
                }
            }
            // Log telemetry for workspace-brain
            await logTelemetry('documentation-validation', {
                valid: result.valid,
                issues_count: result.issues.length,
                checks_run: result.summary.totalChecks,
                categories: [...new Set(result.issues.map(i => i.category))],
                severity_breakdown: {
                    critical: result.issues.filter(i => i.severity === 'critical').length,
                    warning: result.issues.filter(i => i.severity === 'warning').length,
                    info: result.issues.filter(i => i.severity === 'info').length
                }
            });
            // Save baseline after validation
            await driftTracker.saveBaseline();
            return {
                content: [
                    {
                        type: 'text',
                        text: reportText,
                    },
                ],
                _meta: {
                    validationComplete: true,
                    valid: result.valid,
                    issueCount: result.issues.length,
                    checksRun: result.summary.totalChecks,
                    issues: result.issues,
                    timestamp: result.lastValidated,
                    baselineSaved: true
                }
            };
        }
        if (name === 'update_workspace_docs_for_reality') {
            const targets = args?.targets;
            const dryRun = args?.dryRun !== false; // Default to true
            const createBackup = args?.createBackup !== false; // Default to true
            // Capture current snapshot
            const snapshot = await driftTracker.loadBaseline();
            if (!snapshot) {
                throw new McpError(ErrorCode.InvalidRequest, 'No baseline found. Run validate_workspace_documentation first.');
            }
            const result = await documentationUpdater.updateDocumentation({
                targets,
                dryRun,
                createBackup,
                snapshot,
            });
            let reportText = '';
            if (result.dryRun) {
                reportText = `🔍 DRY RUN: Preview of changes\n\n`;
            }
            else {
                reportText = `✅ Documentation updated!\n\n`;
            }
            if (result.changes.length === 0) {
                reportText += `No changes needed. Documentation already matches reality.\n`;
            }
            else {
                reportText += `📝 Changes ${result.dryRun ? 'proposed' : 'applied'} (${result.changes.length} file${result.changes.length > 1 ? 's' : ''}):\n\n`;
                for (const change of result.changes) {
                    reportText += `📄 ${change.file} (${change.linesModified} line${change.linesModified > 1 ? 's' : ''} modified)\n`;
                    if (result.dryRun) {
                        reportText += `${change.preview}\n\n`;
                    }
                }
                if (!result.dryRun && result.backupPath) {
                    reportText += `\n💾 Backups saved to: ${result.backupPath}\n`;
                }
            }
            if (!result.validation.syntaxValid) {
                reportText += `\n⚠️  Syntax Validation Errors:\n`;
                result.validation.errors.forEach(err => {
                    reportText += `  - ${err}\n`;
                });
                if (!result.dryRun) {
                    reportText += `\n↩️  Changes rolled back due to validation errors.\n`;
                }
            }
            if (result.dryRun && result.changes.length > 0) {
                reportText += `\n💡 To apply these changes, call again with dryRun: false\n`;
            }
            // Log telemetry for workspace-brain
            await logTelemetry('documentation-auto-correction', {
                dry_run: result.dryRun,
                changes_count: result.changes.length,
                files_affected: result.changes.map(c => c.file),
                total_lines_modified: result.changes.reduce((sum, c) => sum + c.linesModified, 0),
                syntax_valid: result.validation.syntaxValid,
                validation_errors: result.validation.errors.length,
                backup_created: !!result.backupPath,
                applied: !result.dryRun && result.validation.syntaxValid
            });
            return {
                content: [
                    {
                        type: 'text',
                        text: reportText,
                    },
                ],
                _meta: {
                    updated: !result.dryRun,
                    dryRun: result.dryRun,
                    changesCount: result.changes.length,
                    changes: result.changes.map(c => ({ file: c.file, linesModified: c.linesModified })),
                    syntaxValid: result.validation.syntaxValid,
                    backupPath: result.backupPath,
                    timestamp: new Date().toISOString()
                }
            };
        }
        if (name === 'track_documentation_drift') {
            const since = args?.since || 'last-validation';
            const categories = args?.categories;
            const includeMinorChanges = args?.includeMinorChanges || false;
            const result = await driftTracker.trackDrift({
                since,
                categories: categories,
                includeMinorChanges,
            });
            let reportText = '';
            if (!result.driftDetected) {
                reportText = `✅ No drift detected!\n\n` +
                    `📊 Workspace state unchanged since ${result.since}\n\n` +
                    result.recommendedAction;
            }
            else {
                reportText = `🔔 Drift detected since ${result.since}\n\n`;
                // Group changes by category
                const mcpChanges = result.changes.filter(c => c.category === 'mcps');
                const templateChanges = result.changes.filter(c => c.category === 'templates');
                const projectChanges = result.changes.filter(c => c.category === 'projects');
                if (mcpChanges.length > 0) {
                    reportText += `📦 MCP Changes (${mcpChanges.length}):\n`;
                    mcpChanges.forEach(change => {
                        const icon = change.type === 'added' ? '➕' : change.type === 'removed' ? '➖' : '✏️';
                        reportText += `  ${icon} ${change.details}\n`;
                    });
                    reportText += `\n`;
                }
                if (templateChanges.length > 0) {
                    reportText += `📝 Template Changes (${templateChanges.length}):\n`;
                    templateChanges.forEach(change => {
                        const icon = change.type === 'added' ? '➕' : change.type === 'removed' ? '➖' : '✏️';
                        reportText += `  ${icon} ${change.details}\n`;
                    });
                    reportText += `\n`;
                }
                if (projectChanges.length > 0) {
                    reportText += `🚧 Project Changes (${projectChanges.length}):\n`;
                    projectChanges.forEach(change => {
                        const icon = change.type === 'added' ? '➕' : change.type === 'removed' ? '➖' : '✏️';
                        reportText += `  ${icon} ${change.details}\n`;
                    });
                    reportText += `\n`;
                }
                if (result.affectedDocumentation.length > 0) {
                    reportText += `📄 Affected Documentation:\n`;
                    result.affectedDocumentation.forEach(doc => {
                        reportText += `  - ${doc}\n`;
                    });
                    reportText += `\n`;
                }
                reportText += `💡 ${result.recommendedAction}`;
            }
            // Log telemetry for workspace-brain
            await logTelemetry('documentation-drift', {
                drift_detected: result.driftDetected,
                change_count: result.changes.length,
                since: result.since,
                categories: [...new Set(result.changes.map(c => c.category))],
                change_types: {
                    added: result.changes.filter(c => c.type === 'added').length,
                    removed: result.changes.filter(c => c.type === 'removed').length,
                    modified: result.changes.filter(c => c.type === 'modified').length,
                    renamed: result.changes.filter(c => c.type === 'renamed').length
                },
                affected_docs_count: result.affectedDocumentation.length
            });
            return {
                content: [
                    {
                        type: 'text',
                        text: reportText,
                    },
                ],
                _meta: {
                    driftDetected: result.driftDetected,
                    since: result.since,
                    changeCount: result.changes.length,
                    changes: result.changes,
                    affectedDocs: result.affectedDocumentation,
                    timestamp: new Date().toISOString()
                }
            };
        }
        if (name === 'analyze_documentation_health') {
            // Phase 4: Documentation health analysis
            const result = await healthAnalyzer.analyzeHealth();
            const autoExecuteThreshold = workspaceAdapter.getConfig().thresholds.auto_execute;
            let reportText = `🔍 Documentation Health Analysis\n\n`;
            reportText += `📊 Summary:\n`;
            reportText += `- Files Scanned: ${result.scannedFiles}\n`;
            reportText += `- Issues Detected: ${result.issuesDetected}\n`;
            reportText += `  - Superseded: ${result.summary.superseded}\n`;
            reportText += `  - Redundant: ${result.summary.redundant}\n`;
            reportText += `  - Stale: ${result.summary.stale}\n\n`;
            if (result.issuesDetected === 0) {
                reportText += `✅ No issues detected. Documentation appears healthy!\n`;
            }
            else {
                // Group issues by confidence level
                const highConfidence = result.issues.filter(i => i.confidence >= autoExecuteThreshold);
                const mediumConfidence = result.issues.filter(i => i.confidence >= 0.70 && i.confidence < autoExecuteThreshold);
                const lowConfidence = result.issues.filter(i => i.confidence < 0.70);
                if (highConfidence.length > 0) {
                    reportText += `🟢 High Confidence Issues (≥${(autoExecuteThreshold * 100).toFixed(0)}%) - ${highConfidence.length}:\n\n`;
                    for (const issue of highConfidence.slice(0, 5)) {
                        reportText += `  📄 ${issue.files.join(', ')}\n`;
                        reportText += `     Type: ${issue.type}\n`;
                        reportText += `     Confidence: ${(issue.confidence * 100).toFixed(1)}%\n`;
                        reportText += `     Suggested: ${issue.recommendedAction.operation}\n`;
                        reportText += `     Details: ${issue.analysis.reason}\n\n`;
                    }
                    if (highConfidence.length > 5) {
                        reportText += `  ... and ${highConfidence.length - 5} more\n\n`;
                    }
                }
                if (mediumConfidence.length > 0) {
                    reportText += `🟡 Medium Confidence Issues (70-${(autoExecuteThreshold * 100).toFixed(0)}%) - ${mediumConfidence.length}:\n\n`;
                    for (const issue of mediumConfidence.slice(0, 3)) {
                        reportText += `  📄 ${issue.files.join(', ')}\n`;
                        reportText += `     Type: ${issue.type}\n`;
                        reportText += `     Confidence: ${(issue.confidence * 100).toFixed(1)}%\n`;
                        reportText += `     Details: ${issue.analysis.reason}\n\n`;
                    }
                    if (mediumConfidence.length > 3) {
                        reportText += `  ... and ${mediumConfidence.length - 3} more\n\n`;
                    }
                }
                if (lowConfidence.length > 0) {
                    reportText += `🔴 Low Confidence Issues (<70%) - ${lowConfidence.length}:\n`;
                    reportText += `  Review manually before taking action\n\n`;
                }
            }
            if (result.recommendations.length > 0) {
                reportText += `💡 Recommendations:\n`;
                for (const rec of result.recommendations) {
                    reportText += `  - ${rec}\n`;
                }
            }
            // Log telemetry
            await logTelemetry('documentation-health-analysis', {
                scanned_files: result.scannedFiles,
                issues_detected: result.issuesDetected,
                issue_breakdown: result.summary,
                high_confidence_count: result.issues.filter(i => i.confidence >= autoExecuteThreshold).length,
                timestamp: result.timestamp
            });
            return {
                content: [
                    {
                        type: 'text',
                        text: reportText,
                    },
                ],
                _meta: {
                    healthAnalysisComplete: true,
                    scannedFiles: result.scannedFiles,
                    issuesDetected: result.issuesDetected,
                    summary: result.summary,
                    issues: result.issues,
                    recommendations: result.recommendations,
                    timestamp: result.timestamp
                }
            };
        }
        if (name === 'generate_compliance_audit') {
            // Standards enforcement integration: workspace-wide compliance audit
            const audit = await indexGenerator.generateComplianceAudit();
            let reportText = `📊 Workspace Compliance Audit\n\n`;
            reportText += `**Summary:**\n`;
            reportText += `- Total MCPs Scanned: ${audit.totalMCPs}\n`;
            reportText += `- Average Compliance Score: ${audit.avgScore}/100\n`;
            reportText += `- High Compliance (≥90): ${audit.highCompliance} MCPs ✅\n`;
            reportText += `- Medium Compliance (70-89): ${audit.mediumCompliance} MCPs ⚠️\n`;
            reportText += `- Low Compliance (<70): ${audit.lowCompliance} MCPs ❌\n\n`;
            if (audit.lowComplianceMCPs.length > 0) {
                reportText += `**Low Compliance MCPs (Action Required):**\n\n`;
                for (const mcp of audit.lowComplianceMCPs) {
                    reportText += `${mcp.name} (Score: ${mcp.score}/100)\n`;
                    reportText += `  - ${mcp.criticalViolations} critical violation(s)\n`;
                    for (const suggestion of mcp.suggestions) {
                        reportText += `  - 💡 ${suggestion}\n`;
                    }
                    reportText += `\n`;
                }
            }
            else {
                reportText += `✅ All MCPs meet minimum compliance standards!\n\n`;
            }
            reportText += `\n💡 **Recommendations:**\n`;
            if (audit.lowCompliance > 0) {
                reportText += `- Prioritize fixing ${audit.lowCompliance} low-compliance MCP(s)\n`;
                reportText += `- Run validate_mcp_compliance for detailed violation reports\n`;
            }
            if (audit.mediumCompliance > 0) {
                reportText += `- Consider improving ${audit.mediumCompliance} medium-compliance MCP(s) to reach 90+\n`;
            }
            if (audit.avgScore < 80) {
                reportText += `- Workspace average is below recommended threshold (80)\n`;
            }
            else {
                reportText += `- Maintain current compliance levels with regular audits\n`;
            }
            // Log telemetry
            await logTelemetry('compliance-audit', {
                total_mcps: audit.totalMCPs,
                avg_score: audit.avgScore,
                high_compliance: audit.highCompliance,
                medium_compliance: audit.mediumCompliance,
                low_compliance: audit.lowCompliance,
                timestamp: new Date().toISOString()
            });
            return {
                content: [
                    {
                        type: 'text',
                        text: reportText,
                    },
                ],
                _meta: {
                    complianceAuditComplete: true,
                    totalMCPs: audit.totalMCPs,
                    avgScore: audit.avgScore,
                    breakdown: {
                        high: audit.highCompliance,
                        medium: audit.mediumCompliance,
                        low: audit.lowCompliance,
                    },
                    lowComplianceMCPs: audit.lowComplianceMCPs.map(m => m.name),
                    mcpScores: audit.mcpScores,
                }
            };
        }
        throw new McpError(ErrorCode.MethodNotFound, `Unknown tool: ${name}`);
    }
    catch (error) {
        if (error instanceof McpError) {
            throw error;
        }
        throw new McpError(ErrorCode.InternalError, `Tool execution failed: ${error}`);
    }
});
// Start server
async function main() {
    indexGenerator = new IndexGenerator(PROJECT_ROOT);
    documentationValidator = new DocumentationValidator(PROJECT_ROOT);
    driftTracker = new DriftTracker(PROJECT_ROOT);
    documentationUpdater = new DocumentationUpdater(PROJECT_ROOT);
    // Phase 4: Initialize workspace adapter and health analyzer
    try {
        workspaceAdapter = await ConfigurableWorkspaceAdapter.create(PROJECT_ROOT);
        healthAnalyzer = new DocumentationHealthAnalyzer(workspaceAdapter);
        console.error('Phase 4: Workspace adapter and health analyzer initialized');
    }
    catch (error) {
        console.error('Warning: Could not initialize Phase 4 components:', error);
        console.error('Phase 4 features (analyze_documentation_health) will not be available');
    }
    const transport = new StdioServerTransport();
    await server.connect(transport);
    console.error('Workspace Index MCP server running on stdio');
    console.error(`Project root: ${PROJECT_ROOT}`);
}
main().catch((error) => {
    console.error('Server error:', error);
    process.exit(1);
});
