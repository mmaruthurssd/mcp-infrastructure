---
type: troubleshooting-log
domain: mcp-configuration
tags: [configuration, troubleshooting, learning-optimizer, auto-optimization]
created: 2025-10-29
status: active
---

# MCP Configuration Issues

**Domain:** `mcp-configuration`
**Learning-Optimizer Tracking:** Enabled
**Related Checklist:** [MCP-CONFIGURATION-CHECKLIST.md](../MCP-CONFIGURATION-CHECKLIST.md)
**Optimization Triggers:** 3+ occurrences OR 5+ total issues

---

## Domain Statistics

**Last Updated:** 2025-10-29
**Total Issues:** 2 (Issue #001, Issue #002)
**High-Frequency Issues (3+):** 0
**Promoted to Checklist:** 0
**Prevention Success Rate:** N/A (no promotions yet)

---

## How to Use This File

### AI Assistants

When encountering a configuration issue:

1. **Resolve the issue first**
2. **Check if issue already exists** - Search this file
3. **If new:** Use `track_issue(domain="mcp-configuration", ...)`
4. **If existing:** Frequency auto-incremented by learning-optimizer
5. **Check triggers:** Use `check_optimization_triggers(domain="mcp-configuration")`
6. **If met:** Use `optimize_knowledge_base(domain="mcp-configuration")`
7. **If promoted:** Update MCP-CONFIGURATION-CHECKLIST.md with preventive check

### Users

- Review this file when configuration issues occur
- Check for existing solutions before troubleshooting
- Request optimization when patterns emerge
- Verify preventive checks after promotion

---

## Issue Template

When adding new issues, use this format:

```markdown
### Issue #XXX: [Brief Description]

**Domain:** mcp-configuration
**First Encountered:** YYYY-MM-DD
**Frequency:** 1 occurrence
**Last Seen:** YYYY-MM-DD
**Status:** active

#### Symptom
[Exact error message or observable behavior]

#### Context
- **MCP:** [MCP name]
- **Phase:** [Development/Testing/Deployment]
- **Environment:** [OS, Node version, npm version]
- **Configuration File:** [.mcp.json or config.json]
- **Step:** [Which configuration step]

#### Root Cause
[Technical explanation of why this happened]

#### Solution
[Step-by-step resolution]
```bash
# Commands that resolved the issue
```

#### Prevention
[How to avoid in future - becomes preventive check if promoted]

#### Promotion Status
- [ ] Frequency >= 3 (eligible for promotion)
- [ ] Added to MCP-CONFIGURATION-CHECKLIST.md
- [ ] Prevention success rate: 0/0

---
```

---

## Active Issues

### Example Issue Format (Delete when first real issue added)

This is an example of how issues should be documented. Delete this section when the first real configuration issue is logged.

---

### Issue #000: Example - Duplicate MCP Registration

**Domain:** mcp-configuration
**First Encountered:** 2025-10-29 (example)
**Frequency:** 3 occurrences (example)
**Last Seen:** 2025-10-29 (example)
**Status:** promoted (example)

#### Symptom
```
Error: MCP server 'server-name' is already registered
Configuration conflict detected
Claude Code fails to start with duplicate registration error
```

#### Context
- **MCP:** project-management-mcp (example)
- **Phase:** Deployment
- **Environment:** macOS, Node v20.11.1, npm 10.2.4
- **Configuration Files:** Both .mcp.json AND ~/.config/claude-code/config.json
- **Step:** Registration (Step 2 in deployment process)

#### Root Cause
MCP server was defined in both workspace configuration (.mcp.json) and global configuration (config.json). When Claude Code starts, it attempts to register the server from both locations, resulting in a duplicate registration error.

This typically happens when:
1. Server was initially registered globally
2. Later moved to workspace config
3. Global registration not removed
4. OR: Server accidentally added to both during initial setup

#### Solution

**Step 1: Detect Duplicates**
```bash
# Use MCP Config Manager sync tool
mcp__mcp-config-manager__sync_mcp_configs

# Or manually check both configs
cat .mcp.json | grep "server-name"
cat ~/.config/claude-code/config.json | grep "server-name"
```

**Step 2: Determine Correct Location**
Use Decision Matrix from MCP-CONFIGURATION-CHECKLIST.md Section 2:
- If server installed in workspace → Keep in .mcp.json
- If server is general-purpose → Keep in config.json
- NEVER keep in both

**Step 3: Remove from Incorrect Location**
```bash
# If keeping in workspace (.mcp.json):
# Remove from global config
vi ~/.config/claude-code/config.json
# Delete the server entry

# If keeping in global config:
# Remove from workspace config
vi .mcp.json
# Delete the server entry
```

**Step 4: Verify**
```bash
# Check duplicate is resolved
mcp__mcp-config-manager__sync_mcp_configs

# Restart Claude Code
# Verify MCP loads correctly
```

#### Prevention

**Preventive Check Added to MCP-CONFIGURATION-CHECKLIST.md Section 4:**

```markdown
## Section 4: Duplicate Prevention

### Pre-Configuration Check: Detect Existing Registrations

```bash
# Run config sync to detect duplicates
mcp__mcp-config-manager__sync_mcp_configs

# Manually verify if needed
grep -r "server-name" .mcp.json ~/.config/claude-code/config.json
```

**Pass Criteria:**
- ✅ No duplicate registrations detected
- ✅ Server appears in ONLY ONE config file (workspace OR global, never both)

**If duplicate found:**
- Determine correct location using Decision Matrix (Section 2)
- Remove from incorrect location
- Re-run sync to verify
```

#### Promotion Status
- [x] Frequency >= 3 (promoted after 3 occurrences)
- [x] Added to MCP-CONFIGURATION-CHECKLIST.md Section 4
- [x] Prevention success rate: 5/5 (100%)

**Prevention Metrics:**
- Occurrences before promotion: 3
- Builds after promotion: 5
- Times prevented by check: 5
- Prevention rate: 100%
- Time saved: ~75 minutes (5 × 15 min troubleshooting each)

---

### Issue #001: Incorrect Assumption - Config Key Must Match Server Name

**Domain:** mcp-configuration
**First Encountered:** 2025-10-29
**Frequency:** 1 occurrence
**Last Seen:** 2025-10-29
**Status:** active

#### Symptom
```
All MCP servers showing as 'failed' status in /mcp command after configuration change
Project-management-mcp-server not appearing in MCP list at all
Changed .mcp.json key from 'testing-validation' to 'testing-validation-mcp-server'
All previously working MCPs stopped loading
```

#### Context
- **MCP:** testing-validation-mcp-server (trigger), all MCPs affected
- **Phase:** Deployment / Configuration
- **Environment:** macOS, Node v22.20.0, npm 10.2.4
- **Configuration File:** .mcp.json (workspace)
- **Step:** Registration - attempting to fix testing-validation MCP not appearing

#### Root Cause
Misunderstanding of MCP configuration format. Incorrectly believed that the key name in the `mcpServers` object must exactly match the server's internal `name` property (defined in the Server constructor).

**The Actual Rule (from MCP-CONFIGURATION-CHECKLIST.md Section 3):**
- The key name in `.mcp.json` is an **arbitrary identifier** used by Claude Code to reference the server
- It does NOT need to match the server's internal `name` property
- Key names should be descriptive and concise (e.g., 'testing-validation', 'project-management')

**What Triggered the Misunderstanding:**
- Observed that project-management-mcp-server uses same name in both config key and Server constructor
- Incorrectly generalized this as a requirement rather than a convention
- Made configuration change based on false assumption
- Breaking change affected all MCPs

#### Solution

**Step 1: Identify the Problem**
```bash
# All MCPs showing as failed
# Reviewed MCP-CONFIGURATION-CHECKLIST.md Section 3
# Confirmed keys are arbitrary identifiers
```

**Step 2: Restore from Backup**
```bash
# Save broken config for reference
cp .mcp.json .mcp.json.broken-backup

# Restore from known-good backup
cp .mcp.json.backup .mcp.json

# Verify restoration
cat .mcp.json | jq .
```

**Step 3: Add Testing-Validation Correctly**
```bash
# Edit .mcp.json
# Add testing-validation entry with original key name
# Use key: "testing-validation" (NOT "testing-validation-mcp-server")
```

**Step 4: Validate Configuration**
```bash
# Validate JSON syntax
cat .mcp.json | jq .

# Verify all server files exist
ls -la /path/to/project-management-mcp-server/dist/server.js  # ✅
ls -la /path/to/project-management-dev/dist/server.js          # ✅
ls -la /path/to/testing-validation-mcp-server/dist/server.js  # ✅

# Restart Claude Code required
```

#### Prevention

**Add Clarification to MCP-CONFIGURATION-CHECKLIST.md Section 3:**

```markdown
### Configuration Key Names

**IMPORTANT:** The key name in the `mcpServers` object is an **arbitrary identifier**.

❌ **WRONG ASSUMPTION:** Key must match server's internal name
✅ **CORRECT:** Key is a descriptive identifier for Claude Code

**Examples:**
```json
{
  "mcpServers": {
    "testing-validation": {  // ← Arbitrary key (shorter, concise)
      "command": "node",
      "args": ["/.../testing-validation-mcp-server/dist/server.js"]
      // Server internally uses name: 'testing-validation-mcp-server'
    },
    "pm": {  // ← Can even use abbreviations
      "command": "node",
      "args": ["/.../project-management-mcp-server/dist/server.js"]
      // Server internally uses name: 'project-management-mcp-server'
    }
  }
}
```

**What Actually Matters:**
1. ✅ Valid JSON syntax
2. ✅ Absolute paths to dist/server.js
3. ✅ Proper environment variables
4. ✅ No duplicate keys
5. ✅ Descriptive key names (for maintainability)
```

#### Promotion Status
- [ ] Frequency >= 3 (eligible for promotion)
- [ ] Added to MCP-CONFIGURATION-CHECKLIST.md
- [ ] Prevention success rate: 0/0

---

### Issue #002: MCP Server Fails to Connect - Missing Dependencies at Production Location

**Domain:** mcp-configuration
**First Encountered:** 2025-10-29
**Frequency:** 1 occurrence
**Last Seen:** 2025-10-29
**Status:** active

#### Symptom
```
Server shows '✗ Failed to connect' in claude mcp list output
All other servers show '✓ Connected' status
Direct execution shows: Error [ERR_MODULE_NOT_FOUND]: Cannot find package '@modelcontextprotocol/sdk' imported from dist/server.js
Server is registered correctly in ~/.claude.json with valid absolute paths
```

#### Context
- **MCP:** testing-validation-mcp-server
- **Phase:** Deployment / Post-Configuration
- **Environment:** macOS Darwin 23.3.0, Node v22.20.0, npm installed
- **Configuration File:** ~/.claude.json
- **Configuration Status:** ✅ Valid (absolute paths, correct format, JSON valid)
- **Step:** Post-deployment testing - discovered after configuration validation passed

#### Root Cause
Dependencies (node_modules) were not installed when the server was copied/moved to the production location at `local-instances/mcp-servers/testing-validation-mcp-server/`.

The compiled output (`dist/` folder with server.js) existed, and the configuration was correct, but the runtime dependencies were missing. This caused module resolution errors when Node.js attempted to load the MCP SDK package.

**How This Happens:**
1. Server developed in project folder (e.g., `mcp-server-development/testing-validation-mcp-project/04-product-under-development/dev-instance/`)
2. Dependencies installed and build completed in dev location
3. Compiled `dist/` folder copied to production location
4. Configuration created pointing to production location
5. **Missing Step:** Dependencies not installed at production location
6. Server fails to load despite valid configuration

**MCP Configuration Checklist Gap:**
- Section 6 (Path Requirements) validates that dist/server.js exists
- Section 8 (Configuration Validation) checks file type
- Neither section validates that dependencies (node_modules) exist
- This gap allows misconfigured servers to pass validation

#### Solution

**Step 1: Navigate to Production Location**
```bash
cd /Users/mmaruthurnew/Desktop/medical-practice-workspace/local-instances/mcp-servers/testing-validation-mcp-server
```

**Step 2: Verify Missing Dependencies**
```bash
# Check for node_modules
ls -la node_modules  # Should fail or show empty

# Try running server directly to see error
node dist/server.js
# Error: Cannot find package '@modelcontextprotocol/sdk'
```

**Step 3: Install Dependencies**
```bash
# Install all dependencies
npm install

# Verify installation
ls -la node_modules/@modelcontextprotocol/sdk  # Should exist now
```

**Step 4: Rebuild (Optional but Recommended)**
```bash
# Ensure latest compiled code
npm run build

# Verify build output
ls -la dist/server.js  # Should show recent timestamp
```

**Step 5: Test Connectivity**
```bash
# Test server loads
claude mcp list | grep testing-validation
# Should show: ✓ Connected

# Or test directly
node dist/server.js  # Should start without errors
```

#### Prevention

**Add Pre-Flight Check to MCP-CONFIGURATION-CHECKLIST.md Section 1:**

```markdown
### Build and Dependency Validation ✅

```bash
# Navigate to production location
cd /path/to/local-instances/mcp-servers/[server-name]/

# Check dependencies exist
test -d node_modules/@modelcontextprotocol/sdk && echo "✅ Dependencies installed" || echo "❌ Missing dependencies"

# If missing, install
npm install

# Verify package.json exists
test -f package.json || echo "⚠️ WARNING: No package.json found"

# Check build output exists
test -f dist/server.js || echo "❌ Missing dist/server.js - run npm run build"

# Validate server can load dependencies
node -e "import('@modelcontextprotocol/sdk').then(() => console.log('✅ SDK loads'), err => console.log('❌ SDK missing:', err.message))"
```

**Pass Criteria:**
- ✅ node_modules folder exists
- ✅ @modelcontextprotocol/sdk package present
- ✅ package.json exists at production location
- ✅ dist/server.js exists and is recent
- ✅ Server can resolve all imports

**If checks fail:**
- Run npm install at production location
- Run npm run build to ensure latest code
- Retry validation
```

**Update Section 6 Path Validation Checklist:**
```markdown
- [ ] Build completed before configuration
- [ ] Dependencies installed at production location (node_modules exists)
- [ ] @modelcontextprotocol/sdk package resolvable
```

**Add to Deployment Best Practices:**
- Always run `npm install` after copying server to new location
- Never rely on dist/ folder alone - include package.json
- Test with `node dist/server.js` before configuration
- Include dependency check in pre-configuration validation

#### Promotion Status
- [ ] Frequency >= 3 (eligible for promotion)
- [ ] Added to MCP-CONFIGURATION-CHECKLIST.md Section 1 (pending)
- [ ] Prevention success rate: 0/0

**Impact Assessment:**
- **Time to resolve:** ~5 minutes (once identified)
- **Time to diagnose:** ~10-15 minutes (checking config, paths, etc.)
- **Total incident time:** ~15-20 minutes
- **Prevention value:** High - simple check prevents guaranteed failure

---

## High-Frequency Issues (3+ Occurrences)

Issues that have occurred 3+ times are listed here for quick reference. These have been or are eligible for promotion to preventive checks.

**Current Count:** 1 (example Issue #000)

---

### Issue #000: Duplicate MCP Registration (PROMOTED)
**Frequency:** 3 occurrences → Promoted
**Prevention Rate:** 5/5 (100%)
**Added to Checklist:** Section 4 - Duplicate Prevention
**Status:** Preventing future occurrences

---

## Resolved Issues

Issues that have been resolved and have not recurred for 30+ days.

**Current Count:** 0

---

## Categories

Issues are automatically categorized by learning-optimizer based on keywords:

### Configuration Scope Issues
Keywords: workspace, global, .mcp.json, config.json, scope
Issues: (none yet)

### Path Issues
Keywords: path, absolute, relative, dist, workspaceFolder
Issues: (none yet)

### Dependency Issues
Keywords: dependency, dependencies, node_modules, npm install, ERR_MODULE_NOT_FOUND, package
Issues: Issue #002

### Credential Issues
Keywords: credential, token, API, OAuth, secret, password
Issues: (none yet)

### Duplicate Issues
Keywords: duplicate, already registered, conflict, multiple
Issues: Issue #000 (example)

### Environment Variable Issues
Keywords: env, environment, variable, PROJECT_ROOT
Issues: (none yet)

---

## Optimization History

### 2025-10-29: Issue #002 Added
- **Issue #002:** MCP Server Fails to Connect - Missing Dependencies at Production Location
- Root cause: node_modules not installed at production location
- Prevention: Add dependency validation to MCP-CONFIGURATION-CHECKLIST.md Section 1
- Impact: 15-20 minutes per incident, simple check prevents guaranteed failure
- Status: Documented, awaiting frequency >= 3 for promotion

### 2025-10-29: Initial Setup
- Domain created
- Learning-optimizer integration configured
- Example issue added for reference
- Issue #001 added (config key naming misunderstanding)

---

## Related Resources

- **Configuration Checklist:** [MCP-CONFIGURATION-CHECKLIST.md](../MCP-CONFIGURATION-CHECKLIST.md)
- **Rollout Checklist:** [ROLLOUT-CHECKLIST.md](../03-resources-docs-assets-tools/ROLLOUT-CHECKLIST.md)
- **Workflow Improvements:** [WORKFLOW-IMPROVEMENT-IDEAS.md](../WORKFLOW-IMPROVEMENT-IDEAS.md)
- **Template Troubleshooting:** templates-and-patterns/mcp-server-templates/TROUBLESHOOTING.md
- **Learning-Optimizer Docs:** local-instances/mcp-servers/learning-optimizer-mcp-server/

---

## Commands Quick Reference

```bash
# Track new issue
mcp__learning-optimizer__track_issue(
  domain="mcp-configuration",
  title="Brief description",
  symptom="Error message",
  solution="Resolution steps",
  root_cause="Why it happened",
  prevention="How to avoid",
  context={...}
)

# Check if optimization needed
mcp__learning-optimizer__check_optimization_triggers(
  domain="mcp-configuration"
)

# Run optimization
mcp__learning-optimizer__optimize_knowledge_base(
  domain="mcp-configuration"
)

# Get statistics
mcp__learning-optimizer__get_domain_stats(
  domain="mcp-configuration"
)

# List issues
mcp__learning-optimizer__get_issues(
  domain="mcp-configuration",
  filter="high-frequency"  # optional
)

# Detect duplicates
mcp__learning-optimizer__detect_duplicates(
  domain="mcp-configuration"
)
```

---

**Status:** Active - Awaiting First Real Issue
**Last Updated:** 2025-10-29
**Next Optimization:** When 3+ occurrences OR 5+ total issues
**Maintained By:** AI (Claude) + learning-optimizer-mcp

**Every configuration issue logged here helps prevent future issues and improves the development process.**
