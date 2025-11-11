# Checklist Manager MCP - Staging/Production Setup

**Date:** 2025-11-01
**Status:** Setting up dual environment

---

## Current State Analysis

### ❌ Missing Dual Environment Structure

**Current Structure:**
```
mcp-server-development/checklist-manager-mcp-project/
└── 04-product-under-development/
    ├── src/
    ├── build/
    ├── tests/
    ├── templates/
    ├── package.json
    └── ... (all files at root level)
```

**Expected Structure (Per PRODUCTION-FEEDBACK-LOOP.md):**
```
# STAGING (Development)
mcp-server-development/checklist-manager-mcp-project/
└── 04-product-under-development/
    └── dev-instance/              ← MISSING!
        ├── src/
        ├── dist/
        ├── tests/
        ├── templates/
        ├── package.json
        └── ...

# PRODUCTION (Live)
/local-instances/mcp-servers/
└── checklist-manager/             ← MISSING!
    ├── dist/
    ├── package.json
    ├── node_modules/
    └── templates/
```

---

## Reference: Working Examples

### Example 1: task-executor-mcp-server ✅

**Staging:**
```
mcp-server-development/task-executor-mcp-server-project/04-product-under-development/dev-instance/
├── dist/
├── src/
├── node_modules/
├── package.json
├── README.md
└── SPECIFICATION.md
```

**Production:**
```
local-instances/mcp-servers/task-executor-mcp-server/
├── dist/                    ← Deployed from staging
├── src/                     ← Deployed from staging
├── node_modules/            ← npm install in production
├── package.json
├── README.md
└── SPECIFICATION.md
```

### Example 2: arc-decision-mcp-server ✅

Similar structure - has both dev-instance/ and local-instances/ deployment.

---

## Setup Plan

### Step 1: Create dev-instance Directory
Move all current code into dev-instance subdirectory:
```bash
cd /Users/mmaruthurnew/.../checklist-manager-mcp-project/04-product-under-development/
mkdir dev-instance
mv src build tests templates node_modules package.json package-lock.json \
   tsconfig.json jest.config.js README.md .gitignore .eslintrc.json \
   .prettierrc.json coverage docs \
   dev-instance/
```

### Step 2: Deploy to Production
Create production instance in local-instances:
```bash
cd /Users/mmaruthurnew/Desktop/operations-workspace/local-instances/mcp-servers/
mkdir checklist-manager

# Copy necessary files from dev-instance
cd /Users/mmaruthurnew/.../checklist-manager-mcp-project/04-product-under-development/dev-instance/
cp -r dist package.json package-lock.json templates README.md \
      /Users/mmaruthurnew/.../local-instances/mcp-servers/checklist-manager/

# Install production dependencies
cd /Users/mmaruthurnew/.../local-instances/mcp-servers/checklist-manager/
npm install --production
```

### Step 3: Register Production Instance
Update ~/.claude.json to point to production instance:
```json
{
  "mcpServers": {
    "checklist-manager": {
      "command": "node",
      "args": [
        "/Users/mmaruthurnew/Desktop/operations-workspace/local-instances/mcp-servers/checklist-manager/dist/index.js"
      ]
    }
  }
}
```

### Step 4: Verify Dual Setup
- ✅ Staging exists: `dev-instance/` for development
- ✅ Production exists: `/local-instances/mcp-servers/checklist-manager/` for live use
- ✅ Claude Code points to production instance
- ✅ Development happens in staging

---

## Feedback Loop Workflow

### Development → Production Flow

1. **Develop in Staging:**
   ```bash
   cd .../04-product-under-development/dev-instance/
   # Make changes to src/
   npm run build
   npm test
   ```

2. **Test in Staging:**
   - Run all tests
   - Verify quality gates
   - Use testing-validation MCP

3. **Deploy to Production:**
   ```bash
   # Build fresh production version
   npm run build

   # Copy to production
   cp -r dist/ /Users/mmaruthurnew/.../local-instances/mcp-servers/checklist-manager/
   cp package.json /Users/mmaruthurnew/.../local-instances/mcp-servers/checklist-manager/

   # Update dependencies if changed
   cd /Users/mmaruthurnew/.../local-instances/mcp-servers/checklist-manager/
   npm install --production
   ```

4. **Restart Claude Code:**
   - Quit Claude Code completely
   - Restart to load updated MCP
   - Verify functionality

5. **Monitor Production:**
   - Use performance-monitor MCP
   - Log issues to `08-archive/issues/`
   - Use learning-optimizer for triage

### Production → Staging Feedback Flow

1. **Issue Detected in Production:**
   - AI detects error during MCP operation
   - OR user reports issue

2. **Log Issue:**
   ```bash
   # Create issue file
   cp _mcp-project-template/08-archive/issues/issue-template.md \
      08-archive/issues/2025-11-01-issue-001.md
   ```

3. **Triage with learning-optimizer:**
   ```javascript
   mcp__learning-optimizer__track_issue({
     domain: "checklist-manager-mcp",
     title: "Issue description",
     symptom: "What went wrong",
     solution: "How to fix"
   });
   ```

4. **Fix in Staging:**
   ```bash
   cd .../dev-instance/
   # Make fixes to src/
   # Add tests
   npm run build
   npm test
   ```

5. **Validate:**
   ```javascript
   mcp__testing-validation__run_mcp_tests({
     mcpPath: "/path/to/dev-instance"
   });
   ```

6. **Deploy to Production** (Step 3 above)

---

## Directory Structure After Setup

```
mcp-server-development/checklist-manager-mcp-project/
├── 01-planning/
│   └── SPECIFICATION.md
├── 02-goals-and-roadmap/
├── 03-resources-docs-assets-tools/
│   ├── API-REFERENCE.md
│   └── ROLLOUT-CHECKLIST.md
├── 04-product-under-development/
│   └── dev-instance/                    ← STAGING (Development)
│       ├── src/
│       ├── dist/                        ← Built artifacts
│       ├── tests/
│       ├── templates/
│       ├── package.json
│       ├── README.md
│       └── ...
├── 05-collaboration-communication/
├── 06-temporary-workspace/
├── 07-archive/
│   └── workflows/
│       └── 2025-11-01-035957-checklist-manager-phase2-advanced-features/
├── 08-archive/
│   └── issues/                          ← Issue tracking
└── STAGING-PRODUCTION-SETUP.md          ← This file

/local-instances/mcp-servers/
└── checklist-manager/                   ← PRODUCTION (Live)
    ├── dist/
    ├── node_modules/
    ├── package.json
    ├── templates/
    └── README.md
```

---

## Benefits of Dual Setup

### 🔒 Safety
- Never modify production directly
- All changes tested in staging first
- Easy rollback (keep production backup)

### 🚀 Speed
- Production stays stable
- Development doesn't affect live MCP
- Parallel development possible

### 📊 Tracking
- Clear separation of environments
- Issue tracking in staging project
- Production monitoring separate

### 🔄 Feedback Loop
- Issues logged in staging
- Fixes tested before deployment
- learning-optimizer tracks patterns

---

## Next Steps

1. ✅ **Understand structure** (this document)
2. ⏳ **Execute setup** (create dev-instance, deploy production)
3. ⏳ **Live test** all 10 tools in production
4. ⏳ **Document** feedback loop usage
5. ⏳ **Fix** unit test TypeScript errors in staging

---

## Related Documents

- **PRODUCTION-FEEDBACK-LOOP.md** - Complete feedback loop documentation
- **ROLLOUT-CHECKLIST.md** - Quality gates for deployment
- **API-REFERENCE.md** - Tool documentation
- **SYSTEM-ARCHITECTURE.md** - Overall MCP architecture

---

**Document Status:** Planning Phase
**Next Action:** Execute dual setup (Task 3 in todo list)
