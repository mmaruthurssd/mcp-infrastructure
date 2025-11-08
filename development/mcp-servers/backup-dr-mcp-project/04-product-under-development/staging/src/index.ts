#!/usr/bin/env node

/**
 * Backup & DR MCP Server
 * Automated backup and disaster recovery for critical workspace data
 */

import { Server } from '@modelcontextprotocol/sdk/server/index.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import {
  CallToolRequestSchema,
  ListToolsRequestSchema,
  Tool
} from '@modelcontextprotocol/sdk/types.js';

import { CreateBackupTool, CreateBackupToolParams } from './tools/createBackup.js';
import { RestoreBackupTool, RestoreBackupToolParams } from './tools/restoreBackup.js';
import { ListBackupsTool, ListBackupsToolParams } from './tools/listBackups.js';
import { VerifyBackupTool, VerifyBackupToolParams } from './tools/verifyBackup.js';
import { ScheduleBackupTool, ScheduleBackupToolParams } from './tools/scheduleBackup.js';
import { GetBackupStatusTool, GetBackupStatusToolParams } from './tools/getBackupStatus.js';
import { CleanupOldBackupsTool, CleanupOldBackupsToolParams } from './tools/cleanupOldBackups.js';
import { ExportBackupConfigTool, ExportBackupConfigToolParams } from './tools/exportBackupConfig.js';
import { DEFAULT_CONFIG } from './types/config.types.js';

// Initialize MCP server
const server = new Server(
  {
    name: 'backup-dr-mcp-server',
    version: '1.0.0'
  },
  {
    capabilities: {
      tools: {}
    }
  }
);

// Tool definitions
const TOOLS: Tool[] = [
  {
    name: 'create_backup',
    description: 'Create a new backup (full or incremental) with optional PHI scanning. Supports compression, verification, and exclude patterns.',
    inputSchema: {
      type: 'object',
      properties: {
        sources: {
          type: 'array',
          items: { type: 'string' },
          description: 'Array of source paths to backup (files or directories)'
        },
        type: {
          type: 'string',
          enum: ['full', 'incremental'],
          description: 'Backup type (default: incremental)'
        },
        label: {
          type: 'string',
          description: 'Optional label for the backup'
        },
        compression: {
          type: 'boolean',
          description: 'Enable gzip compression (default: true)'
        },
        verify: {
          type: 'boolean',
          description: 'Verify backup integrity after creation (default: false)'
        },
        excludePatterns: {
          type: 'array',
          items: { type: 'string' },
          description: 'Glob patterns to exclude (e.g., "node_modules/**", "*.log")'
        },
        scanPHI: {
          type: 'boolean',
          description: 'Scan for Protected Health Information (default: false)'
        }
      },
      required: ['sources']
    }
  },
  {
    name: 'restore_backup',
    description: 'Restore backup with conflict detection, dry-run preview, and pre-restore safety backup. Supports selective restore and destination override.',
    inputSchema: {
      type: 'object',
      properties: {
        backupId: {
          type: 'string',
          description: 'Backup ID to restore (e.g., "2025-01-01-120000")'
        },
        destination: {
          type: 'string',
          description: 'Optional destination override (default: original locations)'
        },
        overwrite: {
          type: 'boolean',
          description: 'Overwrite existing files (default: false)'
        },
        preBackup: {
          type: 'boolean',
          description: 'Create safety backup before restore (default: true, requires overwrite: true)'
        },
        dryRun: {
          type: 'boolean',
          description: 'Preview restore without executing (default: false)'
        },
        selective: {
          type: 'array',
          items: { type: 'string' },
          description: 'Restore only matching patterns (e.g., ["patient-data/**"])'
        }
      },
      required: ['backupId']
    }
  },
  {
    name: 'list_backups',
    description: 'Query and filter backups with sorting, date ranges, and statistics. Returns backup catalog with compression ratios and file counts.',
    inputSchema: {
      type: 'object',
      properties: {
        type: {
          type: 'string',
          enum: ['full', 'incremental'],
          description: 'Filter by backup type'
        },
        sources: {
          type: 'array',
          items: { type: 'string' },
          description: 'Filter by source paths'
        },
        label: {
          type: 'string',
          description: 'Filter by label'
        },
        dateRange: {
          type: 'object',
          properties: {
            start: { type: 'string', description: 'ISO 8601 start date' },
            end: { type: 'string', description: 'ISO 8601 end date' }
          },
          description: 'Filter by date range'
        },
        sort: {
          type: 'string',
          enum: ['date-asc', 'date-desc', 'size-asc', 'size-desc'],
          description: 'Sort order (default: date-desc)'
        },
        limit: {
          type: 'number',
          description: 'Maximum number of results'
        }
      }
    }
  },
  {
    name: 'verify_backup',
    description: 'Verify backup integrity with checksum validation. Supports quick (manifest only) or full (all files) verification.',
    inputSchema: {
      type: 'object',
      properties: {
        backupId: {
          type: 'string',
          description: 'Backup ID to verify'
        },
        quick: {
          type: 'boolean',
          description: 'Quick verification (manifest checksum only, default: false)'
        }
      },
      required: ['backupId']
    }
  },
  {
    name: 'schedule_backup',
    description: 'Manage backup schedules with cron expressions. Supports create, list, update, delete, enable, disable, and manual trigger actions.',
    inputSchema: {
      type: 'object',
      properties: {
        action: {
          type: 'string',
          enum: ['create', 'list', 'update', 'delete', 'enable', 'disable', 'trigger'],
          description: 'Action to perform'
        },
        scheduleId: {
          type: 'string',
          description: 'Schedule identifier (required for all actions except list)'
        },
        cronExpression: {
          type: 'string',
          description: 'Cron expression (e.g., "0 2 * * *" for daily at 2 AM)'
        },
        sources: {
          type: 'array',
          items: { type: 'string' },
          description: 'Source paths to backup'
        },
        type: {
          type: 'string',
          enum: ['full', 'incremental'],
          description: 'Backup type'
        },
        label: {
          type: 'string',
          description: 'Optional label'
        },
        compression: {
          type: 'boolean',
          description: 'Enable compression'
        },
        verify: {
          type: 'boolean',
          description: 'Verify after backup'
        },
        excludePatterns: {
          type: 'array',
          items: { type: 'string' },
          description: 'Exclude patterns'
        },
        enabled: {
          type: 'boolean',
          description: 'Enable schedule immediately (default: true)'
        },
        filter: {
          type: 'object',
          properties: {
            enabled: { type: 'boolean' }
          },
          description: 'Filter for list action'
        }
      },
      required: ['action']
    }
  },
  {
    name: 'get_backup_status',
    description: 'Get comprehensive backup system status including statistics, recent backups, schedules, retention preview, and health checks.',
    inputSchema: {
      type: 'object',
      properties: {
        includeSchedules: {
          type: 'boolean',
          description: 'Include schedule information (default: false)'
        },
        includeRetention: {
          type: 'boolean',
          description: 'Include retention policy preview (default: false)'
        }
      }
    }
  },
  {
    name: 'cleanup_old_backups',
    description: 'Apply retention policy and cleanup old backups. Supports dry-run preview and custom retention policies (7 daily, 4 weekly, 12 monthly).',
    inputSchema: {
      type: 'object',
      properties: {
        dryRun: {
          type: 'boolean',
          description: 'Preview cleanup without executing (default: false)'
        },
        retentionPolicy: {
          type: 'object',
          properties: {
            dailyRetention: { type: 'number', description: 'Days to keep daily backups (default: 7)' },
            weeklyRetention: { type: 'number', description: 'Weeks to keep weekly backups (default: 4)' },
            monthlyRetention: { type: 'number', description: 'Months to keep monthly backups (default: 12)' }
          },
          description: 'Custom retention policy'
        }
      }
    }
  },
  {
    name: 'export_backup_config',
    description: 'Export backup configuration for migration or documentation. Supports JSON and YAML formats with schedules and statistics.',
    inputSchema: {
      type: 'object',
      properties: {
        includeSchedules: {
          type: 'boolean',
          description: 'Include backup schedules (default: false)'
        },
        includeStatistics: {
          type: 'boolean',
          description: 'Include backup statistics (default: false)'
        },
        outputPath: {
          type: 'string',
          description: 'Optional output file path'
        },
        format: {
          type: 'string',
          enum: ['json', 'yaml'],
          description: 'Export format (default: json)'
        }
      }
    }
  }
];

// Tool handlers
server.setRequestHandler(ListToolsRequestSchema, async () => ({
  tools: TOOLS
}));

server.setRequestHandler(CallToolRequestSchema, async (request) => {
  const { name, arguments: args } = request.params;

  try {
    switch (name) {
      case 'create_backup': {
        const tool = new CreateBackupTool(
          DEFAULT_CONFIG.compression.level,
          DEFAULT_CONFIG.backupDirectory
        );
        const result = await tool.execute(args as unknown as CreateBackupToolParams);
        return {
          content: [{ type: 'text', text: JSON.stringify(result, null, 2) }]
        };
      }

      case 'restore_backup': {
        const tool = new RestoreBackupTool(DEFAULT_CONFIG.backupDirectory);
        const result = await tool.execute(args as unknown as RestoreBackupToolParams);
        return {
          content: [{ type: 'text', text: JSON.stringify(result, null, 2) }]
        };
      }

      case 'list_backups': {
        const tool = new ListBackupsTool(DEFAULT_CONFIG.backupDirectory);
        const result = await tool.execute(args as unknown as ListBackupsToolParams);
        return {
          content: [{ type: 'text', text: JSON.stringify(result, null, 2) }]
        };
      }

      case 'verify_backup': {
        const tool = new VerifyBackupTool(DEFAULT_CONFIG.backupDirectory);
        const result = await tool.execute(args as unknown as VerifyBackupToolParams);
        return {
          content: [{ type: 'text', text: JSON.stringify(result, null, 2) }]
        };
      }

      case 'schedule_backup': {
        const tool = new ScheduleBackupTool(
          DEFAULT_CONFIG.compression.level,
          DEFAULT_CONFIG.backupDirectory
        );
        const result = await tool.execute(args as unknown as ScheduleBackupToolParams);
        return {
          content: [{ type: 'text', text: JSON.stringify(result, null, 2) }]
        };
      }

      case 'get_backup_status': {
        const tool = new GetBackupStatusTool(
          DEFAULT_CONFIG.compression.level,
          DEFAULT_CONFIG.backupDirectory,
          DEFAULT_CONFIG.retention
        );
        const result = await tool.execute(args as GetBackupStatusToolParams);
        return {
          content: [{ type: 'text', text: JSON.stringify(result, null, 2) }]
        };
      }

      case 'cleanup_old_backups': {
        const tool = new CleanupOldBackupsTool(
          DEFAULT_CONFIG.retention,
          DEFAULT_CONFIG.backupDirectory
        );
        const result = await tool.execute(args as CleanupOldBackupsToolParams);
        return {
          content: [{ type: 'text', text: JSON.stringify(result, null, 2) }]
        };
      }

      case 'export_backup_config': {
        const tool = new ExportBackupConfigTool(
          DEFAULT_CONFIG.compression.level,
          DEFAULT_CONFIG.backupDirectory
        );
        const result = await tool.execute(args as ExportBackupConfigToolParams);
        return {
          content: [{ type: 'text', text: JSON.stringify(result, null, 2) }]
        };
      }

      default:
        throw new Error(`Unknown tool: ${name}`);
    }
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    return {
      content: [
        {
          type: 'text',
          text: JSON.stringify(
            {
              success: false,
              error: errorMessage
            },
            null,
            2
          )
        }
      ],
      isError: true
    };
  }
});

// Start server
async function main() {
  const transport = new StdioServerTransport();
  await server.connect(transport);
  console.error('Backup & DR MCP Server running on stdio');
}

main().catch((error) => {
  console.error('Fatal error in main():', error);
  process.exit(1);
});
