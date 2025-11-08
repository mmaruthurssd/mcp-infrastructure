---
type: readme
phase: stable
project: spec-driven-mcp-server
tags: [MCP, automation, deployment, mcp-server, spec-driven]
category: mcp-servers
status: completed
priority: high
---

# Spec-Driven Development MCP Server

**Version:** 0.2.0
**Status:** Production Ready
**Integration:** Workflow Orchestrator v0.2.0

---

## ⚡ Version 0.2.0 - Workflow Orchestrator Integration + Automatic Parallelization

**What's New:**
- ✅ Integrated with workflow-orchestrator-mcp-server for unified state management
- ✅ Removed ~158 lines of duplicate state management code
- ✅ Gained extensible workflow orchestration capabilities
- ✅ **Automatic parallelization analysis** - Tasks analyzed for parallel execution opportunities
- ✅ **100% backward compatibility** - all existing workflows work unchanged
- ✅ All 23 integration tests passing

**Architecture:**
```
spec-driven-mcp-server
      ↓ imports
workflow-orchestrator-mcp-server v0.2.0 (library)
      ↓ provides
StateManager, WorkflowState<T>, PhaseInfo, ParallelizationAnalyzer
```

**Benefits:**
- Single source of truth for workflow state management
- Consistent workflow patterns across MCP servers
- **Automatic parallelization recommendations** with speedup estimates (<10ms overhead)
- Potential for intelligent workflow suggestions via RuleEngine
- Better state validation and error handling
- Easier maintenance and updates

---

## 🚀 Quick Start

This is a **self-installing template** for the Spec-Driven Development MCP server. Drop this folder into any workspace and let AI handle the installation automatically.

### For AI Assistants

If you're an AI assistant reading this:

1. **Read:** `TEMPLATE-INFO.json` for metadata
2. **Follow:** `INSTALL-INSTRUCTIONS.md` for step-by-step installation
3. **Execute:** All steps automatically after user confirmation

### For Human Users

**Option 1: AI-Powered Installation (Recommended)**

```bash
# Just tell your AI assistant:
"Install the spec-driven MCP server template"

# The AI will:
# - Create proper folder structure
# - Copy template to Templates folder
# - Install working instance to local-instances
# - Run npm install and build
# - Configure MCP automatically
```

**Option 2: Manual Installation**

```bash
# Run the automated script
./install.sh

# Or skip MCP auto-config
./install.sh --skip-mcp-config
```

---

## 📦 What This Template Provides

### Features

✅ **Interactive Spec-Driven Development** - Guided workflow for creating specifications
✅ **Automatic Parallelization Analysis** - Tasks analyzed for parallel execution opportunities (NEW v0.2.0)
✅ **Medical Practice Ready** - Built-in PHI/HIPAA compliance templates
✅ **Auto-Detection** - Detects project type and scenario automatically
✅ **Template-Driven** - Professional, consistent documentation generation
✅ **State Management** - Resume workflows across sessions
✅ **Multi-Scenario Support** - New projects, existing code, feature additions

### What Gets Installed

```
Templates-for-tools-frameworks-mcp-servers/
└── mcp-server-templates/
    └── templates/
        └── spec-driven-mcp-server-template/  ← This template (preserved)

local-instances/
└── mcp-servers/
    └── spec-driven-mcp-server/  ← Working instance
        ├── dist/                 ← Built server
        ├── node_modules/         ← Dependencies
        ├── src/                  ← Source code
        └── ...
```

---

## 🎯 What Is Spec-Driven Development?

Spec-Driven Development inverts traditional software development: **specifications become the source of truth**, and code is generated from those specs.

### The Process

1. **Constitution** - Define project principles (testing, compliance, tech stack)
2. **Specification** - Document WHAT and WHY (problem, requirements, constraints)
3. **Planning** - Define HOW (architecture, technology, implementation phases)
4. **Tasks** - Break down into executable tasks with dependencies

### Why Use It?

- **Clarity First** - Think through requirements before coding
- **Living Documentation** - Specs stay in sync with code
- **Team Alignment** - Everyone understands the "why" and "what"
- **Systematic Iteration** - Evolve features with confidence

---

## 📋 Prerequisites

### System Requirements

- **Node.js** >= 18.0.0
- **npm** >= 8.0.0
- **Git** (for workspace detection)

### For Use with Claude Code

- **Claude Code** installed and configured
- Access to MCP server configuration file

---

## 🛠️ Installation Process

### What the Installation Does

1. **Detects Workspace Root** - Finds your project's root directory
2. **Creates Template Folder** - Sets up `Templates-for-tools-frameworks-mcp-servers/` structure
3. **Stores Template** - Preserves this template for future use
4. **Creates Local Instance** - Copies to `local-instances/mcp-servers/`
5. **Installs Dependencies** - Runs `npm install` in working instance
6. **Builds TypeScript** - Compiles to `dist/server.js`
7. **Configures MCP** - Adds server to Claude Code config (optional)

### After Installation

```bash
# Restart Claude Code to load the server

# Verify it's working
Ask Claude: "Do you have access to the sdd_guide tool?"

# Start using it
"I want to build a new feature using spec-driven development"
```

---

## 📚 Documentation

### Included Documentation

- **`docs/SETUP.md`** - Detailed setup instructions
- **`docs/DEPLOYMENT.md`** - Deployment guide
- **`docs/SCENARIOS.md`** - Usage scenarios and examples
- **`docs/MVP_COMPLETE.md`** - Feature completion status
- **`docs/ALL_SCENARIOS_COMPLETE.md`** - Scenario coverage

### After Installation

Full documentation will be available in:
```
local-instances/mcp-servers/spec-driven-mcp-server/README.md
```

---

## 🔧 Configuration

### MCP Server Configuration

**Recommended: User Scope (Global)**

After installation, add the server to user scope so it's available across all projects:

```bash
claude mcp add --scope user --transport stdio spec-driven -- node /absolute/path/to/local-instances/mcp-servers/spec-driven-mcp-server/dist/server.js
```

**Alternative: Project Scope (`.mcp.json`)**

For project-specific configuration:

```json
{
  "mcpServers": {
    "spec-driven": {
      "command": "node",
      "args": [
        "/absolute/path/to/local-instances/mcp-servers/spec-driven-mcp-server/dist/server.js"
      ]
    }
  }
}
```

### Environment Variables

No environment variables required for basic operation.

Optional:
- State files stored in: `~/.sdd-mcp-data/workflows/`

---

## 🎓 Usage Examples

### Example 1: New Project

```
USER: "I want to build a patient visit tracker for Google Sheets"

AI: [Uses sdd_guide tool to start workflow]

SERVER: Step 1/5: Constitution
        Will this project handle PHI? (y/n)

USER: "Yes"

[Workflow continues through constitution, spec, plan, and tasks]

SERVER: ✓ All artifacts created!
        - Constitution: specs/.specify/memory/constitution.md
        - Specification: specs/001-patient-visit-tracker/spec.md
        - Plan: specs/001-patient-visit-tracker/plan.md
        - Tasks: specs/001-patient-visit-tracker/tasks.md

        🔀 Parallelization Opportunity Detected:
        - Recommended: parallel execution
        - Estimated Speedup: 2.0x
        - Reasoning: 8 independent tasks detected, parallel execution recommended
```

### Example 2: Add Feature to Existing Project

```
USER: "Add export functionality to my existing project"

AI: [Detects existing constitution and specs]

SERVER: Loading existing project constitution...
        Step 1/3: Feature Specification
        What problem does this feature solve?

[Workflow focuses on new feature, references existing architecture]
```

---

## 🚨 Troubleshooting

### Installation Issues

**Template not recognized:**
- Ensure `TEMPLATE-INFO.json` exists
- Check file is valid JSON

**npm install fails:**
- Verify Node.js version: `node --version` (need >=18.0.0)
- Check network connection
- Try: `rm -rf node_modules && npm install`

**Build fails:**
- Verify TypeScript installed: `npm list typescript`
- Check `tsconfig.json` exists
- Review error messages for syntax issues

**MCP config fails:**
- Check Claude Code config file exists
- Verify file is valid JSON
- Use backup file if needed: `claude_desktop_config.backup.json`

### Runtime Issues

**Server not appearing in Claude Code:**
- Restart Claude Code completely
- Verify `dist/server.js` exists
- Check MCP config path is absolute

**Tool not working:**
- Check server logs for errors
- Verify state directory is writable: `~/.sdd-mcp-data/`
- Try clearing state: `rm -rf ~/.sdd-mcp-data/workflows/`

---

## 🔄 Re-Installation

To create a fresh instance:

```bash
# Template is already in Templates folder

# Remove old instance (optional)
rm -rf local-instances/mcp-servers/spec-driven-mcp-server/

# Run installation again
cd Templates-for-tools-frameworks-mcp-servers/mcp-server-templates/templates/spec-driven-mcp-server-template
./install.sh
```

Or ask your AI assistant:
```
"Reinstall the spec-driven MCP server"
```

---

## 📝 Template Information

### Metadata

- **Template Name:** spec-driven-mcp-server-template
- **MCP Server Name:** spec-driven
- **Tool Provided:** `sdd_guide`
- **Version:** 1.0.0
- **Author:** SSD Medical Practice
- **License:** MIT

### File Structure

```
spec-driven-mcp-server-template/
├── TEMPLATE-INFO.json           # AI-readable metadata
├── INSTALL-INSTRUCTIONS.md      # AI installation guide
├── README.md                    # This file
├── install.sh                   # Automated installation
├── configure-mcp.sh             # MCP configuration
├── package.json                 # Dependencies
├── tsconfig.json                # TypeScript config
├── .gitignore                   # Git ignore rules
├── src/                         # Source code
│   ├── server.ts                # Main server
│   ├── types.ts                 # Type definitions
│   ├── tools/                   # Tool implementations
│   ├── workflows/               # Workflow orchestration
│   ├── detection/               # Scenario detection
│   ├── questions/               # Question sets
│   ├── templates/               # Document templates
│   ├── renderers/               # Template rendering
│   └── utils/                   # Utilities
└── docs/                        # Documentation
    ├── SETUP.md
    ├── DEPLOYMENT.md
    ├── SCENARIOS.md
    └── ...
```

---

## 🎯 For Template Creators

If you're creating a new MCP server template using this as a reference:

1. **Read:** `TEMPLATE-CREATION-GUIDE.md` for the standardized pattern
2. **Copy:** This template structure
3. **Modify:** `TEMPLATE-INFO.json` with your server details
4. **Update:** `INSTALL-INSTRUCTIONS.md` with any special steps
5. **Test:** Installation with AI and manual script

---

## 🤝 Contributing

To update this template:

1. Make changes in `local-instances/mcp-servers/spec-driven-mcp-server/`
2. Test thoroughly
3. Copy updated files back to this template
4. Update version in `TEMPLATE-INFO.json`
5. Document changes

---

## 📞 Support

### Resources

- **MCP Protocol Docs:** https://spec.modelcontextprotocol.io/
- **GitHub Spec-Kit:** https://github.com/github/spec-kit
- **Local Documentation:** `docs/` folder after installation

### Common Questions

**Q: Can I modify the template?**
A: Yes, but modifications stay in your instance. The template is preserved.

**Q: Can I create multiple instances?**
A: Yes, modify the instance path in install.sh or use AI to create with different name.

**Q: Does this work with other AI assistants?**
A: Yes, any MCP-compatible client can use this server.

**Q: Is PHI/HIPAA compliance automatic?**
A: The template provides guidance and structure, but you're responsible for implementation.

---

## ✅ Next Steps

1. **Install** the template (AI or manual)
2. **Restart** Claude Code
3. **Verify** with: "Do you have the sdd_guide tool?"
4. **Start** your first spec: "I want to build [your project]"
5. **Read** the documentation in `local-instances/mcp-servers/spec-driven-mcp-server/`

---

**Ready to install? Just say: "Install the spec-driven MCP server template"**
