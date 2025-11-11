# MCP Infrastructure - START HERE

**Workspace Type**: Shared MCP Server Infrastructure
**PHI Status**: ❌ PROHIBITED - Platform-agnostic code only
**AI Clients**: Claude Code + Gemini (Shared)
**Location**: `~/Desktop/mcp-infrastructure`

---

## What Is This Workspace?

The **mcp-infrastructure** workspace contains **26 production MCP servers** that are shared across both Claude Code and Gemini. This is your **shared platform infrastructure** - the tools that power both AI assistants.

**CRITICAL**:
- This workspace contains **NO patient data** and must never contain PHI
- All code here must be **platform-agnostic** (works with any data type)
- Changes here affect **BOTH Claude Code AND Gemini**

---

## Quick Orientation

### Three-Workspace Architecture

You are in **Workspace 2 of 3**:

| # | Workspace | Purpose | PHI | AI Client |
|---|-----------|---------|-----|-----------|
| **1** | operations-workspace | Development, planning, templates | ❌ NO | Claude Code |
| **2** | **mcp-infrastructure** (YOU ARE HERE) | 26 MCP servers (production) | ❌ NO | Claude Code + Gemini |
| **3** | medical-patient-data | Patient data, clinical workflows | ✅ YES | Gemini only |

**See**: `workspace-management/THREE-WORKSPACE-ARCHITECTURE.md` for complete overview

---

## What You Can Do Here

✅ **MCP Development**:
- Build new MCP servers
- Test MCP tools
- Update existing MCPs
- Deploy to production

✅ **Infrastructure**:
- Modify shared code
- Update build scripts
- Create MCP templates
- Write integration tests

✅ **Configuration**:
- Update `~/.claude.json` (Claude Code config)
- Update `.gemini-mcp.json` (Gemini config)
- Configure MCP parameters
- Set environment variables

✅ **Documentation**:
- Update MCP README files
- Create API documentation
- Write usage guides
- Document architecture

✅ **Git Operations**:
- Commit changes
- Push to GitHub
- Tag releases
- Create deployment branches

---

## What You CANNOT Do Here

❌ **PHI-Related**:
- Include PHI in MCP code
- Store patient data in MCP state
- Create PHI-specific logic (must be generic/platform-agnostic)
- Test with real patient data

❌ **Breaking Changes**:
- Deploy untested MCPs to production
- Break backward compatibility without migration plan
- Modify production MCPs without staging test

---

## Directory Structure

```
mcp-infrastructure/
├── START_HERE.md (YOU ARE HERE)
├── workspace-management/ → operations-workspace/workspace-management (SYMLINK)
├── local-instances/
│   └── mcp-servers/ (26 PRODUCTION MCP servers)
│       ├── task-executor-mcp/
│       ├── project-management-mcp/
│       ├── workspace-sync-mcp/
│       ├── security-compliance-mcp/
│       └── ... (22 more)
├── development/
│   └── mcp-servers/ (DEVELOPMENT - test here first)
│       └── [new-mcp-name]/
├── templates/
│   └── mcp-server-template/ (template for new MCPs)
└── scripts/
    ├── build-mcp.sh
    ├── deploy-mcp.sh
    └── test-mcp.sh
```

---

## CRITICAL: Dual-Client Configuration

**Every MCP deployment requires updating BOTH configs:**

1. **~/.claude.json** (for Claude Code)
2. **~/Desktop/medical-patient-data/.gemini-mcp.json** (for Gemini)

**Why?**
- Claude Code and Gemini both use the same MCP servers
- They have separate configuration files
- Forgetting to update one breaks that AI client

**Auto-update script**:
```bash
./scripts/deploy-mcp.sh [mcp-name]
# Automatically updates both configs
```

---

## MCP Development Workflow

### Building a New MCP

```bash
# Step 1: Create in development folder
cd ~/Desktop/mcp-infrastructure/development/mcp-servers
cp -r ../../templates/mcp-server-template ./my-new-mcp
cd my-new-mcp

# Step 2: Develop and test
npm install
npm run build
npm test

# Step 3: Deploy to production
cd ~/Desktop/mcp-infrastructure
./scripts/deploy-mcp.sh my-new-mcp

# Step 4: Restart AI clients to load new MCP
# Restart Claude Code
# Restart Gemini
```

### Updating an Existing MCP

```bash
# Step 1: Work in production folder
cd ~/Desktop/mcp-infrastructure/local-instances/mcp-servers/[mcp-name]

# Step 2: Make changes
# Edit TypeScript files

# Step 3: Build and test
npm run build
npm test

# Step 4: Commit and push
git add .
git commit -m "feat: add new feature to [mcp-name]"
git push

# Step 5: Restart AI clients
# Changes take effect after restart
```

---

## Available MCP Servers (26 Total)

**Organization**:
- smart-file-organizer
- workspace-index

**Quality**:
- security-compliance-mcp
- code-review-mcp
- test-generator-mcp
- standards-enforcement-mcp
- testing-validation-mcp

**Planning**:
- project-management-mcp
- spec-driven-mcp
- arc-decision-mcp

**Execution**:
- task-executor-mcp
- deployment-release-mcp
- parallelization-mcp

**Memory & Learning**:
- workspace-brain-mcp
- learning-optimizer-mcp
- autonomous-deployment-mcp

**Infrastructure**:
- workspace-sync-mcp
- backup-dr-mcp
- configuration-manager-mcp
- performance-monitor-mcp
- workspace-health-dashboard-mcp
- mcp-config-manager-mcp

**Development**:
- git-assistant-mcp

**See**: `README.md` for complete listing with descriptions

---

## For AI Assistants

### On First Run

**Follow the 6-step initialization path**:

1. **START_HERE.md** (this file) - Identify workspace and permissions
2. **workspace-management/AI-WORKSPACE-INITIALIZATION.md** - Detailed initialization steps
3. **workspace-management/DOCUMENTATION-INDEX.md** - Complete documentation map with reading order
4. **workspace-management/AI-GUIDELINES-BY-WORKSPACE.md** - Detailed permissions for each workspace
5. **EVENT_LOG.md** - Recent changes and decisions (check last 50 lines)
6. **README.md** - MCP server architecture and configuration

**For task-specific guidance**: See DOCUMENTATION-INDEX.md > "Before Working With..." section

### Quick Checklist

- [ ] Confirmed I'm in mcp-infrastructure (pwd shows ~/Desktop/mcp-infrastructure)
- [ ] Understand PHI is PROHIBITED here
- [ ] Understand changes affect BOTH Claude Code AND Gemini
- [ ] Read AI-WORKSPACE-INITIALIZATION.md for complete initialization
- [ ] Checked DOCUMENTATION-INDEX.md for reading order
- [ ] Know to test in development/ before deploying to local-instances/
- [ ] Understand dual-config requirement (~/.claude.json AND .gemini-mcp.json)

---

## HIPAA Compliance

**All MCP code must be PHI-agnostic**:
- MCPs work with **any data type**, not just patient data
- No PHI hardcoded in MCP logic
- Generic, reusable, platform-independent

**Pre-commit hooks scan for**:
- PHI (patient identifiers)
- Credentials (API keys, tokens)
- Hardcoded secrets

**Example of PHI-agnostic design**:
```typescript
// ❌ BAD - PHI-specific
function processPatientName(name: string) { ... }

// ✅ GOOD - Generic
function processField(value: string, fieldType: string) { ... }
```

---

## Common Scenarios

### Scenario 1: Build New MCP

**Decision**: Work in `development/mcp-servers/`

**Steps**:
1. Copy template: `cp -r templates/mcp-server-template development/mcp-servers/my-mcp`
2. Develop: Edit TypeScript files, implement tools
3. Build: `npm run build`
4. Test: `npm test`
5. Deploy: `./scripts/deploy-mcp.sh my-mcp`
6. Update configs: Auto-updated by deploy script
7. Restart both AI clients

### Scenario 2: Fix Bug in Existing MCP

**Decision**: Work in `local-instances/mcp-servers/[mcp-name]`

**Steps**:
1. Edit files in production folder
2. Build: `npm run build`
3. Test: `npm test`
4. Commit: `git commit -m "fix: description"`
5. Push: `git push`
6. Restart AI clients to load fix

### Scenario 3: Update MCP Configuration

**Decision**: Update `~/.claude.json` AND `.gemini-mcp.json`

**Steps**:
1. Edit `~/.claude.json` (Claude Code config)
2. Edit `~/Desktop/medical-patient-data/.gemini-mcp.json` (Gemini config)
3. Restart both AI clients
4. Verify MCP loads correctly in both

---

## Troubleshooting

**MCP not loading in Claude Code?**
→ Check `~/.claude.json` has correct path to `local-instances/mcp-servers/[mcp-name]`
→ Run `npm run build` in MCP folder
→ Restart Claude Code

**MCP not loading in Gemini?**
→ Check `.gemini-mcp.json` has correct configuration
→ Verify MCP server is built
→ Restart Gemini client

**Build errors?**
→ Run `npm install` to ensure dependencies are installed
→ Check TypeScript errors: `npm run build`
→ Review error messages

**See**: `workspace-management/TROUBLESHOOTING.md` for more

---

## Next Steps

**New to MCP development?**
→ Read `workspace-management/MCP-CONFIGURATION-GUIDE.md`

**AI assistant starting fresh?**
→ Read `workspace-management/AI-WORKSPACE-INITIALIZATION.md`

**Need to understand MCP architecture?**
→ Read `README.md`

**Building new MCP?**
→ Start with `templates/mcp-server-template/`

**Questions?**
→ Check `workspace-management/TROUBLESHOOTING.md`

---

## Remember

- **Test in development/ before deploying to local-instances/**
- **Always update BOTH configs** (~/.claude.json AND .gemini-mcp.json)
- **All code must be PHI-agnostic**
- **Restart AI clients after changes**
- **Never break backward compatibility without migration plan**
- **Commit often, push regularly**

---

**Need help?** Read the comprehensive guides in `workspace-management/`
