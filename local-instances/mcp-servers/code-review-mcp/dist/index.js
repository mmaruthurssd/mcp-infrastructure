#!/usr/bin/env node
/**
 * Code Review MCP Server
 * Automated code quality analysis and technical debt tracking
 */
import { Server } from '@modelcontextprotocol/sdk/server/index.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import { CallToolRequestSchema, ListToolsRequestSchema, } from '@modelcontextprotocol/sdk/types.js';
import { analyzeCodeQuality, detectComplexity, findCodeSmells, trackTechnicalDebt, suggestImprovements, generateReviewReport, } from './tools/index.js';
const server = new Server({
    name: 'code-review-mcp-server',
    version: '1.0.0',
}, {
    capabilities: {
        tools: {},
    },
});
// List available tools
server.setRequestHandler(ListToolsRequestSchema, async () => {
    return {
        tools: [
            {
                name: 'analyze_code_quality',
                description: 'Run linting and static analysis on files or directories. Supports TypeScript, JavaScript, Python, Java, and Apps Script (.gs files).',
                inputSchema: {
                    type: 'object',
                    properties: {
                        target: {
                            type: 'string',
                            description: 'File path or directory to analyze',
                        },
                        languages: {
                            type: 'array',
                            items: { type: 'string' },
                            description: 'Filter by languages (typescript, javascript, python, java, appsscript)',
                        },
                        severity: {
                            type: 'string',
                            enum: ['error', 'warning', 'info', 'all'],
                            description: 'Minimum severity level to report',
                        },
                        fixable: {
                            type: 'boolean',
                            description: 'Only show auto-fixable issues',
                        },
                        includeMetrics: {
                            type: 'boolean',
                            description: 'Include complexity metrics',
                        },
                    },
                    required: ['target'],
                },
            },
            {
                name: 'detect_complexity',
                description: 'Analyze code complexity (cyclomatic, cognitive, nesting depth). Identifies complex functions and hotspots.',
                inputSchema: {
                    type: 'object',
                    properties: {
                        target: {
                            type: 'string',
                            description: 'File path or directory to analyze',
                        },
                        threshold: {
                            type: 'object',
                            properties: {
                                cyclomatic: { type: 'number', description: 'Cyclomatic complexity threshold (default: 10)' },
                                cognitive: { type: 'number', description: 'Cognitive complexity threshold (default: 15)' },
                                nesting: { type: 'number', description: 'Nesting depth threshold (default: 4)' },
                            },
                        },
                        includeTests: {
                            type: 'boolean',
                            description: 'Include test files in analysis',
                        },
                        format: {
                            type: 'string',
                            enum: ['summary', 'detailed', 'hotspots'],
                            description: 'Output format',
                        },
                    },
                    required: ['target'],
                },
            },
            {
                name: 'find_code_smells',
                description: 'Detect common code smells and anti-patterns (long methods, magic numbers, complex conditionals, Apps Script specific issues).',
                inputSchema: {
                    type: 'object',
                    properties: {
                        target: {
                            type: 'string',
                            description: 'File path or directory to analyze',
                        },
                        categories: {
                            type: 'array',
                            items: { type: 'string' },
                            description: 'Filter by smell categories',
                        },
                        severity: {
                            type: 'string',
                            enum: ['critical', 'major', 'minor', 'all'],
                            description: 'Minimum severity level',
                        },
                        language: {
                            type: 'string',
                            description: 'Specific language to analyze',
                        },
                    },
                    required: ['target'],
                },
            },
            {
                name: 'track_technical_debt',
                description: 'Track, categorize, and manage technical debt items. Persistent storage across sessions.',
                inputSchema: {
                    type: 'object',
                    properties: {
                        action: {
                            type: 'string',
                            enum: ['add', 'list', 'update', 'resolve', 'report'],
                            description: 'Action to perform',
                        },
                        projectPath: {
                            type: 'string',
                            description: 'Project directory path',
                        },
                        debt: {
                            type: 'object',
                            properties: {
                                title: { type: 'string' },
                                description: { type: 'string' },
                                location: { type: 'string' },
                                type: { type: 'string', enum: ['code-quality', 'architecture', 'documentation', 'testing', 'security', 'performance'] },
                                severity: { type: 'string', enum: ['critical', 'high', 'medium', 'low'] },
                                estimatedEffort: { type: 'string' },
                                impact: { type: 'string' },
                            },
                        },
                        debtId: {
                            type: 'string',
                            description: 'Debt item ID (for update/resolve)',
                        },
                        status: {
                            type: 'string',
                            enum: ['open', 'in-progress', 'resolved', 'wontfix'],
                        },
                        notes: {
                            type: 'string',
                        },
                        filters: {
                            type: 'object',
                            properties: {
                                type: { type: 'string' },
                                severity: { type: 'string' },
                                status: { type: 'string' },
                            },
                        },
                    },
                    required: ['action', 'projectPath'],
                },
            },
            {
                name: 'suggest_improvements',
                description: 'Generate AI-powered improvement suggestions based on code analysis. Prioritizes by impact and effort.',
                inputSchema: {
                    type: 'object',
                    properties: {
                        target: {
                            type: 'string',
                            description: 'File path or directory to analyze',
                        },
                        context: {
                            type: 'string',
                            description: 'Additional context about the codebase',
                        },
                        focus: {
                            type: 'string',
                            enum: ['performance', 'maintainability', 'readability', 'security', 'all'],
                            description: 'Focus area for suggestions',
                        },
                        maxSuggestions: {
                            type: 'number',
                            description: 'Maximum number of suggestions (default: 10)',
                        },
                        prioritize: {
                            type: 'boolean',
                            description: 'Sort by impact (default: true)',
                        },
                    },
                    required: ['target'],
                },
            },
            {
                name: 'generate_review_report',
                description: 'Generate comprehensive code review report with metrics, trends, and actionable recommendations.',
                inputSchema: {
                    type: 'object',
                    properties: {
                        projectPath: {
                            type: 'string',
                            description: 'Project directory path',
                        },
                        target: {
                            type: 'string',
                            description: 'Specific path to review (default: entire project)',
                        },
                        format: {
                            type: 'string',
                            enum: ['markdown', 'html', 'json'],
                            description: 'Report format',
                        },
                        includeHistory: {
                            type: 'boolean',
                            description: 'Compare with previous reviews',
                        },
                        outputPath: {
                            type: 'string',
                            description: 'Where to save report',
                        },
                        sections: {
                            type: 'array',
                            items: { type: 'string' },
                            description: 'Which sections to include',
                        },
                    },
                    required: ['projectPath'],
                },
            },
        ],
    };
});
// Handle tool calls
server.setRequestHandler(CallToolRequestSchema, async (request) => {
    try {
        const { name, arguments: args } = request.params;
        switch (name) {
            case 'analyze_code_quality': {
                const result = await analyzeCodeQuality(args);
                return {
                    content: [{ type: 'text', text: JSON.stringify(result, null, 2) }],
                };
            }
            case 'detect_complexity': {
                const result = await detectComplexity(args);
                return {
                    content: [{ type: 'text', text: JSON.stringify(result, null, 2) }],
                };
            }
            case 'find_code_smells': {
                const result = await findCodeSmells(args);
                return {
                    content: [{ type: 'text', text: JSON.stringify(result, null, 2) }],
                };
            }
            case 'track_technical_debt': {
                const result = await trackTechnicalDebt(args);
                return {
                    content: [{ type: 'text', text: JSON.stringify(result, null, 2) }],
                };
            }
            case 'suggest_improvements': {
                const result = await suggestImprovements(args);
                return {
                    content: [{ type: 'text', text: JSON.stringify(result, null, 2) }],
                };
            }
            case 'generate_review_report': {
                const result = await generateReviewReport(args);
                return {
                    content: [{ type: 'text', text: JSON.stringify(result, null, 2) }],
                };
            }
            default:
                throw new Error(`Unknown tool: ${name}`);
        }
    }
    catch (error) {
        const errorMessage = error instanceof Error ? error.message : 'Unknown error';
        return {
            content: [{ type: 'text', text: JSON.stringify({ success: false, error: errorMessage }, null, 2) }],
            isError: true,
        };
    }
});
// Start the server
async function main() {
    const transport = new StdioServerTransport();
    await server.connect(transport);
    console.error('Code Review MCP Server running on stdio');
}
main().catch((error) => {
    console.error('Fatal error:', error);
    process.exit(1);
});
//# sourceMappingURL=index.js.map