---
type: guide
phase: stable
project: git-assistant-mcp-server
tags: [MCP, git-assistant, installation, mcp-server]
category: mcp-servers
status: completed
priority: high
---

# Git Assistant Installation Log & Lessons Learned

**Purpose:** Track installation issues and solutions across different projects

**For AI:** After completing setup, update this log with any issues encountered and solutions applied.

---

## Common Installation Issues

### Issue 1: `.mcp.json` in Wrong Location

**Problem:** `.mcp.json` created in server directory instead of project root

**Symptoms:**
- Server doesn't appear in Claude Code
- No error messages
- Build succeeds but server not found

**Root Cause:**
- Confusion about where PROJECT_ROOT is
- Should be 3 levels up from server directory

**Solution:**
```bash
# PROJECT_ROOT is where your actual project files are
# NOT where the git-assistant-mcp-server folder is

# Correct:
/Users/you/my-project/.mcp.json

# Wrong:
/Users/you/my-project/reusable-tools/mcp-servers/git-assistant-mcp-server/.mcp.json
```

**Prevention:**
- Always use `$(cd ../../../ && pwd)` to find project root
- Verify with `ls $PROJECT_ROOT` showing project files

**Times Encountered:** 0
**Last Seen:** Never
**Status:** Documented preventatively

---

### Issue 2: `.git-assistant-patterns.json` Permission Denied

**Problem:** Server can't create/write patterns file

**Symptoms:**
```
Error: EACCES: permission denied, open '.git-assistant-patterns.json'
```

**Root Cause:**
- Project root not writable
- File created with wrong permissions
- Directory permissions issue

**Solution:**
```bash
# Fix permissions
cd $PROJECT_ROOT
touch .git-assistant-patterns.json
chmod 644 .git-assistant-patterns.json

# Verify
ls -la .git-assistant-patterns.json
```

**AI Action:**
If pattern save fails, suggest permission fix and create file with correct permissions.

**Times Encountered:** 0
**Last Seen:** Never
**Status:** Documented preventatively

---

### Issue 3: Learning Engine Not Found

**Problem:** Git assistant has outdated learning logic

**Symptoms:**
- Pattern matching doesn't work as expected
- Missing features from shared learning engine

**Root Cause:**
- Using bundled learning engine instead of latest from framework
- Framework not present in project

**Solution:**
```bash
# Copy latest from framework if available
FRAMEWORK="$PROJECT_ROOT/frameworks/MCP-Servers-Framework"
if [ -f "$FRAMEWORK/shared-libraries/learning-engine.ts" ]; then
  cp "$FRAMEWORK/shared-libraries/learning-engine.ts" src/
  npm run build
fi
```

**AI Action:**
Always attempt to copy from framework first. If not found, use bundled version and note in log.

**Times Encountered:** 0
**Last Seen:** Never
**Status:** Documented preventatively

---

### Issue 4: Agent File Not Found

**Problem:** No agent/git-assistant.md in server directory

**Symptoms:**
- Can't copy agent file to `.claude/agents/`
- Setup fails at Step 7

**Root Cause:**
- Server might not have agent/ directory
- Agent file might be named differently

**Solution:**
```bash
# Check for agent file
if [ -f "agent/git-assistant.md" ]; then
  cp agent/git-assistant.md "$PROJECT_ROOT/.claude/agents/"
else
  # Create basic agent file
  cat > "$PROJECT_ROOT/.claude/agents/git-assistant.md" << 'EOF'
---
name: git-assistant
description: Analyzes git status and suggests optimal commit timing and messages
tools: mcp__git-assistant__check_commit_readiness, mcp__git-assistant__suggest_commit_message, mcp__git-assistant__show_git_guidance, mcp__git-assistant__analyze_commit_history
---
You are the Git Assistant agent.
Analyze git status, suggest commit timing, and generate meaningful commit messages.
EOF
fi
```

**AI Action:**
If agent file missing, create fallback version. Works fine, just less detailed.

**Times Encountered:** 0
**Last Seen:** Never
**Status:** Documented preventatively

---

### Issue 5: simple-git Module Not Found

**Problem:** Git assistant can't find simple-git dependency

**Symptoms:**
```
Error: Cannot find module 'simple-git'
```

**Root Cause:**
- simple-git not installed
- node_modules corrupted
- package.json missing dependency

**Solution:**
```bash
# Reinstall dependencies
cd "$SERVER_DIR"
rm -rf node_modules/ package-lock.json
npm install
npm run build
```

**AI Action:**
If simple-git missing, reinstall dependencies and rebuild.

**Times Encountered:** 0
**Last Seen:** Never
**Status:** Documented preventatively

---

### Issue 6: Not a Git Repository

**Problem:** Git assistant can't function in non-git directory

**Symptoms:**
```
Error: Not a git repository
```

**Root Cause:**
- PROJECT_ROOT is not a git repository
- User trying to use in wrong directory
- .git folder missing or corrupted

**Solution:**
```bash
# Check if git repo
cd $PROJECT_ROOT
git status

# If not a repo, initialize
git init

# Or point to correct directory
```

**AI Action:**
Inform user that git-assistant requires a git repository. Offer to help initialize one.

**Times Encountered:** 0
**Last Seen:** Never
**Status:** Documented preventatively

---

## Installation History

**For AI:** After each installation, add an entry with project name, issues, solutions, and time taken.

### Installation 1: [Initial Log Created]

**Date:** 2025-10-13
**Project:** git-assistant-mcp-server (production server)
**Issues:** None (log initialization)
**Time:** N/A
**Notes:** Production server with learning capabilities, battle-tested

---

## AI Post-Installation Checklist

After completing setup, AI should:

1. ✅ Verify all files created:
   - [ ] dist/server.js exists
   - [ ] PROJECT_ROOT/.mcp.json exists (NOT in server dir!)
   - [ ] .claude/agents/git-assistant.md exists
   - [ ] simple-git dependency installed

2. ✅ Test server runs:
   ```bash
   node dist/server.js
   # Should print: "Git Assistant MCP Server running on stdio"
   ```

3. ✅ Verify paths are correct:
   - [ ] .mcp.json has absolute path to dist/server.js
   - [ ] Path starts with `/`
   - [ ] Path points to correct server location

4. ✅ Update this log:
   - Add installation entry
   - Note any issues and solutions
   - Increment counters for known issues
   - Add new issues if discovered

5. ✅ Remind user:
   - **Restart Claude Code** (fully quit, not reload!)
   - Say "git assistant" to activate
   - Patterns saved in `.git-assistant-patterns.json`

---

## Git Assistant Specific Notes

**Key Features:**
- Intelligent commit timing analysis
- Smart commit message generation
- Learning from user's commit history
- Per-project pattern storage
- Git best practices guidance

**Common User Questions:**
- "Where are patterns stored?" → `.git-assistant-patterns.json` in project root
- "Can I share patterns with team?" → Yes, commit the patterns file to git
- "How do I see learned patterns?" → Use `list_learned_patterns` tool or check resource
- "How do I remove a pattern?" → Use `remove_learned_pattern` tool
- "Does it work without git?" → No, requires git repository

**Best Practices:**
- Always check git status before suggesting commits
- Explain reasoning for commit readiness
- Offer to teach patterns after commits
- Analyze recent commits to understand user style
- Provide educational guidance when appropriate

---

## Statistics

**Total Installations:** 0
**Success Rate:** N/A
**Average Time:** N/A
**Most Common Issue:** None yet

---

**Last Updated:** 2025-10-13
**Next Review:** After 3 installations
