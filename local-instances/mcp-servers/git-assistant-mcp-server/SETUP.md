---
type: guide
phase: stable
project: git-assistant-mcp-server
tags: [MCP, git-assistant, installation, mcp-server]
category: mcp-servers
status: completed
priority: high
---

# Git Assistant MCP Server - Setup Instructions FOR AI

**Claude/AI:** Read this file when the user says "set up git assistant" or similar.

---

## Your Task

Set up the Git Assistant MCP server in this project. This server provides intelligent version control assistance for AI-assisted development.

---

## Step 1: Understand Context

**Check these things first:**

1. **What's the project root?**
   - Where is the user's main project? (usually 3 levels up from this server)
   - Store as: `PROJECT_ROOT`
   - Verify: `ls $PROJECT_ROOT` should show project files

2. **Server name:** Always use `git-assistant` (fixed, don't ask)

3. **Get server directory:**
   - Store current directory as: `SERVER_DIR`
   - This should be: `.../git-assistant-mcp-server/`

---

## Step 2: Copy Learning Engine from Framework

**IMPORTANT:** Use the latest learning engine from the framework.

```bash
# Find framework (should be in same parent as reusable-tools)
FRAMEWORK_DIR="$PROJECT_ROOT/frameworks/MCP-Servers-Framework"

# Copy latest learning engine
cp "$FRAMEWORK_DIR/shared-libraries/learning-engine.ts" src/

# Verify it copied
ls -la src/learning-engine.ts
```

**If framework not found:**
- Learning engine already exists in src/ - that's OK
- Just use the existing one
- Note in log: "Using bundled learning engine (framework not found)"

---

## Step 3: Install Dependencies

```bash
cd "$SERVER_DIR"
npm install
```

**If this fails:**
- Check Node.js installed: `node --version` (need 18+)
- Try: `rm -rf node_modules/ package-lock.json && npm install`
- Log issue in INSTALLATION_LOG.md

---

## Step 4: Build TypeScript

```bash
npm run build
```

**Verify:**
- Check `dist/server.js` exists: `ls dist/server.js`
- If error: Show user the error message and log it

---

## Step 5: Get Absolute Path

```bash
# Get absolute server path
SERVER_PATH="$(cd "$SERVER_DIR" && pwd)/dist/server.js"
echo "Server path: $SERVER_PATH"
```

Store this as: `SERVER_PATH`

---

## Step 6: Configure Claude Code

**Create or update `.mcp.json` in PROJECT_ROOT:**

If `.mcp.json` doesn't exist, create it:
```json
{
  "mcpServers": {
    "git-assistant": {
      "command": "node",
      "args": ["${SERVER_PATH}"],
      "env": {
        "GIT_ASSISTANT_REPO_PATH": "${PROJECT_ROOT}"
      }
    }
  }
}
```

If `.mcp.json` exists, add to `mcpServers` object:
```json
"git-assistant": {
  "command": "node",
  "args": ["${SERVER_PATH}"],
  "env": {
    "GIT_ASSISTANT_REPO_PATH": "${PROJECT_ROOT}"
  }
}
```

**CRITICAL:**
- Use **absolute path** for `SERVER_PATH` (starts with `/`)
- `.mcp.json` goes in **PROJECT_ROOT**, not in server directory!
- Double-check: `cat $PROJECT_ROOT/.mcp.json | jq .`

---

## Step 7: Copy Agent File

**Copy the pre-configured agent file:**

```bash
# Create agents directory if needed
mkdir -p "$PROJECT_ROOT/.claude/agents/"

# Copy agent file
cp "$SERVER_DIR/agent/git-assistant.md" "$PROJECT_ROOT/.claude/agents/git-assistant.md"

# Verify
ls -la "$PROJECT_ROOT/.claude/agents/git-assistant.md"
```

**If agent/ directory doesn't exist:**
- Check for agent file in server root
- Or create basic agent file (see fallback below)

**Fallback agent file:**
```markdown
---
name: git-assistant
description: Analyzes git status and suggests optimal commit timing and messages
tools: mcp__git-assistant__check_commit_readiness, mcp__git-assistant__suggest_commit_message, mcp__git-assistant__show_git_guidance, mcp__git-assistant__analyze_commit_history
---

You are the Git Assistant agent. Your role is to help with version control by analyzing repository state and suggesting when and how to commit changes.

Check git status, suggest commit readiness, and generate meaningful commit messages.
```

---

## Step 8: Test Server

```bash
# Test server starts without error
node "$SERVER_PATH" 2>&1 | head -1
```

**Expected output:**
```
Git Assistant MCP Server running on stdio
```

**If error:**
- Show user the error
- Check TypeScript compiled correctly
- Verify imports work
- Log error in INSTALLATION_LOG.md

---

## Step 9: Update Installation Log

**IMPORTANT:** Update INSTALLATION_LOG.md before telling user.

1. Read current INSTALLATION_LOG.md
2. Add new installation entry:
   ```markdown
   ### Installation N: git-assistant

   **Date:** [today's date]
   **Project:** ${PROJECT_ROOT}
   **Issues Encountered:** [list any issues, or "None"]
   **Solutions Applied:** [how you fixed them, or "N/A"]
   **Time Taken:** [estimate]
   **Notes:** [any observations]
   ```

3. If you encountered ANY issues:
   - Check if issue already in "Common Installation Issues"
   - If yes: increment "Times Encountered" counter
   - If no: add new issue with full details

4. Update statistics at bottom of log

---

## Step 10: Tell User Next Steps

**Show this message:**

```
✅ Git Assistant MCP Server setup complete!

**What was created:**
- MCP server: ${SERVER_PATH}
- Configuration: ${PROJECT_ROOT}/.mcp.json
- Agent file: ${PROJECT_ROOT}/.claude/agents/git-assistant.md
- Patterns file: ${PROJECT_ROOT}/.git-assistant-patterns.json (created on first use)

**To use:**
1. Restart Claude Code (fully quit and reopen - important!)
2. Say "git assistant" in chat to activate
3. I'll analyze your git status and suggest when to commit

**What I can do:**
- Check if now is a good time to commit
- Suggest meaningful commit messages
- Provide git best practices guidance
- Analyze your commit history patterns
- Learn your commit preferences

**Example:**
Say: "git assistant" or "should I commit now?"
```

---

## Step 11: Wait for User Feedback

**After showing success message:**

1. **If user says it works:** Great! Proactively check git status.

2. **If user says restart didn't help:**
   - **First:** Check INSTALLATION_LOG.md for similar issues
   - Check `.mcp.json` syntax: `cat $PROJECT_ROOT/.mcp.json | jq .`
   - Verify path is absolute: `echo $SERVER_PATH`
   - Check Claude Code logs: `tail ~/.config/claude-code/logs/main.log`
   - **If new issue:** Add to INSTALLATION_LOG.md after resolving

3. **If user wants to test:**
   - Proactively run: "Let me check your git status"
   - Use check_commit_readiness tool
   - Suggest commit message if appropriate

---

## Common Issues You Might Encounter

### ".git-assistant-patterns.json permission denied"
**Solution:**
```bash
# Check project root is writable
touch "$PROJECT_ROOT/.git-assistant-patterns.json"
chmod 644 "$PROJECT_ROOT/.git-assistant-patterns.json"
```

### "Server not appearing in Claude Code"
**Solutions:**
1. Verify `.mcp.json` is in PROJECT_ROOT (not in server directory!)
2. Check path is absolute: `echo $SERVER_PATH` (should start with `/`)
3. Verify server.js exists: `ls $SERVER_PATH`
4. Test server runs: `node $SERVER_PATH`
5. Ensure user **restarted** Claude Code (not just reloaded)

### "Module '@modelcontextprotocol/sdk' not found"
**Solution:**
```bash
cd "$SERVER_DIR"
rm -rf node_modules/ package-lock.json
npm install
npm run build
```

### "simple-git module not found"
**Solution:**
```bash
cd "$SERVER_DIR"
npm install simple-git
npm run build
```

---

## Git Assistant Specific Features

**What makes this server special:**
- **Intelligent timing:** Analyzes code changes to suggest optimal commit times
- **Smart messages:** Generates meaningful commit messages from actual diffs
- **Learning capability:** Learns your commit style over time
- **Educational:** Provides git best practices guidance

**Pattern storage:**
- File: `$PROJECT_ROOT/.git-assistant-patterns.json`
- Contains: Commit preferences, style patterns, metadata
- Shared: Can be committed to git for team use

**Tools available:**
- `check_commit_readiness` - Analyze if now is good time to commit
- `suggest_commit_message` - Generate commit message from changes
- `show_git_guidance` - Get git best practices
- `analyze_commit_history` - Analyze your commit patterns
- `add_learned_pattern` - Teach new pattern
- `list_learned_patterns` - View all patterns
- `remove_learned_pattern` - Remove pattern

---

## Your Communication Style

- **Be proactive:** Offer to check git status before commits
- **Be clear:** Explain why you're suggesting a commit or not
- **Get approval:** Never commit without asking
- **Learn:** Always ask if user wants to remember preferences
- **Be helpful:** Explain git concepts if user is confused

---

## After First Use

**Remind user:**
- Patterns are saved in `.git-assistant-patterns.json`
- Can view patterns: "list git patterns"
- Can teach patterns: "remember to always use conventional commits"
- Gets smarter over time: "The more commits you make, the better I understand your style!"

---

**You've got this!** Git Assistant is production-ready and battle-tested.
