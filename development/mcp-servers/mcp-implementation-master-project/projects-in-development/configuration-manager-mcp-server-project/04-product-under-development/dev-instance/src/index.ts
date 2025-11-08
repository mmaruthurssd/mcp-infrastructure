#!/usr/bin/env node

/**
 * Configuration Manager MCP Server
 * Secure configuration and secrets management with OS keychain integration
 */

import { Server } from '@modelcontextprotocol/sdk/server/index.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import {
  CallToolRequestSchema,
  ListToolsRequestSchema,
} from '@modelcontextprotocol/sdk/types.js';

import { manageSecrets } from './tools/manage-secrets.js';
import { validateConfig } from './tools/validate-config.js';
import { getEnvironmentVars } from './tools/get-environment-vars.js';
import { templateConfig } from './tools/template-config.js';
import { checkConfigDrift } from './tools/check-config-drift.js';

const server = new Server(
  {
    name: 'configuration-manager-mcp-server',
    version: '1.0.0',
  },
  {
    capabilities: {
      tools: {},
    },
  }
);

// Tool definitions
server.setRequestHandler(ListToolsRequestSchema, async () => {
  return {
    tools: [
      {
        name: 'manage_secrets',
        description:
          'Store, retrieve, rotate, and delete secrets using OS keychain. Supports metadata tracking and rotation scheduling.',
        inputSchema: {
          type: 'object',
          properties: {
            action: {
              type: 'string',
              enum: ['store', 'retrieve', 'rotate', 'delete', 'list'],
              description: 'Action to perform',
            },
            key: {
              type: 'string',
              description: 'Secret key/name (required for store/retrieve/rotate/delete)',
            },
            value: {
              type: 'string',
              description: 'Secret value (required for store/rotate)',
            },
            rotationDays: {
              type: 'number',
              description: 'Days until rotation required (default: 90)',
            },
            metadata: {
              type: 'object',
              description: 'Optional metadata for the secret',
              properties: {
                description: { type: 'string' },
                createdBy: { type: 'string' },
              },
            },
          },
          required: ['action'],
        },
      },
      {
        name: 'validate_config',
        description:
          'Validate configuration files against JSON schemas. Supports built-in schemas (mcp-config, project-config, environment-config) or custom schemas.',
        inputSchema: {
          type: 'object',
          properties: {
            configPath: {
              type: 'string',
              description: 'Path to configuration file',
            },
            schemaPath: {
              type: 'string',
              description: 'Optional custom schema path',
            },
            schemaType: {
              type: 'string',
              enum: ['mcp-config', 'project-config', 'environment-config', 'custom'],
              description: 'Built-in schema type (if not using custom schema)',
            },
            strict: {
              type: 'boolean',
              description: 'Strict validation mode (default: true)',
            },
            reportFormat: {
              type: 'string',
              enum: ['text', 'json'],
              description: 'Report format',
            },
          },
          required: ['configPath'],
        },
      },
      {
        name: 'get_environment_vars',
        description:
          'Retrieve environment-specific configuration with cascading hierarchy (.env.production.local > .env.local > .env.production > .env).',
        inputSchema: {
          type: 'object',
          properties: {
            environment: {
              type: 'string',
              enum: ['development', 'staging', 'production', 'test'],
              description: 'Target environment',
            },
            projectPath: {
              type: 'string',
              description: 'Project directory path (default: current directory)',
            },
            variables: {
              type: 'array',
              items: { type: 'string' },
              description: 'Specific variables to retrieve (default: all)',
            },
            includeDefaults: {
              type: 'boolean',
              description: 'Include default values (default: true)',
            },
            format: {
              type: 'string',
              enum: ['json', 'dotenv', 'shell'],
              description: 'Output format',
            },
          },
          required: ['environment'],
        },
      },
      {
        name: 'template_config',
        description:
          'Generate configuration file templates (mcp-server, project, environment, github-action, docker) with placeholder replacement.',
        inputSchema: {
          type: 'object',
          properties: {
            templateType: {
              type: 'string',
              enum: ['mcp-server', 'project', 'environment', 'github-action', 'docker'],
              description: 'Template type',
            },
            outputPath: {
              type: 'string',
              description: 'Output file or directory path',
            },
            options: {
              type: 'object',
              description: 'Template options',
              properties: {
                projectName: { type: 'string' },
                includeExamples: { type: 'boolean' },
                includeComments: { type: 'boolean' },
                environments: {
                  type: 'array',
                  items: { type: 'string' },
                  description: 'For environment templates: generate multiple files',
                },
                overwrite: { type: 'boolean' },
              },
            },
            customFields: {
              type: 'object',
              description: 'Custom field replacements',
            },
          },
          required: ['templateType', 'outputPath'],
        },
      },
      {
        name: 'check_config_drift',
        description:
          'Detect configuration differences across environments. Classifies drift by severity (critical, warning, info) and provides recommendations.',
        inputSchema: {
          type: 'object',
          properties: {
            projectPath: {
              type: 'string',
              description: 'Project directory path',
            },
            environments: {
              type: 'array',
              items: { type: 'string' },
              description: 'Environments to compare (e.g., ["development", "staging", "production"])',
            },
            configType: {
              type: 'string',
              enum: ['environment', 'mcp-config', 'all'],
              description: 'Configuration type to check (currently only "environment" supported)',
            },
            ignoreKeys: {
              type: 'array',
              items: { type: 'string' },
              description: 'Keys to ignore in drift detection',
            },
            reportFormat: {
              type: 'string',
              enum: ['text', 'json', 'html'],
              description: 'Report format',
            },
          },
          required: ['projectPath', 'environments', 'configType'],
        },
      },
    ],
  };
});

// Tool execution
server.setRequestHandler(CallToolRequestSchema, async (request) => {
  try {
    const { name, arguments: args } = request.params;

    let result: any;

    switch (name) {
      case 'manage_secrets':
        result = await manageSecrets(args as any);
        break;

      case 'validate_config':
        result = await validateConfig(args as any);
        break;

      case 'get_environment_vars':
        result = await getEnvironmentVars(args as any);
        break;

      case 'template_config':
        result = await templateConfig(args as any);
        break;

      case 'check_config_drift':
        result = await checkConfigDrift(args as any);
        break;

      default:
        throw new Error(`Unknown tool: ${name}`);
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
          text: JSON.stringify(
            {
              success: false,
              error: error instanceof Error ? error.message : 'Unknown error',
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

// Start server
async function main() {
  const transport = new StdioServerTransport();
  await server.connect(transport);
  console.error('Configuration Manager MCP Server running on stdio');
}

main().catch((error) => {
  console.error('Fatal error:', error);
  process.exit(1);
});
