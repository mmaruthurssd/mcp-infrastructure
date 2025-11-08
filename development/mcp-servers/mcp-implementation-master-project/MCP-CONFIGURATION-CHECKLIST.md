---
type: checklist
tags: [configuration, mcp-setup, deployment, quality-assurance]
created: 2025-10-29
status: production-ready
---

# MCP Configuration Checklist

**Version:** 1.2.0
**Purpose:** Foolproof configuration process for MCP server development and deployment
**Source:** Aligned with MCP_INSTALLATION_ALGORITHM.md, CONFIG_FILE_NAMING_GUIDE.md, and START_HERE.md

---

## Overview

This checklist ensures proper MCP server configuration to prevent:
- ❌ Duplicate registrations
- ❌ Wrong config file usage (workspace .mcp.json causes conflicts)
- ❌ Using ${workspaceFolder} variable (not supported in Claude Code CLI)
- ❌ Relative paths breaking configuration
- ❌ Configuration conflicts
- ❌ Missing environment variables

**CRITICAL:** Claude Code CLI uses `~/.claude.json` ONLY. Do NOT create workspace `.mcp.json` files as they cause conflicts.

**Use this checklist during:**
- MCP server development (Phase 8: Configuration)
- MCP server deployment (before rollout)
- Configuration troubleshooting
- Configuration reviews

---

## Section 1: Pre-Flight Configuration Checks

**Run these checks BEFORE attempting configuration.**

### System Requirements ✅

```bash
# Check Node.js version
node --version  # Must be >= 18.0.0

# Check npm version
npm --version   # Must be >= 8.0.0

# Check git installed
git --version

# Check disk space
df -h .         # Must have > 500MB free
```

**Pass Criteria:**
- ✅ Node.js >= 18.0.0
- ✅ npm >= 8.0.0
- ✅ git installed
- ✅ Disk space > 500MB

**If ANY check fails:** Stop and fix before proceeding.

---

### Environment Validation ✅

```bash
# Check network connectivity to npm registry
curl -I https://registry.npmjs.org/

# Check write permissions in workspace
touch .test-write && rm .test-write

# Detect workspace root
git rev-parse --show-toplevel || pwd
```

**Pass Criteria:**
- ✅ Network connectivity OK
- ✅ Write permissions OK
- ✅ Workspace root detected

---

### Existing Installation Check ✅

```bash
# Check for duplicate registrations
# Use mcp-config-manager's sync_mcp_configs tool

# Check if target path already exists
test -d local-instances/mcp-servers/[server-name]
```

**Pass Criteria:**
- ✅ No duplicate registrations detected
- ✅ No path conflicts OR user confirmed resolution

**If conflicts found:**
- Prompt user for resolution strategy
- Document decision before proceeding

---

## Section 2: Configuration Location (Claude Code CLI)

**CRITICAL:** Claude Code CLI uses `~/.claude.json` ONLY.

### The One True Config File

**For Claude Code CLI (what you're using):**
- **Location:** `~/.claude.json`
- **Managed by:** `claude mcp add --scope user`, `claude mcp remove`, `claude mcp list`
- **Path requirements:** Absolute paths only (no ${workspaceFolder})
- **Scope:** Can register servers as "user" (global) or "project" (project-specific)

### What NOT to Do

❌ **Do NOT create workspace `.mcp.json` files** - This causes conflicts with Claude Code CLI
❌ **Do NOT use `${workspaceFolder}` variable** - Not supported in `~/.claude.json`
❌ **Do NOT configure `claude_desktop_config.json`** - That's for Claude Desktop app (different application)

### Scope Selection (Within ~/.claude.json)

When registering with `claude mcp add`, choose scope:

**User Scope (`--scope user`):**
- ✅ General-purpose servers
- ✅ Servers that work across all projects
- ✅ Servers with no workspace dependencies
- ✅ Example: General utilities, API wrappers

**Project Scope (`--scope project`):**
- ✅ Workspace-specific servers
- ✅ Servers installed in workspace/local-instances/
- ✅ Servers that reference workspace paths
- ✅ Example: Project-specific MCP servers

**Note:** Both scopes register in `~/.claude.json` - the scope parameter just helps organize servers logically.

---

## Section 3: Configuration File Format

**Required format for MCP server configuration in `~/.claude.json`.**

### Claude Code CLI Config (~/.claude.json)

```json
{
  "mcpServers": {
    "server-name": {
      "command": "node",
      "args": [
        "/ABSOLUTE/PATH/TO/workspace/local-instances/mcp-servers/server-name/dist/server.js"
      ],
      "env": {
        "PROJECT_ROOT": "/ABSOLUTE/PATH/TO/workspace",
        "SERVER_CONFIG_DIR": "/ABSOLUTE/PATH/TO/workspace/configuration/server-name",
        "API_TOKEN": "your-token-here"
      }
    }
  }
}
```

**Critical Requirements:**
- ✅ Use ABSOLUTE paths everywhere (args and env)
- ✅ Path must point to compiled dist/server.js
- ❌ NO ${workspaceFolder} variable (not supported in ~/.claude.json)
- ✅ Environment variables use absolute paths
- ✅ Credentials stored here (never commit ~/.claude.json to git)

**Note:** Use `claude mcp add` command instead of manually editing when possible.

### Configuration Key Names (IMPORTANT)

**📌 Promoted from:** troubleshooting/configuration-issues.md Issue #001

**The key name in `mcpServers` is an ARBITRARY identifier** - it does NOT need to match the server's internal `name` property.

❌ **WRONG ASSUMPTION:**
```json
// Thinking the key MUST match server's internal name
{
  "mcpServers": {
    "testing-validation-mcp-server": { ... }  // Must match exactly!
  }
}
```

✅ **CORRECT UNDERSTANDING:**
```json
{
  "mcpServers": {
    "testing-validation": {  // ← Arbitrary key (shorter, cleaner)
      "command": "node",
      "args": ["/absolute/path/testing-validation-mcp-server/dist/server.js"]
      // Server internally uses name: 'testing-validation-mcp-server'
      // Key and internal name DON'T have to match!
    },
    "pm": {  // ← Can even use abbreviations
      "command": "node",
      "args": ["/absolute/path/project-management-mcp-server/dist/server.js"]
    }
  }
}
```

**What Actually Matters:**
1. ✅ Valid JSON syntax
2. ✅ Absolute paths to dist/server.js (everywhere)
3. ✅ Proper environment variables (absolute paths)
4. ✅ No duplicate **keys** in config
5. ✅ Descriptive key names (for readability)

### Registering with CLI Command (Recommended)

**Recommended Method (using CLI):**

```bash
# Register server with user scope
claude mcp add --scope user --transport stdio server-name -- \
  node /absolute/path/to/dist/server.js

# Register server with project scope
claude mcp add --scope project --transport stdio server-name -- \
  node /absolute/path/to/dist/server.js

# Add environment variables
# (Edit ~/.claude.json to add "env" object)
```

**Manual Method (if needed):**

```json
{
  "mcpServers": {
    "server-name": {
      "command": "node",
      "args": ["/absolute/path/to/dist/server.js"],
      "env": {
        "PROJECT_ROOT": "/absolute/path/to/workspace",
        "API_TOKEN": "your-token-here"
      }
    }
  }
}
```

**Critical Requirements:**
- ✅ Use ABSOLUTE paths everywhere (no variables)
- ✅ No ${workspaceFolder} support in ~/.claude.json
- ✅ Credentials stored here (never commit to git)
- ✅ Managed by `claude mcp add/remove/list` commands
- ✅ Check registration with `claude mcp list`

**Note:** See CONFIG_FILE_NAMING_GUIDE.md for details about ~/.claude.json

---

## Section 4: Duplicate Prevention

**CRITICAL: Prevent duplicate server registrations.**

### Duplicate Detection Process

#### Step 1: Run Config Sync
```bash
# Use MCP Config Manager's sync tool
mcp__mcp-config-manager__sync_mcp_configs
```

#### Step 2: Check Config File
```bash
# Check global config (Claude Code CLI - THE ONLY CONFIG)
cat ~/.claude.json | grep "server-name"

# Or use claude mcp list (recommended)
claude mcp list

# Check if workspace .mcp.json exists (it shouldn't)
test -f .mcp.json && echo "WARNING: Workspace .mcp.json exists - remove it!"
```

#### Step 3: If Duplicate Found
**Error:** Same server defined multiple times OR workspace .mcp.json exists

**Resolution:**
1. Remove workspace .mcp.json if it exists (causes conflicts)
2. Remove duplicate entries from ~/.claude.json
3. Keep server registered ONCE in ~/.claude.json only
4. Use `claude mcp remove` and `claude mcp add` to clean up
5. Restart Claude Code

### Duplicate Prevention Rules

- ❌ **NEVER** create workspace .mcp.json (conflicts with CLI)
- ❌ **NEVER** have multiple registrations of same server
- ✅ **ALWAYS** run sync before registration
- ✅ **ALWAYS** check for conflicts before proceeding
- ✅ **USE** `claude mcp list` to verify registrations

**If duplicate detected:**
- Follow Issue #11 resolution from MCP_INSTALLATION_ALGORITHM.md
- Remove workspace .mcp.json
- Keep in ~/.claude.json only
- Verify with `claude mcp list`

---

## Section 5: Credential Management

**Security-critical configuration rules.**

### Credential Storage Rules

#### Rule 1: All Config in ~/.claude.json
```json
// ~/.claude.json (Claude Code CLI - THE ONLY CONFIG)
{
  "mcpServers": {
    "server-name": {
      "command": "node",
      "args": ["/absolute/path/to/dist/server.js"],
      "env": {
        "PROJECT_ROOT": "/absolute/path/to/workspace",
        "OAUTH_TOKEN": "your-token-here",
        "API_KEY": "your-api-key-here"
      }
    }
  }
}
```

**Why:**
- ✅ One config file for everything
- ✅ Never committed to version control
- ✅ Easier to manage
- ✅ Single source of truth

#### Rule 2: NEVER Create Workspace .mcp.json
```json
// .mcp.json - WRONG ❌ (Don't create this file at all)
{
  "mcpServers": {
    "server-name": { ... }  // ❌ CAUSES CONFLICTS
  }
}
```

**Why:**
- ❌ Conflicts with Claude Code CLI config
- ❌ Causes duplicate registration issues
- ❌ Not used by Claude Code CLI
- ❌ Creates confusion

#### Rule 3: All Paths Must Be Absolute
```json
// ~/.claude.json - CORRECT ✅
{
  "mcpServers": {
    "server-name": {
      "command": "node",
      "args": ["/absolute/path/to/dist/server.js"],
      "env": {
        "PROJECT_ROOT": "/absolute/path/to/workspace",
        "SERVER_CONFIG_DIR": "/absolute/path/to/configuration/server-name"
      }
    }
  }
}
```

### Security Checklist

- [ ] All credentials in ~/.claude.json (never committed to git)
- [ ] No workspace .mcp.json file exists
- [ ] No tokens in shell profiles
- [ ] No hard-coded tokens in source code
- [ ] ~/.claude.json never copied to workspace
- [ ] Credentials documented in server README (without actual values)

**Reference:** SECURITY_BEST_PRACTICES.md for complete guidelines

---

## Section 6: Path Requirements

**Absolute paths are CRITICAL for configuration.**

### Path Rules

#### Rule 1: Always Use Absolute Paths
```json
// CORRECT ✅
{
  "args": [
    "/Users/you/workspace/local-instances/mcp-servers/server-name/dist/server.js"
  ]
}

// WRONG ❌
{
  "args": [
    "./local-instances/mcp-servers/server-name/dist/server.js"
  ]
}
```

#### Rule 2: No Variable Support in ~/.claude.json

**${workspaceFolder} is NOT supported in ~/.claude.json:**

```json
// WRONG ❌ (Variable won't expand in ~/.claude.json)
{
  "env": {
    "PROJECT_ROOT": "${workspaceFolder}"  // Not supported
  }
}

// CORRECT ✅ (Use absolute paths everywhere)
{
  "env": {
    "PROJECT_ROOT": "/Users/you/workspace"
  }
}
```

**Per CONFIG_FILE_NAMING_GUIDE.md:** Never use ${workspaceFolder} in ~/.claude.json - it's not supported by Claude Code CLI.

#### Rule 3: Path Must Point to Compiled Output
```json
// CORRECT ✅
{
  "args": ["/path/to/dist/server.js"]
}

// WRONG ❌
{
  "args": ["/path/to/src/server.ts"]  // TypeScript source, not compiled
}
```

### Path Validation Checklist

- [ ] All paths in "args" are absolute (start with / or C:\)
- [ ] All paths in "env" are absolute
- [ ] No relative paths anywhere (., .., ./...)
- [ ] No ${workspaceFolder} variable anywhere (not supported)
- [ ] Path points to dist/server.js (compiled output)
- [ ] File exists at specified path
- [ ] Build completed before configuration

```bash
# Validate paths
ls -la /absolute/path/to/dist/server.js  # Must exist
file /absolute/path/to/dist/server.js     # Must be JavaScript
```

---

## Section 7: Environment Variables

**Proper environment variable configuration.**

### Environment Variable Types

#### All Environment Variables in ~/.claude.json

```json
{
  "mcpServers": {
    "server-name": {
      "env": {
        "PROJECT_ROOT": "/absolute/path/to/workspace",
        "SERVER_CONFIG_DIR": "/absolute/path/to/configuration/server-name",
        "SERVER_DEBUG": "false",
        "API_TOKEN": "your-token",
        "OAUTH_TOKEN": "your-oauth"
      }
    }
  }
}
```

**Requirements:**
- ✅ All paths must be absolute (no variables)
- ✅ Credentials included here
- ✅ Project-specific settings here
- ✅ All configuration in one place

**Note:** Per CONFIG_FILE_NAMING_GUIDE.md, Claude Code CLI only reads ~/.claude.json

### Environment Variable Checklist

- [ ] All environment variables in ~/.claude.json only
- [ ] All paths are absolute (no ${workspaceFolder})
- [ ] No workspace .mcp.json file exists
- [ ] Credentials documented in server README (without actual values)
- [ ] Server documentation lists required env vars
- [ ] No variables or placeholders in config

---

## Section 8: Configuration Validation

**Validate configuration before deployment.**

### JSON Validation

```bash
# Validate workspace config
cat .mcp.json | jq .

# Validate global config (Claude Code CLI)
cat ~/.claude.json | jq .
```

**Pass Criteria:**
- ✅ Valid JSON (no syntax errors)
- ✅ All required fields present
- ✅ Proper nesting structure

### Configuration Integrity Check

```bash
# Check paths exist
ls -la /path/from/config/dist/server.js

# Check Node.js can load the file
node -e "require('/path/from/config/dist/server.js')"

# Check for duplicates
grep -r "server-name" .mcp.json ~/.claude.json

# Or use MCP Config Manager
mcp__mcp-config-manager__sync_mcp_configs
```

**Pass Criteria:**
- ✅ All paths exist
- ✅ Server file is valid JavaScript
- ✅ No duplicate registrations

### Post-Configuration Tests

```bash
# Restart Claude Code
# Then test:

# 1. Check server loads
# Ask Claude Code: "What MCP servers do you have access to?"

# 2. Test server tools
# Ask Claude Code to list tools from the server

# 3. Test basic tool invocation
# Ask Claude Code to run a simple tool from the server
```

**Pass Criteria:**
- ✅ Server appears in available servers list
- ✅ All tools are accessible
- ✅ Basic tool invocation works
- ✅ No errors in logs

---

## Section 9: Common Configuration Errors

**Known issues and solutions.**

### Error 1: Server Not Loading

**Symptom:** "Server is not available" or doesn't appear in tools list

**Diagnosis:**
```bash
# Check which config defines the server
grep -r "server-name" .mcp.json ~/.claude.json

# Or use claude mcp list
claude mcp list

# Check path exists
ls -la /path/from/config
```

**Solutions:**
- Verify server defined in correct config (workspace vs global)
- Check absolute paths
- Verify dist/server.js exists
- Restart Claude Code

---

### Error 2: Duplicate Server Definitions

**Symptom:** Unexpected server behavior, wrong version loading

**Diagnosis:**
```bash
# Check both configs
cat .mcp.json | grep -A 10 "server-name"
cat ~/.claude.json | grep -A 10 "server-name"

# Or use MCP Config Manager
mcp__mcp-config-manager__sync_mcp_configs
```

**Solution:**
- Remove from ONE config (use Decision Matrix)
- Keep in workspace if workspace-specific
- Keep in global if general-purpose
- Restart Claude Code

---

### Error 3: Credentials Not Working

**Symptom:** 401 Unauthorized, authentication errors

**Diagnosis:**
```bash
# Check where credentials are defined
grep -r "OAUTH_TOKEN\|API_TOKEN" .mcp.json ~/.claude.json
```

**Solution:**
- Move ALL credentials to global config
- Remove credentials from workspace .mcp.json
- Verify token validity
- Restart Claude Code

---

### Error 4: Relative Path Breaks

**Symptom:** Server not found, path errors

**Diagnosis:**
```bash
# Check for relative paths in args
grep -r "\./" .mcp.json ~/.claude.json
```

**Solution:**
- Convert ALL paths to absolute
- Use full path from root (/)
- Never use ./ or ../
- Verify path exists
- Restart Claude Code

---

### Error 5: Using ${workspaceFolder} Variable

**Symptom:** Variable not expanded, path not found, server not loading

**Diagnosis:**
```bash
# Check if ${workspaceFolder} is in config (wrong)
grep -r "workspaceFolder" ~/.claude.json
```

**Solution:**
- ❌ ${workspaceFolder} is NOT supported in ~/.claude.json
- Replace all ${workspaceFolder} with absolute paths
- Never use variables in ~/.claude.json
- Restart Claude Code

**Note:** Per CONFIG_FILE_NAMING_GUIDE.md, Claude Code CLI doesn't support ${workspaceFolder}.

---

### Error 6: Workspace .mcp.json Exists

**Symptom:** Duplicate registration warnings, server conflicts, unexpected behavior

**Diagnosis:**
```bash
# Check if workspace .mcp.json exists
test -f .mcp.json && echo "Found workspace .mcp.json - this causes conflicts"
```

**Solution:**
- Remove workspace .mcp.json entirely
- Move all configuration to ~/.claude.json
- Use absolute paths for all workspace-specific paths
- Use `claude mcp add` to re-register if needed
- Restart Claude Code

**Note:** Per CONFIG_FILE_NAMING_GUIDE.md and MCP_INSTALLATION_ALGORITHM.md, workspace .mcp.json causes conflicts with Claude Code CLI.

---

## Section 10: Configuration Backup & Recovery

**Protect against configuration errors.**

### Backup Before Changes

```bash
# Backup global config (Claude Code CLI - THE ONLY CONFIG)
cp ~/.claude.json ~/.claude.json.backup
```

### Recovery Process

```bash
# If configuration breaks:

# 1. Restore from backup
cp ~/.claude.json.backup ~/.claude.json

# 2. Restart Claude Code

# 3. Verify servers load with: claude mcp list

# 4. Try configuration again with fixes
```

### Version Control

```bash
# Global config - NEVER commit to git (contains credentials and user-specific paths)
# ~/.claude.json is outside workspace, so not in git repo

# Workspace .mcp.json - Should NOT exist
# If it exists, remove it:
rm .mcp.json

# Document server registration in README instead
```

---

## Configuration Checklist Summary

### Pre-Configuration ✅
- [ ] Pre-flight checks pass (Node, npm, git, disk, network)
- [ ] No existing installation conflicts
- [ ] No duplicate registrations detected
- [ ] No workspace .mcp.json file exists
- [ ] Build successful (dist/server.js exists)

### Configuration File ✅
- [ ] Using ~/.claude.json (the ONLY config for Claude Code CLI)
- [ ] No workspace .mcp.json created
- [ ] Backup of ~/.claude.json created

### Configuration Content ✅
- [ ] Absolute paths used in "args" (no relative paths)
- [ ] Absolute paths used in "env" (no variables)
- [ ] NO ${workspaceFolder} anywhere (not supported)
- [ ] Path points to dist/server.js (compiled output)
- [ ] Environment variables defined with absolute paths
- [ ] Credentials in ~/.claude.json (if needed)
- [ ] JSON syntax valid

### Validation ✅
- [ ] JSON validates with jq
- [ ] Paths exist and are accessible
- [ ] Server file is valid JavaScript
- [ ] No duplicate registrations
- [ ] Backup created before changes

### Post-Configuration ✅
- [ ] Claude Code restarted
- [ ] Server appears in available servers
- [ ] Tools are accessible
- [ ] Basic tool invocation works
- [ ] No errors in logs

### Documentation ✅
- [ ] Configuration decision documented
- [ ] Environment variables documented
- [ ] .env.example provided (if credentials needed)
- [ ] README updated with configuration instructions

---

## Integration Points

**This checklist integrates with:**

1. **MCP-BUILD-INTEGRATION-GUIDE.md**
   - Phase 8: Configuration section
   - References this checklist for configuration process

2. **ROLLOUT-CHECKLIST.md**
   - Configuration section
   - Pre-deployment validation
   - References this checklist

3. **TROUBLESHOOTING.md** (in templates)
   - Configuration-related issues
   - Links to this checklist for solutions

4. **MCP-COMPLETION-TRACKER.md**
   - Configuration status tracking
   - Verification of configuration completion

---

## Quick Reference

### Configuration Decision Flow

```
1. Verify configuration file:
   - Use ~/.claude.json ONLY
   - Do NOT create workspace .mcp.json

2. Determine scope (optional, for organization):
   - General-purpose → Register with --scope user
   - Project-specific → Register with --scope project
   - Both register in ~/.claude.json

3. Check for conflicts:
   - Run sync_mcp_configs or claude mcp list
   - Remove workspace .mcp.json if exists
   - Remove duplicate entries

4. Use correct paths:
   - Absolute paths in "args"
   - Absolute paths in "env"
   - No ${workspaceFolder} anywhere
   - Point to dist/server.js

5. Validate:
   - JSON syntax valid
   - All paths exist
   - No duplicates
   - No workspace .mcp.json

6. Test:
   - Restart Claude Code
   - Run: claude mcp list
   - Verify server appears
   - Test basic tool invocation
```

---

## Version History

| Version | Date | Changes |
|---------|------|---------|
| 1.2.0 | 2025-10-29 | **CRITICAL FIX:** Corrected to match source documents<br>- **REMOVED:** All workspace .mcp.json guidance (causes conflicts)<br>- **REMOVED:** All ${workspaceFolder} support claims (not supported in ~/.claude.json)<br>- **FIXED:** Clarified ~/.claude.json is THE ONLY config for Claude Code CLI<br>- **UPDATED:** All examples use absolute paths only<br>- **ALIGNED:** With CONFIG_FILE_NAMING_GUIDE.md and MCP_INSTALLATION_ALGORITHM.md<br>- **ADDED:** Error #6 for workspace .mcp.json conflicts |
| 1.1.0 | 2025-10-29 | ❌ **INCORRECT VERSION:** Mistakenly claimed ${workspaceFolder} support<br>- Incorrectly stated workspace .mcp.json was valid<br>- Incorrectly claimed ${workspaceFolder} was supported<br>- Misinterpreted CONFIGURATION_STANDARD.md context |
| 1.0.0 | 2025-10-29 | Initial creation from 4 configuration files |

---

**Created:** 2025-10-29
**Updated:** 2025-10-29 (v1.2.0 - Critical corrections)
**Source of Truth:**
- templates-and-patterns/mcp-server-templates/MCP_INSTALLATION_ALGORITHM.md
- templates-and-patterns/mcp-server-templates/CONFIG_FILE_NAMING_GUIDE.md
- templates-and-patterns/mcp-server-templates/START_HERE.md

**Note:** v1.1.0 was incorrect. v1.2.0 properly aligns with source documents.
**CONFIGURATION_STANDARD.md** is about server-specific config storage (`configuration/[server-name]/`), NOT the `.mcp.json` registry file.

**Maintained By:** Medical Practice Workspace
**Status:** Production Ready
