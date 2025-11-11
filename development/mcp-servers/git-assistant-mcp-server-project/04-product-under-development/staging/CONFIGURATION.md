---
type: reference
phase: stable
project: git-assistant-mcp-server
tags: [MCP, automation, configuration, git-assistant, mcp-server]
category: mcp-servers
status: completed
priority: medium
---

# Git Assistant MCP Server - Configuration Guide

## Quick Setup for Claude Code

### Step 1: Build the Server

```bash
cd /Users/mmaruthurnew/Desktop/Google\ Sheets\ Automation\ Projects/user-story-generation/reusable-tools/git-assistant-mcp-server
npm install
npm run build
```

### Step 2: Configure Claude Code

Add to your Claude Code MCP configuration file (`~/.config/claude-code/mcp.json` or workspace `.mcp.json`):

```json
{
  "mcpServers": {
    "git-assistant": {
      "command": "node",
      "args": [
        "/Users/mmaruthurnew/Desktop/Google Sheets Automation Projects/user-story-generation/reusable-tools/git-assistant-mcp-server/dist/server.js"
      ],
      "env": {
        "GIT_ASSISTANT_REPO_PATH": "${workspaceFolder}",
        "GIT_ASSISTANT_DEBUG": "false"
      }
    }
  }
}
```

### Step 3: Restart Claude Code

After adding the configuration, restart Claude Code to load the Git Assistant MCP server.

### Step 4: Test the Server

Try these commands in Claude Code:

```
You: "Should I commit now?"
Claude: [Uses check_commit_readiness tool]

You: "Suggest a commit message"
Claude: [Uses suggest_commit_message tool]

You: "Analyze my commit history"
Claude: [Uses analyze_commit_history tool]
```

## Available Features

### Resources (Read-Only Data)
- `git://status` - Current repository status
- `git://recent-commits` - Last 10 commits
- `git://diff-summary` - Changes since last commit
- `git://learned-patterns` - View learned patterns

### Tools (Actions)
1. **check_commit_readiness** - Analyze if now is good time to commit
2. **suggest_commit_message** - Generate meaningful commit message
3. **show_git_guidance** - Get educational guidance on git workflows
4. **analyze_commit_history** - Analyze your commit patterns
5. **add_learned_pattern** - Teach server a new pattern
6. **list_learned_patterns** - View all learned patterns
7. **remove_learned_pattern** - Remove a learned pattern

## Learning Features

The Git Assistant learns from your behavior and adapts suggestions over time:

- **Commit frequency patterns** - Learns when you typically commit
- **File count preferences** - Adapts to your typical commit size
- **Message style** - Matches your commit message format
- **Pattern storage** - Saves preferences in `.git-assistant-preferences.json`

## Environment Variables

| Variable | Description | Default |
|----------|-------------|---------|
| `GIT_ASSISTANT_REPO_PATH` | Path to git repository | Current working directory |
| `GIT_ASSISTANT_DEBUG` | Enable debug logging | `false` |
| `GIT_ASSISTANT_MAX_FILES` | Max files before warning | `7` |
| `GIT_ASSISTANT_MAX_LINES` | Max line changes before warning | `200` |

## Troubleshooting

### Server Not Appearing in Claude Code
1. Check configuration path is absolute (not relative)
2. Verify `dist/server.js` exists
3. Restart Claude Code
4. Check Claude Code logs

### "Not a git repository" Error
- Ensure you're in a valid git repository
- Check `GIT_ASSISTANT_REPO_PATH` points to repo root

### TypeScript Build Errors
```bash
npm run clean
npm install
npm run build
```

## Next Steps

1. **Test in your repository** - Try the commit readiness check
2. **Generate commit messages** - Let AI suggest messages
3. **Teach patterns** - Add learned patterns for your workflow
4. **Review guidance** - Explore git best practices

Would you like me to remember this pattern?
