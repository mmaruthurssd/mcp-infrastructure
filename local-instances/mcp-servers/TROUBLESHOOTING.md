---
type: reference
tags: [troubleshooting, issues, solutions, debugging, configuration]
priority: key-document
---

# MCP Server Troubleshooting Guide

This document tracks all issues encountered during MCP server setup and their solutions.

**Purpose**: Document problems and fixes so they're never repeated.

---

## Quick Diagnosis

Before diving into specific issues, use the MCP Config Manager:

```
Use mcp-config-manager tool: sync_mcp_configs()
```

This will automatically detect: orphaned configs, missing registrations, **duplicate registrations**, and build issues.

**⚠️ CRITICAL: Always check for duplicate registrations!**
Servers registered in MULTIPLE config files can cause:
- Unpredictable behavior
- Loading failures
- Config sync issues

Then check the specific issues below based on the error messages.

---

## 📊 Quick Stats Dashboard

**Last Updated:** 2025-10-26

### Most Common Issues (By Frequency)
1. **Duplicate Registrations** (Issue #11) - 1 occurrence [🔴 CRITICAL]
2. **Wrong Config File** (Issue #10) - 1 occurrence [🔴 CRITICAL]
3. **Missing Dependencies** (Issue #12) - 1 occurrence [🔴 CRITICAL]
4. **Missing Environment Variables** (Issue #1) - 0 occurrences
5. **Wrong Scope** (Issue #2) - 0 occurrences

### Recent Issues (Last 7 Days)
- Issue #12: Missing Dependencies (occurred 2025-10-26) - SOLVED ✓
- Issue #11: Duplicate Registrations (occurred 2025-10-26) - SOLVED ✓
- Issue #10: Wrong Config File (occurred 2025-10-26) - SOLVED ✓

### Trending Issues (Last 30 Days)
- Issue #12: Missing Dependencies (↑ New discovery - common in dev instances)
- Issue #11: Duplicate Registrations (↑ New discovery - often follows Issue #10)
- Issue #10: Wrong Config File (↑ New discovery - affects all CLI users)

**Note for AI:** Update this dashboard after resolving each issue. Increment frequency, update dates, recalculate rankings.

---

## Common Issues

### Setup Issues

#### Issue #10: Wrong Config File Location (claude_desktop_config.json vs ~/.claude.json)

**Metadata:**
| Metric | Value |
|--------|-------|
| Frequency | 1 occurrence |
| Last Occurred | 2025-10-26 |
| Success Rate | 100% (1/1 resolved) |
| Avg Resolution Time | ~10 min |
| Trend (30d) | → New discovery |
| Priority | 🔴 **CRITICAL** |

**Problem**: Servers configured in `claude_desktop_config.json` but Claude Code CLI never loads them because it reads from `~/.claude.json` instead.

**Symptoms**:
- All 10 servers configured with correct absolute paths in `claude_desktop_config.json`
- Claude Code CLI shows 0 servers or "Failed to connect" errors
- `claude mcp list` shows empty or wrong servers
- Configuration looks perfect but nothing works
- Restarting Claude Code doesn't help

**Root Cause**:
- **Claude Code CLI** actually reads from `~/.claude.json` (NOT `claude_desktop_config.json`)
- `claude_desktop_config.json` is for the Claude Desktop app (separate application)
- Configuring the wrong file = servers never load, even if configuration is perfect

**The Critical Discovery**:
```
Claude Code CLI → ~/.claude.json
Claude Desktop App → ~/Library/Application Support/Claude/claude_desktop_config.json

They are TWO SEPARATE APPLICATIONS with TWO SEPARATE CONFIG FILES.
```

**Automatic Detection**:
```
# Check which config file has servers
cat ~/.claude.json  # CLI config (the one that matters)
cat ~/Library/Application\ Support/Claude/claude_desktop_config.json  # Desktop app config

# Check what CLI sees
claude mcp list  # Shows servers from ~/.claude.json only
```

**AI-Automated Fix**:
```
1. Check what's in ~/.claude.json:
   Use Bash: cat ~/.claude.json

2. If empty or missing servers:
   - Get list of servers that should be registered
   - Get absolute paths to each server's dist/server.js
   - For each server:
     Use Bash: claude mcp add --scope user --transport stdio <server-name> -- node /absolute/path/to/dist/server.js

3. Add environment variables if needed:
   - Read server README to identify required env vars
   - Use Bash: claude mcp add with env vars (if supported)
   - OR manually edit ~/.claude.json to add env object

4. Verify registration:
   Use Bash: claude mcp list
   Should show all 10 servers

5. Check for missing files (like decision-tree.json):
   - Use Bash: ls <server>/dist/
   - If files missing from dist/, copy from src/

6. Instruct user to restart Claude Code (Cmd+Q)

7. After restart, verify all servers connected
```

**Manual Fix** (if AI automation fails):
1. Check current config location:
   ```bash
   cat ~/.claude.json
   ```

2. Register all servers using CLI:
   ```bash
   claude mcp add --scope user --transport stdio server-name -- node /absolute/path/to/dist/server.js
   ```

3. Add environment variables to `~/.claude.json`:
   ```json
   {
     "mcpServers": {
       "server-name": {
         "command": "node",
         "args": ["/path/to/server.js"],
         "env": {
           "ENV_VAR": "value"
         }
       }
     }
   }
   ```

4. Remove workspace `.mcp.json` if it exists (causes conflicts)

5. Restart Claude Code (Cmd+Q and reopen)

**Example Resolution:**
```bash
# Before: Servers in wrong file
cat ~/Library/Application\ Support/Claude/claude_desktop_config.json
# Shows 10 servers configured

cat ~/.claude.json
# Empty or missing

# Fix: Register in correct location
claude mcp add --scope user --transport stdio ai-planning -- node /workspace/local-instances/mcp-servers/ai-planning/dist/server.js
claude mcp add --scope user --transport stdio git-assistant -- node /workspace/local-instances/mcp-servers/git-assistant/dist/server.js
# ... repeat for all 10 servers

# Verify
claude mcp list
# Now shows all 10 servers

# Result: All servers connect after restart
```

**Date First Documented**: 2025-10-26

**Lesson**:
- **Claude Code CLI reads from `~/.claude.json`, NOT `claude_desktop_config.json`**
- `claude_desktop_config.json` is for Claude Desktop app (completely separate application)
- Always use `claude mcp add --scope user` to register servers (manages `~/.claude.json`)
- Check config with `claude mcp list` before assuming servers are registered
- Don't manually edit config files - use CLI commands
- Workspace `.mcp.json` conflicts with CLI config - avoid using it
- When servers don't load, FIRST check: `cat ~/.claude.json` to verify they're actually registered

---

#### Issue #11: Duplicate MCP Server Registrations Across Multiple Config Files

**Metadata:**
| Metric | Value |
|--------|-------|
| Frequency | 1 occurrence |
| Last Occurred | 2025-10-26 |
| Success Rate | 100% (1/1 resolved) |
| Avg Resolution Time | ~5 min |
| Trend (30d) | → New discovery |
| Priority | 🔴 **CRITICAL** |

**Problem**: MCP servers registered in BOTH `~/.claude.json` AND `claude_desktop_config.json`, creating duplicate registrations that can cause unpredictable behavior.

**Symptoms**:
- `sync_mcp_configs()` reports "REGISTERED IN MULTIPLE LOCATIONS" for many/all servers
- Servers may appear to work but config maintenance becomes error-prone
- Changes to one config file don't affect the other
- Confusion about which config file is actually being used
- Potential loading conflicts or failures

**Root Cause**:
- After discovering Issue #10 (wrong config file), servers were registered in `~/.claude.json`
- **BUT** old registrations in `claude_desktop_config.json` were NOT removed
- Result: Same servers exist in both locations with identical paths
- Claude Code CLI only reads `~/.claude.json`, making the Desktop config entries unnecessary

**The Critical Understanding**:
```
Claude Code CLI → ONLY reads ~/.claude.json
Claude Desktop App → ONLY reads ~/Library/Application Support/Claude/claude_desktop_config.json

Having servers in BOTH is:
- Redundant (CLI ignores Desktop config)
- Risky (creates maintenance burden)
- Confusing (which is the "real" config?)
```

**Automatic Detection**:
```
Use mcp-config-manager tool: sync_mcp_configs()

Look for "Configuration Conflicts" section with warnings like:
⚠️  server-name - REGISTERED IN MULTIPLE LOCATIONS
   Locations: global, claude-code
   Recommendation: Keep in ONE location only
```

**AI-Automated Fix**:
```
1. Run sync to identify all duplicates:
   Use mcp-config-manager: sync_mcp_configs()

2. Determine which config to keep:
   - For Claude Code CLI users: Keep ~/.claude.json
   - Remove from: ~/Library/Application Support/Claude/claude_desktop_config.json

3. Backup Desktop config before changes:
   Use Bash: cp ~/Library/Application\ Support/Claude/claude_desktop_config.json ~/Library/Application\ Support/Claude/claude_desktop_config.json.backup

4. Read Desktop config:
   Use Read: ~/Library/Application Support/Claude/claude_desktop_config.json

5. Remove mcpServers section (or empty it):
   Use Edit to replace entire mcpServers object with {}
   OR manually edit to keep only Desktop-app-specific servers (if any)

6. Verify cleanup:
   Use mcp-config-manager: sync_mcp_configs()
   Should show NO duplicate registrations

7. Test: User restarts Claude Code
   All servers should still work (they use ~/.claude.json)
```

**Manual Fix**:
```bash
# 1. Backup Desktop config
cp ~/Library/Application\ Support/Claude/claude_desktop_config.json ~/Library/Application\ Support/Claude/claude_desktop_config.json.backup

# 2. Edit Desktop config
# Remove the entire mcpServers section or set it to:
{
  "mcpServers": {}
}

# 3. Verify CLI config is intact
cat ~/.claude.json
# Should show all 10 servers

# 4. Verify with mcp-config-manager
# Run sync_mcp_configs() - should show no conflicts

# 5. Restart Claude Code
# Cmd+Q and reopen
```

**Example Resolution**:
```bash
# Before: 10 servers in BOTH configs
sync_mcp_configs()
# Shows: "⚠️ 10 servers - REGISTERED IN MULTIPLE LOCATIONS"

# Backup Desktop config
cp ~/Library/Application\ Support/Claude/claude_desktop_config.json ~/claude_desktop_backup.json

# Clear Desktop config mcpServers
echo '{"mcpServers": {}}' > ~/Library/Application\ Support/Claude/claude_desktop_config.json

# Verify CLI config still has all servers
cat ~/.claude.json
# Shows: All 10 servers present

# Verify cleanup
sync_mcp_configs()
# Shows: "✓ No conflicts detected"

# Restart and test
# All 10 servers load correctly from ~/.claude.json
```

**Date First Documented**: 2025-10-26

**Lesson**:
- **Always use sync_mcp_configs() BEFORE and AFTER any config changes**
- When fixing Issue #10 (wrong config file), remember to REMOVE old registrations
- Claude Code CLI and Claude Desktop App are SEPARATE - don't configure both
- Duplicate registrations are a MAINTENANCE RISK even if servers currently work
- Backup configs before making changes (especially Desktop config)
- After cleanup, verify with sync_mcp_configs() that conflicts are resolved
- **Preventive check**: Run sync_mcp_configs() regularly to catch duplicates early

---

#### Issue #12: MCP Server Fails to Load Due to Missing node_modules Dependencies

**Metadata:**
| Metric | Value |
|--------|-------|
| Frequency | 1 occurrence |
| Last Occurred | 2025-10-26 |
| Success Rate | 100% (1/1 resolved) |
| Avg Resolution Time | ~2 min |
| Trend (30d) | → New discovery |
| Priority | 🔴 **CRITICAL** |

**Problem**: MCP server shows as "FAILED" in Claude Code's MCP server list even though it's properly registered in config with correct paths.

**Symptoms**:
- Server appears in `/mcp` command list but shows status "FAILED"
- Config file has correct absolute path to `dist/server.js`
- `dist/server.js` file exists at the specified path
- Other servers in the same directory work fine
- Restarting Claude Code doesn't fix the issue
- Error message may show "UNMET DEPENDENCY" when checking `npm list`

**Root Cause**:
- When working in a dev instance or after cloning/copying an MCP server, `node_modules/` may not be present
- The build artifacts (`dist/`) may already exist from a previous build, masking the missing dependencies
- MCP servers require dependencies like `@modelcontextprotocol/sdk`, `@types/node`, and `typescript` to be installed before they can run
- The server fails to start because Node.js cannot find the required modules

**The Critical Understanding**:
```
Built dist/ files ≠ Installed dependencies

An MCP server needs BOTH:
1. Compiled JavaScript files in dist/ (from `npm run build`)
2. node_modules/ with all dependencies (from `npm install`)

Having only #1 will cause "FAILED" status even though paths are correct.
```

**Automatic Detection**:
```bash
# Check if dependencies are installed
cd /path/to/mcp-server
npm list

# Look for "UNMET DEPENDENCY" errors:
# UNMET DEPENDENCY @modelcontextprotocol/sdk@^0.5.0
# UNMET DEPENDENCY @types/node@^20.0.0
# UNMET DEPENDENCY typescript@^5.3.0
```

**AI-Automated Fix**:
```
1. When server shows "FAILED" status:
   - Check if dist/server.js exists (path is correct)
   - Navigate to server directory

2. Check for dependencies:
   Use Bash: cd /path/to/server && npm list

3. If "UNMET DEPENDENCY" errors appear:
   Use Bash: npm install

4. Verify installation:
   Use Bash: npm list | head -10
   Should show all dependencies installed

5. Instruct user to restart Claude Code (Cmd+Q)

6. Verify server now shows "connected" instead of "FAILED"
```

**Manual Fix**:
```bash
# 1. Navigate to the failing server's directory
cd /path/to/mcp-server

# 2. Check dependency status
npm list

# 3. Install all dependencies
npm install

# 4. Verify dependencies are installed
npm list @modelcontextprotocol/sdk
npm list @types/node
npm list typescript

# 5. Restart Claude Code (Cmd+Q and reopen)

# 6. Check server status - should now show "connected"
```

**Example Resolution**:
```bash
# Before: Server failing
/mcp
# ai-planning-dev: FAILED

# Check directory
cd /Users/username/Desktop/workspace/projects-in-development/project-management-mcp-server-project/dev-instance

# Check dependencies
npm list
# UNMET DEPENDENCY @modelcontextprotocol/sdk@^0.5.0
# UNMET DEPENDENCY @types/node@^20.0.0
# UNMET DEPENDENCY typescript@^5.3.0

# Install dependencies
npm install
# added 17 packages, and audited 18 packages in 464ms
# found 0 vulnerabilities

# Verify installation
npm list
# project-management-mcp-server@0.6.0
# ├── @modelcontextprotocol/sdk@0.5.0
# ├── @types/node@20.19.23
# └── typescript@5.9.3

# Restart Claude Code
# Server now shows: ai-planning-dev: connected ✓
```

**Date First Documented**: 2025-10-26

**Lesson**:
- **Always run `npm install` before registering an MCP server in config**
- The presence of `dist/` files does NOT mean dependencies are installed
- When cloning or copying MCP servers, `node_modules/` is typically not included in git
- Dev instances are especially prone to this issue
- Use `npm list` to verify dependencies before assuming a server is ready
- Add pre-registration checks in setup scripts to catch this early
- If a server shows "FAILED" but path is correct, check `npm list` first

**Prevention Checklist** (add to setup guides):
```bash
# Before registering any MCP server:
cd /path/to/server
npm install              # Install dependencies
npm list                 # Verify no UNMET DEPENDENCY errors
npm run build            # Build if needed
ls dist/server.js        # Verify build output exists
# Now safe to register in config
```

---

#### Issue #1: Missing Environment Variables in Claude Code Configuration

**Metadata:**
| Metric | Value |
|--------|-------|
| Frequency | 0 occurrences |
| Last Occurred | Never |
| Success Rate | N/A (0/0 resolved) |
| Avg Resolution Time | ~5 min (estimated) |
| Trend (30d) | → Stable |

**Problem**: MCP servers fail to connect in Claude Code with "Failed to reconnect" errors, even though they work in VS Code.

**Symptoms**:
- Error message: "Failed to reconnect to [server-name]"
- Server works fine in VS Code but not in Claude Code
- VS Code config has environment variables but Claude Code config doesn't

**Root Cause**: Claude Code uses a different configuration file than VS Code:
- VS Code: `~/Library/Application Support/Code/User/mcp.json`
- Claude Code: `~/Library/Application Support/Claude/claude_desktop_config.json`

The environment variables were configured in VS Code but missing from Claude Code's config.

**Example of WRONG configuration** (missing env vars):
```json
{
  "mcpServers": {
    "miro": {
      "command": "node",
      "args": [
        "/Users/username/Desktop/workspace/local-instances/mcp-servers/miro-mcp-server/build/index.js"
      ]
    },
    "file-organizer": {
      "command": "node",
      "args": [
        "/Users/username/Desktop/workspace/local-instances/mcp-servers/file-organizer-mcp-server/dist/server.js"
      ]
    }
  }
}
```

**Fix**: Add the required environment variables to Claude Code's configuration:

```json
{
  "mcpServers": {
    "miro": {
      "command": "node",
      "args": [
        "/Users/username/Desktop/workspace/local-instances/mcp-servers/miro-mcp-server/build/index.js"
      ],
      "env": {
        "MIRO_OAUTH_TOKEN": "your-token-here"
      }
    },
    "file-organizer": {
      "command": "node",
      "args": [
        "/Users/username/Desktop/workspace/local-instances/mcp-servers/file-organizer-mcp-server/dist/server.js"
      ],
      "env": {
        "FILE_ORGANIZER_PROJECT_ROOT": "/Users/username/Desktop/workspace"
      }
    },
    "smart-file-organizer": {
      "command": "node",
      "args": [
        "/Users/username/Desktop/workspace/local-instances/mcp-servers/smart-file-organizer-mcp-server/dist/server.js"
      ],
      "env": {
        "SMART_FILE_ORGANIZER_PROJECT_ROOT": "/Users/username/Desktop/workspace"
      }
    }
  }
}
```

**Date**: 2025-10-16

**Result**: After adding environment variables and restarting Claude Code, all MCP servers connected successfully.

**Lesson**:
- Always check BOTH configuration files when setting up MCP servers for Claude Code
- Each MCP server may require specific environment variables - check the server's documentation or source code
- Environment variables need to be set in the configuration file that the client (VS Code or Claude Code) is using

**Required Environment Variables by Server**:
- `miro`: `MIRO_OAUTH_TOKEN`
- `file-organizer`: `FILE_ORGANIZER_PROJECT_ROOT`
- `smart-file-organizer`: `SMART_FILE_ORGANIZER_PROJECT_ROOT`
- `git-assistant`: `GIT_ASSISTANT_REPO_PATH`, `GIT_ASSISTANT_DEBUG`
- `spec-driven`: No environment variables required

---

#### Issue #2: MCP Server Not Available in Other Projects (Wrong Scope)

**Problem**: MCP server works in one project but not available in others

**Symptoms**:
- Server shows up in `claude mcp list` for one project only
- Tools not available when opening other projects
- Need to reconfigure server for each new workspace

**Root Cause**: Server was added to **local scope** or **project scope** instead of **user scope** (global)

**Fix**: Add server to user scope so it's available globally across ALL projects:

```bash
# Remove from local/project scope
claude mcp remove <server-name>

# Add to user scope (global)
claude mcp add --scope user --transport stdio <server-name> -- node /absolute/path/to/dist/server.js
```

**Example**:
```bash
claude mcp add --scope user --transport stdio file-organizer -- node /Users/username/Desktop/workspace/local-instances/mcp-servers/file-organizer-mcp-server/dist/server.js
```

**Date**: 2025-10-18

**Result**: Server now available across all projects without needing separate configuration

**Lesson**:
- **Always use `--scope user`** for general-purpose MCP servers
- User scope = global configuration (available everywhere)
- Local/project scope = specific to one workspace only
- Check scope with: `claude mcp list`

---

#### Issue #3: Wrong Config File and Format (Legacy Manual Configuration)

**Problem**: MCP servers not appearing in Claude Code or VS Code

**Note**: This issue applies to manual `.mcp.json` configuration. **The recommended approach is to use `claude mcp add --scope user`** instead of manual configuration.

**Common mistakes**:
1. Config file in wrong location
2. Wrong filename (`mcp-servers.json` instead of `.mcp.json`)
3. Missing `mcpServers` wrapper key
4. Config has `servers` key instead of `mcpServers`

**Recommended Fix**: Use `claude mcp add` instead of manual configuration:
```bash
claude mcp add --scope user --transport stdio <server-name> -- node /absolute/path/to/server.js
```

**Manual Configuration (Alternative)**:
- For project scope: Create `.mcp.json` at project root
- Must have `mcpServers` wrapper key (not `servers`)

**Correct format**:
```json
{
  "mcpServers": {
    "server-name": {
      "command": "node",
      "args": ["/absolute/path/to/server.js"]
    }
  }
}
```

---

#### Issue #4: Module Not Found Errors

**Problem**: Server fails to start with "Cannot find module" errors

**Fix**:
1. Ensure `node_modules` is installed: `npm install`
2. Verify MCP SDK is installed: `npm list @modelcontextprotocol/sdk`
3. Check build output exists: `ls dist/server.js` or `ls build/index.js`
4. Rebuild if necessary: `npm run build`

---

#### Issue #5: Permission Denied Errors

**Problem**: Server fails to start with permission errors

**Fix**:
```bash
chmod +x dist/server.js
# or for build directory
chmod +x build/index.js
```

Note: Not all servers need executable permissions - most work fine without it when run via `node`.

---

### Runtime Issues

#### Issue #6: Server Starts But Tools Don't Work

**Problem**: Server connects but tools are unavailable or fail

**Diagnosis**:
1. Check server logs for errors
2. Verify environment variables are set correctly
3. Test the server directly: `node dist/server.js`
4. Check for console.log statements (breaks MCP protocol)

**Fix**: Use `console.error()` instead of `console.log()` in server code

---

#### Issue #7: console.log() Breaks MCP Protocol

**Problem**: Using `console.log()` in server code interferes with MCP communication

**Why**: MCP uses stdout for protocol messages. `console.log()` writes to stdout and corrupts the message stream.

**Fix**: Replace all `console.log()` with `console.error()` in server source code:

```javascript
// ❌ Wrong
console.log("Debug message");

// ✅ Correct
console.error("Debug message");
```

Then rebuild: `npm run build`

---

### Configuration Issues

#### Issue #8: Environment Variables Not Working

**Problem**: Server can't access environment variables

**Common mistakes**:
1. Using `${VAR}` syntax (only works for `${workspaceFolder}`)
2. Missing `env` object in config
3. Hardcoding values instead of using env vars

**Fix**:
```json
{
  "mcpServers": {
    "server-name": {
      "command": "node",
      "args": ["/path/to/server.js"],
      "env": {
        "SERVER_VAR": "actual-value",
        "PROJECT_ROOT": "${workspaceFolder}"
      }
    }
  }
}
```

Note: Only `${workspaceFolder}` is supported for variable substitution in VS Code.

---

#### Issue #9: Changes Not Taking Effect

**Problem**: Modified config but MCP servers still use old settings

**Fix**:
1. Save the config file
2. Completely quit the application (Cmd+Q on macOS)
3. Restart the application (VS Code or Claude Code)
4. Verify servers reconnect with new settings

Note: "Reload Window" is NOT sufficient - must fully quit and restart.

---

## Verification Checklist

Use this checklist to systematically verify your MCP setup:

### Setup Verification
- [ ] Config file exists at correct location for your client (VS Code or Claude Code)
- [ ] Filename is correct (`.mcp.json` for VS Code, `claude_desktop_config.json` for Claude)
- [ ] JSON is valid (test with `python3 -m json.tool config.json`)
- [ ] Has `mcpServers` key (not `servers`)
- [ ] All paths are absolute (start with `/`)
- [ ] All server files exist at specified paths
- [ ] All servers have `node_modules` installed
- [ ] All servers have MCP SDK: `@modelcontextprotocol/sdk`
- [ ] All servers have build output (dist/ or build/)

### Runtime Verification
- [ ] All servers start without errors: `node dist/server.js`
- [ ] No `console.log()` in server code (only `console.error()`)
- [ ] All required environment variables are configured
- [ ] Application restarted after config changes
- [ ] MCP tools appear in Claude Code/VS Code
- [ ] Tools execute successfully

---

## Debugging Commands

```bash
# Validate JSON syntax
python3 -m json.tool ~/.config/claude-code/.mcp.json

# Check if MCP SDK is installed
cd /path/to/server && npm list @modelcontextprotocol/sdk

# Test server startup
cd /path/to/server && node dist/server.js

# Check for console.log in source
cd /path/to/server && grep -r "console.log" src/

# Verify file permissions
ls -la /path/to/server/dist/server.js

# Check environment variables in running process
ps aux | grep mcp
```

---

## Adding New Issues

When you encounter a new issue:

1. **Diagnose and fix it**
2. **Document it immediately** using this template:

```markdown
---

#### Issue #X: [Brief description]

**Problem**: [What went wrong]

**Symptoms**:
- [Specific error messages]
- [Observable behavior]

**Root Cause**: [Why it happened]

**Example of WRONG configuration/code**:
```json or ```javascript
[Show the problem]
```

**Fix**: [How to resolve it]

**Correct configuration/code**:
```json or ```javascript
[Show the solution]
```

**Date**: YYYY-MM-DD

**Result**: [Outcome after fix]

**Lesson**: [Key takeaway]
```

---

## Quick Reference

**Most Common Issues** (check these first):
1. **Missing node_modules dependencies** - Run `npm install` in server directory (Issue #12)
2. **Server not available in other projects** - Forgot `--scope user` (Issue #2)
3. **Wrong config file** - Claude Code uses `~/.claude.json` not `claude_desktop_config.json` (Issue #10)
4. **Duplicate registrations** - Server in multiple config files (Issue #11)
5. Missing environment variables (Issue #1)
6. Not restarting application after changes (Issue #9)
7. Using console.log() instead of console.error() (Issue #7)

**Recommended Installation Approach**:
Use `claude mcp add --scope user` instead of manual configuration:
```bash
claude mcp add --scope user --transport stdio <server-name> -- node /path/to/server.js
```

**Configuration File Locations** (for manual config):
- User scope (global): `~/.claude.json` (recommended)
- Project scope: `.mcp.json` at project root
- Legacy VS Code: `~/Library/Application Support/Code/User/mcp.json`
- Legacy Claude Desktop: `~/Library/Application Support/Claude/claude_desktop_config.json`

**Verification Commands**:
- List servers: `claude mcp list`
- Remove server: `claude mcp remove <name>`
- Verification script: `./verify-mcp-setup.sh`

---

## 🤖 AI Instructions: Updating Troubleshooting Metadata

**When to Update:** After diagnosing and fixing ANY MCP configuration issue.

### Step 1: Identify the Issue

Match user symptoms to an issue number (#1-#10). If no match exists, create a new issue following the template in "Adding New Issues".

### Step 2: Update Issue Metadata

Use the Edit tool to update the metadata table for that issue:

**Increment Frequency:**
```
Old: | Frequency | 5 occurrences |
New: | Frequency | 6 occurrences |
```

**Update Last Occurred:**
```
Old: | Last Occurred | 2025-10-20 |
New: | Last Occurred | 2025-10-26 |  (use today's date)
```

**Update Success Rate** (if issue resolved):
```
Old: | Success Rate | 80% (4/5 resolved) |
New: | Success Rate | 83% (5/6 resolved) |  (increment both numbers)
```

**Update Success Rate** (if issue NOT resolved):
```
Old: | Success Rate | 80% (4/5 resolved) |
New: | Success Rate | 67% (4/6 resolved) |  (increment denominator only)
```

**Update Trend** (compare frequency over last 30 days):
```
↑ Increasing = More occurrences in last 30 days than previous 30
→ Stable = Similar frequency
↓ Decreasing = Fewer occurrences recently
```

### Step 3: Update Quick Stats Dashboard

Use the Edit tool to update the Quick Stats Dashboard section:

**Update "Last Updated" date:**
```
Old: **Last Updated:** 2025-10-25
New: **Last Updated:** 2025-10-26
```

**Re-rank "Most Common Issues" by Frequency:**
```
Sort issues by frequency (highest first)
List top 5 issues with their current frequency counts

Example:
1. **Configuration Conflicts** (Issue #10) - 15 occurrences
2. **Missing Environment Variables** (Issue #1) - 8 occurrences
3. **Wrong Scope** (Issue #2) - 5 occurrences
...
```

**Update "Recent Issues (Last 7 Days)":**
```
List issues that occurred in last 7 days
Format: "- Issue #X: Title (occurred YYYY-MM-DD)"

Example:
- Issue #10: Configuration Conflicts (occurred 2025-10-26)
- Issue #1: Missing Environment Variables (occurred 2025-10-24)
```

**Update "Trending Issues (Last 30 Days)":**
```
List issues with ↑ Increasing trend
Format: "- Issue #X: Title (↑ X occurrences in last 30d)"

Example:
- Issue #10: Configuration Conflicts (↑ 5 occurrences in last 30d)
```

### Step 4: Verify Updates

After making edits, verify:
- [ ] Issue metadata table updated with new frequency
- [ ] Last Occurred date is today
- [ ] Success rate math is correct
- [ ] Quick Stats Dashboard reflects new rankings
- [ ] Recent Issues includes today's issue (if within last 7 days)

### Example Update Workflow

**User reports:** "Only 4 of 10 servers are loading"

**AI Actions:**
1. Run sync_mcp_configs() → Detects conflicts
2. Identify Issue: #10 (Configuration Conflicts)
3. Apply automated fix (remove duplicates)
4. User confirms resolved
5. Update metadata:
   - Frequency: 0 → 1
   - Last Occurred: Never → 2025-10-26
   - Success Rate: N/A → 100% (1/1 resolved)
6. Update Quick Stats:
   - Move Issue #10 to #1 in rankings (if now most frequent)
   - Add to Recent Issues
7. Done!

---

Last Updated: 2025-10-26
