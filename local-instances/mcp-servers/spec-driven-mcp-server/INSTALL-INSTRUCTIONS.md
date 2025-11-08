---
type: reference
phase: stable
project: spec-driven-mcp-server
tags: [MCP, mcp-server, spec-driven, workflow]
category: mcp-servers
status: completed
priority: medium
---

# AI Installation Instructions

**Template:** Spec-Driven Development MCP Server
**Version:** 1.0.0
**Auto-Installation:** Supported

---

## Overview

This template provides a self-installing MCP server for Spec-Driven Development workflows. When an AI assistant detects this template, it should follow these instructions to install it properly.

---

## Pre-Flight Checklist

**CRITICAL:** Before starting installation, AI MUST execute the pre-installation checklist.

### Step 0: Run Pre-Installation Checks

**Location:** `${WORKSPACE_ROOT}/Templates-for-tools-frameworks-mcp-servers/mcp-server-templates/TROUBLESHOOTING.md`

**Instructions:**

1. **Read TROUBLESHOOTING.md** in the mcp-server-templates folder
2. **Execute ALL checks** in the "🚨 FOR AI ASSISTANTS: PRE-INSTALLATION CHECKLIST" section
3. **Report results to user** using the "Pre-Installation Results" template
4. **STOP if any check fails** - provide fix instructions and wait for user to resolve
5. **Only proceed to Step 1** when ALL checks pass

**Why this matters:**
- Catches common issues BEFORE installation attempts
- Prevents wasted time on failing installations
- Provides clear diagnosis when prerequisites are missing

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

# ... (run all checks from TROUBLESHOOTING.md)
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

**Target Path:** `${WORKSPACE_ROOT}/Templates-for-tools-frameworks-mcp-servers/mcp-server-templates/templates/`

1. Check if directory exists
2. If NO: Create the full directory path
3. If YES: Verify it's writable

**Result:** Template storage location ready

---

### Step 3: Move/Copy Template to Storage (if not already there)

**Source:** Current template location
**Destination:** `${WORKSPACE_ROOT}/Templates-for-tools-frameworks-mcp-servers/mcp-server-templates/templates/spec-driven-mcp-server-template/`

1. Check if template is already in Templates folder
2. If NO: Copy entire template directory there
3. Preserve original if dropped elsewhere (don't delete user's copy)

**Result:** Template stored in standard location

---

### Step 4: Create Working Instance Directory

**Target Path:** `${WORKSPACE_ROOT}/local-instances/mcp-servers/`

1. Check if directory exists
2. If NO: Create the full directory path
3. If YES: Check for existing `spec-driven-mcp-server` installation

**Result:** Local instances directory ready

---

### Step 5: Copy Template to Working Instance

**Source:** `${WORKSPACE_ROOT}/Templates-for-tools-frameworks-mcp-servers/mcp-server-templates/templates/spec-driven-mcp-server-template/`
**Destination:** `${WORKSPACE_ROOT}/local-instances/mcp-servers/spec-driven-mcp-server/`

**Exclude from copy:**
- `node_modules/` (will be installed fresh)
- `dist/` (will be built fresh)
- `.git/` (if present)
- `INSTALL-INSTRUCTIONS.md` (AI-only file)

**Copy everything else:**
- `src/` directory with all source code
- `package.json` and `package-lock.json`
- `tsconfig.json`
- `.gitignore`
- `.env.example`
- `docs/` directory
- `README.md`
- `install.sh` and `configure-mcp.sh` (for manual use)

**Result:** Fresh working copy in local-instances

---

### Step 6: Install Dependencies

**Working Directory:** `${WORKSPACE_ROOT}/local-instances/mcp-servers/spec-driven-mcp-server/`

**Command:** `npm install`

**Expected Output:**
- `node_modules/` directory created
- All dependencies from `package.json` installed
- No errors

**Verification:**
- Check that `node_modules/@modelcontextprotocol/sdk` exists
- Check that `node_modules/typescript` exists

**Result:** All dependencies installed

---

### Step 7: Build TypeScript

**Working Directory:** `${WORKSPACE_ROOT}/local-instances/mcp-servers/spec-driven-mcp-server/`

**Command:** `npm run build`

**Expected Output:**
- `dist/` directory created
- TypeScript compiled to JavaScript
- `dist/server.js` exists
- No compilation errors

**Verification:**
- Check that `dist/server.js` exists
- Check that `dist/server.js` is not empty
- File size should be > 10KB

**Result:** Server built and ready to run

---

### Step 8: Configure MCP (Optional but Recommended)

**Target File:**
- macOS: `~/Library/Application Support/Claude/claude_desktop_config.json`
- Windows: `%APPDATA%\Claude\claude_desktop_config.json`

**Before modifying:**
1. Create backup: `claude_desktop_config.backup.json`
2. Read existing config
3. Parse as JSON

**Configuration to add:**
```json
{
  "mcpServers": {
    "spec-driven": {
      "command": "node",
      "args": [
        "${ABSOLUTE_PATH}/local-instances/mcp-servers/spec-driven-mcp-server/dist/server.js"
      ]
    }
  }
}
```

**Important:**
- Replace `${ABSOLUTE_PATH}` with the actual absolute path to `WORKSPACE_ROOT`
- Merge with existing `mcpServers` if present (don't overwrite)
- Preserve all other configuration

**Result:** Claude Code configured to use the MCP server

---

### Step 9: Post-Installation Learning (Auto-Learning System)

**Purpose:** If any issues were encountered during installation, document them in TROUBLESHOOTING.md so future installations can avoid the same problems.

**Location to Update:** `${WORKSPACE_ROOT}/Templates-for-tools-frameworks-mcp-servers/mcp-server-templates/TROUBLESHOOTING.md`

#### When to Add Auto-Learned Issues

Add a new issue to TROUBLESHOOTING.md if:
- ✅ Installation encountered an error that required troubleshooting
- ✅ Error was resolved successfully
- ✅ Issue is NOT already documented in TROUBLESHOOTING.md
- ✅ Solution could help prevent future installation failures

#### How to Document New Issues

**AI must append to the "Auto-Learned Issues" section:**

```markdown
#### Auto-Learned Issue #X: [Brief Description]

**First Encountered:** YYYY-MM-DD
**Frequency:** 1 occurrence
**Last Seen:** YYYY-MM-DD

**Symptom:**
[Exact error message or observable behavior that was seen]

**Context:**
- OS: [macOS/Windows/Linux]
- Node version: [X.X.X]
- npm version: [X.X.X]
- Installation step: [Which step failed - e.g., "Step 6: npm install"]
- Template: spec-driven-mcp-server-template

**Root Cause:**
[Why this happened - be specific about the underlying issue]

**Solution:**
[Step-by-step fix that resolved the issue]

**Prevention:**
[How to avoid in future - suggest pre-flight check if applicable]

---
```

#### Example: Documenting a New Issue

**Scenario:** npm install failed due to network timeout

```markdown
#### Auto-Learned Issue #26: npm install timeout on slow networks

**First Encountered:** 2025-10-17
**Frequency:** 1 occurrence
**Last Seen:** 2025-10-17

**Symptom:**
```
npm install
npm ERR! network timeout at: https://registry.npmjs.org/@modelcontextprotocol/sdk/-/sdk-1.0.4.tgz
npm ERR! network This is a problem related to network connectivity.
```

**Context:**
- OS: macOS 14.2
- Node version: 20.11.1
- npm version: 10.2.4
- Installation step: Step 6: npm install
- Template: spec-driven-mcp-server-template

**Root Cause:**
Slow or unreliable network connection causing npm registry requests to timeout before completion.

**Solution:**
1. Increase npm timeout: `npm config set timeout 60000`
2. Retry installation: `npm install`
3. If still failing, try alternative registry: `npm config set registry https://registry.npmmirror.com`

**Prevention:**
- Added to pre-flight checklist: Check network connectivity with `curl -I https://registry.npmjs.org/`
- Consider testing download speed before installation

---
```

#### Updating Existing Issues

If an issue already exists in TROUBLESHOOTING.md but was encountered again:

1. **Update "Frequency":** Increment occurrence count
2. **Update "Last Seen":** Update to current date
3. **Enhance "Solution":** Add any new insights or alternative fixes
4. **Do NOT create duplicate entry**

#### AI Instructions for Learning

**After installation completes:**

1. **Review what happened:**
   - Did all steps complete successfully without errors?
   - Were any errors encountered that required troubleshooting?
   - Was the solution found in existing TROUBLESHOOTING.md or discovered during session?

2. **If new issue discovered:**
   - Read TROUBLESHOOTING.md to check if issue already documented
   - If NOT documented: Add new auto-learned issue using format above
   - If documented: Update frequency and last seen date

3. **Report to user:**
   ```
   📚 Installation Learning Update:

   ✓ New issue documented: "npm install timeout on slow networks"
   ✓ Added to: Templates-for-tools-frameworks-mcp-servers/mcp-server-templates/TROUBLESHOOTING.md
   ✓ Future installations will check for this issue in pre-flight checklist

   This knowledge will be synced to GitHub and shared with all users.
   ```

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
I found the spec-driven-mcp-server-template.

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
✓ Create Templates-for-tools-frameworks-mcp-servers/mcp-server-templates/templates/ (if needed)
✓ Store template in Templates folder (preserved for reuse)
✓ Create local-instances/mcp-servers/
✓ Copy template to local-instances/mcp-servers/spec-driven-mcp-server/
✓ Run npm install
✓ Run npm run build
✓ Configure Claude Code MCP settings (optional)
✓ Document any issues for future installations

Workspace Root: /path/to/workspace
Template Storage: Templates-for-tools-frameworks-mcp-servers/mcp-server-templates/templates/spec-driven-mcp-server-template
Working Instance: local-instances/mcp-servers/spec-driven-mcp-server

Proceed with installation? (y/n)
```

**If pre-flight checks fail:**

```
I found the spec-driven-mcp-server-template.

Pre-Flight Checklist: ❌ FAILED
✓ Node.js: v20.11.1 (OK)
✗ npm: 7.24.0 (NEEDS UPGRADE - 8.0.0+ required)
✓ Git: installed
✓ Disk space: 45GB free
✗ Network: Cannot reach registry.npmjs.org (CHECK CONNECTION)

Cannot proceed with installation until issues are resolved.

Fix Instructions:
1. Upgrade npm: npm install -g npm@latest
2. Check network connection
3. Run pre-flight checks again

Would you like me to help troubleshoot these issues? (y/n)
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
- Check Claude Code config file exists
- Check file is valid JSON before modification
- Restore from backup if modification fails
- Suggest manual configuration steps

---

## Verification

After installation, verify:

1. **Pre-flight passed:** All checks from Step 0 completed successfully
2. **Template exists:** `Templates-for-tools-frameworks-mcp-servers/mcp-server-templates/templates/spec-driven-mcp-server-template/`
3. **Instance exists:** `local-instances/mcp-servers/spec-driven-mcp-server/`
4. **Dependencies installed:** `local-instances/mcp-servers/spec-driven-mcp-server/node_modules/` exists
5. **Built successfully:** `local-instances/mcp-servers/spec-driven-mcp-server/dist/server.js` exists
6. **MCP configured:** Claude Code config contains "spec-driven" entry
7. **Learning completed:** Any new issues documented in TROUBLESHOOTING.md (Step 9)

**Success Message (No Issues):**
```
✅ Installation Complete!

Pre-Flight Checks: ✅ All passed
Template stored at: Templates-for-tools-frameworks-mcp-servers/mcp-server-templates/templates/spec-driven-mcp-server-template/
Working instance at: local-instances/mcp-servers/spec-driven-mcp-server/
Server ready at: local-instances/mcp-servers/spec-driven-mcp-server/dist/server.js
MCP Configuration: Updated successfully

Installation Statistics:
- Dependencies installed: 92 packages
- Build time: ~2 seconds
- Total time: ~15 seconds
- Issues encountered: 0

Next Steps:
1. Restart Claude Code to load the new MCP server
2. Verify with: "Do you have access to the sdd_guide tool?"
3. Start using: "I want to build a new feature using spec-driven development"

Documentation: local-instances/mcp-servers/spec-driven-mcp-server/README.md
```

**Success Message (With Issues Resolved):**
```
✅ Installation Complete!

Pre-Flight Checks: ✅ All passed
Template stored at: Templates-for-tools-frameworks-mcp-servers/mcp-server-templates/templates/spec-driven-mcp-server-template/
Working instance at: local-instances/mcp-servers/spec-driven-mcp-server/
Server ready at: local-instances/mcp-servers/spec-driven-mcp-server/dist/server.js
MCP Configuration: Updated successfully

Installation Statistics:
- Dependencies installed: 92 packages
- Build time: ~2 seconds
- Total time: ~18 seconds
- Issues encountered: 1 (resolved)

📚 Installation Learning:
✓ New issue documented: "npm install timeout on slow networks"
✓ Updated: Templates-for-tools-frameworks-mcp-servers/mcp-server-templates/TROUBLESHOOTING.md
✓ Future installations will benefit from this knowledge

Next Steps:
1. Restart Claude Code to load the new MCP server
2. Verify with: "Do you have access to the sdd_guide tool?"
3. Start using: "I want to build a new feature using spec-driven development"

Documentation: local-instances/mcp-servers/spec-driven-mcp-server/README.md
```

---

## Re-Installation

If the user wants to reinstall or create a fresh instance:

1. Template is already in Templates folder (don't move again)
2. Optionally remove old instance: `rm -rf local-instances/mcp-servers/spec-driven-mcp-server/`
3. Copy template fresh from Templates folder
4. Run npm install and build
5. MCP config already exists (don't duplicate)

---

## Template Preservation

**IMPORTANT:** The template in `Templates-for-tools-frameworks-mcp-servers/mcp-server-templates/templates/` should NEVER be modified during installation.

- It serves as the source of truth
- Users can create multiple instances from it
- It can be updated independently
- Always copy FROM template, never modify template itself

---

## For Future AI Assistants

This installation pattern is **standardized** across all MCP server templates in this workspace.

### What to Look For

- **`TEMPLATE-INFO.json`** - Machine-readable metadata about the template
- **`INSTALL-INSTRUCTIONS.md`** - This file with step-by-step installation guide
- **`TROUBLESHOOTING.md`** - Pre-installation checklist and known issues (in mcp-server-templates folder)
- **Standard paths:** Templates folder → local-instances

### Installation Pattern

1. **Pre-Flight First:** Always run Step 0 (pre-installation checklist) before attempting installation
2. **Template Preservation:** Never modify the template in Templates folder
3. **Working Instance:** Create fresh copy in local-instances for actual use
4. **Auto-Learning:** Document any new issues in TROUBLESHOOTING.md for future installations
5. **Consistency:** All MCP server templates follow this exact pattern

### Auto-Learning System

Every installation contributes to collective knowledge:
- Issues encountered → Documented in TROUBLESHOOTING.md
- Solutions discovered → Added to troubleshooting guide
- Pre-flight checks → Enhanced based on learned issues
- Knowledge shared → Via GitHub sync for all users

This creates a **self-improving installation system** that gets better with each use.

### Key Files

```
Templates-for-tools-frameworks-mcp-servers/
└── mcp-server-templates/
    ├── TROUBLESHOOTING.md              ← Shared knowledge base (READ FIRST)
    ├── TEMPLATE-CREATION-GUIDE.md      ← How to create new templates
    └── templates/
        └── [template-name]/
            ├── TEMPLATE-INFO.json      ← Metadata (REQUIRED)
            ├── INSTALL-INSTRUCTIONS.md ← AI guide (REQUIRED)
            └── [source files]          ← Template content

local-instances/
└── mcp-servers/
    └── [server-name]/                  ← Working instance (created during install)
```

All MCP server templates in this workspace follow this pattern for consistency.
