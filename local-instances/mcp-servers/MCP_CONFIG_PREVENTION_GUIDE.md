# MCP Configuration - Prevention & Troubleshooting

**How to stop configuration issues before they start**

---

## ✅ Immediate Fixes Completed

1. ✅ Added `ai-planning` to `.mcp.json`
2. ✅ Created all missing configuration directories
3. ✅ Updated all paths to use `${workspaceFolder}` (portable)
4. ✅ Created validation script
5. ✅ Created MCP Config Guardian subagent

**Status: All 9 servers properly configured**

---

## 🛡️ Three-Layer Defense Against Config Issues

### Layer 1: Automated Validation (Recommended)

**What:** Run validation script automatically before commits

**Setup:**
```bash
# Create git pre-commit hook (optional)
cat > .git/hooks/pre-commit << 'EOF'
#!/bin/bash
# Only validate if .mcp.json changed
if git diff --cached --name-only | grep -q "\.mcp\.json"; then
  echo "Validating MCP configuration..."
  ./local-instances/mcp-servers/validate-mcp-config.sh
  if [ $? -ne 0 ]; then
    echo "❌ MCP configuration validation failed!"
    echo "Fix issues or use 'git commit --no-verify' to skip"
    exit 1
  fi
fi
EOF
chmod +x .git/hooks/pre-commit
```

**Pros:** Catches issues before they're committed
**Cons:** Adds 1-2 seconds to commits that touch .mcp.json

---

### Layer 2: On-Demand Validation

**What:** Run validation whenever you suspect issues

**How:**
```bash
# From workspace root:
./local-instances/mcp-servers/validate-mcp-config.sh
```

**Or in Claude Code:**
```
You: "mcp config" or "check mcp servers"
MCP Config Guardian: [Runs validation and reports issues]
```

**When to use:**
- After adding new MCP server
- After editing .mcp.json
- When MCP server stops working
- Weekly as a health check

---

### Layer 3: MCP Config Guardian Subagent

**What:** Specialized AI assistant for MCP configuration

**How to invoke:**
```
mcp config
```

**What it does:**
- Runs validation automatically
- Explains issues in plain language
- Offers specific fixes
- Applies fixes for you
- Verifies fixes worked

**Example:**
```
You: "mcp config"

Guardian: Running validation...
✅ All 9 servers properly configured
No issues found.
```

---

## 🔍 What Gets Checked

The validation script checks:

1. **Server exists** - Directory and files present
2. **Server built** - `dist/server.js` exists
3. **In .mcp.json** - Registered properly
4. **Portable paths** - Uses `${workspaceFolder}`, not hardcoded
5. **Environment variables** - All required vars set
6. **Config directories** - Exist where needed
7. **package.json** - Present for npm operations

---

## 📋 Quick Reference: Adding New MCP Server

**Checklist when adding a new server:**

```bash
# 1. Copy/create server in local-instances/mcp-servers/
cp -r template/ local-instances/mcp-servers/new-server/

# 2. Install and build
cd local-instances/mcp-servers/new-server/
npm install
npm run build

# 3. Create config directory (if needed)
mkdir -p ../../configuration/new-server

# 4. Add to .mcp.json (use ${workspaceFolder} for paths!)
# Example:
{
  "new-server": {
    "command": "node",
    "args": [
      "${workspaceFolder}/local-instances/mcp-servers/new-server/dist/server.js"
    ],
    "env": {
      "NEW_SERVER_PROJECT_ROOT": "${workspaceFolder}",
      "NEW_SERVER_CONFIG_DIR": "${workspaceFolder}/configuration/new-server"
    }
  }
}

# 5. Validate
./local-instances/mcp-servers/validate-mcp-config.sh

# 6. Restart Claude Code
```

---

## ⚠️ Common Mistakes to Avoid

### ❌ Hardcoded Paths
```json
"args": [
  "/Users/mmaruthurnew/Desktop/operations-workspace/..."
]
```

### ✅ Portable Paths
```json
"args": [
  "${workspaceFolder}/local-instances/..."
]
```

---

### ❌ Forgetting Environment Variables
```json
"my-server": {
  "command": "node",
  "args": ["${workspaceFolder}/..."]
  // Missing "env" section!
}
```

### ✅ Including Required Env Vars
```json
"my-server": {
  "command": "node",
  "args": ["${workspaceFolder}/..."],
  "env": {
    "MY_SERVER_PROJECT_ROOT": "${workspaceFolder}",
    "MY_SERVER_CONFIG_DIR": "${workspaceFolder}/configuration/my-server"
  }
}
```

---

### ❌ Forgetting to Create Config Directory
```bash
# Added to .mcp.json but directory doesn't exist
```

### ✅ Creating Config Directory
```bash
mkdir -p configuration/my-server
```

---

### ❌ Forgetting to Build
```bash
# Modified code but didn't rebuild
```

### ✅ Always Rebuild After Changes
```bash
cd local-instances/mcp-servers/my-server
npm run build
```

---

## 🎯 Recommended Workflow

**For ongoing development:**

1. **Before starting work:** Quick health check
   ```bash
   ./local-instances/mcp-servers/validate-mcp-config.sh
   ```

2. **After adding/modifying server:** Validate
   ```bash
   # Make changes...
   npm run build  # if code changed
   ./local-instances/mcp-servers/validate-mcp-config.sh
   ```

3. **Before committing:** Validate (or use pre-commit hook)
   ```bash
   git add .
   ./local-instances/mcp-servers/validate-mcp-config.sh
   git commit -m "..."
   ```

4. **Weekly:** Full audit
   ```
   In Claude Code: "mcp config"
   ```

---

## 🤖 Using the MCP Config Guardian

The guardian subagent is your first line of defense:

### When to Call:
- **"mcp config"** - Full validation
- **"check mcp servers"** - Same as above
- **"why isn't {server} working?"** - Diagnose specific server
- **"I added a new mcp server"** - Validate new addition

### What It Does:
1. Runs validation script
2. Interprets results
3. Suggests fixes
4. Applies fixes (with your permission)
5. Verifies fixes worked

### Example Interaction:
```
You: "mcp config"

Guardian: Running validation...

Checking 9 servers:
✅ ai-planning (PASS)
✅ arc-decision (PASS)
✅ communications (PASS)
✅ git-assistant (PASS)
✅ learning-optimizer (PASS)
✅ project-index-generator (PASS)
✅ smart-file-organizer (PASS)
✅ spec-driven (PASS)
✅ task-executor (PASS)

Summary: 9/9 servers properly configured
Status: ✅ All healthy
```

---

## 🔧 Troubleshooting Specific Issues

### "MCP server not appearing in Claude Code"

**Diagnosis:**
```bash
./local-instances/mcp-servers/validate-mcp-config.sh | grep "your-server"
```

**Common causes:**
- Not in .mcp.json → Add it
- Not built → Run `npm run build`
- Invalid JSON in .mcp.json → Fix syntax

---

### "Server starts but tools don't work"

**Diagnosis:**
```
In Claude Code: "mcp config"
```

**Common causes:**
- Missing environment variables → Add to .mcp.json
- Missing config directory → Create it
- Wrong paths → Use ${workspaceFolder}

---

### "Getting path errors"

**Diagnosis:**
```bash
grep "/Users/mmaruthurnew" .mcp.json
```

**Fix:**
Replace hardcoded paths with `${workspaceFolder}`

---

## 📊 Understanding Validation Output

### Status Levels:

**✅ PASS** - Server fully configured, no issues
**⚠️ WARNINGS** - Server works but has non-critical issues
**❌ FAILED** - Server has critical issues, won't work

### Exit Codes:
- `0` = All pass or warnings only
- `1` = One or more failures

---

## 🎓 Best Practices

1. **Always use portable paths** (`${workspaceFolder}`)
2. **Validate after every .mcp.json edit**
3. **Create config directories upfront**
4. **Set all required environment variables**
5. **Rebuild after code changes**
6. **Document custom configurations**
7. **Run weekly health checks**

---

## 📁 File Locations Reference

```
workspace-root/
├── .mcp.json                                    # Main configuration
├── .claude/
│   └── agents/
│       └── mcp-config-guardian.md              # Guardian subagent
├── local-instances/
│   └── mcp-servers/
│       ├── validate-mcp-config.sh              # Validation script
│       ├── MCP_CONFIGURATION_GUIDE.md          # Detailed reference
│       ├── MCP_CONFIG_PREVENTION_GUIDE.md      # This file
│       ├── {server-name}-mcp-server/           # Individual servers
│       │   ├── dist/server.js                  # Built server
│       │   ├── src/                            # Source code
│       │   └── package.json                    # Dependencies
│       └── ...
└── configuration/
    ├── {server-name}/                          # Server config dirs
    └── ...
```

---

## 🚨 Emergency Recovery

If configurations are severely broken:

1. **Backup current state:**
   ```bash
   cp .mcp.json .mcp.json.backup
   ```

2. **Run full validation:**
   ```bash
   ./local-instances/mcp-servers/validate-mcp-config.sh > validation-report.txt
   ```

3. **Get AI help:**
   ```
   In Claude Code: "mcp config - full audit"
   ```

4. **Or rebuild from scratch:**
   - Check which servers you actually use
   - Remove unused servers from .mcp.json
   - Validate remaining servers one by one
   - Use template from MCP_CONFIGURATION_GUIDE.md

---

## Summary: Your Configuration Safety Net

**Three ways to catch issues:**

1. **Automatic (pre-commit hook)** - Best for teams
2. **On-demand (validation script)** - Best for regular checks
3. **Interactive (MCP Config Guardian)** - Best for diagnosis/fixes

**Choose what works for you!**

Minimum: Run validation script weekly
Recommended: Use MCP Config Guardian after changes
Best: Enable pre-commit hook + guardian

---

*Configuration issues resolved: 2025-10-26*
*All 9 servers validated and working*
