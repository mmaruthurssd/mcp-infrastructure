---
type: readme
phase: stable
project: git-assistant-mcp-server
tags: [MCP, automation, configuration, deployment, git-assistant, mcp-server]
category: mcp-servers
status: completed
priority: high
---

# Git Assistant MCP Server

**Status:** V1.0 - Production Ready
**Created:** 2025-10-11
**Last Updated:** 2025-10-12

## Quick Start

```bash
# Install dependencies
cd git-assistant-mcp-server/
npm install

# Build TypeScript
npm run build

# Configure Claude Code (add to ~/.config/claude-code/mcp-servers.json)
# See Configuration section below

# Start server (for testing)
node dist/server.js
```

## What It Does

Git Assistant MCP Server is an intelligent version control assistant that monitors your development activity and provides contextual guidance for git best practices. It helps developers understand when to commit, generates meaningful commit messages, and teaches git workflows through interactive guidance. Perfect for AI-assisted development workflows in Claude Code.

## Prerequisites

- Node.js >= 18.0.0
- npm >= 8.0.0
- Git installed and configured
- Claude Code (or any MCP-compatible client)
- TypeScript knowledge (for development/customization)

## Installation

### Auto-Install Setup (Recommended)

The server includes an automatic setup script that:
- ✅ Copies the agent file to `.claude/agents/git-assistant.md`
- ✅ Updates your `.mcp.json` configuration
- ✅ Makes the server ready to use immediately

```bash
# Navigate to server directory
cd git-assistant-mcp-server/

# Install, build, and set up
npm install
npm run build
npm run setup
```

The setup script will:
1. Create `.claude/agents/` directory if it doesn't exist
2. Copy the pre-configured agent file
3. Update `.mcp.json` with the correct paths
4. Show you how to invoke the agent

After setup, just say **"git assistant"** in Claude Code!

### Manual Installation (Alternative)

If you prefer manual setup or the auto-install doesn't work:

```bash
# Clone or navigate to tool directory
cd "Reusable Tools/git-assistant-mcp-server/"

# Install dependencies
npm install

# Build TypeScript
npm run build

# Verify build
ls dist/  # Should see server.js and other compiled files
```

Then copy the agent file manually - see "Manual Agent Setup" section below.

## Configuration

**Recommended: User Scope (Global Configuration)**

Add the server to user scope so it's available across all projects:

```bash
claude mcp add --scope user --transport stdio git-assistant -- node /absolute/path/to/local-instances/mcp-servers/git-assistant-mcp-server/dist/server.js
```

**Alternative: Project Scope (`.mcp.json`)**

For project-specific configuration:

```json
{
  "mcpServers": {
    "git-assistant": {
      "command": "node",
      "args": [
        "/absolute/path/to/local-instances/mcp-servers/git-assistant-mcp-server/dist/server.js"
      ],
      "env": {
        "GIT_ASSISTANT_REPO_PATH": "${workspaceFolder}",
        "GIT_ASSISTANT_DEBUG": "false"
      }
    }
  }
}
```

**Environment Variables:**

| Variable | Description | Default | Required |
|----------|-------------|---------|----------|
| `GIT_ASSISTANT_REPO_PATH` | Path to git repository | Current working directory | No |
| `GIT_ASSISTANT_DEBUG` | Enable debug logging | `false` | No |
| `GIT_ASSISTANT_MAX_FILES` | Max files before warning | `7` | No |
| `GIT_ASSISTANT_MAX_LINES` | Max line changes before warning | `200` | No |

## Manual Agent Setup

If you didn't use the auto-install, copy this to `.claude/agents/git-assistant.md`:

```markdown
---
name: git-assistant
description: Analyzes git status and suggests optimal commit timing and messages
tools: mcp__git-assistant__check_commit_readiness, mcp__git-assistant__suggest_commit_message, mcp__git-assistant__show_git_guidance, mcp__git-assistant__analyze_commit_history
---

You are the Git Assistant agent. Your role is to help maintain a clean git history by suggesting when to commit and generating meaningful commit messages.

## Your Capabilities

You have access to the Git Assistant MCP server with these tools:
- `check_commit_readiness` - Analyze if it's a good time to commit
- `suggest_commit_message` - Generate a meaningful commit message
- `show_git_guidance` - Provide git workflow guidance
- `analyze_commit_history` - Analyze commit patterns

## Your Workflow

1. **Check commit readiness:**
   - Use `check_commit_readiness` to analyze current git status
   - Consider: number of changes, time since last commit, coherence of changes

2. **Provide assessment:**
   - Tell the user if it's a good time to commit
   - Explain your reasoning (e.g., "logical stopping point", "too many unrelated changes")

3. **Suggest commit message:**
   - If ready to commit, use `suggest_commit_message`
   - Generate conventional commit format: `type: description`
   - Types: feat, fix, refactor, docs, test, chore

4. **Offer guidance:**
   - If user is unsure about git workflow, use `show_git_guidance`
   - Provide best practices and tips

5. **Learn patterns:**
   - Analyze commit history to understand user's commit frequency
   - Adapt suggestions to user's workflow

## Communication Style

- Be helpful but not demanding
- Explain the reasoning behind commit suggestions
- Offer alternatives when appropriate
- Teach git best practices when relevant

## Example Interaction

"I've analyzed your git status:

**Current state:**
- 2,184 staged changes
- 2,227 unstaged changes
- Last commit: unknown

**Assessment:**
This seems like a significant refactoring or reorganization. With 4,000+ changes, it might be worth breaking this into smaller commits for better history.

**Recommendation:**
1. Review what's currently staged
2. Commit related changes together (e.g., framework setup, documentation, slash commands)
3. Stage and commit remaining changes in logical groups

Would you like me to suggest a commit message for the currently staged changes?"
```

## Usage

### Basic Usage

Once configured, use within Claude Code:

```
You: "Should I commit now?"
Claude: (calls check_commit_readiness tool)
        "✅ Good time to commit - changes are focused and include tests.

        Reasons:
        - 3 related files changed
        - 127 lines added (moderate size)
        - Test coverage included
        - 45 minutes since last commit"
```

### Advanced Usage

**1. Generate Commit Messages:**
```
You: "Suggest a commit message for my changes"
Claude: (calls suggest_commit_message tool)
        "feat: add employee deduplication check

        Implemented validation to prevent duplicate employees
        when the same person is added twice. Checks email
        uniqueness and returns helpful error with existing ID."
```

**2. Get Git Guidance:**
```
You: "How should I write good commit messages?"
Claude: (calls show_git_guidance tool with topic='commit-messages')
        [Returns comprehensive guidance on commit message best practices]
```

**3. Analyze Your Commit History:**
```
You: "Analyze my commit patterns"
Claude: (calls analyze_commit_history tool)
        "Analysis: You commit every 2.1 hours on average with 3.2 files
        per commit. 68% of commits have subject line only - consider
        adding more body text to explain 'why' for complex changes."
```

**4. Learn Your Patterns (V2.0):**
```
You: "Learn my coding patterns"
Claude: (calls learn_patterns tool)
        "I've detected that you:
        - Create PLAN.md before implementation
        - Group changes by phase
        - Create reusable tools in separate folders

        I'll adapt my suggestions to match your workflow!"
```

### Examples

**Example 1: Check Commit Readiness**
```
You: "Check if I should commit"
Claude: Uses git://status resource + check_commit_readiness tool
Output: Analysis of repository state with recommendation
```

**Example 2: View Recent Commits**
```
You: "Show my recent commits"
Claude: Uses git://recent-commits resource
Output: Last 10 commits with details
```

**Example 3: Get Diff Summary**
```
You: "What changed since last commit?"
Claude: Uses git://diff-summary resource
Output: File-by-file breakdown of changes
```

## Resources & Tools

### Resources (Read-Only Data)

| Resource | Description |
|----------|-------------|
| `git://status` | Current git repository status (staged, unstaged, untracked files) |
| `git://recent-commits` | Last 10 commits in current branch |
| `git://diff-summary` | Summary of changes since last commit |

### Tools (Actions)

| Tool | Description |
|------|-------------|
| `check_commit_readiness` | Analyze if now is a good time to commit |
| `suggest_commit_message` | Generate meaningful commit message based on changes |
| `show_git_guidance` | Provide educational guidance on git workflows |
| `analyze_commit_history` | Analyze user's commit patterns and provide insights |
| `learn_patterns` (V2.0) | Learn and adapt to individual developer workflows |

## Output

The Git Assistant MCP Server produces:

- **Commit readiness analysis** - Confidence score, reasons, warnings, next steps
- **Commit messages** - Subject line + body in conventional commit format
- **Git guidance** - Educational content on best practices
- **Pattern analysis** - Insights into your commit behavior
- **Personalized suggestions** - Adapted to your workflow (V2.0)

All output is returned as JSON via MCP protocol for consumption by Claude Code.

## Troubleshooting

### Common Issue 1
**Problem:** "Not a git repository" error
**Solution:** Ensure you're running commands from within a git repository. Check `GIT_ASSISTANT_REPO_PATH` environment variable points to valid git repo.

### Common Issue 2
**Problem:** MCP server not appearing in Claude Code
**Solution:**
1. Verify `mcp-servers.json` path is correct
2. Use absolute path (not relative) for server.js
3. Restart Claude Code after configuration changes
4. Check Claude Code logs: `tail -f ~/.config/claude-code/logs/main.log`

### Common Issue 3
**Problem:** "simple-git error" or git commands failing
**Solution:**
1. Verify git is installed: `git --version`
2. Ensure repository has at least one commit
3. Check git is initialized: `ls -la .git/`

### Common Issue 4
**Problem:** TypeScript build errors
**Solution:**
```bash
# Clean and rebuild
rm -rf dist/ node_modules/
npm install
npm run build
```

### Common Issue 5
**Problem:** Commit message suggestions are generic
**Solution:**
- Ensure you have recent commit history (server learns from it)
- Make sure changes have meaningful diff (not just whitespace)
- Use V2.0 `learn_patterns` tool to improve personalization

## Related Tools

- [clasp-authenticator](../clasp-authenticator/) - Authenticate with Apps Script CLI (useful if using git for Apps Script projects)
- [apps-script-cloner](../apps-script-cloner/) - Clone Apps Script projects to git repositories
- [business-validation-testing](../business-validation-testing/) - Testing toolkit that benefits from good git practices

## Use Cases

- **AI-assisted development:** Claude Code users who want version control guidance while coding
- **Git beginners:** Developers learning git best practices with interactive coaching
- **Team standardization:** Enforce consistent commit practices across development team
- **Commit message quality:** Automatically generate meaningful, conventional commit messages
- **Workflow optimization:** Analyze and improve your commit patterns over time
- **Pattern learning:** Adapt to individual developer workflows and project structures (V2.0)

## Development

### Project Structure

```
git-assistant-mcp-server/
├── README.md                 # This file
├── PLAN.md                   # Detailed implementation plan
├── package.json              # Dependencies and scripts
├── tsconfig.json             # TypeScript configuration
├── src/
│   ├── server.ts            # MCP server initialization
│   ├── git.ts               # Git command wrappers
│   ├── heuristics.ts        # Commit readiness heuristics
│   ├── message-generator.ts # Commit message generation
│   └── patterns.ts          # Pattern learning (V2.0)
├── tests/
│   ├── git.test.ts          # Unit tests
│   └── integration.test.ts  # Integration tests
└── dist/                     # Compiled JavaScript (generated)
```

### Running Tests

```bash
# Run all tests
npm test

# Run with coverage
npm run test:coverage

# Run specific test
npm test -- heuristics.test.ts
```

### Building

```bash
# Development build (with watch mode)
npm run dev

# Production build
npm run build

# Clean build
npm run clean && npm run build
```

## Changelog

### v1.0.0 (2025-10-12) ✅
- ✅ Complete V1.0 feature set implemented
- ✅ All 4 resources functional (status, recent-commits, diff-summary, learned-patterns)
- ✅ All 7 tools functional (check_commit_readiness, suggest_commit_message, show_git_guidance, analyze_commit_history, add_learned_pattern, list_learned_patterns, remove_learned_pattern)
- ✅ Continuous learning engine integrated
- ✅ Heuristics engine with personalized preferences
- ✅ Message generator with conventional commit format
- ✅ TypeScript implementation with full type safety
- ✅ Production-ready deployment

### v2.0.0 (Planned - Future)
- Advanced pattern learning with condition evaluation
- Project type detection
- Repository initialization suggestions
- Team-wide pattern sharing

### v0.3.0 (Planned - Week 3)
- Message generator tool
- Git guidance tool
- Commit history analysis

### v0.2.0 (Planned - Week 2)
- Commit readiness heuristics
- Intelligent timing suggestions

### v0.1.0 (Planned - Week 1)
- Basic MCP server structure
- Git resources (status, commits, diff)
- Initial tool scaffolding

## Implementation Timeline

**V1.0:** 4 weeks (part-time)
- Week 1: Foundation + Resources
- Week 2: Commit Readiness Tool
- Week 3: Message Generator + Guidance
- Week 4: Polish + Deploy

**V2.0:** +1-2 weeks (pattern learning)

See [PLAN.md](./PLAN.md) for detailed implementation plan.

## Technical Details

**Dependencies:**
- `@modelcontextprotocol/sdk` ^1.0.0 - MCP protocol implementation
- `simple-git` ^3.21.0 - Git command wrapper

**Dev Dependencies:**
- `typescript` ^5.3.0
- `vitest` ^1.0.0
- `@types/node` ^20.0.0

**Transport:** stdio (standard input/output for Claude Code integration)

**Language:** TypeScript

**Tested on:** macOS, Linux (Windows support planned)

## Security & Privacy

- ✅ All git operations are read-only (except when user explicitly requests commit)
- ✅ No data sent to external servers
- ✅ Runs locally on your machine
- ✅ No API keys or credentials required
- ✅ Pattern learning data stored locally (`.git-assistant-preferences.json`)

## Contributing

When extending this tool:

1. **Maintain pattern learning** - Ensure new features work with personalization
2. **Update heuristics** - Document any new commit readiness rules
3. **Add tests** - All new features must have unit tests (>80% coverage)
4. **Update documentation** - Keep README and PLAN.md current
5. **Follow conventions** - Use conventional commit format for your own commits!

## Resources

- [MCP Protocol Specification](https://spec.modelcontextprotocol.io/)
- [Git Best Practices](https://chris.beams.io/posts/git-commit/)
- [Conventional Commits](https://www.conventionalcommits.org/)
- [simple-git Documentation](https://github.com/steveukx/git-js)

---

**Status:** V1.0 implementation complete! All core features functional. See [PLAN.md](./PLAN.md) for detailed implementation details and future roadmap.
