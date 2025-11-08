#!/usr/bin/env node

/**
 * Parallelization MCP Server
 *
 * Infrastructure-level MCP for parallel task execution analysis, sub-agent
 * coordination, conflict detection, and progress aggregation.
 *
 * This is a generalizable tool that can enhance ANY system that breaks work
 * into sub-tasks (Project Management MCP, Orchestrator Framework, Task Executor, etc.)
 */

import { Server } from '@modelcontextprotocol/sdk/server/index.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import {
  CallToolRequestSchema,
  ListToolsRequestSchema,
} from '@modelcontextprotocol/sdk/types.js';

import { AnalyzeTaskParallelizabilityTool } from './tools/analyze-task-parallelizability.js';
import { CreateDependencyGraphTool } from './tools/create-dependency-graph.js';
import { ExecuteParallelWorkflowTool } from './tools/execute-parallel-workflow.js';
import { AggregateProgressTool } from './tools/aggregate-progress.js';
import { DetectConflictsTool } from './tools/detect-conflicts.js';
import { OptimizeBatchDistributionTool } from './tools/optimize-batch-distribution.js';

class ParallelizationMCPServer {
  private server: Server;

  constructor() {
    this.server = new Server(
      {
        name: 'parallelization-mcp-server',
        version: '1.0.0',
      },
      {
        capabilities: {
          tools: {},
        },
      }
    );

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
          AnalyzeTaskParallelizabilityTool.getToolDefinition(),
          CreateDependencyGraphTool.getToolDefinition(),
          ExecuteParallelWorkflowTool.getToolDefinition(),
          AggregateProgressTool.getToolDefinition(),
          DetectConflictsTool.getToolDefinition(),
          OptimizeBatchDistributionTool.getToolDefinition(),
        ],
      };
    });

    // Handle tool calls
    this.server.setRequestHandler(CallToolRequestSchema, async (request) => {
      const { name, arguments: args } = request.params;

      try {
        let result: any;

        switch (name) {
          case 'analyze_task_parallelizability':
            result = AnalyzeTaskParallelizabilityTool.execute(args as any);
            break;

          case 'create_dependency_graph':
            result = CreateDependencyGraphTool.execute(args as any);
            break;

          case 'execute_parallel_workflow':
            result = ExecuteParallelWorkflowTool.execute(args as any);
            break;

          case 'aggregate_progress':
            result = AggregateProgressTool.execute(args as any);
            break;

          case 'detect_conflicts':
            result = DetectConflictsTool.execute(args as any);
            break;

          case 'optimize_batch_distribution':
            result = OptimizeBatchDistributionTool.execute(args as any);
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
                stack: error instanceof Error ? error.stack : undefined,
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
    console.error('Parallelization MCP Server running on stdio');
  }
}

const server = new ParallelizationMCPServer();
server.run().catch(console.error);
