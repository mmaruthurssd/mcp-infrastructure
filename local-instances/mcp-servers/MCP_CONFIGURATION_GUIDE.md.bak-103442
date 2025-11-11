# MCP Server Configuration Guide

**Complete reference for all MCP server configurations in this workspace**

---

## Overview

This guide documents the proper configuration for each MCP server, including:
- Environment variables
- Configuration directories
- MCP JSON entries
- Common issues and fixes

---

## Configuration Status Summary

| Server | In .mcp.json | Env Vars Set | Config Dir Exists | Status |
|--------|-------------|--------------|-------------------|--------|
| **ai-planning** | ❌ MISSING | N/A | ❌ | 🔴 NOT CONFIGURED |
| **arc-decision** | ✅ | ✅ | ✅ | 🟢 CONFIGURED |
| **communications** | ✅ | ⚠️ PARTIAL | ❌ | 🟡 NEEDS SECRETS |
| **git-assistant** | ✅ | ✅ | ❌ | 🟡 MISSING DIR |
| **learning-optimizer** | ✅ | ✅ | ❌ | 🟡 MISSING DIR |
| **project-index-generator** | ✅ | ✅ | ❌ | 🟡 MISSING DIR |
| **smart-file-organizer** | ✅ | ✅ | ❌ | 🟡 MISSING DIR |
| **spec-driven** | ✅ | ✅ | ❌ | 🟡 MISSING DIR |
| **task-executor** | ✅ | N/A | N/A | 🟢 CONFIGURED |

---

## Individual Server Configurations

### 1. project-management-mcp-server

**Status:** 🔴 NOT CONFIGURED - Missing from .mcp.json

**What it does:** AI-assisted project planning and goal workflow management

**Required environment variables:** NONE

**Recommended .mcp.json entry:**
```json
"ai-planning": {
  "command": "node",
  "args": [
    "${workspaceFolder}/local-instances/mcp-servers/project-management-mcp-server/dist/server.js"
  ]
}
```

**Configuration directory:** Not required

---

### 2. arc-decision-mcp-server

**Status:** 🟢 FULLY CONFIGURED

**What it does:** Helps decide architecture (Skills, MCP, Subagents, Hybrids)

**Required environment variables:**
- `ARC_DECISION_PROJECT_ROOT` - Workspace root (set to `${workspaceFolder}`)
- `ARC_DECISION_CONFIG_DIR` - Configuration directory (set to `${workspaceFolder}/configuration/arc-decision`)

**Current .mcp.json entry:** ✅ Correct
```json
"arc-decision": {
  "command": "node",
  "args": [
    "/Users/mmaruthurnew/Desktop/medical-practice-workspace/local-instances/mcp-servers/arc-decision-mcp-server/dist/server.js"
  ],
  "env": {
    "ARC_DECISION_PROJECT_ROOT": "${workspaceFolder}",
    "ARC_DECISION_CONFIG_DIR": "${workspaceFolder}/configuration/arc-decision"
  }
}
```

**Configuration directory:** ✅ `configuration/arc-decision/` exists

---

### 3. communications-mcp-server

**Status:** 🟡 NEEDS EMAIL/GOOGLE CREDENTIALS

**What it does:** Email sending and Google API integration

**Required environment variables:**
- **For Email (SMTP):**
  - `SMTP_HOST` - SMTP server (default: `smtp.gmail.com`)
  - `SMTP_PORT` - SMTP port (default: `587`)
  - `SMTP_SECURE` - Use TLS (default: `false`)
  - `SMTP_USER` - Email username/address
  - `SMTP_PASSWORD` - Email password or app password
  - `SMTP_FROM` - From address (optional, defaults to SMTP_USER)

- **For Google OAuth (optional):**
  - `GOOGLE_CLIENT_ID` - Google OAuth client ID
  - `GOOGLE_CLIENT_SECRET` - Google OAuth client secret
  - `GOOGLE_REFRESH_TOKEN` - Google OAuth refresh token

- **For Staging (optional):**
  - `STAGING_ENABLED` - Enable staging database (default: `true`)
  - `STAGING_DB_PATH` - Path to staging database

**Recommended .mcp.json entry:**
```json
"communications": {
  "command": "node",
  "args": [
    "${workspaceFolder}/local-instances/mcp-servers/communications-mcp-server/dist/server.js"
  ],
  "env": {
    "SMTP_HOST": "smtp.gmail.com",
    "SMTP_PORT": "587",
    "SMTP_SECURE": "false",
    "SMTP_USER": "your-email@gmail.com",
    "SMTP_PASSWORD": "your-app-password",
    "STAGING_ENABLED": "true",
    "STAGING_DB_PATH": "${workspaceFolder}/configuration/communications/staging.db"
  }
}
```

**Configuration directory:** Create `configuration/communications/`

**Security note:** Store credentials in `.mcp.json` (which should be in `.gitignore`) or use a separate `.env` file

---

### 4. git-assistant-mcp-server

**Status:** 🟡 MISSING CONFIG DIRECTORY

**What it does:** Git operations, commit analysis, and workflow guidance

**Required environment variables:**
- `GIT_ASSISTANT_REPO_PATH` - Repository path (set to `${workspaceFolder}`)
- `GIT_ASSISTANT_DEBUG` - Debug mode (default: `false`)
- `GIT_ASSISTANT_MAX_FILES` - Max files to analyze (default: `7`)
- `GIT_ASSISTANT_MAX_LINES` - Max lines per file (default: `200`)
- `GIT_ASSISTANT_CONFIG_DIR` - Configuration directory (set to `${workspaceFolder}/configuration/git-assistant`)

**Current .mcp.json entry:** ✅ Correct (but needs portable path)
```json
"git-assistant": {
  "command": "node",
  "args": [
    "${workspaceFolder}/local-instances/mcp-servers/git-assistant-mcp-server/dist/server.js"
  ],
  "env": {
    "GIT_ASSISTANT_REPO_PATH": "${workspaceFolder}",
    "GIT_ASSISTANT_DEBUG": "false",
    "GIT_ASSISTANT_MAX_FILES": "7",
    "GIT_ASSISTANT_MAX_LINES": "200",
    "GIT_ASSISTANT_CONFIG_DIR": "${workspaceFolder}/configuration/git-assistant"
  }
}
```

**Configuration directory:** ❌ Create `configuration/git-assistant/`

---

### 5. learning-optimizer-mcp-server

**Status:** 🟡 MISSING CONFIG DIRECTORY

**What it does:** Token usage optimization and learning pattern analysis

**Required environment variables:**
- `LEARNING_OPTIMIZER_PROJECT_ROOT` - Workspace root (set to `${workspaceFolder}`)
- `LEARNING_OPTIMIZER_CONFIG_DIR` - Configuration directory (set to `${workspaceFolder}/configuration/learning-optimizer`)

**Current .mcp.json entry:** ✅ Correct (but needs portable path)
```json
"learning-optimizer": {
  "command": "node",
  "args": [
    "${workspaceFolder}/local-instances/mcp-servers/learning-optimizer-mcp-server/dist/server.js"
  ],
  "env": {
    "LEARNING_OPTIMIZER_PROJECT_ROOT": "${workspaceFolder}",
    "LEARNING_OPTIMIZER_CONFIG_DIR": "${workspaceFolder}/configuration/learning-optimizer"
  }
}
```

**Configuration directory:** ❌ Create `configuration/learning-optimizer/`

---

### 6. project-index-generator-mcp-server

**Status:** 🟡 MISSING CONFIG DIRECTORY

**What it does:** Generates project documentation and index files

**Required environment variables:**
- `PROJECT_INDEX_GENERATOR_PROJECT_ROOT` - Workspace root (set to `${workspaceFolder}`)
- `PROJECT_INDEX_GENERATOR_CONFIG_DIR` - Configuration directory (set to `${workspaceFolder}/configuration/project-index-generator`)

**Current .mcp.json entry:** ✅ Correct (but needs portable path)
```json
"project-index-generator": {
  "command": "node",
  "args": [
    "${workspaceFolder}/local-instances/mcp-servers/project-index-generator-mcp-server/dist/server.js"
  ],
  "env": {
    "PROJECT_INDEX_GENERATOR_PROJECT_ROOT": "${workspaceFolder}",
    "PROJECT_INDEX_GENERATOR_CONFIG_DIR": "${workspaceFolder}/configuration/project-index-generator"
  }
}
```

**Configuration directory:** ❌ Create `configuration/project-index-generator/`

---

### 7. smart-file-organizer-mcp-server

**Status:** 🟡 MISSING CONFIG DIRECTORY

**What it does:** Intelligent file organization with learning patterns

**Required environment variables:**
- `SMART_FILE_ORGANIZER_PROJECT_ROOT` - Workspace root (set to `${workspaceFolder}`)
- `SMART_FILE_ORGANIZER_CONFIG_DIR` - Configuration directory (set to `${workspaceFolder}/configuration/smart-file-organizer`)

**Current .mcp.json entry:** ✅ Correct (but needs portable path)
```json
"smart-file-organizer": {
  "command": "node",
  "args": [
    "${workspaceFolder}/local-instances/mcp-servers/smart-file-organizer-mcp-server/dist/server.js"
  ],
  "env": {
    "SMART_FILE_ORGANIZER_PROJECT_ROOT": "${workspaceFolder}",
    "SMART_FILE_ORGANIZER_CONFIG_DIR": "${workspaceFolder}/configuration/smart-file-organizer"
  }
}
```

**Configuration directory:** ❌ Create `configuration/smart-file-organizer/`

---

### 8. spec-driven-mcp-server

**Status:** 🟡 MISSING CONFIG DIRECTORY

**What it does:** Spec-driven development workflow guidance

**Required environment variables:**
- `SPEC_DRIVEN_CONFIG_DIR` - Configuration directory (set to `${workspaceFolder}/configuration/spec-driven`)

**Current .mcp.json entry:** ✅ Correct (but needs portable path)
```json
"spec-driven": {
  "command": "node",
  "args": [
    "${workspaceFolder}/local-instances/mcp-servers/spec-driven-mcp-server/dist/server.js"
  ],
  "env": {
    "SPEC_DRIVEN_CONFIG_DIR": "${workspaceFolder}/configuration/spec-driven"
  }
}
```

**Configuration directory:** ❌ Create `configuration/spec-driven/`

---

### 9. task-executor-mcp-server

**Status:** 🟢 FULLY CONFIGURED

**What it does:** Task execution workflow management

**Required environment variables:** NONE

**Current .mcp.json entry:** ✅ Correct (but needs portable path)
```json
"task-executor": {
  "command": "node",
  "args": [
    "${workspaceFolder}/local-instances/mcp-servers/task-executor-mcp-server/dist/server.js"
  ]
}
```

**Configuration directory:** Not required

---

## Key Configuration Concepts

### 1. Environment Variables

**Purpose:** Configure MCP servers without hardcoding values

**Common patterns:**
- `{SERVER}_PROJECT_ROOT` - Workspace root directory
- `{SERVER}_CONFIG_DIR` - Server-specific configuration directory
- `{SERVER}_DEBUG` - Enable debug logging

**Special variable:** `${workspaceFolder}` is replaced by Claude Code with the actual workspace path, making configurations portable across machines.

---

### 2. Configuration Directories

**Purpose:** Store server-specific data (learned patterns, state, caches)

**Location:** `${workspaceFolder}/configuration/{server-name}/`

**Why needed:**
- Persist learned patterns across sessions
- Store server state
- Cache data for performance
- Keep configuration separate from code

**Current issue:** Most config directories don't exist yet (they're created on first use by most servers)

---

### 3. Portable vs Hardcoded Paths

**❌ Bad (hardcoded):**
```json
"args": [
  "/Users/mmaruthurnew/Desktop/medical-practice-workspace/local-instances/..."
]
```

**✅ Good (portable):**
```json
"args": [
  "${workspaceFolder}/local-instances/..."
]
```

**Why it matters:** Portable paths work on any machine, in any location

---

### 4. MCP Scopes

**What they are:** Permissions that control what MCP servers can access

**Common scopes:**
- File system access
- Network access
- Subprocess execution

**Where configured:** In Claude Code settings (not .mcp.json)

**Current issue:** Need to check if scopes are properly set for each server

---

## Common Issues & Fixes

### Issue 1: MCP Server Not Appearing

**Symptoms:** Server tools don't show up in Claude Code

**Causes:**
- Not in .mcp.json
- Build failed (no dist/server.js)
- Syntax error in .mcp.json

**Fix:**
1. Check server is in .mcp.json
2. Verify `dist/server.js` exists
3. Validate JSON syntax
4. Restart Claude Code

---

### Issue 2: Server Starts But Tools Fail

**Symptoms:** Server loads but tool calls error

**Causes:**
- Missing environment variables
- Invalid paths in env vars
- Missing configuration directory
- Insufficient scopes

**Fix:**
1. Check all required env vars are set
2. Verify paths are valid
3. Create missing config directories
4. Check Claude Code scope settings

---

### Issue 3: Path Errors

**Symptoms:** "File not found" or "Directory not found" errors

**Causes:**
- Hardcoded paths instead of `${workspaceFolder}`
- Missing configuration directory
- Typo in path

**Fix:**
1. Replace hardcoded paths with `${workspaceFolder}`
2. Create missing directories
3. Double-check spelling

---

## Recommended Actions

### Immediate Fixes Needed:

1. **Add project-management-mcp-server to .mcp.json** (Critical)
2. **Create missing configuration directories:**
   ```bash
   mkdir -p configuration/{git-assistant,learning-optimizer,project-index-generator,smart-file-organizer,spec-driven,communications}
   ```

3. **Update .mcp.json to use portable paths:**
   - Replace all hardcoded paths with `${workspaceFolder}`

4. **Configure communications server:**
   - Add SMTP credentials (if email functionality needed)
   - Or remove from .mcp.json if not used

### Validation Script:

```bash
# Run from workspace root
for server in ai-planning arc-decision communications git-assistant learning-optimizer project-index-generator smart-file-organizer spec-driven task-executor; do
  echo "Checking $server..."

  # Check dist/server.js exists
  if [ -f "local-instances/mcp-servers/${server}-mcp-server/dist/server.js" ]; then
    echo "  ✅ Built"
  else
    echo "  ❌ Not built"
  fi

  # Check in .mcp.json
  if grep -q "\"${server}\"" .mcp.json 2>/dev/null; then
    echo "  ✅ In .mcp.json"
  else
    echo "  ❌ Not in .mcp.json"
  fi
done
```

---

## Environment Variable Best Practices

1. **Use ${workspaceFolder}** for all workspace-relative paths
2. **Set PROJECT_ROOT** for servers that need workspace access
3. **Set CONFIG_DIR** for servers that persist state
4. **Use descriptive names** prefixed with server name
5. **Document all env vars** in server README
6. **Never commit secrets** - use .gitignore for .mcp.json or separate .env

---

## Additional Configuration Types

Beyond environment variables, MCP servers may need:

### 1. **Server-Specific Config Files**
- Stored in `configuration/{server-name}/`
- Usually JSON or YAML
- Created by server on first run

### 2. **Credentials/Secrets**
- API keys
- OAuth tokens
- Passwords
- Store in .mcp.json (gitignored) or separate .env file

### 3. **Runtime State**
- Learning patterns
- Caches
- Session data
- Automatically managed by servers

### 4. **Claude Code Scopes**
- Configured in Claude Code UI
- Control file/network/subprocess access
- Must be granted for servers to work

### 5. **Build Configuration**
- package.json
- tsconfig.json
- Usually don't need changes after setup

---

## Testing Configuration

After making changes:

1. **Restart Claude Code**
2. **Check MCP status in Claude Code settings**
3. **Try calling a tool from each server**
4. **Check server logs for errors**
5. **Verify config directories are created**

---

## Questions to Answer

1. Are there any other configuration directories that should exist?
2. Which servers actually need config directories vs just nice-to-have?
3. What scopes are currently set in Claude Code?
4. Are there any .env files that should be referenced?
5. Should communications server be configured or removed?

---

*Last updated: 2025-10-26*
