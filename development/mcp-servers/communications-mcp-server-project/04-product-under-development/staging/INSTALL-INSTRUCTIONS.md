---
type: template
phase: stable
tags: [mcp-server, installation]
category: templates
status: completed
priority: medium
---

# AI Installation Instructions

**Template:** Communications MCP Server
**Version:** 1.0.0
**Auto-Installation:** Supported

---

## Overview

This template provides a self-installing MCP server for email and Google Chat communications with staging/approval workflow. When an AI assistant detects this template, it should follow these instructions to install it properly.

---

## Pre-Flight Checklist

**CRITICAL:** Before starting installation, AI MUST execute the pre-installation checklist.

### Step 0: Run Pre-Installation Checks

**Location:** `${WORKSPACE_ROOT}/templates-and-patterns/mcp-server-templates/TROUBLESHOOTING.md`

**Instructions:**

1. **Read TROUBLESHOOTING.md** in the mcp-server-templates folder
2. **Execute ALL checks** in the "🚨 FOR AI ASSISTANTS: PRE-INSTALLATION CHECKLIST" section
3. **Report results to user** using the "Pre-Installation Results" template
4. **STOP if any check fails** - provide fix instructions and wait for user to resolve
5. **Only proceed to Step 1** when ALL checks pass

**Example Check Execution:**
```bash
# Check Node.js version
node --version  # Must be >= 18.0.0

# Check npm version
npm --version   # Must be >= 8.0.0

# Check git is installed
git --version

# Check disk space
df -h .  # Must have >500MB free
```

**Report to User:**
```
Pre-Installation Checklist Results:

✓ Node.js version: v20.11.1 (>= 18.0.0 required)
✓ npm version: 10.2.4 (>= 8.0.0 required)
✓ Git installed: version 2.39.2
✓ Disk space: 45GB free (>500MB required)
✓ Network connectivity: OK
✓ Write permissions: OK
✓ Workspace root detected: /Users/you/workspace
✓ Templates folder: Ready
✓ Local instances folder: Ready
✓ No installation conflicts

✅ All checks passed - Safe to proceed with installation

Proceed with installation? (y/n)
```

---

## Installation Steps for AI

### Step 1: Detect Workspace Root

Find the workspace root directory by:
- Looking for `.git` directory (git repository root)
- Looking for `package.json` in parent directories
- Using the directory 2-3 levels up from the template location

**Store as:** `WORKSPACE_ROOT`

---

### Step 2: Create Template Storage Directory (if needed)

**Target Path:** `${WORKSPACE_ROOT}/templates-and-patterns/mcp-server-templates/templates/`

1. Check if directory exists
2. If NO: Create the full directory path
3. If YES: Verify it's writable

**Result:** Template storage location ready

---

### Step 3: Move/Copy Template to Storage (if not already there)

**Source:** Current template location
**Destination:** `${WORKSPACE_ROOT}/templates-and-patterns/mcp-server-templates/templates/communications-mcp-server-template/`

1. Check if template is already in Templates folder
2. If NO: Copy entire template directory there
3. Preserve original if dropped elsewhere (don't delete user's copy)

**Result:** Template stored in standard location

---

### Step 4: Create Working Instance Directory

**Target Path:** `${WORKSPACE_ROOT}/local-instances/mcp-servers/`

1. Check if directory exists
2. If NO: Create the full directory path
3. If YES: Check for existing `communications-mcp-server` installation

**Result:** Local instances directory ready

---

### Step 5: Copy Template to Working Instance

**Source:** `${WORKSPACE_ROOT}/templates-and-patterns/mcp-server-templates/templates/communications-mcp-server-template/`
**Destination:** `${WORKSPACE_ROOT}/local-instances/mcp-servers/communications-mcp-server/`

**Exclude from copy:**
- `node_modules/` (will be installed fresh)
- `dist/` (will be built fresh)
- `.git/` (if present)
- `INSTALL-INSTRUCTIONS.md` (AI-only file)
- `TEMPLATE-INFO.json` (template metadata, not needed in instance)
- `staging-db.json` (will be created fresh)

**Copy everything else:**
- `src/` directory with all source code
- `package.json` and `package-lock.json`
- `tsconfig.json`
- `.gitignore`
- `public/` directory (review server HTML)
- `README.md`, `SETUP.md`, `STAGING_WORKFLOW.md`, `QUICK_START_STAGING.md`
- `install.sh` and `configure-mcp.sh` (for manual use)
- `planning-and-roadmap/` directory

**Result:** Fresh working copy in local-instances

---

### Step 6: Install Dependencies

**Working Directory:** `${WORKSPACE_ROOT}/local-instances/mcp-servers/communications-mcp-server/`

**Command:** `npm install`

**Expected Output:**
- `node_modules/` directory created
- All dependencies from `package.json` installed
- No errors

**Verification:**
- Check that `node_modules/@modelcontextprotocol/sdk` exists
- Check that `node_modules/typescript` exists
- Check that `node_modules/nodemailer` exists
- Check that `node_modules/googleapis` exists
- Check that `node_modules/express` exists

**Result:** All dependencies installed

---

### Step 7: Build TypeScript

**Working Directory:** `${WORKSPACE_ROOT}/local-instances/mcp-servers/communications-mcp-server/`

**Command:** `npm run build`

**Expected Output:**
- `dist/` directory created
- TypeScript compiled to JavaScript
- `dist/server.js` exists
- `dist/review-server.js` exists
- `dist/staging-db.js` exists
- No compilation errors

**Verification:**
- Check that `dist/server.js` exists and is not empty (should be > 10KB)
- Check that `dist/review-server.js` exists
- Check that `dist/staging-db.js` exists

**Result:** Server built and ready to run

---

### Step 8: Configure MCP (REQUIRED)

**IMPORTANT:** This step is **mandatory** - MCP configuration is essential for the server to work with Claude Code.

**Target File:**
- Workspace: `${WORKSPACE_ROOT}/.mcp.json` (preferred for workspace-specific config)
- OR Global:
  - macOS: `~/Library/Application Support/Claude/claude_desktop_config.json`
  - Windows: `%APPDATA%\Claude\claude_desktop_config.json`
  - Linux: `~/.config/Claude/claude_desktop_config.json`

**Before modifying:**
1. Check if workspace `.mcp.json` exists
2. If exists: Read and parse as JSON
3. If not exists: Create new config file
4. Create backup: `.mcp.json.backup`

**Configuration to add:**
```json
{
  "mcpServers": {
    "communications": {
      "command": "node",
      "args": [
        "${workspaceFolder}/local-instances/mcp-servers/communications-mcp-server/dist/server.js"
      ]
    }
  }
}
```

**Optional environment variables** (add if user wants specific methods):
```json
{
  "mcpServers": {
    "communications": {
      "command": "node",
      "args": [
        "${workspaceFolder}/local-instances/mcp-servers/communications-mcp-server/dist/server.js"
      ],
      "env": {
        "SMTP_HOST": "smtp.gmail.com",
        "SMTP_PORT": "587",
        "SMTP_USER": "user@gmail.com",
        "SMTP_PASSWORD": "app-password-here",
        "SMTP_FROM": "user@gmail.com"
      }
    }
  }
}
```

**Important:**
- Use `${workspaceFolder}` for portable paths (recommended)
- OR use absolute path: `${ABSOLUTE_PATH}/local-instances/...`
- Merge with existing `mcpServers` if present (don't overwrite)
- Preserve all other configuration
- Environment variables are OPTIONAL - server works without them (webhook method)

**Result:** Claude Code configured to use the MCP server

---

### Step 9: Post-Installation Guidance

**Important:** Unlike other MCP servers, the communications server has optional configuration.

**Tell the user:**

```
✅ Communications MCP Server installed successfully!

The server is now configured and ready to use with ANY of these methods:

1. Google Chat Webhook (EASIEST - No setup needed!)
   - Create webhook in Google Chat space
   - Use: "Send 'message' to Google Chat webhook [URL]"

2. SMTP Email (Simple - requires email credentials)
   - See SETUP.md for Gmail App Password setup
   - Add SMTP_* env vars to .mcp.json
   - Restart Claude Code

3. Gmail API / Google Chat API (Advanced - requires OAuth)
   - See SETUP.md for OAuth setup
   - Add GOOGLE_CLIENT_ID, etc. to .mcp.json
   - Restart Claude Code

📋 Staging & Approval Workflow:
   - Start review server: cd local-instances/mcp-servers/communications-mcp-server && npm run review-server
   - Stage emails for review before sending
   - Approve via web dashboard: http://localhost:3001/review
   - See STAGING_WORKFLOW.md for full guide

Documentation:
   - Quick start: local-instances/mcp-servers/communications-mcp-server/README.md
   - Setup guide: local-instances/mcp-servers/communications-mcp-server/SETUP.md
   - Staging workflow: local-instances/mcp-servers/communications-mcp-server/STAGING_WORKFLOW.md
```

**Result:** User informed about configuration options

---

### Step 10: Post-Installation Learning (Auto-Learning System)

**Purpose:** If any issues were encountered during installation, document them in TROUBLESHOOTING.md so future installations can avoid the same problems.

**Location to Update:** `${WORKSPACE_ROOT}/templates-and-patterns/mcp-server-templates/TROUBLESHOOTING.md`

#### When to Add Auto-Learned Issues

Add a new issue to TROUBLESHOOTING.md if:
- ✅ Installation encountered an error that required troubleshooting
- ✅ Error was resolved successfully
- ✅ Issue is NOT already documented in TROUBLESHOOTING.md
- ✅ Solution could help prevent future installation failures

#### How to Document New Issues

Follow the same format as Step 9 in the spec-driven template INSTALL-INSTRUCTIONS.md.

**Result:** Continuous improvement of installation process through automated learning

---

## User Confirmation Flow

**AI must follow this sequence:**

1. **Read TEMPLATE-INFO.json** to understand what will be installed
2. **Execute Pre-Flight Checklist** (Step 0) and report results
3. **Show Installation Plan** to user
4. **Wait for user confirmation** before proceeding

**Confirmation Message:**

```
I found the communications-mcp-server-template.

Pre-Flight Checklist: ✅ ALL CHECKS PASSED
✓ Node.js: v20.11.1 (>= 18.0.0 required)
✓ npm: 10.2.4 (>= 8.0.0 required)
✓ Git: installed
✓ Disk space: 45GB free
✓ Network: OK
✓ Permissions: OK
✓ No conflicts detected

Installation Plan:
✓ Run pre-installation checks
✓ Create templates-and-patterns/mcp-server-templates/templates/ (if needed)
✓ Store template in Templates folder (preserved for reuse)
✓ Create local-instances/mcp-servers/
✓ Copy template to local-instances/mcp-servers/communications-mcp-server/ (excluding node_modules/)
✓ Run npm install
✓ Run npm run build
✓ Configure Claude Code MCP settings (REQUIRED)
✓ Document any issues for future installations

Workspace Root: /path/to/workspace
Template Storage: templates-and-patterns/mcp-server-templates/templates/communications-mcp-server-template
Working Instance: local-instances/mcp-servers/communications-mcp-server

Features:
- Email via SMTP (Gmail, Outlook, any provider)
- Email via Gmail API with OAuth
- Google Chat via API or webhook
- Staging & approval workflow with web dashboard
- Multiple authentication methods

Proceed with installation? (y/n)
```

**If user confirms and checks passed, execute Steps 1-9.**

---

## Error Handling

### If npm install fails:
- Check Node.js version (requires >= 18.0.0)
- Check npm version (requires >= 8.0.0)
- Check network connectivity
- Suggest: `rm -rf node_modules && npm install`

### If npm run build fails:
- Check TypeScript is installed in node_modules
- Check tsconfig.json exists
- Check src/ directory has .ts files
- Show compilation errors to user

### If MCP config fails:
- Check workspace .mcp.json or global config file exists
- Check file is valid JSON before modification
- Restore from backup if modification fails
- Suggest manual configuration steps

---

## Verification

After installation, verify:

1. **Pre-flight passed:** All checks from Step 0 completed successfully
2. **Template exists:** `templates-and-patterns/mcp-server-templates/templates/communications-mcp-server-template/`
3. **Instance exists:** `local-instances/mcp-servers/communications-mcp-server/`
4. **Dependencies installed:** `local-instances/mcp-servers/communications-mcp-server/node_modules/` exists
5. **Built successfully:** `local-instances/mcp-servers/communications-mcp-server/dist/server.js` exists
6. **Review server built:** `local-instances/mcp-servers/communications-mcp-server/dist/review-server.js` exists
7. **MCP configured:** Config file contains "communications" entry

**Success Message:**
```
✅ Installation Complete!

Pre-Flight Checks: ✅ All passed
Template stored at: templates-and-patterns/mcp-server-templates/templates/communications-mcp-server-template/
Working instance at: local-instances/mcp-servers/communications-mcp-server/
Server ready at: local-instances/mcp-servers/communications-mcp-server/dist/server.js
MCP Configuration: Updated successfully

Installation Statistics:
- Dependencies installed: ~110 packages
- Build time: ~3 seconds
- Total time: ~20 seconds
- Issues encountered: 0

Next Steps:
1. Restart Claude Code to load the new MCP server
2. Choose communication method:
   - Webhook (easiest): No setup needed
   - SMTP: Follow SETUP.md for credentials
   - OAuth: Follow SETUP.md for Google OAuth
3. Optional: Start review server for staging workflow
   cd local-instances/mcp-servers/communications-mcp-server && npm run review-server
4. Test with: "Send 'Hello' to Google Chat webhook [URL]"

Documentation: local-instances/mcp-servers/communications-mcp-server/README.md
```

---

## Re-Installation

If the user wants to reinstall or create a fresh instance:

1. Template is already in Templates folder (don't move again)
2. Optionally remove old instance: `rm -rf local-instances/mcp-servers/communications-mcp-server/`
3. Copy template fresh from Templates folder
4. Run npm install and build
5. MCP config already exists (don't duplicate)

---

## Template Preservation

**IMPORTANT:** The template in `templates-and-patterns/mcp-server-templates/templates/` should NEVER be modified during installation.

- It serves as the source of truth
- Users can create multiple instances from it
- It can be updated independently
- Always copy FROM template, never modify template itself

---

## For Future AI Assistants

This installation pattern is **standardized** across all MCP server templates in this workspace.

The communications server has these unique characteristics:
1. **Optional configuration** - Works with webhooks (no setup), SMTP (simple), or OAuth (advanced)
2. **Review server component** - Separate Express server for email staging/approval
3. **Staging database** - Local JSON database for approval workflow
4. **Multiple tools** - 14 tools covering email, chat, staging, and approval

See the main TEMPLATE-INFO.json for full feature list and trigger keywords.
