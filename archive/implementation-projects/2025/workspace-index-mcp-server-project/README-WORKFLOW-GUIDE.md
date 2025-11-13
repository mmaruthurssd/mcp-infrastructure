---
type: guide
tags: [workflow, mcp-development, algorithm-b, getting-started]
---

# MCP Server Development Workflow Guide

**Purpose:** Guide for using the MCP project template and following Algorithm B (MCP Server Development Workflow) from the Project Management MCP Server.

**Template Version:** 2.0.0
**Last Updated:** 2025-10-29

---

## Overview

This template is designed for **MCP server development projects** using **Algorithm B** from the Project Management MCP Server. Algorithm B is optimized for focused technical builds with clear requirements.

### What Makes MCP Projects Different?

MCP server projects have:
- **Clear technical requirements** (X tools to implement)
- **Focused scope** (single-domain, technical focus)
- **Shorter timelines** (3-10 weeks typically)
- **Less stakeholder complexity** (small teams)
- **Inherited vision** (often part of larger coordination project)

Therefore, they need **lighter-weight planning** than full hierarchical projects, but still benefit from:
- ✅ **Conversation capture** (why we're building this)
- ✅ **Design decision documentation** (architecture rationale)
- ✅ **Progress tracking** (NEXT-STEPS.md, EVENT-LOG.md)
- ✅ **Integration clarity** (dependencies and handoffs)

---

## Workflow: Algorithm B (MCP Server Development)

### **Phase 1: Understanding & Brief (30 mins - 1 hour)**

#### Step 1: Capture Initial Discussion

**File:** `01-planning/initial-discussion.md`

**Purpose:** Capture the unstructured conversation about requirements, problem space, and initial ideas.

**What to document:**
- What problem does this MCP solve?
- What tools are needed?
- What approaches were considered?
- What dependencies and integration points?
- What questions remain open?

**Tips:**
- Don't filter ideas yet—capture everything
- Document alternatives considered (even if rejected)
- Capture uncertainties and assumptions

---

#### Step 2: Create PROJECT-BRIEF

**File:** `01-planning/PROJECT-BRIEF.md`

**Purpose:** Lightweight vision document (not full PROJECT OVERVIEW). Synthesizes the discussion into clear direction.

**What to document:**
- Vision and purpose (1-2 paragraphs)
- What it does / What it doesn't do (scope clarity)
- Integration points (uses and used by)
- Success criteria
- Timeline and constraints
- Risks

**Tips:**
- Keep it concise (2-3 pages max)
- Focus on the "what" and "why"
- Save detailed "how" for SPECIFICATION.md

---

### **Phase 2: Technical Planning (1-2 hours)**

#### Step 3: Write SPECIFICATION

**File:** `01-planning/SPECIFICATION.md`

**Purpose:** Detailed technical specification with tool schemas, architecture, data models.

**What to document:**
- Tools to implement (with full parameter schemas)
- Architecture overview
- Data models and types
- Integration contracts
- Testing approach
- Implementation plan

**Tips:**
- This is the most detailed document
- Include code examples and schemas
- Think through edge cases
- Reference design decisions where appropriate

---

#### Step 4: Document Design Decisions

**File:** `01-planning/DESIGN-DECISIONS.md`

**Purpose:** Capture architectural choices and rationale. Future you (or other developers) will thank you.

**What to document:**
- Why this approach vs alternatives?
- What trade-offs were made?
- What risks were accepted?
- What was deferred and why?

**Format:**
- One decision per section
- Include: Context, Decision, Alternatives, Rationale, Trade-offs, Impact
- Update as new decisions are made (living document)

**Tips:**
- Document while decisions are fresh
- Include rejected alternatives (prevents revisiting)
- Be honest about trade-offs

---

#### Step 5: Identify Dependencies & Integration Points

**Files:**
- `03-resources-docs-assets-tools/DEPENDENCIES.md`
- `03-resources-docs-assets-tools/INTEGRATION-POINTS.md`

**Purpose:** Make it clear what this MCP relies on and how it integrates.

**DEPENDENCIES.md covers:**
- Other MCPs used
- npm packages/libraries
- External systems
- File system access

**INTEGRATION-POINTS.md covers:**
- Who uses this MCP?
- How do they call it?
- What data formats are exchanged?
- Integration testing approach

---

### **Phase 3: Implementation (varies)**

#### Step 6: Development in dev-instance/

**Location:** `04-product-under-development/dev-instance/`

**Setup:**
```bash
cd 04-product-under-development/dev-instance/
npm install
npm run build
npm test
```

**Development Loop:**
1. Implement tool in `src/tools/[tool-name].ts`
2. Register in `src/server.ts`
3. Write tests in `tests/[tool-name].test.ts`
4. Build and test
5. Update NEXT-STEPS.md
6. Log progress in EVENT-LOG.md

**Tips:**
- Work on one tool at a time
- Test as you go
- Update EVENT-LOG.md daily
- Keep NEXT-STEPS.md current

---

#### Step 7: Track Progress

**Files to maintain:**

**NEXT-STEPS.md**
- What's completed? ✅
- What's in progress? 🔄
- What's next? ⏭️
- Any blockers? 🚫

**EVENT-LOG.md**
- Daily development log
- Milestones achieved
- Problems solved
- Decisions made

**TROUBLESHOOTING.md**
- Known issues
- Solutions discovered
- Common errors
- Workarounds

---

#### Step 8: Quality Gates

Use **Testing & Validation MCP** to validate:

```javascript
// Run tests
mcp__testing-validation__run_mcp_tests({
  mcpPath: "/path/to/dev-instance",
  testType: "all",
  coverage: true
});

// Validate standards
mcp__testing-validation__validate_mcp_implementation({
  mcpPath: "/path/to/project",
  standards: ["file-structure", "naming", "documentation", "code", "mcp"]
});

// Check quality gates
mcp__testing-validation__check_quality_gates({
  mcpPath: "/path/to/project",
  phase: "all"
});
```

**Quality requirements:**
- ✅ All tests passing (100%)
- ✅ Coverage >70%
- ✅ Build successful (0 errors)
- ✅ Standards validation passing
- ✅ Security scan clean

---

### **Phase 4: Rollout (30 mins)**

#### Step 9: Production Deployment

**Process:**

1. **Final validation:**
   ```bash
   cd dev-instance/
   npm run build
   npm test
   ```

2. **Copy to production:**
   ```bash
   cp -r dev-instance/ /path/to/local-instances/mcp-servers/[mcp-name]/
   ```

3. **Register with Claude Code:**
   ```javascript
   mcp__mcp-config-manager__register_mcp_server({
     serverName: "[mcp-name]",
     scope: "project"  // or "user"
   });
   ```

4. **Restart Claude Code** to load new MCP

5. **Integration test:**
   - Call each tool manually
   - Verify responses
   - Test error handling

6. **Update tracking:**
   - Mark project complete in master tracker
   - Archive workflow if using task-executor
   - Update EVENT-LOG.md with rollout details

---

## Project Structure

```
[mcp-name]-project/
├── 01-planning/
│   ├── PROJECT-BRIEF.md          ⭐ Vision & purpose
│   ├── SPECIFICATION.md          ⭐ Technical spec
│   ├── initial-discussion.md     ⭐ Requirements conversation
│   └── DESIGN-DECISIONS.md       ⭐ Architecture rationale
├── 02-goals-and-roadmap/
│   └── [Optional - if using goal workflow]
├── 03-resources-docs-assets-tools/
│   ├── DEPENDENCIES.md           ⭐ What this uses
│   ├── INTEGRATION-POINTS.md     ⭐ How it integrates
│   └── [Reference materials]
├── 04-product-under-development/
│   └── dev-instance/             ⭐ Staging development
│       ├── src/
│       │   ├── server.ts
│       │   ├── types/
│       │   ├── utils/
│       │   └── tools/
│       ├── tests/
│       ├── dist/
│       ├── package.json
│       ├── tsconfig.json
│       └── README.md
├── 05-brainstorming/
│   └── [Future enhancements]
├── 08-archive/
│   └── issues/                   ⭐ Production issues
├── EVENT-LOG.md                  ⭐ Development history
├── NEXT-STEPS.md                 ⭐ Current priorities
├── TROUBLESHOOTING.md            ⭐ Known issues
└── README.md                     ⭐ Project overview
```

---

## Key Documents to Maintain

### Throughout Development

**NEXT-STEPS.md** (daily updates)
- Current status
- What's done
- What's in progress
- What's next
- Blockers

**EVENT-LOG.md** (daily or milestone-based)
- Significant events
- Decisions made
- Problems solved
- Milestones achieved

**TROUBLESHOOTING.md** (as issues arise)
- Known issues
- Solutions
- Workarounds
- Prevention tips

---

### During Planning

**PROJECT-BRIEF.md** (once, updated if scope changes)
**SPECIFICATION.md** (once, updated if requirements change)
**initial-discussion.md** (captured once during initial conversation)
**DESIGN-DECISIONS.md** (living document - add as decisions are made)

---

## Tips for Success

### 1. Front-Load the Conversation

Spend quality time on `initial-discussion.md` and `PROJECT-BRIEF.md`. The better you understand requirements up-front, the smoother implementation goes.

### 2. Document Design Decisions Immediately

Don't wait until later to write `DESIGN-DECISIONS.md`. Capture decisions when they're fresh.

### 3. Keep NEXT-STEPS.md Current

Update it every session. It's your roadmap and progress tracker.

### 4. Use EVENT-LOG.md as Development Diary

Log daily or after each significant milestone. Future you will appreciate the history.

### 5. Test Early, Test Often

Don't wait until everything is built to run tests. Test each tool as you implement it.

### 6. Use Quality Gates Before Rollout

The Testing & Validation MCP catches issues before production. Use it.

---

## Integration with Project Management MCP

### When to Use Project Management MCP Tools

**Yes, use for:**
- Goal tracking (if this MCP is one of many in a larger project)
- Handoffs to Spec-Driven or Task Executor MCPs
- Progress aggregation to master project

**No, don't need for:**
- CONSTITUTION generation (MCP projects inherit principles)
- STAKEHOLDERS.md (typically small teams)
- Components/Sub-areas (single-focus projects)

### Handoff to Other MCPs

**Spec-Driven MCP:**
- Use if MCP requires detailed sub-goal decomposition
- Uncommon for MCP projects (spec is starting point)

**Task Executor MCP:**
- Optional for implementation workflows
- Can be useful for larger MCPs (10+ tools)
- Create workflow from SPECIFICATION.md tasks

---

## Differences from Full Hierarchical Projects

| Aspect | Algorithm A (Hierarchical) | Algorithm B (MCP Development) |
|--------|---------------------------|------------------------------|
| CONSTITUTION | ✅ Required | ❌ Not needed (inherited) |
| PROJECT OVERVIEW | ✅ Full version with history | ✅ PROJECT-BRIEF (lightweight) |
| STAKEHOLDERS.md | ✅ Required | ❌ Optional (small teams) |
| Components | ✅ Multiple domains | ❌ Single-focus |
| Goals | ✅ Hierarchical (major → sub) | ✅ Optional (can use tasks directly) |
| Conversation capture | ✅ Extensive | ✅ Focused |
| Design decisions | ⚠️ Optional | ✅ Critical for technical projects |
| Dependencies | ⚠️ Implicit in docs | ✅ Explicit DEPENDENCIES.md |

---

## Example: Testing & Validation MCP Project

For a real example of Algorithm B in action, see:
`/mcp-server-development/testing-validation-mcp-project/`

**What they created:**
- ✅ PROJECT-BRIEF.md (vision and purpose)
- ✅ SPECIFICATION.md (6 tools with schemas)
- ✅ initial-discussion.md (requirements conversation)
- ✅ DESIGN-DECISIONS.md (architecture rationale)
- ✅ DEPENDENCIES.md (Jest, security-compliance-mcp)
- ✅ INTEGRATION-POINTS.md (who uses this MCP)
- ✅ EVENT-LOG.md (development diary)
- ✅ NEXT-STEPS.md (progress tracking)

**Timeline:**
- Planning: 2 hours
- Implementation: 8 hours (4 phases)
- Rollout: 30 mins
- **Total: ~10.5 hours from start to production**

---

## Related Resources

- **WORKFLOW-ALGORITHMS.md** (`projects-in-development/project-management-mcp-server-project/03-resources-docs-assets-tools/`) - Full description of all workflow algorithms
- **Project Management MCP Server User Guide** (`local-instances/mcp-servers/project-management-mcp-server/docs/USER-GUIDE-ORCHESTRATION.md`)
- **MCP Build Integration Guide** (`mcp-server-development/mcp-implementation-master-project/03-resources-docs-assets-tools/`)

---

## Questions?

If you're unsure whether to use Algorithm B or another workflow:
1. Read WORKFLOW-ALGORITHMS.md decision framework
2. Consider project complexity, clarity, and timeline
3. When in doubt, start simple (Algorithm B or C) and upgrade later

---

**Template Version:** 2.0.0
**Last Updated:** 2025-10-29
**Next Review:** After 5+ MCP projects use this template (gather learnings)
