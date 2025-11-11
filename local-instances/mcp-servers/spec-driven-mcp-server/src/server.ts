#!/usr/bin/env node

/**
 * Spec-Driven Development MCP Server
 *
 * Interactive MCP server that guides users through creating specifications,
 * plans, and tasks following Spec-Driven Development methodology.
 */

import { Server } from '@modelcontextprotocol/sdk/server/index.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import {
  CallToolRequestSchema,
  ListToolsRequestSchema,
} from '@modelcontextprotocol/sdk/types.js';

import { SDDGuideTool } from './tools/sdd-guide.js';
import { ResearchBestPracticesTool } from './tools/research-best-practices.js';
import { UpdateTaskStatusTool } from './tools/update-task-status.js';
import { GetTaskProgressTool } from './tools/get-task-progress.js';

class SDDMCPServer {
  private server: Server;
  private sddGuideTool: SDDGuideTool;

  constructor() {
    this.server = new Server(
      {
        name: 'spec-driven-mcp-server',
        version: '0.2.0',
      },
      {
        capabilities: {
          tools: {},
        },
      }
    );

    this.sddGuideTool = new SDDGuideTool();

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

  private setupHandlers() {
    // List available tools
    this.server.setRequestHandler(ListToolsRequestSchema, async () => {
      return {
        tools: [
          SDDGuideTool.getToolDefinition(),
          ResearchBestPracticesTool.getToolDefinition(),
          UpdateTaskStatusTool.getToolDefinition(),
          GetTaskProgressTool.getToolDefinition()
        ],
      };
    });

    // Handle tool calls
    this.server.setRequestHandler(CallToolRequestSchema, async (request) => {
      const { name, arguments: args } = request.params;

      try {
        let result: any;

        switch (name) {
          case 'sdd_guide':
            result = await this.sddGuideTool.execute(args);
            break;

          case 'research_best_practices':
            const guidance = ResearchBestPracticesTool.execute(args as any);
            result = {
              success: true,
              guidance,
              formatted: ResearchBestPracticesTool.formatGuidance(guidance)
            };
            break;

          case 'update_task_status':
            result = UpdateTaskStatusTool.execute(args as any);
            break;

          case 'get_task_progress':
            const progressResult = GetTaskProgressTool.execute(args as any);
            result = {
              ...progressResult,
              formatted: GetTaskProgressTool.formatProgress(progressResult)
            };
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
      } catch (error) {
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
    console.error('Spec-Driven Development MCP Server running on stdio');
  }
}

const server = new SDDMCPServer();
server.run().catch(console.error);
