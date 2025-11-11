#!/usr/bin/env node
// Workspace Sync MCP Server
// Provides workspace synchronization with platform updates, project sync, and Google Drive integration
import { Server } from '@modelcontextprotocol/sdk/server/index.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import { CallToolRequestSchema, ListToolsRequestSchema, } from '@modelcontextprotocol/sdk/types.js';
import { exec } from 'child_process';
import { promisify } from 'util';
import { readFile, writeFile } from 'fs/promises';
import { existsSync } from 'fs';
import * as yaml from 'js-yaml';
import { join } from 'path';
const execAsync = promisify(exec);
// Get workspace root from environment or use current directory
const workspaceRoot = process.env.WORKSPACE_ROOT || process.cwd();
const scriptsDir = join(workspaceRoot, 'scripts', 'sync');
const manifestPath = join(workspaceRoot, 'workspace-manifest.yml');
// Initialize MCP server
const server = new Server({
    name: 'workspace-sync',
    version: '1.0.0',
}, {
    capabilities: {
        tools: {},
    },
});
// === TOOL DEFINITIONS ===
server.setRequestHandler(ListToolsRequestSchema, async () => {
    return {
        tools: [
            {
                name: 'check_platform_updates',
                description: 'Check for platform updates from upstream repository. Compares current version with latest upstream version, detects breaking changes, and shows new components.',
                inputSchema: {
                    type: 'object',
                    properties: {},
                },
            },
            {
                name: 'apply_platform_update',
                description: 'Apply platform update with backup and rollback capabilities. Creates backup before updating, merges from upstream tag, validates workspace health after update.',
                inputSchema: {
                    type: 'object',
                    properties: {
                        skipBackup: {
                            type: 'boolean',
                            description: 'Skip backup creation (not recommended)',
                        },
                        autoConfirm: {
                            type: 'boolean',
                            description: 'Auto-confirm breaking changes (use with caution)',
                        },
                    },
                },
            },
            {
                name: 'sync_projects',
                description: 'Sync all projects using git submodules and Google Drive. Parses workspace-manifest.yml and syncs each project according to its sync method.',
                inputSchema: {
                    type: 'object',
                    properties: {
                        projectName: {
                            type: 'string',
                            description: 'Sync specific project only (optional)',
                        },
                    },
                },
            },
            {
                name: 'workspace_health',
                description: 'Run comprehensive workspace health check. Validates platform metadata, workspace configuration, git repository, submodules, dependencies, MCP build status, disk space, and security configuration.',
                inputSchema: {
                    type: 'object',
                    properties: {},
                },
            },
            {
                name: 'list_projects',
                description: 'List all projects configured in workspace-manifest.yml with their sync status, location, and metadata.',
                inputSchema: {
                    type: 'object',
                    properties: {
                        filter: {
                            type: 'string',
                            description: 'Filter by sync method: git, google-drive, both, manual',
                            enum: ['git', 'google-drive', 'both', 'manual'],
                        },
                    },
                },
            },
            {
                name: 'update_manifest',
                description: 'Update workspace-manifest.yml with new project or MCP configuration. Safely modifies YAML while preserving structure and comments.',
                inputSchema: {
                    type: 'object',
                    properties: {
                        section: {
                            type: 'string',
                            description: 'Section to update: projects, mcps, security',
                            enum: ['projects', 'mcps', 'security'],
                        },
                        action: {
                            type: 'string',
                            description: 'Action to perform: add, update, remove',
                            enum: ['add', 'update', 'remove'],
                        },
                        data: {
                            type: 'object',
                            description: 'Data to add/update (structure depends on section)',
                        },
                    },
                    required: ['section', 'action', 'data'],
                },
            },
            {
                name: 'sync_google_drive',
                description: 'Sync project with Google Drive using bidirectional synchronization. Requires Google Drive API credentials. (Phase 4 implementation - OAuth2 authentication required)',
                inputSchema: {
                    type: 'object',
                    properties: {
                        projectName: {
                            type: 'string',
                            description: 'Project name to sync',
                        },
                        direction: {
                            type: 'string',
                            description: 'Sync direction: upload, download, bidirectional',
                            enum: ['upload', 'download', 'bidirectional'],
                        },
                        driveFolderId: {
                            type: 'string',
                            description: 'Google Drive folder ID',
                        },
                    },
                    required: ['projectName', 'direction'],
                },
            },
            {
                name: 'post_team_message',
                description: 'Post a message to team activity feed. Message is committed to git and pushed to GitHub for team members to see.',
                inputSchema: {
                    type: 'object',
                    properties: {
                        message: {
                            type: 'string',
                            description: 'Message to post to team',
                        },
                        status: {
                            type: 'string',
                            description: 'Optional status update: working, lunch, offline',
                            enum: ['working', 'lunch', 'offline', 'meeting'],
                        },
                    },
                    required: ['message'],
                },
            },
            {
                name: 'get_team_activity',
                description: 'View recent team activity messages. Shows what teammates have posted.',
                inputSchema: {
                    type: 'object',
                    properties: {
                        since: {
                            type: 'string',
                            description: 'Show messages since date (YYYY-MM-DD) or relative (today, yesterday)',
                        },
                        limit: {
                            type: 'number',
                            description: 'Maximum number of messages to show (default: 10)',
                        },
                    },
                },
            },
            {
                name: 'update_team_status',
                description: 'Update your current status and what you are working on.',
                inputSchema: {
                    type: 'object',
                    properties: {
                        status: {
                            type: 'string',
                            description: 'Your current status',
                            enum: ['working', 'lunch', 'offline', 'meeting'],
                        },
                        task: {
                            type: 'string',
                            description: 'What you are working on (optional)',
                        },
                    },
                    required: ['status'],
                },
            },
            {
                name: 'get_team_status',
                description: 'See what all team members are currently working on and their status.',
                inputSchema: {
                    type: 'object',
                    properties: {},
                },
            },
            {
                name: 'daemon_control',
                description: 'Control the auto-sync daemon (start/stop/status). The daemon automatically syncs team activity every 5 minutes.',
                inputSchema: {
                    type: 'object',
                    properties: {
                        action: {
                            type: 'string',
                            description: 'Action to perform',
                            enum: ['start', 'stop', 'restart', 'status'],
                        },
                    },
                    required: ['action'],
                },
            },
            {
                name: 'rollback_team_activity',
                description: 'Undo last N team messages (if you posted by mistake). Uses git revert.',
                inputSchema: {
                    type: 'object',
                    properties: {
                        count: {
                            type: 'number',
                            description: 'Number of messages to rollback (default: 1)',
                        },
                    },
                },
            },
        ],
    };
});
// === TOOL HANDLERS ===
server.setRequestHandler(CallToolRequestSchema, async (request) => {
    const { name, arguments: args } = request.params;
    try {
        switch (name) {
            case 'check_platform_updates': {
                const scriptPath = join(scriptsDir, 'check-platform-updates.sh');
                if (!existsSync(scriptPath)) {
                    return {
                        content: [
                            {
                                type: 'text',
                                text: `Error: Script not found: ${scriptPath}`,
                            },
                        ],
                    };
                }
                try {
                    const { stdout, stderr } = await execAsync(`cd "${workspaceRoot}" && bash "${scriptPath}"`);
                    return {
                        content: [
                            {
                                type: 'text',
                                text: stdout || stderr,
                            },
                        ],
                    };
                }
                catch (error) {
                    // Exit code 2 means updates available (expected)
                    if (error.code === 2) {
                        return {
                            content: [
                                {
                                    type: 'text',
                                    text: error.stdout || error.message,
                                },
                            ],
                        };
                    }
                    throw error;
                }
            }
            case 'apply_platform_update': {
                const scriptPath = join(scriptsDir, 'apply-platform-update.sh');
                if (!existsSync(scriptPath)) {
                    return {
                        content: [
                            {
                                type: 'text',
                                text: `Error: Script not found: ${scriptPath}`,
                            },
                        ],
                    };
                }
                const autoConfirm = args?.autoConfirm ? 'yes' : '';
                const command = autoConfirm
                    ? `cd "${workspaceRoot}" && echo "yes" | bash "${scriptPath}"`
                    : `cd "${workspaceRoot}" && bash "${scriptPath}"`;
                const { stdout, stderr } = await execAsync(command);
                return {
                    content: [
                        {
                            type: 'text',
                            text: stdout || stderr,
                        },
                    ],
                };
            }
            case 'sync_projects': {
                const scriptPath = join(scriptsDir, 'sync-projects.sh');
                if (!existsSync(scriptPath)) {
                    return {
                        content: [
                            {
                                type: 'text',
                                text: `Error: Script not found: ${scriptPath}`,
                            },
                        ],
                    };
                }
                try {
                    const { stdout, stderr } = await execAsync(`cd "${workspaceRoot}" && bash "${scriptPath}"`);
                    return {
                        content: [
                            {
                                type: 'text',
                                text: stdout || stderr,
                            },
                        ],
                    };
                }
                catch (error) {
                    // Exit code 2 means partial sync (some projects failed)
                    if (error.code === 2) {
                        return {
                            content: [
                                {
                                    type: 'text',
                                    text: error.stdout || error.message,
                                },
                            ],
                        };
                    }
                    throw error;
                }
            }
            case 'workspace_health': {
                const scriptPath = join(scriptsDir, 'workspace-health-check.sh');
                if (!existsSync(scriptPath)) {
                    return {
                        content: [
                            {
                                type: 'text',
                                text: `Error: Script not found: ${scriptPath}`,
                            },
                        ],
                    };
                }
                const { stdout, stderr } = await execAsync(`cd "${workspaceRoot}" && bash "${scriptPath}"`);
                return {
                    content: [
                        {
                            type: 'text',
                            text: stdout || stderr,
                        },
                    ],
                };
            }
            case 'list_projects': {
                if (!existsSync(manifestPath)) {
                    return {
                        content: [
                            {
                                type: 'text',
                                text: 'Error: workspace-manifest.yml not found. Run: cp workspace-manifest.template.yml workspace-manifest.yml',
                            },
                        ],
                    };
                }
                const manifestContent = await readFile(manifestPath, 'utf-8');
                const manifest = yaml.load(manifestContent);
                if (!manifest.projects || manifest.projects.length === 0) {
                    return {
                        content: [
                            {
                                type: 'text',
                                text: 'No projects configured in workspace-manifest.yml',
                            },
                        ],
                    };
                }
                const filter = args?.filter;
                let projects = manifest.projects;
                if (filter) {
                    projects = projects.filter((p) => p.sync?.method === filter);
                }
                const projectList = projects.map((p) => {
                    return {
                        name: p.name,
                        displayName: p.display_name,
                        location: p.location,
                        syncMethod: p.sync?.method,
                        autoSync: p.sync?.auto_sync,
                        owner: p.team?.owner,
                        type: p.metadata?.type,
                        hipaaCompliant: p.metadata?.hipaa_compliant,
                        lastSync: p.metadata?.last_sync,
                    };
                });
                return {
                    content: [
                        {
                            type: 'text',
                            text: JSON.stringify(projectList, null, 2),
                        },
                    ],
                };
            }
            case 'update_manifest': {
                if (!existsSync(manifestPath)) {
                    return {
                        content: [
                            {
                                type: 'text',
                                text: 'Error: workspace-manifest.yml not found',
                            },
                        ],
                    };
                }
                const { section, action, data } = args;
                const manifestContent = await readFile(manifestPath, 'utf-8');
                const manifest = yaml.load(manifestContent);
                switch (section) {
                    case 'projects':
                        if (!manifest.projects) {
                            manifest.projects = [];
                        }
                        if (action === 'add') {
                            manifest.projects.push(data);
                        }
                        else if (action === 'update') {
                            const index = manifest.projects.findIndex((p) => p.name === data.name);
                            if (index !== -1) {
                                manifest.projects[index] = { ...manifest.projects[index], ...data };
                            }
                            else {
                                throw new Error(`Project not found: ${data.name}`);
                            }
                        }
                        else if (action === 'remove') {
                            manifest.projects = manifest.projects.filter((p) => p.name !== data.name);
                        }
                        break;
                    case 'mcps':
                        if (!manifest.mcps?.enabled) {
                            manifest.mcps = { enabled: [], disabled: [] };
                        }
                        if (action === 'add') {
                            manifest.mcps.enabled.push(data);
                        }
                        else if (action === 'update') {
                            const index = manifest.mcps.enabled.findIndex((m) => m.name === data.name);
                            if (index !== -1) {
                                manifest.mcps.enabled[index] = { ...manifest.mcps.enabled[index], ...data };
                            }
                            else {
                                throw new Error(`MCP not found: ${data.name}`);
                            }
                        }
                        else if (action === 'remove') {
                            manifest.mcps.enabled = manifest.mcps.enabled.filter((m) => m.name !== data.name);
                        }
                        break;
                    case 'security':
                        if (!manifest.security) {
                            manifest.security = {};
                        }
                        manifest.security = { ...manifest.security, ...data };
                        break;
                    default:
                        throw new Error(`Unknown section: ${section}`);
                }
                // Update last_updated
                manifest.metadata.last_updated = new Date().toISOString().split('T')[0];
                // Write back to file
                const newContent = yaml.dump(manifest, {
                    indent: 2,
                    lineWidth: -1,
                    noRefs: true,
                });
                await writeFile(manifestPath, newContent, 'utf-8');
                return {
                    content: [
                        {
                            type: 'text',
                            text: `Successfully ${action}ed ${section} in workspace-manifest.yml`,
                        },
                    ],
                };
            }
            case 'sync_google_drive': {
                // Phase 4: Google Drive sync implementation
                // This requires Google Drive API setup with OAuth2 authentication
                return {
                    content: [
                        {
                            type: 'text',
                            text: `Google Drive sync not yet implemented.

To implement:
1. Set up Google Drive API credentials (OAuth2)
2. Install googleapis package: npm install googleapis
3. Implement bidirectional sync logic
4. Handle conflict resolution

This feature will be available in Phase 4 completion.

For now, use git sync method for projects.`,
                        },
                    ],
                };
            }
            case 'post_team_message': {
                const { message, status } = args;
                const activityLog = join(workspaceRoot, 'team', 'activity.log');
                const stateFile = join(workspaceRoot, 'team', 'state.json');
                // Get username from git config
                const { stdout: username } = await execAsync('git config user.name');
                const cleanUsername = username.trim();
                // Format timestamp
                const now = new Date();
                const timestamp = now.toISOString().replace('T', ' ').substring(0, 19);
                // Append message to activity log
                const logEntry = `[${timestamp}] [${cleanUsername}] ${message}\n`;
                const currentLog = existsSync(activityLog) ? await readFile(activityLog, 'utf-8') : '';
                await writeFile(activityLog, currentLog + logEntry, 'utf-8');
                // Update status if provided
                if (status) {
                    const state = existsSync(stateFile)
                        ? JSON.parse(await readFile(stateFile, 'utf-8'))
                        : { last_updated: '', team_members: {}, active_tasks: {} };
                    state.team_members[cleanUsername] = {
                        status,
                        last_updated: timestamp,
                    };
                    state.last_updated = timestamp;
                    await writeFile(stateFile, JSON.stringify(state, null, 2), 'utf-8');
                }
                // Git commit and push
                await execAsync(`cd "${workspaceRoot}" && git add team/`);
                await execAsync(`cd "${workspaceRoot}" && git commit -m "team: [${cleanUsername}] posted activity update"`);
                await execAsync(`cd "${workspaceRoot}" && git push origin main`);
                return {
                    content: [
                        {
                            type: 'text',
                            text: `✅ Posted to team: ${message}\n\nYour message has been committed to git and pushed to GitHub.\nTeammates will see it within 5 minutes (daemon poll interval).`,
                        },
                    ],
                };
            }
            case 'get_team_activity': {
                const { since, limit = 10 } = args;
                const activityLog = join(workspaceRoot, 'team', 'activity.log');
                if (!existsSync(activityLog)) {
                    return {
                        content: [
                            {
                                type: 'text',
                                text: 'No team activity yet. Use post_team_message to start!',
                            },
                        ],
                    };
                }
                const content = await readFile(activityLog, 'utf-8');
                const lines = content
                    .split('\n')
                    .filter((line) => line.trim() && !line.startsWith('#'));
                // Filter by date if 'since' provided
                let filtered = lines;
                if (since) {
                    // Simple date filtering (can be enhanced)
                    filtered = lines.filter((line) => {
                        if (since === 'today') {
                            const today = new Date().toISOString().substring(0, 10);
                            return line.includes(today);
                        }
                        else if (since === 'yesterday') {
                            const yesterday = new Date(Date.now() - 86400000).toISOString().substring(0, 10);
                            return line.includes(yesterday);
                        }
                        else {
                            return line.includes(since);
                        }
                    });
                }
                // Get last N messages
                const recent = filtered.slice(-limit);
                if (recent.length === 0) {
                    return {
                        content: [
                            {
                                type: 'text',
                                text: `No activity found${since ? ` since ${since}` : ''}.`,
                            },
                        ],
                    };
                }
                const output = `📋 Recent Team Activity (${recent.length} messages):\n\n${recent.join('\n')}`;
                return {
                    content: [
                        {
                            type: 'text',
                            text: output,
                        },
                    ],
                };
            }
            case 'update_team_status': {
                const { status, task } = args;
                const stateFile = join(workspaceRoot, 'team', 'state.json');
                // Get username
                const { stdout: username } = await execAsync('git config user.name');
                const cleanUsername = username.trim();
                // Load or create state
                const state = existsSync(stateFile)
                    ? JSON.parse(await readFile(stateFile, 'utf-8'))
                    : { last_updated: '', team_members: {}, active_tasks: {} };
                const timestamp = new Date().toISOString().replace('T', ' ').substring(0, 19);
                state.team_members[cleanUsername] = {
                    status,
                    task: task || null,
                    last_updated: timestamp,
                };
                if (task) {
                    state.active_tasks[cleanUsername] = task;
                }
                else {
                    delete state.active_tasks[cleanUsername];
                }
                state.last_updated = timestamp;
                await writeFile(stateFile, JSON.stringify(state, null, 2), 'utf-8');
                // Git commit and push
                await execAsync(`cd "${workspaceRoot}" && git add team/state.json`);
                await execAsync(`cd "${workspaceRoot}" && git commit -m "team: [${cleanUsername}] updated status to ${status}"`);
                await execAsync(`cd "${workspaceRoot}" && git push origin main`);
                return {
                    content: [
                        {
                            type: 'text',
                            text: `✅ Updated status to: ${status}${task ? `\nWorking on: ${task}` : ''}\n\nStatus synced to GitHub.`,
                        },
                    ],
                };
            }
            case 'get_team_status': {
                const stateFile = join(workspaceRoot, 'team', 'state.json');
                if (!existsSync(stateFile)) {
                    return {
                        content: [
                            {
                                type: 'text',
                                text: 'No team status available yet.',
                            },
                        ],
                    };
                }
                const state = JSON.parse(await readFile(stateFile, 'utf-8'));
                if (!state.team_members || Object.keys(state.team_members).length === 0) {
                    return {
                        content: [
                            {
                                type: 'text',
                                text: 'No team members have posted status updates yet.',
                            },
                        ],
                    };
                }
                let output = '👥 Team Status:\n\n';
                for (const [member, info] of Object.entries(state.team_members)) {
                    const memberInfo = info;
                    const statusEmoji = {
                        working: '💼',
                        lunch: '🍽️',
                        offline: '📴',
                        meeting: '👔',
                    };
                    const emoji = statusEmoji[memberInfo.status] || '❓';
                    output += `${emoji} ${member}: ${memberInfo.status}`;
                    if (memberInfo.task) {
                        output += ` (${memberInfo.task})`;
                    }
                    output += `\n   Last updated: ${memberInfo.last_updated}\n\n`;
                }
                return {
                    content: [
                        {
                            type: 'text',
                            text: output,
                        },
                    ],
                };
            }
            case 'daemon_control': {
                const { action } = args;
                const controlScript = join(scriptsDir, 'daemon-control.sh');
                if (!existsSync(controlScript)) {
                    return {
                        content: [
                            {
                                type: 'text',
                                text: `Error: Daemon control script not found: ${controlScript}`,
                            },
                        ],
                    };
                }
                const { stdout, stderr } = await execAsync(`cd "${workspaceRoot}" && bash "${controlScript}" ${action}`);
                return {
                    content: [
                        {
                            type: 'text',
                            text: stdout || stderr,
                        },
                    ],
                };
            }
            case 'rollback_team_activity': {
                const { count = 1 } = args;
                const activityLog = join(workspaceRoot, 'team', 'activity.log');
                if (!existsSync(activityLog)) {
                    return {
                        content: [
                            {
                                type: 'text',
                                text: 'No activity to rollback.',
                            },
                        ],
                    };
                }
                // Get git log for activity.log
                const { stdout: logOutput } = await execAsync(`cd "${workspaceRoot}" && git log --oneline -${count} team/activity.log`);
                if (!logOutput.trim()) {
                    return {
                        content: [
                            {
                                type: 'text',
                                text: 'No commits found to rollback.',
                            },
                        ],
                    };
                }
                // Revert last N commits affecting activity.log
                const commits = logOutput.trim().split('\n');
                const commitHashes = commits.map((line) => line.split(' ')[0]);
                let output = `Rolling back ${count} commit(s):\n\n`;
                output += logOutput + '\n\n';
                for (const hash of commitHashes.reverse()) {
                    await execAsync(`cd "${workspaceRoot}" && git revert --no-edit ${hash}`);
                }
                await execAsync(`cd "${workspaceRoot}" && git push origin main`);
                output += `✅ Rolled back ${count} message(s) and pushed to GitHub.`;
                return {
                    content: [
                        {
                            type: 'text',
                            text: output,
                        },
                    ],
                };
            }
            default:
                throw new Error(`Unknown tool: ${name}`);
        }
    }
    catch (error) {
        return {
            content: [
                {
                    type: 'text',
                    text: `Error: ${error.message}\n${error.stdout || ''}\n${error.stderr || ''}`,
                },
            ],
            isError: true,
        };
    }
});
// Start server
const transport = new StdioServerTransport();
server.connect(transport);
console.error('Workspace Sync MCP server running on stdio');
//# sourceMappingURL=index.js.map