#!/usr/bin/env node

import { Server } from '@modelcontextprotocol/sdk/server/index.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import {
  CallToolRequestSchema,
  ListToolsRequestSchema,
} from '@modelcontextprotocol/sdk/types.js';

import { generateUnitTests } from './tools/generate-unit-tests.js';
import { generateIntegrationTests } from './tools/generate-integration-tests.js';
import { analyzeCoverageGaps } from './tools/analyze-coverage-gaps.js';
import { suggestTestScenarios } from './tools/suggest-test-scenarios.js';

/**
 * Test Generator MCP Server
 * Provides automated test generation tools for TypeScript/JavaScript projects
 */

const server = new Server(
  {
    name: 'test-generator-mcp',
    version: '1.0.0',
  },
  {
    capabilities: {
      tools: {},
    },
  }
);

/**
 * List all available tools
 */
server.setRequestHandler(ListToolsRequestSchema, async () => {
  return {
    tools: [
      {
        name: 'generate_unit_tests',
        description:
          'Generate unit tests for TypeScript/JavaScript functions and classes. Analyzes source code via AST parsing and generates comprehensive test suites.',
        inputSchema: {
          type: 'object',
          properties: {
            sourceFile: {
              type: 'string',
              description: 'Absolute path to source file to generate tests for',
            },
            targetFile: {
              type: 'string',
              description:
                'Optional output path for test file (default: sourceFile.test.ts in same directory)',
            },
            framework: {
              type: 'string',
              enum: ['jest', 'mocha', 'vitest'],
              default: 'jest',
              description: 'Test framework to use',
            },
            coverage: {
              type: 'string',
              enum: ['basic', 'comprehensive', 'edge-cases'],
              default: 'comprehensive',
              description:
                'Test coverage level - basic (happy path), comprehensive (happy + error), edge-cases (all scenarios)',
            },
            functions: {
              type: 'array',
              items: { type: 'string' },
              description:
                'Optional: specific function names to test (default: all exported functions)',
            },
          },
          required: ['sourceFile'],
        },
      },
      {
        name: 'generate_integration_tests',
        description:
          'Generate integration tests for APIs and modules. Supports REST API testing with supertest and module integration testing.',
        inputSchema: {
          type: 'object',
          properties: {
            targetModule: {
              type: 'string',
              description: 'Path to module or API file to test',
            },
            apiSpec: {
              type: 'string',
              description: 'Optional path to OpenAPI/Swagger spec file for API testing',
            },
            framework: {
              type: 'string',
              enum: ['jest', 'supertest'],
              default: 'jest',
              description:
                'Testing framework (supertest includes Jest + supertest for API testing)',
            },
            scenarios: {
              type: 'array',
              items: {
                type: 'object',
                properties: {
                  name: { type: 'string' },
                  endpoint: { type: 'string' },
                  method: {
                    type: 'string',
                    enum: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH'],
                  },
                  expectedStatus: { type: 'number' },
                },
              },
              description: 'Optional custom test scenarios',
            },
            includeSetup: {
              type: 'boolean',
              default: true,
              description: 'Include beforeAll/afterAll setup/teardown code',
            },
          },
          required: ['targetModule'],
        },
      },
      {
        name: 'analyze_coverage_gaps',
        description:
          'Analyze test coverage gaps in a project. Parses coverage reports and identifies untested code with priority recommendations.',
        inputSchema: {
          type: 'object',
          properties: {
            projectPath: {
              type: 'string',
              description: 'Absolute path to project root directory',
            },
            coverageFile: {
              type: 'string',
              description:
                'Optional path to coverage JSON file (default: auto-detect from coverage/, .nyc_output/)',
            },
            threshold: {
              type: 'number',
              default: 80,
              description: 'Minimum acceptable coverage percentage',
            },
            reportFormat: {
              type: 'string',
              enum: ['summary', 'detailed', 'file-by-file'],
              default: 'detailed',
              description: 'Report detail level',
            },
            excludePatterns: {
              type: 'array',
              items: { type: 'string' },
              default: ['node_modules', 'dist', 'build', '*.test.ts'],
              description: 'Patterns to exclude from analysis',
            },
          },
          required: ['projectPath'],
        },
      },
      {
        name: 'suggest_test_scenarios',
        description:
          'Suggest test scenarios for a source file using pattern analysis. Identifies edge cases, error conditions, and happy paths.',
        inputSchema: {
          type: 'object',
          properties: {
            sourceFile: {
              type: 'string',
              description: 'Absolute path to source file to analyze',
            },
            context: {
              type: 'string',
              description:
                "Optional context about how the code is used (e.g., 'authentication module', 'payment processing')",
            },
            scenarioTypes: {
              type: 'array',
              items: {
                type: 'string',
                enum: [
                  'happy-path',
                  'edge-cases',
                  'error-handling',
                  'boundary-conditions',
                  'security',
                ],
              },
              default: ['happy-path', 'edge-cases', 'error-handling'],
              description: 'Types of scenarios to suggest',
            },
            maxSuggestions: {
              type: 'number',
              default: 10,
              description: 'Maximum number of scenario suggestions',
            },
          },
          required: ['sourceFile'],
        },
      },
    ],
  };
});

/**
 * Handle tool execution
 */
server.setRequestHandler(CallToolRequestSchema, async (request) => {
  try {
    const { name, arguments: args } = request.params;

    switch (name) {
      case 'generate_unit_tests': {
        const result = await generateUnitTests(args as any);
        return {
          content: [
            {
              type: 'text',
              text: JSON.stringify(result, null, 2),
            },
          ],
        };
      }

      case 'generate_integration_tests': {
        const result = await generateIntegrationTests(args as any);
        return {
          content: [
            {
              type: 'text',
              text: JSON.stringify(result, null, 2),
            },
          ],
        };
      }

      case 'analyze_coverage_gaps': {
        const result = await analyzeCoverageGaps(args as any);
        return {
          content: [
            {
              type: 'text',
              text: JSON.stringify(result, null, 2),
            },
          ],
        };
      }

      case 'suggest_test_scenarios': {
        const result = await suggestTestScenarios(args as any);
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
    const errorMessage = error instanceof Error ? error.message : String(error);
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
  console.error('Test Generator MCP Server running on stdio');
}

main().catch((error) => {
  console.error('Server error:', error);
  process.exit(1);
});
