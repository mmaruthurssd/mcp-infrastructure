---
type: reference
phase: stable
project: spec-driven-mcp-server
tags: [MCP, mcp-server, spec-driven, workflow]
category: mcp-servers
status: completed
priority: medium
---

# Scenario Guide: Using All Three Workflows

The Spec-Driven MCP Server now supports **all three development scenarios**. Here's how they work and when to use each.

---

## Scenario 1: New Project (Greenfield)

**When to use**: Starting from scratch or minimal codebase

**Auto-detected when**:
- Directory is empty or has minimal files
- No existing constitution or specs
- No significant codebase

**Questions asked**: 12 constitution + 12 specification + 12 planning = ~36 questions

**Example usage**:
```
USER: "I want to build a new Google Sheets version control system"

CLAUDE: [Detects: new-project scenario]
        "Starting Spec-Driven Development for your new project..."
```

**Created files**:
```
project/
└── specs/
    ├── .specify/memory/constitution.md    # NEW
    └── 001-version-control/
        ├── spec.md                        # NEW
        ├── plan.md                        # NEW
        └── tasks.md                       # NEW
```

**Key questions**:
- PHI handling? → Full HIPAA compliance setup
- Testing requirements → TDD mandatory or optional
- Tech stack → Defines approved technologies
- Architecture principles → From scratch

---

## Scenario 2: Existing Project (Brownfield)

**When to use**: Adding specs to existing code without specs

**Auto-detected when**:
- Directory has code (src/, *.ts, *.gs files)
- No existing constitution or specs
- Established codebase

**Questions asked**: 11 constitution + 12 specification + 12 planning = ~35 questions

**Example usage**:
```
USER: "I have an existing Google Sheets dashboard. I want to add proper specs and then add email notifications"

CLAUDE: [Detects: existing-project scenario]
        "I see this is an existing project. Let me help you document it and add the new feature..."
```

**Created files**:
```
existing-project/
├── [existing code files]
└── specs/                                # NEW FOLDER
    ├── .specify/memory/constitution.md   # Based on existing stack
    └── 001-email-notifications/
        ├── spec.md                       # For new feature
        ├── plan.md                       # Integrates with existing
        └── tasks.md                      # Refactoring-aware
```

**Key differences from new-project**:
- ✅ Asks about **existing tech stack** (not choosing new)
- ✅ Asks about **architectural constraints** from existing code
- ✅ Asks about **backward compatibility** requirements
- ✅ Asks about **refactoring needs**
- ✅ Asks about **data migration** requirements
- ✅ Asks about **rollback strategy**
- ✅ Constitution adapts to existing patterns

---

## Scenario 3: Add Feature (Continuing Development)

**When to use**: Adding features to a project that already has specs

**Auto-detected when**:
- Directory has specs/ folder
- Constitution exists at specs/.specify/memory/constitution.md
- Previous feature specs exist (001-, 002-, etc.)

**Questions asked**: 2 constitution + 10 specification + 10 planning = ~22 questions

**Example usage**:
```
USER: "I want to add PDF export to my patient dashboard (which already has specs)"

CLAUDE: [Detects: add-feature scenario]
        "I found your existing constitution. Let's add the PDF export feature..."
```

**Created files**:
```
project-with-specs/
├── specs/
│   ├── .specify/memory/constitution.md   # REUSED (with optional additions)
│   ├── 001-patient-dashboard/            # Existing
│   │   └── ...
│   └── 002-pdf-export/                   # NEW FEATURE
│       ├── spec.md
│       ├── plan.md
│       └── tasks.md
```

**Key differences from brownfield**:
- ✅ **Much shorter** (reuses constitution)
- ✅ Asks if you want to **use existing constitution** (recommended: yes)
- ✅ Asks how feature **relates to existing features**
- ✅ Asks about **integration points** with other specs
- ✅ References **existing patterns** from prior specs
- ✅ Follows **established architecture** automatically

---

## How Auto-Detection Works

The server checks (in order):

1. **Has constitution + specs?** → `add-feature`
2. **Has code but no specs?** → `existing-project`
3. **Empty or minimal?** → `new-project`

You can also **manually specify**:
```typescript
sdd_guide({
  action: "start",
  project_path: "...",
  scenario: "existing-project"  // Force specific scenario
})
```

---

## Workflow Comparison

| Aspect | New Project | Existing Project | Add Feature |
|--------|-------------|------------------|-------------|
| **Constitution** | Full questions (12) | Adapted questions (11) | Minimal (2) |
| **Specification** | Standard (12) | Integration-focused (12) | Streamlined (10) |
| **Planning** | From scratch (12) | Refactoring-aware (12) | Pattern-following (10) |
| **Total Questions** | ~36 | ~35 | ~22 |
| **Duration** | 10-15 min | 10-15 min | 5-8 min |
| **Complexity** | Medium | High | Low |

---

## Question Highlights by Scenario

### New Project - Unique Questions:
- "What is the primary technology stack?" (choosing fresh)
- "Is simplicity-first mandatory?" (establishing principles)
- "What deployment environment?" (deciding from options)

### Existing Project - Unique Questions:
- "What technology stack is **currently** in use?" (discovering)
- "What are the architectural **constraints from existing codebase**?"
- "Does this require **refactoring** existing code?"
- "How will you test **without breaking** existing functionality?"
- "What's the **rollback plan**?"

### Add Feature - Unique Questions:
- "Should we **use existing constitution**?" (recommended: yes)
- "How does this **relate to existing features**?"
- "What **existing patterns** will you follow?"
- "What are the **integration points** with existing features?"

---

## Example Conversations

### New Project Flow
```
USER: "Build a new patient appointment scheduler"
→ Scenario: new-project
→ Questions about tech stack, testing, PHI handling
→ Creates: constitution.md + 001-appointment-scheduler/
```

### Existing Project Flow
```
USER: "I have an old billing system. Add automated reminders"
→ Scenario: existing-project
→ Questions about existing stack, constraints, migration
→ Creates: constitution.md (adapted) + 001-automated-reminders/
```

### Add Feature Flow
```
USER: "Add SMS notifications to my appointment scheduler"
→ Scenario: add-feature (finds existing constitution)
→ Questions about feature integration, existing patterns
→ Creates: 002-sms-notifications/ (follows 001 patterns)
```

---

## Tips for Each Scenario

### For New Projects:
- Be thoughtful about PHI handling (affects whole constitution)
- Choose simplicity unless you have specific needs
- TDD mandatory recommended for medical practice apps

### For Existing Projects:
- Accurately describe existing tech stack
- Identify all architectural constraints upfront
- Plan for backward compatibility early
- Consider data migration carefully

### For Adding Features:
- Review existing constitution first
- Reference existing specs when describing relationships
- Follow established patterns unless justified otherwise
- Keep consistency with prior feature implementations

---

## What Gets Reused vs Created

| Scenario | Constitution | Spec | Plan | Tasks |
|----------|--------------|------|------|-------|
| **New Project** | ✨ Created | ✨ Created | ✨ Created | ✨ Created |
| **Existing Project** | ✨ Created (adapted) | ✨ Created | ✨ Created | ✨ Created |
| **Add Feature** | ♻️ Reused (+ optional additions) | ✨ Created | ✨ Created | ✨ Created |

---

## Next Steps After Completion

Regardless of scenario, after specs are complete:

1. **Review** the generated specs
2. **Validate** against requirements
3. **Implement** using tasks.md as guide
4. **Test** according to plan
5. **Iterate** by adding more features (add-feature scenario)

All scenarios generate the same output structure - only the questions and context differ!
