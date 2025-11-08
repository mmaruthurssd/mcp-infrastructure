# Arc Decision MCP Server - Setup Instructions (For AI)

**This file tells you (the AI) how to set up this MCP server template.**

---

## What This Template Does

The Arc Decision MCP Server helps developers decide whether to build tools as:
- **MCP Servers** (external capabilities)
- **Subagents** (specialized thinking)
- **Both (Hybrid)** (complex tools)

**It's a hybrid tool itself** - demonstrating the pattern it teaches!

---

## Setup Steps (Execute These)

### 1. Navigate to This Directory

```bash
cd arc-decision-mcp-server-template/
```

### 2. Install Dependencies

```bash
npm install
```

### 3. Build TypeScript

```bash
npm run build
```

### 4. Run Auto-Setup

```bash
npm run setup
```

**This script will:**
- Copy `agent/arch-decision.md` to `.claude/agents/arc-decision.md`
- Update `.mcp.json` with server configuration
- Show success message

### 5. Verify Setup

Check that these files were created:
- `dist/server.js` (compiled server)
- `.claude/agents/arc-decision.md` (subagent file)
- `.mcp.json` entry for `arch-decision-mcp-server`

### 6. Test the Server

Tell the user:

```markdown
✅ Arc Decision MCP Server is ready!

To use it:
1. In Claude Code, type: **arc decision**
2. Describe the tool you want to build
3. The assistant will interview you and provide a recommendation

The server includes:
- Decision tree framework
- Learning engine (remembers past decisions)
- Real-world examples (file-organizer, git-assistant, etc.)
- Template generation (coming soon)
```

---

## What Was Built

**MCP Server Component:**
- 7 tools for architecture analysis
- 4 resources (decision-tree, learned-patterns, best-practices, examples)
- Continuous learning engine
- 700+ lines of production TypeScript

**Subagent Component:**
- Interactive interview persona
- Educational guidance
- Teaching-focused communication
- 400+ lines of specialized prompting

---

## If Setup Fails

### Issue: npm install fails
**Solution:**
```bash
rm -rf node_modules package-lock.json
npm install
```

### Issue: TypeScript build fails
**Solution:**
```bash
npx tsc --version  # Verify TypeScript installed
npm run build
```

### Issue: setup script fails
**Solution:**
Run setup steps manually:
```bash
# Create .claude/agents directory
mkdir -p .claude/agents

# Copy agent file
cp agent/arch-decision.md .claude/agents/arc-decision.md

# Add to .mcp.json manually
# (show user the configuration to add)
```

---

## Customization (After Setup)

If the user wants to customize:

**Update server name/description:**
1. Edit `package.json` - Change name and description
2. Edit `src/server.ts` - Update server initialization
3. Rebuild: `npm run build`

**Add new decision paths:**
1. Edit `src/decision-tree.json` - Add question nodes or outcomes
2. No rebuild needed (JSON loaded at runtime)

**Modify subagent persona:**
1. Edit `agent/arch-decision.md` - Update system prompt
2. Copy to `.claude/agents/` - Overwrite existing file

---

## File Structure

```
arc-decision-mcp-server-template/
├── README.md                 # User documentation
├── SETUP.md                  # This file (for AI)
├── IMPLEMENTATION_COMPLETE.md # Implementation summary
├── package.json              # NPM configuration
├── tsconfig.json             # TypeScript config
├── install-agent.js          # Auto-setup script
├── src/
│   ├── server.ts            # Main MCP server (700+ lines)
│   ├── learning-engine.ts   # Continuous learning (200+ lines)
│   └── decision-tree.json   # Decision framework
├── agent/
│   └── arch-decision.md     # Subagent persona (400+ lines)
└── templates/
    ├── subagent/
    │   └── basic-subagent-template.md
    └── mcp-server/
        ├── package.json.template
        └── server.ts.template
```

---

## What Happens on First Use

When the user first invokes the Arc Decision assistant:

1. **They type:** "arc decision" in Claude Code
2. **Subagent activates** (from `.claude/agents/arc-decision.md`)
3. **MCP server tools become available** (from `.mcp.json` config)
4. **Learning file created:** `.arch-decision-patterns.json` (in project root)

---

## Expected User Workflow

```
User: "arc decision"

Arc Decision Assistant:
"Hi! I'm here to help you decide whether to build your tool as an MCP server,
subagent, or both. What do you want to build?"

User: "A deployment automation tool for AWS"

Arc Decision Assistant:
[Calls analyze_requirements]
[Calls find_similar_decisions]

"Based on your description, I recommend: **MCP Server**

Why? You need to interact with AWS (an external system), which requires MCP
server capabilities. A subagent alone can't make API calls to AWS.

Would you like me to:
1. Show you similar examples?
2. Compare MCP vs hybrid approaches?
3. Record this decision for future learning?"
```

---

## Success Criteria

Setup is successful when:
- ✅ `npm install` completes without errors
- ✅ `npm run build` creates `dist/server.js`
- ✅ `npm run setup` copies files and updates configs
- ✅ User can type "arc decision" and subagent responds
- ✅ MCP tools are available (analyze_requirements, etc.)

---

## Notes for AI

- This is a **template** - meant to be copied to user projects
- Don't modify the template in place (suggest copying if needed)
- The server name in code is still "arch-decision-mcp-server" (arc vs arch) - this is intentional for the tool name
- Learning patterns are stored per-project (`.arch-decision-patterns.json`)
- Templates folder (`templates/`) is for future expansion (template generation feature)

---

**Ready to set up? Run the steps above!** 🚀
