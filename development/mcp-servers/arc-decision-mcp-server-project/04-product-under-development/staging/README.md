# Arc Decision MCP Server Template - Drop-In Ready

**Just copy this folder to your project. AI does the rest.**

---

## What Is This?

An intelligent assistant that helps you decide whether to build tools as:
- **Skills** - For workflow instructions and patterns (ultra-lightweight!)
- **MCP Servers** - For external capabilities (APIs, databases, files, git)
- **Subagents** - For specialized AI thinking/behavior
- **Hybrids** - For complex tools needing multiple approaches

**This tool itself is a hybrid** - it demonstrates the pattern it teaches!

---

## Usage

### 1. Copy to Your Project

```bash
# Copy entire folder
cp -r arc-decision-mcp-server-template/ /path/to/your-project/.mcp-arc-decision/
```

### 2. Tell the AI

```
You: "Set up the Arc Decision MCP server"
```

That's it! The AI will:
- Read SETUP.md to understand what to do
- Install dependencies
- Build the server
- Configure Claude Code
- Create agent file
- Test it works

---

## What You Get

After setup, in Claude Code type:

```
arc decision
```

The Arc Decision Assistant will interview you and help you make informed architecture decisions!

---

## How It Works

### The Hybrid Pattern in Action

This tool demonstrates why **MCP Server + Subagent** is powerful for complex tools:

**MCP Server Component:**
- Provides decision tree logic (now includes Skills!)
- Analyzes requirements across Skills, MCP, and Subagent options
- Learns from past decisions (continuous learning engine)
- Generates templates for all architecture types
- Exposes resources (decision-tree, learned-patterns, examples, best-practices)

**Subagent Component:**
- Interviews you interactively
- Provides educational guidance
- Teaches architecture principles (including new Skills pattern)
- Orchestrates MCP tools intelligently
- Explains "why" not just "what"

**Why Not Add a Skill?**
We could add a Skill for "architecture decision patterns" to make this even more token-efficient, but the educational/teaching aspect (Subagent) is core to the user experience.

---

## What Are Skills? (NEW in 2025!)

**Skills** are Claude's newest architecture option - ultra-lightweight folders with instructions that Claude loads only when relevant.

### When to Use Skills

✅ **Perfect for:**
- Workflow instructions (step-by-step processes)
- Code patterns and style guides
- Brand guidelines and formatting rules
- Document templates
- Simple automation with scripts

❌ **Not suitable for:**
- Specialized AI behavior (use Subagent)
- External system access (use MCP Server)
- State persistence across sessions (use MCP Server)

### Why Skills Are Game-Changing

**Token Efficiency:**
- Skills: ~50 tokens (scan) + ~500 tokens (when loaded)
- Subagents: ~1000-3000 tokens (full prompt)
- MCP Servers: ~2000-5000 tokens per invocation

**Auto-Discovery:**
- Claude automatically finds and loads relevant skills
- Only loads when actually needed
- Multiple skills can work together

**Simplicity:**
- Just a SKILL.md file with YAML frontmatter
- No server to build or maintain
- Portable across Claude apps, Code, and API

### Skills vs Subagents vs MCP

| Feature | **Skill** | **Subagent** | **MCP Server** |
|---------|-----------|--------------|----------------|
| **Purpose** | Instructions/patterns | AI behavior | External capabilities |
| **Tokens** | ~500 | ~2000 | ~3000 |
| **Setup** | Markdown file | Markdown file | TypeScript server |
| **External APIs** | ❌ | ❌ | ✅ |
| **AI Behavior** | ❌ | ✅ | ❌ |
| **State** | ❌ | Limited | ✅ |

**Rule of thumb:**
- Instructions? → Skill
- AI thinking? → Subagent
- External systems? → MCP Server
- Need multiple? → Hybrid!

---

## MCP Server Tools

### `analyze_requirements`

Analyze tool description and get architectural recommendation.

```typescript
{
  description: string;          // What you want to build
  externalSystems?: string[];   // APIs, databases, etc.
  complexity?: 'simple' | 'moderate' | 'complex';
  stateNeeded?: boolean;        // Need persistent state?
}
```

**Returns:**
- Recommendation (MCP server / subagent / hybrid)
- Confidence level
- Rationale
- Benefits and considerations
- Template suggestion
- Similar past decisions

### `suggest_architecture`

Get suggestion based on answered decision tree questions.

```typescript
{
  hasExternalSystems: boolean;
  isComplex: boolean;
  needsState: boolean;
  needsTeaching?: boolean;
}
```

### `compare_approaches`

Compare MCP, subagent, and hybrid approaches.

```typescript
{
  description: string;  // Tool description
}
```

**Returns:** Pros/cons of each approach for your use case.

### `find_similar_decisions`

Find similar architectural decisions from learning history.

```typescript
{
  description: string;  // Tool description
  limit?: number;       // Max patterns to return (default: 5)
}
```

### `record_decision`

Record a decision for future learning.

```typescript
{
  toolDescription: string;
  decision: 'mcp-server' | 'subagent' | 'hybrid';
  reasoning: string;
  externalSystems?: string[];
  complexity: 'simple' | 'moderate' | 'complex';
  stateManagement: boolean;
}
```

### `update_decision_outcome`

Update how a past decision turned out.

```typescript
{
  patternId: string;
  outcome: 'successful' | 'needed-refactoring' | 'abandoned';
}
```

### `get_statistics`

Get statistics about learned decisions.

**Returns:**
- Total decisions
- Breakdown by architecture type
- Breakdown by outcome
- Most referenced patterns

---

## MCP Server Resources

### `architecture://decision-tree`

The complete decision tree framework (JSON)

### `architecture://learned-patterns`

All learned patterns from past decisions + statistics

### `architecture://best-practices`

Architecture decision guidelines and best practices (Markdown)

### `architecture://examples`

Real-world examples (file-organizer, git-assistant, code-reviewer, etc.)

---

## Usage Examples

### Example 1: Simple Query

```
You: "I want to build a code review assistant"