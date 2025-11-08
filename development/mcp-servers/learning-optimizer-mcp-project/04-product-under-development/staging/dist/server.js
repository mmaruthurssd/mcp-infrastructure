#!/usr/bin/env node
/**
 * Learning Optimizer MCP Server
 * Domain-agnostic troubleshooting optimization system
 */
import { Server } from '@modelcontextprotocol/sdk/server/index.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import { CallToolRequestSchema, ListToolsRequestSchema, } from '@modelcontextprotocol/sdk/types.js';
import { DomainConfigLoader } from './domain-config.js';
import { IssueTracker } from './issue-tracker.js';
import { Categorizer } from './categorizer.js';
import { DuplicateDetector } from './duplicate-detector.js';
import { OptimizerEngine } from './optimizer.js';
import { PreventiveCheckGenerator } from './preventive-generator.js';
import { ReviewWorkflow } from './review-workflow.js';
import { Validator } from './validator.js';
// Get environment variables
const PROJECT_ROOT = process.env.LEARNING_OPTIMIZER_PROJECT_ROOT || process.cwd();
const CONFIG_DIR = process.env.LEARNING_OPTIMIZER_CONFIG_DIR || `${PROJECT_ROOT}/learning-optimizer-configs`;
console.error('Learning Optimizer MCP Server starting...');
console.error(`Project root: ${PROJECT_ROOT}`);
console.error(`Config directory: ${CONFIG_DIR}`);
// Initialize components
const configLoader = new DomainConfigLoader(CONFIG_DIR);
const issueTracker = new IssueTracker(PROJECT_ROOT);
const categorizer = new Categorizer();
const duplicateDetector = new DuplicateDetector();
const optimizer = new OptimizerEngine(PROJECT_ROOT);
const preventiveGenerator = new PreventiveCheckGenerator(PROJECT_ROOT);
const reviewWorkflow = new ReviewWorkflow();
const validator = new Validator();
// Load domain configurations
await configLoader.loadAllConfigs();
// Create MCP server
const server = new Server({
    name: 'learning-optimizer-mcp-server',
    version: '1.0.0',
}, {
    capabilities: {
        tools: {},
    },
});
// List available tools
server.setRequestHandler(ListToolsRequestSchema, async () => ({
    tools: [
        {
            name: 'track_issue',
            description: 'Track a new issue or update existing one with increased frequency. Auto-detects duplicates by symptom similarity.',
            inputSchema: {
                type: 'object',
                properties: {
                    domain: {
                        type: 'string',
                        description: 'Domain identifier (e.g., "mcp-installation", "google-sheets")',
                    },
                    title: {
                        type: 'string',
                        description: 'Brief issue title',
                    },
                    symptom: {
                        type: 'string',
                        description: 'Error message or observable behavior',
                    },
                    solution: {
                        type: 'string',
                        description: 'Step-by-step fix that resolved the issue',
                    },
                    root_cause: {
                        type: 'string',
                        description: 'Why this happened (optional)',
                    },
                    prevention: {
                        type: 'string',
                        description: 'How to avoid in future (optional)',
                    },
                    context: {
                        type: 'object',
                        description: 'Additional context (OS, versions, step, template, etc.)',
                    },
                },
                required: ['domain', 'title', 'symptom', 'solution'],
            },
        },
        {
            name: 'check_optimization_triggers',
            description: 'Check if optimization should be triggered for a domain based on thresholds (high-impact, technical debt, duplicates)',
            inputSchema: {
                type: 'object',
                properties: {
                    domain: {
                        type: 'string',
                        description: 'Domain identifier',
                    },
                },
                required: ['domain'],
            },
        },
        {
            name: 'optimize_knowledge_base',
            description: 'Execute full optimization: merge duplicates, categorize issues, promote high-impact issues to preventive checks',
            inputSchema: {
                type: 'object',
                properties: {
                    domain: {
                        type: 'string',
                        description: 'Domain identifier',
                    },
                },
                required: ['domain'],
            },
        },
        {
            name: 'get_domain_stats',
            description: 'Get statistics for a domain: total issues, categories, promoted issues, highest frequency',
            inputSchema: {
                type: 'object',
                properties: {
                    domain: {
                        type: 'string',
                        description: 'Domain identifier',
                    },
                },
                required: ['domain'],
            },
        },
        {
            name: 'list_domains',
            description: 'List all configured domains',
            inputSchema: {
                type: 'object',
                properties: {},
            },
        },
        {
            name: 'get_issues',
            description: 'Get all tracked issues for a domain',
            inputSchema: {
                type: 'object',
                properties: {
                    domain: {
                        type: 'string',
                        description: 'Domain identifier',
                    },
                    filter: {
                        type: 'string',
                        description: 'Filter: "promoted", "high-frequency", "duplicates" (optional)',
                    },
                },
                required: ['domain'],
            },
        },
        {
            name: 'detect_duplicates',
            description: 'Detect duplicate issues in a domain',
            inputSchema: {
                type: 'object',
                properties: {
                    domain: {
                        type: 'string',
                        description: 'Domain identifier',
                    },
                },
                required: ['domain'],
            },
        },
        {
            name: 'categorize_issues',
            description: 'Categorize all issues in a domain based on configured keyword matching',
            inputSchema: {
                type: 'object',
                properties: {
                    domain: {
                        type: 'string',
                        description: 'Domain identifier',
                    },
                },
                required: ['domain'],
            },
        },
        {
            name: 'get_prevention_metrics',
            description: 'Get prevention success rates for promoted issues',
            inputSchema: {
                type: 'object',
                properties: {
                    domain: {
                        type: 'string',
                        description: 'Domain identifier',
                    },
                },
                required: ['domain'],
            },
        },
        {
            name: 'get_promotion_candidates',
            description: 'Get issues pending review for promotion (mitigation strategy: human review workflow)',
            inputSchema: {
                type: 'object',
                properties: {
                    domain: {
                        type: 'string',
                        description: 'Domain identifier',
                    },
                },
                required: ['domain'],
            },
        },
        {
            name: 'review_promotion',
            description: 'Approve, reject, or defer a promotion candidate (mitigation strategy: human review workflow)',
            inputSchema: {
                type: 'object',
                properties: {
                    domain: {
                        type: 'string',
                        description: 'Domain identifier',
                    },
                    issue_number: {
                        type: 'number',
                        description: 'Issue number to review',
                    },
                    action: {
                        type: 'string',
                        description: 'Review action: "approve", "reject", or "defer"',
                        enum: ['approve', 'reject', 'defer'],
                    },
                    reviewed_by: {
                        type: 'string',
                        description: 'Name or identifier of reviewer',
                    },
                    review_notes: {
                        type: 'string',
                        description: 'Optional notes about the review decision',
                    },
                },
                required: ['domain', 'issue_number', 'action', 'reviewed_by'],
            },
        },
        {
            name: 'mark_issue_exclude_from_promotion',
            description: 'Mark an issue to be excluded from promotion (mitigation strategy: manual override)',
            inputSchema: {
                type: 'object',
                properties: {
                    domain: {
                        type: 'string',
                        description: 'Domain identifier',
                    },
                    issue_number: {
                        type: 'number',
                        description: 'Issue number to exclude',
                    },
                },
                required: ['domain', 'issue_number'],
            },
        },
        {
            name: 'validate_domain_config',
            description: 'Validate a domain configuration file (mitigation strategy: validation layer)',
            inputSchema: {
                type: 'object',
                properties: {
                    domain: {
                        type: 'string',
                        description: 'Domain identifier',
                    },
                },
                required: ['domain'],
            },
        },
    ],
}));
// Handle tool calls
server.setRequestHandler(CallToolRequestSchema, async (request) => {
    const { name, arguments: args } = request.params;
    if (!args) {
        throw new Error('Missing arguments');
    }
    try {
        switch (name) {
            case 'track_issue': {
                const domain = args.domain;
                const config = configLoader.getConfig(domain);
                if (!config) {
                    throw new Error(`Unknown domain: ${domain}`);
                }
                const context = {
                    domain,
                    ...args.context,
                };
                const issue = await issueTracker.trackIssue(config.knowledgeBaseFile, {
                    title: args.title,
                    symptom: args.symptom,
                    rootCause: args.root_cause,
                    solution: args.solution,
                    prevention: args.prevention,
                    context,
                });
                return {
                    content: [
                        {
                            type: 'text',
                            text: JSON.stringify({
                                success: true,
                                issue: {
                                    issueNumber: issue.issueNumber,
                                    title: issue.title,
                                    frequency: issue.frequency,
                                    status: issue.frequency === 1 ? 'new' : 'updated',
                                },
                                message: issue.frequency === 1
                                    ? `Created Issue #${issue.issueNumber}`
                                    : `Updated Issue #${issue.issueNumber} (frequency: ${issue.frequency})`,
                            }, null, 2),
                        },
                    ],
                };
            }
            case 'check_optimization_triggers': {
                const domain = args.domain;
                const config = configLoader.getConfig(domain);
                if (!config) {
                    throw new Error(`Unknown domain: ${domain}`);
                }
                const triggers = await optimizer.checkOptimizationTriggers(config.knowledgeBaseFile, config);
                return {
                    content: [
                        {
                            type: 'text',
                            text: JSON.stringify({
                                domain,
                                shouldOptimize: triggers.length > 0,
                                triggers,
                            }, null, 2),
                        },
                    ],
                };
            }
            case 'optimize_knowledge_base': {
                const domain = args.domain;
                const config = configLoader.getConfig(domain);
                if (!config) {
                    throw new Error(`Unknown domain: ${domain}`);
                }
                const result = await optimizer.optimize(config.knowledgeBaseFile, config);
                // Generate preventive checks for promoted issues
                const issues = await issueTracker.getIssues(config.knowledgeBaseFile);
                const promotedIssues = issues.filter(i => i.promoted && !i.mergedInto);
                if (promotedIssues.length > 0 && config.preventiveCheckFile) {
                    await preventiveGenerator.addPreventiveChecks(config.preventiveCheckFile, promotedIssues);
                }
                return {
                    content: [
                        {
                            type: 'text',
                            text: JSON.stringify({
                                success: true,
                                domain,
                                result,
                            }, null, 2),
                        },
                    ],
                };
            }
            case 'get_domain_stats': {
                const domain = args.domain;
                const config = configLoader.getConfig(domain);
                if (!config) {
                    throw new Error(`Unknown domain: ${domain}`);
                }
                const issues = await issueTracker.getIssues(config.knowledgeBaseFile);
                const categoryStats = categorizer.getCategoryStats(issues, config.categories);
                const highestFrequency = issues.reduce((max, issue) => (issue.frequency > max.frequency ? issue : max), { issueNumber: 0, frequency: 0 });
                const stats = {
                    domain: config.displayName,
                    totalIssues: issues.filter(i => !i.mergedInto).length,
                    promotedIssues: issues.filter(i => i.promoted).length,
                    categories: Array.from(categoryStats.entries()).map(([name, count]) => ({
                        name,
                        count,
                    })),
                    highestFrequencyIssue: {
                        issueNumber: highestFrequency.issueNumber,
                        frequency: highestFrequency.frequency,
                    },
                };
                return {
                    content: [
                        {
                            type: 'text',
                            text: JSON.stringify(stats, null, 2),
                        },
                    ],
                };
            }
            case 'list_domains': {
                const domains = configLoader.getAllConfigs().map(config => ({
                    domain: config.domain,
                    displayName: config.displayName,
                    description: config.description,
                    knowledgeBaseFile: config.knowledgeBaseFile,
                }));
                return {
                    content: [
                        {
                            type: 'text',
                            text: JSON.stringify({ domains }, null, 2),
                        },
                    ],
                };
            }
            case 'get_issues': {
                const domain = args.domain;
                const filter = args.filter;
                const config = configLoader.getConfig(domain);
                if (!config) {
                    throw new Error(`Unknown domain: ${domain}`);
                }
                let issues = await issueTracker.getIssues(config.knowledgeBaseFile);
                // Apply filter
                if (filter === 'promoted') {
                    issues = issues.filter(i => i.promoted);
                }
                else if (filter === 'high-frequency') {
                    issues = issues.filter(i => i.frequency >= config.optimizationTriggers.highImpactThreshold);
                }
                else if (filter === 'duplicates') {
                    const duplicateGroups = duplicateDetector.detectDuplicates(issues);
                    const duplicateIssueNumbers = new Set(duplicateGroups.flatMap(g => g.duplicates.map(d => d.issueNumber)));
                    issues = issues.filter(i => duplicateIssueNumbers.has(i.issueNumber));
                }
                return {
                    content: [
                        {
                            type: 'text',
                            text: JSON.stringify({ domain, filter, issues }, null, 2),
                        },
                    ],
                };
            }
            case 'detect_duplicates': {
                const domain = args.domain;
                const config = configLoader.getConfig(domain);
                if (!config) {
                    throw new Error(`Unknown domain: ${domain}`);
                }
                const issues = await issueTracker.getIssues(config.knowledgeBaseFile);
                const duplicateGroups = duplicateDetector.detectDuplicates(issues);
                return {
                    content: [
                        {
                            type: 'text',
                            text: JSON.stringify({
                                domain,
                                duplicateGroupsFound: duplicateGroups.length,
                                groups: duplicateGroups.map(g => ({
                                    primaryIssue: {
                                        number: g.primaryIssue.issueNumber,
                                        title: g.primaryIssue.title,
                                        frequency: g.primaryIssue.frequency,
                                    },
                                    duplicates: g.duplicates.map(d => ({
                                        number: d.issueNumber,
                                        title: d.title,
                                        frequency: d.frequency,
                                    })),
                                    combinedFrequency: g.combinedFrequency,
                                })),
                            }, null, 2),
                        },
                    ],
                };
            }
            case 'categorize_issues': {
                const domain = args.domain;
                const config = configLoader.getConfig(domain);
                if (!config) {
                    throw new Error(`Unknown domain: ${domain}`);
                }
                const issues = await issueTracker.getIssues(config.knowledgeBaseFile);
                const categorized = categorizer.categorizeAll(issues, config.categories);
                const result = Array.from(categorized.entries()).map(([category, issues]) => ({
                    category,
                    count: issues.length,
                    issues: issues.map(i => ({
                        issueNumber: i.issueNumber,
                        title: i.title,
                        frequency: i.frequency,
                    })),
                }));
                return {
                    content: [
                        {
                            type: 'text',
                            text: JSON.stringify({ domain, categories: result }, null, 2),
                        },
                    ],
                };
            }
            case 'get_prevention_metrics': {
                const domain = args.domain;
                const config = configLoader.getConfig(domain);
                if (!config) {
                    throw new Error(`Unknown domain: ${domain}`);
                }
                const issues = await issueTracker.getIssues(config.knowledgeBaseFile);
                const promotedIssues = issues.filter(i => i.promoted);
                const metrics = promotedIssues.map(issue => ({
                    issueNumber: issue.issueNumber,
                    title: issue.title,
                    occurrencesBeforePromotion: issue.frequency,
                    promotionDate: issue.lastSeen,
                    // Note: Real prevention tracking would require additional data
                    estimatedPreventionRate: issue.frequency >= 5 ? '95-100%' : '85-95%',
                }));
                return {
                    content: [
                        {
                            type: 'text',
                            text: JSON.stringify({ domain, metrics }, null, 2),
                        },
                    ],
                };
            }
            case 'get_promotion_candidates': {
                const domain = args.domain;
                const config = configLoader.getConfig(domain);
                if (!config) {
                    throw new Error(`Unknown domain: ${domain}`);
                }
                const issues = await issueTracker.getIssues(config.knowledgeBaseFile);
                const candidates = reviewWorkflow.getPromotionCandidates(issues, config);
                // Generate human-readable report
                const report = reviewWorkflow.generateReviewReport(candidates);
                return {
                    content: [
                        {
                            type: 'text',
                            text: JSON.stringify({
                                domain,
                                candidatesFound: candidates.length,
                                candidates: candidates.map(c => ({
                                    issueNumber: c.issue.issueNumber,
                                    title: c.issue.title,
                                    frequency: c.issue.frequency,
                                    qualityScore: c.qualityScore,
                                    confidence: c.confidence,
                                    recommendApprove: c.recommendApprove,
                                    reasons: c.reasons,
                                    warnings: c.warnings,
                                })),
                                report,
                            }, null, 2),
                        },
                    ],
                };
            }
            case 'review_promotion': {
                const domain = args.domain;
                const issueNumber = args.issue_number;
                const action = args.action;
                const reviewedBy = args.reviewed_by;
                const reviewNotes = args.review_notes;
                const config = configLoader.getConfig(domain);
                if (!config) {
                    throw new Error(`Unknown domain: ${domain}`);
                }
                const issues = await issueTracker.getIssues(config.knowledgeBaseFile);
                const issue = issues.find(i => i.issueNumber === issueNumber);
                if (!issue) {
                    throw new Error(`Issue #${issueNumber} not found in ${domain}`);
                }
                const decision = {
                    issueNumber,
                    action,
                    reviewedBy,
                    reviewNotes,
                };
                reviewWorkflow.applyReviewDecision(issue, decision);
                // Save updated knowledge base
                const kb = await issueTracker.parseKnowledgeBase(`${PROJECT_ROOT}/${config.knowledgeBaseFile}`);
                kb.issues = issues;
                kb.lastUpdated = new Date().toISOString().split('T')[0];
                await issueTracker.saveKnowledgeBase(`${PROJECT_ROOT}/${config.knowledgeBaseFile}`, kb);
                // If approved, generate preventive check
                let preventiveCheckAdded = false;
                if (action === 'approve' && config.preventiveCheckFile) {
                    await preventiveGenerator.addPreventiveChecks(config.preventiveCheckFile, [issue]);
                    preventiveCheckAdded = true;
                }
                return {
                    content: [
                        {
                            type: 'text',
                            text: JSON.stringify({
                                success: true,
                                domain,
                                issueNumber,
                                action,
                                reviewedBy,
                                promoted: issue.promoted,
                                excluded: issue.excludeFromPromotion,
                                preventiveCheckAdded,
                                message: `Issue #${issueNumber} ${action}d by ${reviewedBy}`,
                            }, null, 2),
                        },
                    ],
                };
            }
            case 'mark_issue_exclude_from_promotion': {
                const domain = args.domain;
                const issueNumber = args.issue_number;
                const config = configLoader.getConfig(domain);
                if (!config) {
                    throw new Error(`Unknown domain: ${domain}`);
                }
                const issues = await issueTracker.getIssues(config.knowledgeBaseFile);
                const issue = issues.find(i => i.issueNumber === issueNumber);
                if (!issue) {
                    throw new Error(`Issue #${issueNumber} not found in ${domain}`);
                }
                issue.excludeFromPromotion = true;
                issue.promotionPending = false;
                // Save updated knowledge base
                const kb = await issueTracker.parseKnowledgeBase(`${PROJECT_ROOT}/${config.knowledgeBaseFile}`);
                kb.issues = issues;
                kb.lastUpdated = new Date().toISOString().split('T')[0];
                await issueTracker.saveKnowledgeBase(`${PROJECT_ROOT}/${config.knowledgeBaseFile}`, kb);
                return {
                    content: [
                        {
                            type: 'text',
                            text: JSON.stringify({
                                success: true,
                                domain,
                                issueNumber,
                                excludeFromPromotion: true,
                                message: `Issue #${issueNumber} marked to exclude from promotion`,
                            }, null, 2),
                        },
                    ],
                };
            }
            case 'validate_domain_config': {
                const domain = args.domain;
                const config = configLoader.getConfig(domain);
                if (!config) {
                    throw new Error(`Unknown domain: ${domain}`);
                }
                const validation = validator.validateDomainConfig(config);
                return {
                    content: [
                        {
                            type: 'text',
                            text: JSON.stringify({
                                domain,
                                valid: validation.valid,
                                errors: validation.errors,
                                warnings: validation.warnings,
                                message: validation.valid
                                    ? 'Configuration is valid'
                                    : `Configuration has ${validation.errors.length} error(s)`,
                            }, null, 2),
                        },
                    ],
                };
            }
            default:
                throw new Error(`Unknown tool: ${name}`);
        }
    }
    catch (error) {
        console.error(`Error executing ${name}:`, error);
        return {
            content: [
                {
                    type: 'text',
                    text: JSON.stringify({ error: error.message, tool: name }, null, 2),
                },
            ],
            isError: true,
        };
    }
});
// Start server
const transport = new StdioServerTransport();
await server.connect(transport);
console.error('Learning Optimizer MCP Server running on stdio');
//# sourceMappingURL=server.js.map