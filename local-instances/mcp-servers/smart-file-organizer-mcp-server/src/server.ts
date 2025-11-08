#!/usr/bin/env node

import { Server } from '@modelcontextprotocol/sdk/server/index.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import {
  CallToolRequestSchema,
  ListResourcesRequestSchema,
  ListToolsRequestSchema,
  ReadResourceRequestSchema,
  ErrorCode,
  McpError
} from '@modelcontextprotocol/sdk/types.js';
import fs from 'fs/promises';
import path from 'path';
import { fileURLToPath } from 'url';
import { ContentAnalyzer } from './content-analyzer.js';
import { ProjectDetector } from './project-detector.js';
import { LifecycleManager } from './lifecycle-manager.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Get project root (4 levels up from dist/server.js: dist -> template -> mcp-server-templates -> frameworks)
const PROJECT_ROOT = process.env.SMART_FILE_ORGANIZER_PROJECT_ROOT ||
                     path.resolve(__dirname, '..', '..', '..', '..');

// Load folder map and custom rules
const folderMapPath = path.join(__dirname, '..', 'schemas', 'folder-map.json');
const customRulesPath = path.join(PROJECT_ROOT, '.mcp-data/smart-file-organizer-rules.json');

let folderMap: any;
let customRules: any;
let contentAnalyzer: ContentAnalyzer;
let projectDetector: ProjectDetector;
let lifecycleManager: LifecycleManager;

async function loadFolderMap() {
  const data = await fs.readFile(folderMapPath, 'utf-8');
  folderMap = JSON.parse(data);

  // Initialize analyzers
  contentAnalyzer = new ContentAnalyzer(folderMap);
  projectDetector = new ProjectDetector(folderMap);
  lifecycleManager = new LifecycleManager(folderMap);
}

async function loadCustomRules() {
  try {
    const data = await fs.readFile(customRulesPath, 'utf-8');
    customRules = JSON.parse(data);
  } catch (error) {
    // Initialize if file doesn't exist
    customRules = {
      patterns: [],
      fileDecisions: [],
      projectBoundaries: [],
      metadata: {
        created: new Date().toISOString().split('T')[0],
        lastUpdated: new Date().toISOString().split('T')[0],
        version: '1.0.0'
      }
    };
    await saveCustomRules();
  }
}

async function saveCustomRules() {
  customRules.metadata.lastUpdated = new Date().toISOString().split('T')[0];
  await fs.writeFile(customRulesPath, JSON.stringify(customRules, null, 2), 'utf-8');
}

interface FileInfo {
  name: string;
  path: string;
  relativePath: string;
  type: 'file' | 'directory';
  size?: number;
  modified?: string;
}

// Helper: List files in a directory
async function listFiles(dirPath: string, recursive: boolean = false): Promise<FileInfo[]> {
  try {
    const entries = await fs.readdir(dirPath, { withFileTypes: true });
    const files: FileInfo[] = [];

    for (const entry of entries) {
      // Skip hidden files and node_modules
      if (entry.name.startsWith('.') || entry.name === 'node_modules') {
        continue;
      }

      const fullPath = path.join(dirPath, entry.name);
      const relativePath = path.relative(PROJECT_ROOT, fullPath);
      const stats = await fs.stat(fullPath);

      const fileInfo: FileInfo = {
        name: entry.name,
        path: fullPath,
        relativePath,
        type: entry.isDirectory() ? 'directory' : 'file',
        size: entry.isFile() ? stats.size : undefined,
        modified: stats.mtime.toISOString()
      };

      files.push(fileInfo);

      // Recursively list subdirectories if requested
      if (recursive && entry.isDirectory()) {
        const subFiles = await listFiles(fullPath, true);
        files.push(...subFiles);
      }
    }

    return files;
  } catch (error) {
    throw new McpError(
      ErrorCode.InternalError,
      `Failed to list files: ${error}`
    );
  }
}

// Helper: Get unorganized files (files in root that shouldn't be there)
async function getUnorganizedFiles(): Promise<FileInfo[]> {
  const rootFiles = await listFiles(PROJECT_ROOT, false);
  const unorganized: FileInfo[] = [];
  const allowedRootFiles = folderMap.rootFiles.allowed;
  const definedFolders = Object.keys(folderMap.folderTypes);

  for (const file of rootFiles) {
    // Skip allowed root files
    if (allowedRootFiles.includes(file.name)) {
      continue;
    }

    // Skip defined folders
    if (definedFolders.some(folder => file.name === folder)) {
      continue;
    }

    // Skip hidden files
    if (file.name.startsWith('.')) {
      continue;
    }

    unorganized.push(file);
  }

  return unorganized;
}

// Initialize MCP server
const server = new Server(
  {
    name: 'smart-file-organizer',
    version: '1.0.0',
  },
  {
    capabilities: {
      resources: {},
      tools: {},
    },
  }
);

// Register resources
server.setRequestHandler(ListResourcesRequestSchema, async () => {
  return {
    resources: [
      {
        uri: 'smart-file-organizer://folder-map',
        name: 'Folder Structure Map',
        description: 'Comprehensive folder structure with deep understanding of folder purposes',
        mimeType: 'application/json',
      },
      {
        uri: 'smart-file-organizer://unorganized-files',
        name: 'Unorganized Files',
        description: 'List of files that don\'t belong in their current location',
        mimeType: 'application/json',
      },
      {
        uri: 'smart-file-organizer://custom-rules',
        name: 'Custom Learned Rules',
        description: 'Custom patterns, file decisions, and project boundaries learned from user',
        mimeType: 'application/json',
      },
      {
        uri: 'smart-file-organizer://lifecycle-stages',
        name: 'Lifecycle Stages',
        description: 'Information about file lifecycle stages and transitions',
        mimeType: 'application/json',
      },
    ],
  };
});

server.setRequestHandler(ReadResourceRequestSchema, async (request) => {
  const uri = request.params.uri;

  if (uri === 'smart-file-organizer://folder-map') {
    return {
      contents: [
        {
          uri,
          mimeType: 'application/json',
          text: JSON.stringify(folderMap, null, 2),
        },
      ],
    };
  }

  if (uri === 'smart-file-organizer://unorganized-files') {
    const unorganized = await getUnorganizedFiles();
    return {
      contents: [
        {
          uri,
          mimeType: 'application/json',
          text: JSON.stringify(unorganized, null, 2),
        },
      ],
    };
  }

  if (uri === 'smart-file-organizer://custom-rules') {
    return {
      contents: [
        {
          uri,
          mimeType: 'application/json',
          text: JSON.stringify(customRules, null, 2),
        },
      ],
    };
  }

  if (uri === 'smart-file-organizer://lifecycle-stages') {
    return {
      contents: [
        {
          uri,
          mimeType: 'application/json',
          text: JSON.stringify(folderMap.lifecycleStages, null, 2),
        },
      ],
    };
  }

  throw new McpError(
    ErrorCode.InvalidRequest,
    `Unknown resource: ${uri}`
  );
});

// Register tools
server.setRequestHandler(ListToolsRequestSchema, async () => {
  return {
    tools: [
      {
        name: 'list_files',
        description: 'List files in a directory with optional recursive scanning',
        inputSchema: {
          type: 'object',
          properties: {
            directory: {
              type: 'string',
              description: 'Directory to list (relative to project root, or "root" for project root)',
            },
            recursive: {
              type: 'boolean',
              description: 'Whether to list files recursively (default: false)',
            },
          },
        },
      },
      {
        name: 'analyze_file',
        description: 'Deeply analyze a file to understand its purpose and suggest optimal location',
        inputSchema: {
          type: 'object',
          properties: {
            filePath: {
              type: 'string',
              description: 'Path to the file to analyze (relative to project root)',
            },
          },
          required: ['filePath'],
        },
      },
      {
        name: 'analyze_directory',
        description: 'Analyze a directory to detect if it\'s a project and suggest organization',
        inputSchema: {
          type: 'object',
          properties: {
            dirPath: {
              type: 'string',
              description: 'Path to the directory to analyze (relative to project root)',
            },
          },
          required: ['dirPath'],
        },
      },
      {
        name: 'check_lifecycle',
        description: 'Check if a file/folder should transition to a different lifecycle stage',
        inputSchema: {
          type: 'object',
          properties: {
            path: {
              type: 'string',
              description: 'Path to check (relative to project root)',
            },
          },
          required: ['path'],
        },
      },
      {
        name: 'suggest_organization',
        description: 'Get comprehensive organization suggestions for multiple files',
        inputSchema: {
          type: 'object',
          properties: {
            paths: {
              type: 'array',
              items: { type: 'string' },
              description: 'Array of file paths to analyze (relative to project root)',
            },
          },
          required: ['paths'],
        },
      },
      {
        name: 'move_file',
        description: 'Move a file or directory to a new location',
        inputSchema: {
          type: 'object',
          properties: {
            source: {
              type: 'string',
              description: 'Source path (relative to project root)',
            },
            destination: {
              type: 'string',
              description: 'Destination path (relative to project root)',
            },
          },
          required: ['source', 'destination'],
        },
      },
      {
        name: 'create_project_folder',
        description: 'Create a new project folder with proper structure',
        inputSchema: {
          type: 'object',
          properties: {
            projectName: {
              type: 'string',
              description: 'Name of the project',
            },
            location: {
              type: 'string',
              enum: ['active-work', 'projects-in-development', 'projects'],
              description: 'Where to create the project (default: projects-in-development)',
            },
            includeStructure: {
              type: 'boolean',
              description: 'Whether to create standard folders (src/, docs/, etc.) (default: true)',
            },
          },
          required: ['projectName'],
        },
      },
      {
        name: 'add_pattern',
        description: 'Teach the server a new pattern for file organization',
        inputSchema: {
          type: 'object',
          properties: {
            pattern: {
              type: 'string',
              description: 'Regex pattern to match file names',
            },
            location: {
              type: 'string',
              description: 'Where files matching this pattern should go',
            },
            reason: {
              type: 'string',
              description: 'Why this pattern should go to this location',
            },
          },
          required: ['pattern', 'location', 'reason'],
        },
      },
      {
        name: 'record_decision',
        description: 'Record a file organization decision for learning',
        inputSchema: {
          type: 'object',
          properties: {
            fileName: {
              type: 'string',
              description: 'Name of the file that was organized',
            },
            movedTo: {
              type: 'string',
              description: 'Where the file was moved to',
            },
            reason: {
              type: 'string',
              description: 'Reason for this decision',
            },
          },
          required: ['fileName', 'movedTo', 'reason'],
        },
      },
    ],
  };
});

server.setRequestHandler(CallToolRequestSchema, async (request) => {
  const { name, arguments: args } = request.params;

  try {
    if (name === 'list_files') {
      const dir = args?.directory === 'root' || !args?.directory
        ? PROJECT_ROOT
        : path.join(PROJECT_ROOT, args.directory as string);
      const recursive = args?.recursive === true;

      const files = await listFiles(dir, recursive);

      return {
        content: [
          {
            type: 'text',
            text: JSON.stringify(files, null, 2),
          },
        ],
      };
    }

    if (name === 'analyze_file') {
      const filePath = args?.filePath as string;
      if (!filePath) {
        throw new McpError(ErrorCode.InvalidParams, 'filePath is required');
      }

      const fullPath = path.join(PROJECT_ROOT, filePath);
      const analysis = await contentAnalyzer.analyzeFile(fullPath);

      let metadataText = '';
      if (analysis.metadata) {
        metadataText = '\n\nMetadata Found:\n';
        if (analysis.metadata.type) metadataText += `  Type: ${analysis.metadata.type}\n`;
        if (analysis.metadata.phase) metadataText += `  Phase: ${analysis.metadata.phase}\n`;
        if (analysis.metadata.project) metadataText += `  Project: ${analysis.metadata.project}\n`;
        if (analysis.metadata.tags) metadataText += `  Tags: ${Array.isArray(analysis.metadata.tags) ? analysis.metadata.tags.join(', ') : analysis.metadata.tags}\n`;
        if (analysis.metadata.status) metadataText += `  Status: ${analysis.metadata.status}\n`;
        if (analysis.metadata.priority) metadataText += `  Priority: ${analysis.metadata.priority}\n`;

        // Show other custom fields
        const standardFields = ['type', 'phase', 'project', 'tags', 'status', 'priority'];
        const customFields = Object.keys(analysis.metadata).filter(k => !standardFields.includes(k));
        if (customFields.length > 0) {
          metadataText += '  Custom fields: ' + customFields.map(k => `${k}=${analysis.metadata![k]}`).join(', ') + '\n';
        }
      }

      return {
        content: [
          {
            type: 'text',
            text: `📊 Analysis for "${filePath}":\n\n` +
                  `File Type: ${analysis.fileType}\n` +
                  `Purpose: ${analysis.purpose || 'Not determined'}\n` +
                  `Is Secret: ${analysis.isSecret ? 'Yes ⚠️' : 'No'}\n` +
                  `Is Template: ${analysis.isTemplate ? 'Yes' : 'No'}\n` +
                  `Is Temporary: ${analysis.isTemporary ? 'Yes' : 'No'}\n` +
                  `Is Planning Doc: ${analysis.isPlanningDoc ? 'Yes' : 'No'}\n` +
                  `Confidence: ${(analysis.confidence * 100).toFixed(0)}%\n` +
                  metadataText +
                  `\nSuggested Location: ${analysis.suggestedLocation}\n\n` +
                  `Reasoning:\n${analysis.reasoning.map((r, i) => `${i + 1}. ${r}`).join('\n')}\n\n` +
                  `Keywords: ${analysis.keywords.join(', ') || 'None detected'}`,
          },
        ],
      };
    }

    if (name === 'analyze_directory') {
      const dirPath = args?.dirPath as string;
      if (!dirPath) {
        throw new McpError(ErrorCode.InvalidParams, 'dirPath is required');
      }

      const fullPath = path.join(PROJECT_ROOT, dirPath);
      const result = await projectDetector.analyzeDirectory(fullPath);

      if (result.isProject && result.projectInfo) {
        const info = result.projectInfo;
        return {
          content: [
            {
              type: 'text',
              text: `🎯 Project Detected: "${info.name}"\n\n` +
                    `Confidence: ${(info.confidence * 100).toFixed(0)}%\n` +
                    `Files: ${info.files.length}\n\n` +
                    `Project Indicators:\n` +
                    `- Has package.json: ${info.hasPackageJson ? '✓' : '✗'}\n` +
                    `- Has README.md: ${info.hasReadme ? '✓' : '✗'}\n` +
                    `- Has src/ folder: ${info.hasSrcFolder ? '✓' : '✗'}\n` +
                    `- Has config files: ${info.hasConfigFiles ? '✓' : '✗'}\n\n` +
                    `Suggested Location: ${info.suggestedLocation}\n\n` +
                    `Reasoning:\n${info.reasoning.map((r, i) => `${i + 1}. ${r}`).join('\n')}`,
            },
          ],
        };
      } else {
        return {
          content: [
            {
              type: 'text',
              text: `ℹ️ Not detected as a project\n\n` +
                    `Reasoning:\n${result.reasoning.map((r, i) => `${i + 1}. ${r}`).join('\n')}`,
            },
          ],
        };
      }
    }

    if (name === 'check_lifecycle') {
      const filePath = args?.path as string;
      if (!filePath) {
        throw new McpError(ErrorCode.InvalidParams, 'path is required');
      }

      const fullPath = path.join(PROJECT_ROOT, filePath);
      const lifecycle = await lifecycleManager.analyzeLifecycle(fullPath, PROJECT_ROOT);

      let message = `🔄 Lifecycle Analysis for "${filePath}":\n\n` +
                    `Current Stage: ${lifecycle.currentStage}\n` +
                    `Suggested Stage: ${lifecycle.suggestedStage}\n` +
                    `Should Transition: ${lifecycle.shouldTransition ? 'Yes ✓' : 'No'}\n\n`;

      if (lifecycle.shouldTransition && lifecycle.transition) {
        message += `Recommended Transition:\n` +
                   `From: ${lifecycle.transition.from}\n` +
                   `To: ${lifecycle.transition.to}\n` +
                   `Reason: ${lifecycle.transition.reason}\n` +
                   `Confidence: ${(lifecycle.transition.confidence * 100).toFixed(0)}%\n` +
                   `Action: ${lifecycle.transition.suggestedAction}\n\n`;
      }

      message += `Analysis:\n${lifecycle.reasoning.map((r, i) => `${i + 1}. ${r}`).join('\n')}`;

      return {
        content: [
          {
            type: 'text',
            text: message,
          },
        ],
      };
    }

    if (name === 'suggest_organization') {
      const paths = args?.paths as string[];
      if (!paths || !Array.isArray(paths)) {
        throw new McpError(ErrorCode.InvalidParams, 'paths array is required');
      }

      const suggestions: string[] = [];

      for (const filePath of paths) {
        const fullPath = path.join(PROJECT_ROOT, filePath);

        try {
          const analysis = await contentAnalyzer.analyzeFile(fullPath);
          suggestions.push(
            `📁 ${filePath}\n` +
            `   → ${analysis.suggestedLocation}\n` +
            `   Confidence: ${(analysis.confidence * 100).toFixed(0)}%\n` +
            `   Reason: ${analysis.reasoning[analysis.reasoning.length - 1]}\n`
          );
        } catch (error) {
          suggestions.push(`📁 ${filePath}\n   ⚠️ Error: ${error}\n`);
        }
      }

      return {
        content: [
          {
            type: 'text',
            text: `📋 Organization Suggestions:\n\n${suggestions.join('\n')}`,
          },
        ],
      };
    }

    if (name === 'move_file') {
      const source = args?.source as string;
      const destination = args?.destination as string;

      if (!source || !destination) {
        throw new McpError(ErrorCode.InvalidParams, 'source and destination are required');
      }

      const sourcePath = path.join(PROJECT_ROOT, source);
      const destPath = path.join(PROJECT_ROOT, destination);

      // Check if source exists
      try {
        await fs.access(sourcePath);
      } catch {
        throw new McpError(ErrorCode.InvalidParams, `Source does not exist: ${source}`);
      }

      // Create destination directory if needed
      const destDir = path.dirname(destPath);
      await fs.mkdir(destDir, { recursive: true });

      // Move the file
      await fs.rename(sourcePath, destPath);

      // Record the decision
      const fileName = path.basename(source);
      customRules.fileDecisions.push({
        fileName,
        movedFrom: source,
        movedTo: destination,
        timestamp: new Date().toISOString().split('T')[0],
      });
      await saveCustomRules();

      return {
        content: [
          {
            type: 'text',
            text: `✅ Successfully moved:\n  ${source}\n  → ${destination}\n\n(Decision recorded for future reference)`,
          },
        ],
      };
    }

    if (name === 'create_project_folder') {
      const projectName = args?.projectName as string;
      const location = (args?.location as string) || 'projects-in-development';
      const includeStructure = args?.includeStructure !== false;

      if (!projectName) {
        throw new McpError(ErrorCode.InvalidParams, 'projectName is required');
      }

      // Normalize project name
      const normalizedName = projectName
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/^-|-$/g, '');

      const projectPath = path.join(PROJECT_ROOT, location, normalizedName);

      // Check if already exists
      try {
        await fs.access(projectPath);
        throw new McpError(
          ErrorCode.InvalidParams,
          `Project folder already exists: ${location}/${normalizedName}`
        );
      } catch (error: any) {
        if (error.code !== 'ENOENT' && !(error instanceof McpError)) {
          throw error;
        }
      }

      // Create project folder
      await fs.mkdir(projectPath, { recursive: true });

      // Create standard structure if requested
      if (includeStructure) {
        await fs.mkdir(path.join(projectPath, 'src'), { recursive: true });
        await fs.mkdir(path.join(projectPath, 'docs'), { recursive: true });

        // Create basic README
        const readme = `# ${projectName}\n\n## Description\n\nAdd project description here.\n\n## Installation\n\nAdd installation instructions.\n\n## Usage\n\nAdd usage examples.\n`;
        await fs.writeFile(path.join(projectPath, 'README.md'), readme, 'utf-8');
      }

      // Record project boundary
      customRules.projectBoundaries.push({
        projectName: normalizedName,
        location: `${location}/${normalizedName}`,
        created: new Date().toISOString().split('T')[0],
      });
      await saveCustomRules();

      return {
        content: [
          {
            type: 'text',
            text: `✅ Created project: ${location}/${normalizedName}/\n\n` +
                  (includeStructure
                    ? `Structure:\n- src/\n- docs/\n- README.md\n`
                    : ''),
          },
        ],
      };
    }

    if (name === 'add_pattern') {
      const pattern = args?.pattern as string;
      const location = args?.location as string;
      const reason = args?.reason as string;

      if (!pattern || !location || !reason) {
        throw new McpError(
          ErrorCode.InvalidParams,
          'pattern, location, and reason are required'
        );
      }

      // Test if pattern is valid regex
      try {
        new RegExp(pattern);
      } catch (error) {
        throw new McpError(ErrorCode.InvalidParams, `Invalid regex pattern: ${pattern}`);
      }

      // Add the pattern
      customRules.patterns.push({
        pattern,
        location,
        reason,
        addedOn: new Date().toISOString().split('T')[0],
      });
      await saveCustomRules();

      return {
        content: [
          {
            type: 'text',
            text: `✅ Pattern added successfully!\n\n` +
                  `Pattern: ${pattern}\n` +
                  `Location: ${location}\n` +
                  `Reason: ${reason}\n\n` +
                  `This pattern will now be used for future file suggestions.`,
          },
        ],
      };
    }

    if (name === 'record_decision') {
      const fileName = args?.fileName as string;
      const movedTo = args?.movedTo as string;
      const reason = args?.reason as string;

      if (!fileName || !movedTo || !reason) {
        throw new McpError(
          ErrorCode.InvalidParams,
          'fileName, movedTo, and reason are required'
        );
      }

      customRules.fileDecisions.push({
        fileName,
        movedTo,
        reason,
        timestamp: new Date().toISOString().split('T')[0],
      });
      await saveCustomRules();

      return {
        content: [
          {
            type: 'text',
            text: `✅ Decision recorded:\n  ${fileName} → ${movedTo}\n  Reason: ${reason}`,
          },
        ],
      };
    }

    throw new McpError(ErrorCode.MethodNotFound, `Unknown tool: ${name}`);
  } catch (error) {
    if (error instanceof McpError) {
      throw error;
    }
    throw new McpError(ErrorCode.InternalError, `Tool execution failed: ${error}`);
  }
});

// Start server
async function main() {
  await loadFolderMap();
  await loadCustomRules();

  const transport = new StdioServerTransport();
  await server.connect(transport);

  console.error('Smart File Organizer MCP server running on stdio');
  console.error(`Project root: ${PROJECT_ROOT}`);
  console.error(`Loaded ${customRules.patterns.length} custom patterns`);
  console.error(`Loaded ${customRules.fileDecisions.length} file decisions`);
  console.error(`Loaded ${customRules.projectBoundaries?.length || 0} project boundaries`);
}

main().catch((error) => {
  console.error('Server error:', error);
  process.exit(1);
});
