#!/usr/bin/env node
/**
 * Task Executor MCP Server
 *
 * Lightweight MCP server for managing task execution workflows with verification,
 * temp-to-archive lifecycle, and documentation tracking.
 */
import { Server } from '@modelcontextprotocol/sdk/server/index.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import { CallToolRequestSchema, ListToolsRequestSchema, } from '@modelcontextprotocol/sdk/types.js';
import { CreateWorkflowTool } from './tools/create-workflow.js';
import { CompleteTaskTool } from './tools/complete-task.js';
import { GetWorkflowStatusTool } from './tools/get-workflow-status.js';
import { ArchiveWorkflowTool } from './tools/archive-workflow.js';
class TaskExecutorMCPServer {
    server;
    constructor() {
        this.server = new Server({
            name: 'task-executor-mcp-server',
            version: '1.0.0',
        }, {
            capabilities: {
                tools: {},
            },
        });
        this.setupHandlers();
        // Error handling
        this.server.onerror = (error) => {
            console.error('[MCP Error]', error);
        };
        process.on('SIGINT', async () => {
            await this.server.close();
            process.exit(0);
        });
    }
    setupHandlers() {
        // List available tools
        this.server.setRequestHandler(ListToolsRequestSchema, async () => {
            return {
                tools: [
                    CreateWorkflowTool.getToolDefinition(),
                    CompleteTaskTool.getToolDefinition(),
                    GetWorkflowStatusTool.getToolDefinition(),
                    ArchiveWorkflowTool.getToolDefinition()
                ],
            };
        });
        // Handle tool calls
        this.server.setRequestHandler(CallToolRequestSchema, async (request) => {
            const { name, arguments: args } = request.params;
            try {
                let result;
                switch (name) {
                    case 'create_workflow':
                        result = CreateWorkflowTool.execute(args);
                        break;
                    case 'complete_task':
                        result = await CompleteTaskTool.execute(args);
                        break;
                    case 'get_workflow_status':
                        const statusResult = GetWorkflowStatusTool.execute(args);
                        result = {
                            ...statusResult,
                            formatted: GetWorkflowStatusTool.formatStatus(statusResult)
                        };
                        break;
                    case 'archive_workflow':
                        result = await ArchiveWorkflowTool.execute(args);
                        break;
                    default:
                        return {
                            content: [
                                {
                                    type: 'text',
                                    text: JSON.stringify({
                                        success: false,
                                        error: `Unknown tool: ${name}`,
                                    }),
                                },
                            ],
                            isError: true,
                        };
                }
                return {
                    content: [
                        {
                            type: 'text',
                            text: JSON.stringify(result, null, 2),
                        },
                    ],
                };
            }
            catch (error) {
                return {
                    content: [
                        {
                            type: 'text',
                            text: JSON.stringify({
                                success: false,
                                error: String(error),
                            }),
                        },
                    ],
                    isError: true,
                };
            }
        });
    }
    async run() {
        const transport = new StdioServerTransport();
        await this.server.connect(transport);
        console.error('Task Executor MCP Server running on stdio');
    }
}
const server = new TaskExecutorMCPServer();
server.run().catch(console.error);
//# sourceMappingURL=server.js.map