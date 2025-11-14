#!/usr/bin/env node

/**
 * Checklist Manager MCP Server
 * Provides intelligent checklist management, tracking, and enforcement
 */

import { Server } from '@modelcontextprotocol/sdk/server/index.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import {
  CallToolRequestSchema,
  ListToolsRequestSchema,
} from '@modelcontextprotocol/sdk/types.js';

import { registerChecklist } from './tools/register_checklist.js';
import { getChecklistStatus } from './tools/get_checklist_status.js';
import { validateChecklistCompliance } from './tools/validate_checklist_compliance.js';
import { createFromTemplate } from './tools/create_from_template.js';
import { updateChecklistItem } from './tools/update_checklist_item.js';

import type {
  RegisterChecklistParams,
  GetChecklistStatusParams,
  ValidateChecklistComplianceParams,
  CreateFromTemplateParams,
  UpdateChecklistItemParams,
} from './types/index.js';

/**
 * Create and configure the MCP server
 */
const server = new Server(
  {
    name: 'checklist-manager',
    version: '0.1.0',
  },
  {
    capabilities: {
      tools: {},
    },
  }
);

/**
 * Handler for listing available tools
 */
server.setRequestHandler(ListToolsRequestSchema, async () => {
  return {
    tools: [
      {
        name: 'register_checklist',
        description:
          'Register a new checklist in the central registry. Parses markdown checklist file and creates registry entry.',
        inputSchema: {
          type: 'object',
          properties: {
            checklist_path: {
              type: 'string',
              description:
                'Absolute path to checklist markdown file (must exist)',
            },
            checklist_type: {
              type: 'string',
              enum: [
                'deployment',
                'setup',
                'cleanup',
                'review',
                'onboarding',
                'custom',
              ],
              description:
                'Type of checklist (optional, defaults to frontmatter value)',
            },
            owner: {
              type: 'string',
              description:
                'Owner/team responsible (default: "unassigned" or frontmatter value)',
            },
            enforcement: {
              type: 'string',
              enum: ['mandatory', 'optional', 'informational'],
              description:
                'Enforcement level (default: "optional" or frontmatter value)',
            },
            auto_update: {
              type: 'boolean',
              description:
                'Enable auto-completion via MCP integrations (default: true)',
            },
          },
          required: ['checklist_path'],
        },
      },
      {
        name: 'get_checklist_status',
        description:
          'Get current completion status of checklist(s). Returns real-time status from files.',
        inputSchema: {
          type: 'object',
          properties: {
            checklist_id: {
              type: 'string',
              description: 'Query by checklist ID',
            },
            checklist_path: {
              type: 'string',
              description: 'Query by file path (alternative to ID)',
            },
            checklist_type: {
              type: 'string',
              enum: [
                'deployment',
                'setup',
                'cleanup',
                'review',
                'onboarding',
                'custom',
              ],
              description: 'Get all checklists of this type',
            },
            status_filter: {
              type: 'string',
              enum: ['not-started', 'in-progress', 'completed'],
              description: 'Filter checklists by status',
            },
          },
        },
      },
      {
        name: 'validate_checklist_compliance',
        description:
          'Validate that mandatory checklists are completed. Enforcement layer that can block operations.',
        inputSchema: {
          type: 'object',
          properties: {
            operation_type: {
              type: 'string',
              enum: [
                'deployment',
                'setup',
                'cleanup',
                'review',
                'onboarding',
                'custom',
              ],
              description: 'Type of operation to validate checklists for',
            },
            skip_enforcement: {
              type: 'boolean',
              description:
                'Skip enforcement and return warnings only (default: false)',
            },
          },
          required: ['operation_type'],
        },
      },
      {
        name: 'create_from_template',
        description:
          'Create a new checklist from a template with variable substitution.',
        inputSchema: {
          type: 'object',
          properties: {
            template_path: {
              type: 'string',
              description: 'Absolute path to template markdown file',
            },
            output_path: {
              type: 'string',
              description: 'Absolute path for output checklist file',
            },
            variables: {
              type: 'object',
              description:
                'Variables for substitution (e.g., {{project_name}} -> "MyProject")',
            },
            owner: {
              type: 'string',
              description: 'Owner/team responsible (updates frontmatter)',
            },
            enforcement: {
              type: 'string',
              enum: ['mandatory', 'optional', 'informational'],
              description: 'Enforcement level (updates frontmatter)',
            },
          },
          required: ['template_path', 'output_path'],
        },
      },
      {
        name: 'update_checklist_item',
        description:
          'KILLER FEATURE: Auto-complete checklist items via fuzzy matching. Enables MCP integrations to auto-check items.',
        inputSchema: {
          type: 'object',
          properties: {
            checklist_id: {
              type: 'string',
              description: 'Checklist ID to update',
            },
            checklist_path: {
              type: 'string',
              description:
                'Checklist path to update (alternative to checklist_id)',
            },
            item_text: {
              type: 'string',
              description:
                'Item text to match (uses fuzzy matching, e.g., "Run tests" matches "Run unit tests")',
            },
            completed: {
              type: 'boolean',
              description: 'Mark item as completed (true) or unchecked (false)',
            },
            triggered_by: {
              type: 'string',
              description: 'Optional: MCP tool that triggered this update',
            },
            notes: {
              type: 'string',
              description: 'Optional: Notes about the update',
            },
          },
          required: ['item_text', 'completed'],
        },
      },
    ],
  };
});

/**
 * Handler for tool execution
 */
server.setRequestHandler(CallToolRequestSchema, async (request) => {
  const { name, arguments: args } = request.params;

  try {
    switch (name) {
      case 'register_checklist': {
        const result = await registerChecklist(
          args as unknown as RegisterChecklistParams
        );
        return {
          content: [
            {
              type: 'text',
              text: JSON.stringify(result, null, 2),
            },
          ],
        };
      }

      case 'get_checklist_status': {
        const result = await getChecklistStatus(
          args as unknown as GetChecklistStatusParams
        );
        return {
          content: [
            {
              type: 'text',
              text: JSON.stringify(result, null, 2),
            },
          ],
        };
      }

      default:
        throw new Error(`Unknown tool: ${name}`);
    }
  } catch (error) {
    const errorMessage =
      error instanceof Error ? error.message : 'Unknown error';
    return {
      content: [
        {
          type: 'text',
          text: JSON.stringify(
            {
              success: false,
              error: errorMessage,
            },
            null,
            2
          ),
        },
      ],
      isError: true,
    };
  }
});

/**
 * Start the server
 */
async function main() {
  const transport = new StdioServerTransport();
  await server.connect(transport);
  console.error('Checklist Manager MCP server running on stdio');
}

main().catch((error) => {
  console.error('Fatal error in main():', error);
  process.exit(1);
});
