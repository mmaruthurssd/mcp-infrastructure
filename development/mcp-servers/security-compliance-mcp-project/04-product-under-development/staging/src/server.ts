#!/usr/bin/env node

/**
 * Security & Compliance MCP Server
 *
 * Provides automated security infrastructure for medical practice workspace:
 * - Credential detection and prevention
 * - PHI protection (HIPAA compliance)
 * - Pre-commit security hooks
 * - Encrypted secrets management
 * - Security audit logging
 */

import { Server } from '@modelcontextprotocol/sdk/server/index.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import {
  CallToolRequestSchema,
  ListToolsRequestSchema,
} from '@modelcontextprotocol/sdk/types.js';
import { scanForCredentials, formatScanResults, type ScanForCredentialsArgs } from './tools/scan-for-credentials.js';
import { manageAllowList, formatAllowList, type ManageAllowListArgs } from './tools/manage-allowlist.js';
import { manageHooks, formatHookManagementResult, type ManageHooksArgs } from './tools/manage-hooks.js';
import { scanForPHI, formatPHIScanResults, type ScanForPHIArgs } from './tools/scan-for-phi.js';
import { manageSecrets, formatSecretsResult, type ManageSecretsArgs } from './tools/manage-secrets.js';

/**
 * Security & Compliance MCP Server
 */
class SecurityComplianceMCPServer {
  private server: Server;

  constructor() {
    this.server = new Server(
      {
        name: 'security-compliance-mcp',
        version: '1.0.0',
      },
      {
        capabilities: {
          tools: {},
        },
      }
    );

    this.setupHandlers();
  }

  /**
   * Set up MCP request handlers
   */
  private setupHandlers(): void {
    // List available tools
    this.server.setRequestHandler(ListToolsRequestSchema, async () => {
      return {
        tools: [
          {
            name: 'scan_for_credentials',
            description: 'Scan files, directories, or git commits for exposed credentials (API keys, tokens, passwords). Returns detailed report with severity levels and remediation suggestions.',
            inputSchema: {
              type: 'object',
              properties: {
                target: {
                  type: 'string',
                  description: 'File path, directory path, or commit hash',
                },
                mode: {
                  type: 'string',
                  enum: ['file', 'directory', 'staged', 'commit'],
                  description: 'Scanning mode: file (single file), directory (recursive), staged (git staged files), commit (specific commit)',
                },
                commitHash: {
                  type: 'string',
                  description: 'Git commit hash (required when mode is "commit")',
                },
                minConfidence: {
                  type: 'number',
                  description: 'Minimum confidence threshold (0.0-1.0, default 0.5)',
                },
                exclude: {
                  type: 'array',
                  items: { type: 'string' },
                  description: 'Directories to exclude (e.g., ["node_modules", ".git"])',
                },
              },
              required: ['target', 'mode'],
            },
          },
          {
            name: 'manage_allowlist',
            description: 'Manage security allow-list to filter out known false positives. Add, remove, or list entries.',
            inputSchema: {
              type: 'object',
              properties: {
                action: {
                  type: 'string',
                  enum: ['add', 'remove', 'list'],
                  description: 'Action to perform',
                },
                entry: {
                  type: 'object',
                  description: 'Entry to add (required for "add" action)',
                  properties: {
                    filePath: {
                      type: 'string',
                      description: 'File path pattern (supports wildcards)',
                    },
                    lineNumber: {
                      type: 'number',
                      description: 'Specific line number',
                    },
                    patternName: {
                      type: 'string',
                      description: 'Pattern name to allow-list',
                    },
                    matchedText: {
                      type: 'string',
                      description: 'Exact matched text',
                    },
                    reason: {
                      type: 'string',
                      description: 'Reason for allow-listing (required)',
                    },
                    addedBy: {
                      type: 'string',
                      description: 'Person adding this entry',
                    },
                  },
                  required: ['reason'],
                },
                index: {
                  type: 'number',
                  description: 'Index of entry to remove (required for "remove" action)',
                },
              },
              required: ['action'],
            },
          },
          {
            name: 'manage_hooks',
            description: 'Install, uninstall, or check status of git pre-commit hooks for automated security scanning.',
            inputSchema: {
              type: 'object',
              properties: {
                action: {
                  type: 'string',
                  enum: ['install', 'uninstall', 'status'],
                  description: 'Hook management action',
                },
                gitDir: {
                  type: 'string',
                  description: 'Git repository directory (optional, defaults to current directory)',
                },
              },
              required: ['action'],
            },
          },
          {
            name: 'scan_for_phi',
            description: 'Scan files for Protected Health Information (PHI) to ensure HIPAA compliance. Detects patient identifiers, medical records, and sensitive health data.',
            inputSchema: {
              type: 'object',
              properties: {
                target: {
                  type: 'string',
                  description: 'File path, directory path, or commit hash',
                },
                mode: {
                  type: 'string',
                  enum: ['file', 'directory', 'staged', 'commit'],
                  description: 'Scanning mode',
                },
                commitHash: {
                  type: 'string',
                  description: 'Git commit hash (required when mode is "commit")',
                },
                minConfidence: {
                  type: 'number',
                  description: 'Minimum confidence threshold (0.0-1.0)',
                },
                sensitivity: {
                  type: 'string',
                  enum: ['low', 'medium', 'high'],
                  description: 'Scanning sensitivity (low=fewer false positives, high=fewer false negatives, default: medium)',
                },
                categories: {
                  type: 'array',
                  items: {
                    type: 'string',
                    enum: ['identifier', 'demographic', 'medical', 'financial'],
                  },
                  description: 'PHI categories to scan for',
                },
                exclude: {
                  type: 'array',
                  items: { type: 'string' },
                  description: 'Directories to exclude',
                },
              },
              required: ['target', 'mode'],
            },
          },
          {
            name: 'manage_secrets',
            description: 'Securely encrypt, decrypt, and manage API keys and credentials with rotation tracking. Uses OS-native keystore (Keychain/Credential Manager) or encrypted file storage.',
            inputSchema: {
              type: 'object',
              properties: {
                action: {
                  type: 'string',
                  enum: ['encrypt', 'decrypt', 'rotate', 'status'],
                  description: 'Secrets management action',
                },
                key: {
                  type: 'string',
                  description: 'Secret identifier (e.g., "api_key", "database_password")',
                },
                value: {
                  type: 'string',
                  description: 'Secret value (required for encrypt and rotate)',
                },
                rotationDays: {
                  type: 'number',
                  description: 'Days until rotation required (default: 90)',
                },
              },
              required: ['action'],
            },
          },
        ],
      };
    });

    // Handle tool calls
    this.server.setRequestHandler(CallToolRequestSchema, async (request) => {
      const { name, arguments: args } = request.params;

      try {
        switch (name) {
          case 'scan_for_credentials': {
            const scanArgs = args as unknown as ScanForCredentialsArgs;
            const result = await scanForCredentials(scanArgs);
            const formatted = formatScanResults(result);

            return {
              content: [
                {
                  type: 'text',
                  text: formatted,
                },
              ],
            };
          }

          case 'manage_allowlist': {
            const allowlistArgs = args as unknown as ManageAllowListArgs;
            const result = await manageAllowList(allowlistArgs);
            const formatted = formatAllowList(result);

            return {
              content: [
                {
                  type: 'text',
                  text: formatted,
                },
              ],
            };
          }

          case 'manage_hooks': {
            const hooksArgs = args as unknown as ManageHooksArgs;
            const result = await manageHooks(hooksArgs);
            const formatted = formatHookManagementResult(result);

            return {
              content: [
                {
                  type: 'text',
                  text: formatted,
                },
              ],
            };
          }

          case 'scan_for_phi': {
            const phiArgs = args as unknown as ScanForPHIArgs;
            const result = await scanForPHI(phiArgs);
            const formatted = formatPHIScanResults(result);

            return {
              content: [
                {
                  type: 'text',
                  text: formatted,
                },
              ],
            };
          }

          case 'manage_secrets': {
            const secretsArgs = args as unknown as ManageSecretsArgs;
            const result = await manageSecrets(secretsArgs);
            const formatted = formatSecretsResult(result);

            return {
              content: [
                {
                  type: 'text',
                  text: formatted,
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
              text: `Error: ${errorMessage}`,
            },
          ],
          isError: true,
        };
      }
    });
  }

  /**
   * Start the MCP server
   */
  async start(): Promise<void> {
    const transport = new StdioServerTransport();
    await this.server.connect(transport);
    console.error('Security & Compliance MCP server running on stdio');
  }
}

// Start the server
const server = new SecurityComplianceMCPServer();
server.start().catch((error) => {
  console.error('Failed to start server:', error);
  process.exit(1);
});
