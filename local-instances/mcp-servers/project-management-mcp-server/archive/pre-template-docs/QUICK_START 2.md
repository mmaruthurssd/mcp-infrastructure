# AI Planning MCP Server - Quick Start Guide

**Version:** 0.6.0
**Last Updated:** 2025-10-26

---

## What Works Right Now

✅ **Phase 6: Project Setup** (8 tools) - Fully functional
⚠️ **Phases 1-5: Goal Management** (11 tools) - Has critical bug (see TESTING_REPORT.md)

**This guide covers Phase 6 only.**

---

## Prerequisites

1. AI Planning MCP server is registered and running
2. You have a project directory ready
3. You want to set up a new project with:
   - Constitution (principles & guidelines)
   - Roadmap (phases & milestones)
   - Resources inventory
   - Assets list
   - Stakeholder analysis

---

## 5-Minute Walkthrough

### Step 1: Start Project Setup

```javascript
mcp__ai-planning__start_project_setup({
  projectPath: "/path/to/your/project",
  projectName: "My Medical Portal",
  projectType: "software",  // or "research", "business", "product"
  constitutionMode: "quick",  // or "deep"
  initialDescription: "A patient portal for viewing medical records"
})
```

**What happens:**
- Creates `project-setup/` directory
- Starts conversation
- Asks first question

**Response:** Conversation ID + first question

---

### Step 2: Answer Questions (2-3 rounds)

```javascript
mcp__ai-planning__continue_project_setup({
  projectPath: "/path/to/your/project",
  conversationId: "conv-...",
  userResponse: "We want to save doctors time on phone calls..."
})
```

**Keep calling until:**
- `readyToGenerate: true`
- `completeness: 85%` or higher

**Tip:** Be conversational! The more context, the better the output.

---

### Step 3: Generate All Documents

Once ready, call these in sequence:

```javascript
// 1. Extract goals from conversation
const goals = mcp__ai-planning__extract_project_goals({
  projectPath: "/path/to/your/project",
  conversationId: "conv-..."
})

// 2. Generate constitution
mcp__ai-planning__generate_project_constitution({
  projectPath: "/path/to/your/project",
  conversationId: "conv-..."
})

// 3. Generate roadmap
mcp__ai-planning__generate_initial_roadmap({
  projectPath: "/path/to/your/project",
  conversationId: "conv-...",
  extractedGoals: goals.mainGoals,
  timeframe: "6 months"
})

// 4. Identify resources & assets
mcp__ai-planning__identify_resources_and_assets({
  projectPath: "/path/to/your/project",
  conversationId: "conv-..."
})

// 5. Identify stakeholders
mcp__ai-planning__identify_stakeholders({
  projectPath: "/path/to/your/project",
  conversationId: "conv-..."
})

// 6. Finalize setup
mcp__ai-planning__finalize_project_setup({
  projectPath: "/path/to/your/project",
  conversationId: "conv-...",
  extractedGoals: goals.mainGoals
})
```

---

## What You Get

After finalization, your project has:

```
your-project/
├── project-setup/
│   ├── CONSTITUTION.md       ← Principles, constraints, success criteria
│   ├── ROADMAP.md            ← Phases, milestones, timeline
│   ├── RESOURCES.md          ← Team, tools, budget
│   ├── ASSETS.md             ← Existing & needed assets
│   ├── STAKEHOLDERS.md       ← Stakeholder matrix
│   └── conversation-log.md   ← Full planning conversation
│
└── brainstorming/future-goals/
    └── potential-goals/
        └── *.md              ← Initial goals ready for evaluation
```

---

## Example: Medical Practice Portal

**Input (2-turn conversation):**

Turn 1:
```
"Build patient portal for viewing medical records and scheduling appointments.
We have 15 physicians, 50,000 patients, $150K budget, need HIPAA compliance,
want MVP in 6 months."
```

Turn 2:
```
"Main problem is administrative burden. Doctors spend 30 min/day on phone calls
answering questions patients could self-serve. Need to save physician time
and improve patient satisfaction."
```

**Output:**

**CONSTITUTION.md:**
```markdown
## Core Principles
1. Patient Privacy First - HIPAA compliance non-negotiable
2. Physician-Centric UX - Optimize for busy doctors
3. Data Integrity - Never sacrifice accuracy for speed
4. Quality Over Speed - Build it right the first time

## Constraints
- Budget: $150K for Year 1
- Timeline: MVP in 6 months
- Regulatory: HIPAA compliance required

## Success Criteria
- 80% physician adoption within 3 months
- 30 min/day time savings per physician
- Zero HIPAA violations
```

**ROADMAP.md:**
```markdown
## Phase 1: Foundation (2 months)
Goal: Establish core infrastructure

### Milestones
- M1.1: Patient Portal MVP
  - Authentication & authorization
  - Medical records viewing
  - Appointment scheduling
```

**RESOURCES.md:**
```markdown
## Budget
Total: $150,000 for Year 1

## Timeline
Duration: 6 months (Nov 2025 - Apr 2026)
```

**STAKEHOLDERS.md:**
```markdown
## Key Stakeholders
- **Physicians (15)** - High influence, High interest
  Strategy: Manage Closely - Weekly updates

- **Patients (50,000)** - Low influence, High interest
  Strategy: Keep Informed - Passive updates
```

---

## Known Limitations

### ⚠️ Data Quality Issues

**Duplicate Extraction:**
- Goals and stakeholders may have near-duplicates
- Example: "patient", "patient (patient)", "patients"
- **Workaround:** Manually review and merge duplicates

**Malformed Names:**
- May extract "15 physician" instead of "15 physicians"
- May create stakeholders like "000 patient"
- **Workaround:** Edit generated markdown files directly

### ❌ Goal Management Blocked

**Critical Bug:**
- `create_potential_goal` → `promote_to_selected` workflow is broken
- Template rendering issue prevents goal promotion
- See TESTING_REPORT.md for details

**What Works:**
- ✅ `evaluate_goal` - Get Impact/Effort/Tier suggestions
- ✅ `view_goals_dashboard` - See all goals

**What Doesn't:**
- ❌ Creating properly formatted potential goals
- ❌ Promoting goals to selected status
- ❌ Full goal lifecycle management

**Status:** Bug fix in progress

---

## Tips for Best Results

### During Conversation

1. **Be specific about numbers**
   - "15 physicians, 50,000 patients" not "lots of doctors and patients"

2. **Mention constraints early**
   - Budget, timeline, regulatory requirements
   - "Need HIPAA compliance, $150K budget, 6 months"

3. **Describe the problem**
   - Not just what you want to build
   - But why and what problem it solves

4. **Name stakeholders explicitly**
   - "Chief Medical Officer Dr. Smith"
   - "IT Director John Doe"

### After Generation

1. **Review all documents**
   - AI makes educated guesses from limited info
   - Edit anything that doesn't match your vision

2. **Merge duplicates**
   - Check stakeholders for "doctor" and "doctor (doctor)"
   - Check goals for similar descriptions

3. **Expand sections**
   - Add more principles to constitution
   - Add more milestones to roadmap
   - Add team member details to resources

---

## Troubleshooting

### "Template not found" error

**Problem:** Templates not copied to dist/ during build

**Fix:**
```bash
cd /path/to/ai-planning-mcp-server
npm run build
# This now runs: tsc && npm run copy-templates
```

**Verification:**
```bash
ls dist/templates/project-setup/
# Should see: CONSTITUTION.md, ROADMAP.md, etc.
```

### Conversation never reaches 100% completeness

**Expected:** System is ready at 85%+

**Action:** Look for `readyToGenerate: true` in response

---

## Next Steps

**After Project Setup:**

1. **Manual Review**
   - Read all generated documents
   - Edit as needed
   - Merge duplicates

2. **Goal Evaluation** (Works!)
   - Use `evaluate_goal` to analyze ideas
   - Get Impact/Effort/Tier suggestions

3. **Wait for Bug Fix** (Goal Management)
   - Creating and promoting goals currently blocked
   - See TESTING_REPORT.md for status

4. **Integration**
   - Use constitution to guide decisions
   - Use roadmap for planning
   - Use stakeholder matrix for communication

---

## Configuration Options

### Constitution Modes

**Quick Mode** (default):
- 3-5 core principles
- Basic constraints
- 5-10 minute conversation
- Good for: Small projects, quick starts

**Deep Mode:**
- Comprehensive framework
- Detailed decision guidelines
- Quality standards
- Ethics statement
- 15-20 minute conversation
- Good for: Large projects, regulated industries

Usage:
```javascript
constitutionMode: "quick"  // or "deep"
```

### Project Types

**Available:**
- `software` - Software development projects
- `research` - Research projects
- `business` - Business initiatives
- `product` - Product development

**Impact:** Tailors questions and constitution to project type

---

## FAQs

**Q: Can I use this for existing projects?**
A: Yes! It will help document existing projects and create planning docs.

**Q: What if I don't know the budget/timeline yet?**
A: Just say "TBD" or "Not decided yet" - you can edit later.

**Q: How do I edit generated documents?**
A: They're markdown files. Edit directly in any text editor.

**Q: Can I re-run project setup?**
A: Yes, but it will overwrite existing files. Back up first!

**Q: Why are there duplicate stakeholders?**
A: Known issue with NLP extraction. Manually merge duplicates for now.

---

## Support

**Issues:** See TESTING_REPORT.md for known bugs
**Template:** See `src/templates/` for file formats
**Code:** See `src/tools/` for tool implementations

---

**Last Updated:** 2025-10-26
**Status:** Phase 6 Functional, Phase 1-5 Blocked
**Next:** Bug fix for goal management workflow
