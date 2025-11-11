#!/usr/bin/env node

import { Server } from "@modelcontextprotocol/sdk/server/index.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import {
  CallToolRequestSchema,
  ListToolsRequestSchema,
} from "@modelcontextprotocol/sdk/types.js";

// Import tool implementations
import { generateApiDocs } from "./tools/generate-api-docs.js";
import { generateChangelog } from "./tools/generate-changelog.js";
import { trackDocCoverage } from "./tools/track-doc-coverage.js";
import { generateDiagrams } from "./tools/generate-diagrams.js";
import { updateDocumentation } from "./tools/update-documentation.js";
import { catalogDocumentation } from "./tools/catalog-documentation.js";

const server = new Server(
  {
    name: "documentation-generator-mcp",
    version: "1.0.0",
  },
  {
    capabilities: {
      tools: {},
    },
  }
);

// List available tools
server.setRequestHandler(ListToolsRequestSchema, async () => {
  return {
    tools: [
      {
        name: "generate_api_docs",
        description: "Generate API documentation from TypeScript source files with JSDoc comments",
        inputSchema: {
          type: "object",
          properties: {
            sourceFile: {
              type: "string",
              description: "Absolute path to TypeScript file",
            },
            outputFile: {
              type: "string",
              description: "Optional output path (default: sourceFile.API.md)",
            },
            includePrivate: {
              type: "boolean",
              description: "Include private members (default: false)",
            },
            includeExamples: {
              type: "boolean",
              description: "Extract examples from tests (default: true)",
            },
            format: {
              type: "string",
              enum: ["markdown", "html"],
              description: "Output format (default: markdown)",
            },
          },
          required: ["sourceFile"],
        },
      },
      {
        name: "generate_changelog",
        description: "Generate changelog from git commit history with automatic categorization",
        inputSchema: {
          type: "object",
          properties: {
            projectPath: {
              type: "string",
              description: "Absolute path to git repository",
            },
            fromVersion: {
              type: "string",
              description: "Start tag/commit (default: last tag)",
            },
            toVersion: {
              type: "string",
              description: "End tag/commit (default: HEAD)",
            },
            outputFile: {
              type: "string",
              description: "Output path (default: projectPath/CHANGELOG.md)",
            },
            format: {
              type: "string",
              enum: ["keepachangelog", "simple"],
              description: "Changelog format",
            },
            groupBy: {
              type: "string",
              enum: ["type", "scope"],
              description: "How to group commits",
            },
          },
          required: ["projectPath"],
        },
      },
      {
        name: "track_doc_coverage",
        description: "Scan TypeScript files and calculate documentation coverage percentage",
        inputSchema: {
          type: "object",
          properties: {
            projectPath: {
              type: "string",
              description: "Project root to scan",
            },
            includePatterns: {
              type: "array",
              items: { type: "string" },
              description: "Glob patterns to include (default: [\"**/*.ts\"])",
            },
            excludePatterns: {
              type: "array",
              items: { type: "string" },
              description: "Patterns to exclude (default: [\"**/*.test.ts\", \"**/node_modules/**\"])",
            },
            minCoverage: {
              type: "number",
              description: "Minimum coverage threshold (default: 70)",
            },
            reportFormat: {
              type: "string",
              enum: ["summary", "detailed", "json"],
              description: "Report detail level",
            },
          },
          required: ["projectPath"],
        },
      },
      {
        name: "generate_diagrams",
        description: "Generate Mermaid.js diagrams from code structure analysis",
        inputSchema: {
          type: "object",
          properties: {
            projectPath: {
              type: "string",
              description: "Project root",
            },
            diagramType: {
              type: "string",
              enum: ["architecture", "dependencies", "dataflow"],
              description: "Type of diagram to generate",
            },
            sourceFiles: {
              type: "array",
              items: { type: "string" },
              description: "Specific files to analyze (default: all)",
            },
            outputFile: {
              type: "string",
              description: "Output path (default: projectPath/diagrams/{type}.md)",
            },
            maxDepth: {
              type: "number",
              description: "Max depth for dependency traversal (default: 3)",
            },
          },
          required: ["projectPath", "diagramType"],
        },
      },
      {
        name: "update_documentation",
        description: "Detect code changes and regenerate affected documentation",
        inputSchema: {
          type: "object",
          properties: {
            projectPath: {
              type: "string",
              description: "Project root",
            },
            since: {
              type: "string",
              description: "Git ref to compare (default: last commit)",
            },
            dryRun: {
              type: "boolean",
              description: "Preview changes without writing (default: false)",
            },
            autoCommit: {
              type: "boolean",
              description: "Auto-commit doc updates (default: false)",
            },
          },
          required: ["projectPath"],
        },
      },
      {
        name: "catalog_documentation",
        description: "Scan and index all markdown documentation files",
        inputSchema: {
          type: "object",
          properties: {
            projectPath: {
              type: "string",
              description: "Project root to scan",
            },
            outputFile: {
              type: "string",
              description: "Index output path (default: projectPath/DOCS-INDEX.md)",
            },
            includePatterns: {
              type: "array",
              items: { type: "string" },
              description: "Patterns to include (default: [\"**/*.md\"])",
            },
            excludePatterns: {
              type: "array",
              items: { type: "string" },
              description: "Patterns to exclude (default: [\"**/node_modules/**\"])",
            },
            extractMetadata: {
              type: "boolean",
              description: "Extract YAML frontmatter (default: true)",
            },
          },
          required: ["projectPath"],
        },
      },
    ],
  };
});

// Handle tool calls
server.setRequestHandler(CallToolRequestSchema, async (request) => {
  const { name, arguments: args } = request.params;

  try {
    switch (name) {
      case "generate_api_docs":
        return await generateApiDocs(args as any);
      case "generate_changelog":
        return await generateChangelog(args as any);
      case "track_doc_coverage":
        return await trackDocCoverage(args as any);
      case "generate_diagrams":
        return await generateDiagrams(args as any);
      case "update_documentation":
        return await updateDocumentation(args as any);
      case "catalog_documentation":
        return await catalogDocumentation(args as any);
      default:
        throw new Error(`Unknown tool: ${name}`);
    }
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    return {
      content: [
        {
          type: "text",
          text: JSON.stringify(
            {
              success: false,
              error: {
                code: "TOOL_ERROR",
                message: errorMessage,
              },
            },
            null,
            2
          ),
        },
      ],
    };
  }
});

// Start server
async function main() {
  const transport = new StdioServerTransport();
  await server.connect(transport);
  console.error("Documentation Generator MCP Server running on stdio");
}

main().catch((error) => {
  console.error("Server error:", error);
  process.exit(1);
});
