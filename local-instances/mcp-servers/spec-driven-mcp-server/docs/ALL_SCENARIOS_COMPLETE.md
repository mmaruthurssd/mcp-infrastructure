---
type: reference
phase: stable
project: spec-driven-mcp-server
tags: [MCP, mcp-server, spec-driven]
category: mcp-servers
status: completed
priority: medium
---

# All Scenarios Complete! 🎉

## What Was Added

All three development scenarios are now fully implemented:

✅ **New Project (Greenfield)** - Build from scratch
✅ **Existing Project (Brownfield)** - Add specs to existing code
✅ **Add Feature (Continuing Development)** - Extend projects with specs

## Files Created

### Question Sets (9 total)
```
src/questions/
├── constitution/
│   ├── new-project.json         ✅ (was already there)
│   ├── existing-project.json    ✨ NEW
│   └── add-feature.json         ✨ NEW
├── specification/
│   ├── new-project.json         ✅ (was already there)
│   ├── existing-project.json    ✨ NEW
│   └── add-feature.json         ✨ NEW
└── planning/
    ├── new-project.json         ✅ (was already there)
    ├── existing-project.json    ✨ NEW
    └── add-feature.json         ✨ NEW
```

### Documentation
- ✨ `SCENARIOS.md` - Complete guide to all three scenarios

## How Each Scenario Works

### 1. New Project (Greenfield)
**Questions**: 36 total (12 + 12 + 12)
**Duration**: 10-15 minutes
**Auto-detected**: Empty directory or minimal code

**Key Questions**:
- Choose tech stack from scratch
- Define PHI/HIPAA requirements
- Establish testing principles
- Set architecture standards

**Output**:
```
specs/
├── .specify/memory/constitution.md    # Full constitution
└── 001-feature-name/
    ├── spec.md
    ├── plan.md
    └── tasks.md
```

---

### 2. Existing Project (Brownfield)
**Questions**: 35 total (11 + 12 + 12)
**Duration**: 10-15 minutes
**Auto-detected**: Has code but no specs

**Key Questions**:
- What tech stack is CURRENTLY in use?
- What architectural constraints exist?
- Does this require refactoring?
- What's the backward compatibility plan?
- Data migration needed?
- How to test without breaking existing?

**Output**:
```
existing-code/
├── [your existing files]
└── specs/                            # NEW
    ├── .specify/memory/constitution.md
    └── 001-new-feature/
        ├── spec.md                   # Integration-aware
        ├── plan.md                   # Refactoring-aware
        └── tasks.md                  # Migration-aware
```

---

### 3. Add Feature (Continuing Development)
**Questions**: 22 total (2 + 10 + 10)
**Duration**: 5-8 minutes
**Auto-detected**: Has existing constitution + specs

**Key Questions**:
- Use existing constitution? (recommended: yes)
- How does this relate to existing features?
- What existing patterns to follow?
- Integration points with other features?
- Follow established architecture?

**Output**:
```
specs/
├── .specify/memory/constitution.md    # REUSED
├── 001-first-feature/                # Existing
└── 002-new-feature/                  # NEW
    ├── spec.md                       # References 001
    ├── plan.md                       # Follows patterns
    └── tasks.md                      # Integrates
```

---

## Auto-Detection Logic

The server automatically detects scenario:

```
1. Check for constitution + specs → add-feature
2. Check for code but no specs → existing-project
3. Otherwise → new-project
```

Or manually specify:
```typescript
sdd_guide({
  action: "start",
  scenario: "existing-project"  // Force specific scenario
})
```

## Question Count Comparison

| Scenario | Constitution | Specification | Planning | Total | Time |
|----------|--------------|---------------|----------|-------|------|
| New Project | 12 | 12 | 12 | **36** | 10-15 min |
| Existing Project | 11 | 12 | 12 | **35** | 10-15 min |
| Add Feature | 2 | 10 | 10 | **22** | 5-8 min |

## Key Differences

### Existing Project vs New Project
- ✅ Asks about **existing** stack (not choosing)
- ✅ **Architectural constraints** from codebase
- ✅ **Backward compatibility** requirements
- ✅ **Refactoring scope** and justification
- ✅ **Data migration** planning
- ✅ **Rollback strategy**
- ✅ **Testing without breaking** existing

### Add Feature vs Both Others
- ✅ **Reuses constitution** (just 2 questions)
- ✅ Much **shorter** overall
- ✅ **References existing** features
- ✅ **Integration-focused** questions
- ✅ **Pattern-following** approach
- ✅ **Consistency-driven** planning

## Testing the Scenarios

### Test New Project:
```
USER: "I want to build a new patient appointment scheduler"
→ Auto-detects: new-project
→ Full constitution questions
```

### Test Existing Project:
```
USER: "I have an existing Google Sheets billing system.
       I want to add specs and then add automated reminders"
→ Auto-detects: existing-project (has code, no specs)
→ Constitution adapted to existing stack
```

### Test Add Feature:
```
USER: "I want to add SMS notifications to my appointment scheduler"
       (assuming specs already exist from previous run)
→ Auto-detects: add-feature (finds constitution)
→ Short workflow, reuses constitution
```

## Rebuild Status

✅ **Build completed successfully**
```bash
npm run build
```

All question files are now included in the compiled JavaScript.

## Using All Scenarios

Just start naturally:

```
"I want to build..."           → new-project
"I have existing code..."      → existing-project
"Add feature to my project..." → add-feature
```

The server handles the rest automatically!

## What This Enables

1. **New products** - Full greenfield development
2. **Existing products** - Retrofitting specs to legacy code
3. **Continuing development** - Systematic feature additions

All three use cases from your original questions are now covered!

## Documentation

- `README.md` - Full server documentation
- `SETUP.md` - Installation instructions
- `SCENARIOS.md` - Detailed scenario guide (NEW!)
- `MVP_COMPLETE.md` - Original MVP summary
- `ALL_SCENARIOS_COMPLETE.md` - This file

## Next Steps

1. **Install** (if not already):
   ```bash
   npm install
   npm run build
   ```

2. **Configure** Claude Code (see SETUP.md)

3. **Test all three scenarios**:
   - Try a new project
   - Try with existing code
   - Try adding a feature to one with specs

4. **Customize** question files for your specific needs

5. **Extend** with additional scenario-specific logic if needed

## Summary

🎉 **Complete Implementation**:
- 3 scenarios × 3 workflow steps = 9 question sets
- Auto-detection working
- All templates compatible
- Build successful
- Ready to use!

The Spec-Driven Development MCP Server now handles the complete development lifecycle from greenfield to brownfield to continuing development.
