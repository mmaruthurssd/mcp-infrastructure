# AI Planning MCP Server - Iteration & Evolution Roadmap

**Created:** 2025-10-26
**Purpose:** Strategic plan for evolving this system to handle diverse project types and scales

---

## Vision: From Starting Point to Adaptive System

You described this as a "starting point" that should:
- ✅ Handle different project types (software, construction, product, etc.)
- ✅ Scale to different project sizes (small features vs large multi-project initiatives)
- ✅ Develop specialized capabilities for niche domains
- ✅ Support complex hierarchies (projects containing sub-projects)
- ✅ Iterate and improve over time

**This document outlines how to get there.**

---

## Current State Assessment

### What We Have (v0.6.0)

**Strengths:**
- Solid architecture (19 tools, 6 phases)
- Working project setup (8/8 tools functional)
- Cross-server integration designed (with spec-driven MCP)
- Template-based approach (easily customizable)
- NLP extraction (conversation → structured data)

**Limitations:**
- Generic "software project" focus only
- Single-tier project model (no sub-projects)
- Fixed templates (not domain-specific)
- Critical bug in goal management
- No project type specialization

**Immediate Needs:**
1. Fix template rendering bug (CRITICAL)
2. Add duplicate detection
3. Improve NLP extraction quality

---

## Evolution Strategy: 3 Phases

### Phase A: Fix & Stabilize (2-3 weeks)

**Goal:** Make current system production-ready

**Tasks:**
1. ✅ Fix template rendering (Issue #3)
2. ✅ Add duplicate detection
3. ✅ Improve stakeholder/goal extraction
4. ✅ Add validation & error handling
5. ✅ Create test suite
6. ✅ Document working workflows

**Deliverable:** v0.7.0 - Fully functional for software projects

---

### Phase B: Specialize (1-2 months)

**Goal:** Add project type intelligence

**Approach:** Template variants + domain-specific extraction

#### 1. Project Type System

**Structure:**
```
templates/
├── project-setup/
│   ├── software/          ← Existing
│   │   ├── CONSTITUTION.md
│   │   ├── ROADMAP.md
│   │   └── ...
│   │
│   ├── construction/       ← NEW
│   │   ├── CONSTITUTION.md (safety-first principles)
│   │   ├── ROADMAP.md (permits, inspections, phases)
│   │   ├── RESOURCES.md (contractors, materials, equipment)
│   │   └── PERMITS.md (NEW)
│   │
│   ├── product/            ← NEW
│   │   ├── CONSTITUTION.md (user-centric principles)
│   │   ├── ROADMAP.md (discovery, design, launch)
│   │   ├── MARKET-ANALYSIS.md (NEW)
│   │   └── COMPETITORS.md (NEW)
│   │
│   └── research/           ← NEW
│       ├── CONSTITUTION.md (scientific rigor)
│       ├── HYPOTHESIS.md (NEW)
│       ├── METHODOLOGY.md (NEW)
│       └── DATA-PLAN.md (NEW)
```

**Implementation:**
```typescript
// In start_project_setup
const templateSet = getTemplateSetForProjectType(projectType);

// In generate_project_constitution
const principles = getPrinciplesForDomain(projectType, conversation);

// Examples:
// Software → "Security first", "Scalability", "Maintainability"
// Construction → "Safety first", "Code compliance", "Budget control"
// Product → "User value", "Market fit", "Iterate quickly"
// Research → "Reproducibility", "Rigor", "Peer review"
```

#### 2. Domain-Specific Extraction

**NLP Patterns by Domain:**

**Software:**
- Stakeholders: "developers", "users", "DevOps", "QA"
- Resources: "GitHub", "AWS", "React", "PostgreSQL"
- Constraints: "HIPAA", "GDPR", "SOC2", "uptime SLA"

**Construction:**
- Stakeholders: "general contractor", "architect", "inspectors", "city officials"
- Resources: "excavator", "concrete", "steel", "electricians"
- Constraints: "building codes", "permits", "zoning", "OSHA"

**Product:**
- Stakeholders: "product manager", "users", "competitors", "distributors"
- Resources: "Figma", "user research", "prototyping", "manufacturing"
- Constraints: "market launch date", "pricing", "certifications"

**Research:**
- Stakeholders: "PI", "co-investigators", "IRB", "participants"
- Resources: "lab equipment", "datasets", "statistical software"
- Constraints: "IRB approval", "funding cycle", "publication timeline"

**Deliverable:** v0.8.0 - Multi-domain support (4 project types)

---

### Phase C: Scale & Hierarchy (2-3 months)

**Goal:** Support complex multi-project systems

#### 1. Project Hierarchy Model

**Concept:**
```
Enterprise Project (Parent)
├── Software Component (Child)
│   ├── Frontend (Sub-child)
│   └── Backend (Sub-child)
│
├── Construction Component (Child)
│   ├── Site Prep (Sub-child)
│   └── Building (Sub-child)
│
└── Operations Component (Child)
    ├── Training (Sub-child)
    └── Support (Sub-child)
```

**File Structure:**
```
mega-project/
├── project-setup/              ← Parent level
│   ├── CONSTITUTION.md         (enterprise principles)
│   ├── ROADMAP.md              (cross-component timeline)
│   └── COMPONENTS.md           (list of child projects)
│
├── components/
│   ├── software-component/
│   │   ├── project-setup/      (inherits + extends parent)
│   │   ├── sub-components/
│   │   │   ├── frontend/
│   │   │   └── backend/
│   │   └── brainstorming/
│   │
│   ├── construction-component/
│   │   └── ...
│   │
│   └── operations-component/
│       └── ...
```

**Constitution Inheritance:**
```typescript
// Parent (Enterprise)
Principles:
  1. Safety first (all components)
  2. Regulatory compliance (all components)
  3. Budget accountability (all components)

// Child (Software Component) - inherits + adds
Principles:
  1. Safety first ← (inherited)
  2. Regulatory compliance ← (inherited)
  3. Budget accountability ← (inherited)
  4. Data security ← (added)
  5. Scalability ← (added)
```

#### 2. New Tools for Hierarchy

**Tool:** `create_sub_project`
```typescript
{
  parentProjectPath: "/path/to/parent",
  componentName: "software-component",
  componentType: "software",
  inheritPrinciples: true,
  additionalPrinciples: ["Data security", "Scalability"]
}
```

**Tool:** `sync_parent_roadmap`
```typescript
// Aggregates all child roadmaps into parent view
{
  projectPath: "/path/to/parent",
  includeComponents: ["all"]  // or ["software", "construction"]
}
```

**Tool:** `check_component_dependencies`
```typescript
// Identifies cross-component dependencies
{
  projectPath: "/path/to/parent"
}
// Output:
// "Software component depends on Construction milestone M2.1"
// "Operations training blocked until Software is 80% complete"
```

**Deliverable:** v1.0.0 - Full hierarchy support

---

## Project Size Adaptations

### Small Projects (Single Feature, <2 weeks)

**Optimization:** Skip project setup, go straight to goal management

**Workflow:**
```
evaluate_goal → create_potential_goal → promote_to_selected → spec-driven MCP
```

**No need for:**
- Constitution (use team defaults)
- Roadmap (simple task list sufficient)
- Stakeholder analysis (obvious)

---

### Medium Projects (MVP, 1-3 months)

**Current System:** Perfect fit ✅

**Workflow:**
```
Project Setup (8 tools) → Goal Management → Spec-driven execution
```

**Outputs:**
- Constitution (quick mode)
- Simple roadmap (2-3 phases)
- Goal tracking
- Progress reports

---

### Large Projects (Multi-month, Multiple Components)

**Enhancements Needed:**
- Roadmap versioning (v1.0, v1.1, v1.2 as scope changes)
- Dependency tracking
- Risk management
- Budget tracking
- Capacity planning

**New Tools:**
- `update_roadmap_version` - Track major changes
- `add_dependency` - Link goals/components
- `track_budget` - Monitor spending vs. estimates
- `capacity_check` - Warn about over-commitment

---

### Mega Projects (Multi-year, Cross-domain)

**Hierarchy Approach:**

```
Construction + Software Hospital System
├── Physical Construction (12 months)
│   ├── Site Preparation (2 months)
│   ├── Foundation (3 months)
│   ├── Structure (5 months)
│   └── Interior (2 months)
│
├── Medical Equipment (6 months)
│   ├── Procurement (2 months)
│   ├── Installation (3 months)
│   └── Testing (1 month)
│
└── Hospital Management Software (9 months)
    ├── Patient Records System (4 months)
    ├── Appointment Scheduling (3 months)
    └── Billing System (2 months)
```

**Requirements:**
- Cross-component coordination
- Milestone dependencies (software can't start until building has power)
- Separate budgets per component
- Different stakeholders per domain
- Unified parent roadmap

---

## Domain Specialization Examples

### Healthcare Projects

**Custom Constitution Principles:**
- HIPAA compliance non-negotiable
- Patient safety paramount
- Clinical workflow optimization
- Provider burden minimization

**Custom Questions:**
- "Does this handle PHI/patient data?"
- "Which clinical workflows are affected?"
- "What are the clinical risks?"
- "Have you consulted with providers?"

**Custom Stakeholders:**
- Clinical staff (MDs, RNs, NPs)
- Patients
- Compliance officers
- HIPAA security officers
- Insurance partners
- Regulatory bodies (HHS, state boards)

**Custom Assets:**
- EHR integrations
- HL7 FHIR APIs
- Security certifications
- BAAs (Business Associate Agreements)

---

### Construction Projects

**Custom Constitution Principles:**
- Safety first - zero injuries
- Code compliance - no violations
- Schedule adherence - avoid delays
- Budget control - no overruns

**Custom Questions:**
- "What permits are required?"
- "What are the site conditions?"
- "What's the inspection schedule?"
- "Who are the subcontractors?"

**Custom Stakeholders:**
- General contractor
- Subcontractors (electrical, plumbing, HVAC)
- Architects
- Engineers (structural, MEP)
- Building inspectors
- City planning department
- Neighbors (for impact)

**Custom Assets:**
- Blueprints/plans
- Permits
- Site surveys
- Material suppliers
- Equipment rentals
- Insurance policies

**Custom Documents:**
- `PERMITS.md` - List of required permits & status
- `INSPECTIONS.md` - Schedule of inspections
- `SAFETY-PLAN.md` - OSHA requirements

---

### Product Development

**Custom Constitution Principles:**
- User value first
- Market validation early
- Iterate quickly
- Data-driven decisions

**Custom Questions:**
- "Who is the target user?"
- "What's the unique value proposition?"
- "Who are the competitors?"
- "What's the go-to-market strategy?"

**Custom Stakeholders:**
- Product manager
- Target users/customers
- Sales team
- Marketing team
- Competitors (monitor)
- Distribution partners
- Manufacturing (if physical)

**Custom Assets:**
- User research findings
- Competitive analysis
- Market sizing data
- Prototypes
- User feedback loops
- Analytics setup

**Custom Documents:**
- `MARKET-ANALYSIS.md` - TAM/SAM/SOM, trends
- `COMPETITORS.md` - Feature comparison, positioning
- `GTM-STRATEGY.md` - Launch plan, channels, pricing

---

## Implementation Strategy

### Approach 1: Template Variants (Easiest)

**Pros:**
- Easy to implement
- Clear separation by domain
- Customizable per project type

**Cons:**
- Template proliferation
- Harder to maintain consistency
- Duplicate code/content

**When to use:** Phase B (4-5 project types)

---

### Approach 2: Modular Templates + Composition (Scalable)

**Structure:**
```
templates/
├── base/
│   ├── CONSTITUTION-BASE.md      (core structure)
│   ├── ROADMAP-BASE.md
│   └── STAKEHOLDERS-BASE.md
│
├── modules/
│   ├── principles/
│   │   ├── software.md
│   │   ├── construction.md
│   │   ├── product.md
│   │   └── research.md
│   │
│   ├── stakeholder-types/
│   │   ├── software-stakeholders.md
│   │   ├── construction-stakeholders.md
│   │   └── ...
│   │
│   └── assets/
│       ├── software-assets.md
│       └── ...
│
└── composed/               (generated at runtime)
```

**Composition Logic:**
```typescript
function generateConstitution(projectType: string, conversation: Conversation) {
  const base = loadTemplate('base/CONSTITUTION-BASE.md');
  const principles = loadModule(`modules/principles/${projectType}.md`);
  const guidelines = inferGuidelines(conversation, projectType);
  const constraints = extractConstraints(conversation, projectType);

  return compose(base, principles, guidelines, constraints);
}
```

**Pros:**
- DRY (don't repeat yourself)
- Easy to add new domains
- Consistent structure
- Mix-and-match capabilities

**Cons:**
- More complex implementation
- Requires composition engine
- Harder to debug

**When to use:** Phase C (10+ project types, hybrid projects)

---

### Approach 3: AI-Generated Templates (Future)

**Concept:**
- No fixed templates
- AI generates constitution/roadmap based on conversation
- Uses few-shot learning from example projects

**Pros:**
- Infinitely flexible
- Handles novel project types
- No template maintenance

**Cons:**
- Requires LLM integration
- Quality/consistency concerns
- Token costs

**When to use:** v2.0+ (after stable base)

---

## Recommended Path Forward

### Immediate (Next 2 weeks)

1. **Fix Critical Bug**
   - Debug GoalTemplateRenderer
   - Add template rendering tests
   - Verify complete workflow

2. **Stabilize Core**
   - Add duplicate detection
   - Improve NLP extraction
   - Add validation

### Short-term (Month 1-2)

3. **Add 3-4 Project Types**
   - Use Approach 1 (Template Variants)
   - Focus on: software, construction, product, research
   - Test with real projects

4. **Document Patterns**
   - What works well?
   - What needs customization?
   - Common principles across types?

### Medium-term (Month 3-4)

5. **Refactor to Modular (Approach 2)**
   - Extract common base templates
   - Create principle/stakeholder/asset modules
   - Build composition engine

6. **Add Hierarchy Support**
   - Parent/child project model
   - Principle inheritance
   - Cross-component dependencies

### Long-term (Month 5-6)

7. **Domain Intelligence**
   - Smart question selection by domain
   - Better NLP for domain-specific entities
   - Validation rules per domain

8. **Scale Features**
   - Roadmap versioning
   - Budget tracking
   - Capacity planning
   - Risk management

---

## Success Metrics

### Phase A (Stabilize)
- ✅ Zero critical bugs
- ✅ 100% tool test coverage
- ✅ Complete software project workflow works end-to-end

### Phase B (Specialize)
- ✅ 4 project types supported
- ✅ Domain-specific templates reduce manual editing by 50%
- ✅ NLP extraction accuracy >80% for each domain

### Phase C (Scale)
- ✅ Support 3-level project hierarchy
- ✅ Cross-component dependency tracking
- ✅ Handle 100+ goal projects without performance issues

---

## Open Questions for Discussion

1. **Priority Order:**
   - Fix bugs first, or add features in parallel?
   - Which project types are highest priority?

2. **Scope:**
   - How deep should domain specialization go?
   - How many project types to support in v1.0?

3. **Architecture:**
   - Stick with template approach or explore AI generation?
   - When to refactor to modular system?

4. **User Control:**
   - How much AI automation vs. user customization?
   - Should templates be editable by users?

5. **Integration:**
   - How tightly integrate with spec-driven MCP?
   - Should this system handle task execution or just planning?

---

## Conclusion

**The AI Planning MCP Server has immense potential.**

**Current state:** Solid foundation, one critical bug away from being highly useful for software projects.

**Next step:** Fix the template rendering bug, then decide:
- Quick iteration (add more project types with template variants)
- Or deeper refactor (build modular composition system for long-term scalability)

**Recommendation:** Fix bug → add 2-3 project types quickly → learn what works → then refactor for scale.

This "build, learn, refactor" approach balances speed with sustainability.

---

**Ready to iterate!**
**Created:** 2025-10-26
**Status:** Roadmap Defined, Awaiting Prioritization
