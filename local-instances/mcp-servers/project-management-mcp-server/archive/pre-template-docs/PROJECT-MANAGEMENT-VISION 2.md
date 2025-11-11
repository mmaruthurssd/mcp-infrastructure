---
type: specification
phase: stable
project: ai-planning-mcp-server
tags: [vision, roadmap, planning, project-management, future]
category: mcp-servers
status: in-progress
priority: medium
---

# Project Management MCP Server - Complete Vision

**Created:** 2025-10-26
**Status:** Gap Analysis & Implementation Plan

---

## Overview: Three-Part System

This MCP server provides **end-to-end project management** from initial planning to execution:

```
┌─────────────────────┐
│  PART 1:            │
│  PROJECT SETUP      │──┐
│                     │  │
│  • Unstructured     │  │
│    planning convo   │  │
│  • Goal extraction  │  │
│  • Constitution     │  │
│  • Roadmap v1.0     │  │
│  • Resources        │  │
│  • Assets           │  │
│  • Stakeholders     │  │
└─────────────────────┘  │
                         │
                         ▼
┌─────────────────────┐  │
│  PART 2:            │◀─┘
│  GOAL MANAGEMENT    │
│                     │
│  • Goals from setup │
│  • + Brainstorming  │
│  • Prioritization   │
│  • Main → Sub-goals │
│  • Update roadmap   │
│  • Lifecycle mgmt   │
└─────────────────────┘
                         │
                         ▼
┌─────────────────────┐  │
│  PART 3:            │◀─┘
│  GOAL EXECUTION     │
│                     │
│  • Spec-Driven MCP  │
│  • Task breakdown   │
│  • Implementation   │
│  • Progress → Part 2│
└─────────────────────┘
```

---

## Part 1: PROJECT SETUP (NOT IMPLEMENTED)

### Purpose
Initial project planning through conversational workflow that establishes foundation.

### User Flow
1. User initiates project setup conversation
2. AI guides unstructured discussion about project vision, problems, goals
3. System extracts structured information
4. Generates project documents: constitution, roadmap, resource plan
5. Identifies initial goals to feed into Part 2

### Required Tools

#### Tool 1: `start_project_setup`
**Status:** ❌ NOT IMPLEMENTED

**Purpose:** Initiate conversational project planning session

**Input:**
```typescript
{
  projectPath: string;
  projectName: string;
  projectType?: 'software' | 'research' | 'business' | 'product';
  initialDescription?: string;  // Optional seed
}
```

**What it does:**
- Creates project directory structure
- Initiates conversation state
- Guides user through discovery questions:
  - What problem are we solving?
  - Who are the stakeholders?
  - What resources do we have?
  - What assets exist or are needed?
  - What are the constraints?
  - What are success criteria?

**Output:**
```typescript
{
  success: true;
  conversationId: string;
  sessionFile: string;  // Where conversation is logged
  nextQuestion: string;  // First question to ask user
}
```

---

#### Tool 2: `continue_project_setup`
**Status:** ❌ NOT IMPLEMENTED

**Purpose:** Continue multi-turn planning conversation

**Input:**
```typescript
{
  projectPath: string;
  conversationId: string;
  userResponse: string;  // User's answer to last question
}
```

**What it does:**
- Logs user response
- Analyzes conversation so far
- Determines what information is still missing
- Asks next question or suggests completion

**Output:**
```typescript
{
  success: true;
  nextQuestion?: string;      // Next question (if more needed)
  readyToGenerate?: boolean;  // If enough info gathered
  extractedSoFar: {
    goals: string[];
    stakeholders: string[];
    resources: string[];
    assets: string[];
    constraints: string[];
  };
}
```

---

#### Tool 3: `extract_project_goals`
**Status:** ❌ NOT IMPLEMENTED

**Purpose:** Extract structured goals from planning conversation

**Input:**
```typescript
{
  projectPath: string;
  conversationId: string;
}
```

**What it does:**
- Parses entire conversation
- Identifies goal statements using NLP patterns
- Categorizes into main goals vs sub-goals
- Estimates initial impact/effort
- Suggests tier placement

**Output:**
```typescript
{
  success: true;
  goalsExtracted: number;
  mainGoals: Array<{
    name: string;
    description: string;
    suggestedImpact: string;
    suggestedEffort: string;
    suggestedTier: string;
    extractedFrom: string;  // Quote from conversation
  }>;
}
```

---

#### Tool 4: `generate_project_constitution`
**Status:** ❌ NOT IMPLEMENTED

**Purpose:** Generate project-specific constitution (principles, guidelines, constraints)

**Input:**
```typescript
{
  projectPath: string;
  conversationId: string;
  projectType: 'software' | 'research' | 'business' | 'product';
}
```

**What it does:**
- Analyzes project type, goals, constraints from conversation
- Generates constitution with sections:
  - **Core Principles** (3-5 guiding principles)
  - **Decision Framework** (how to make tradeoff decisions)
  - **Quality Guidelines** (standards and criteria)
  - **Constraints** (technical, budget, timeline, regulatory)
  - **Ethics Statement** (if applicable)
  - **Success Criteria** (how we measure success)

**Output:**
```typescript
{
  success: true;
  constitutionPath: string;  // e.g., project-setup/CONSTITUTION.md
  sections: {
    principles: string[];
    decisionFramework: string;
    guidelines: string[];
    constraints: string[];
    successCriteria: string[];
  };
}
```

**Example Constitution:**
```markdown
# Project Constitution: Medical Practice Management System

## Core Principles
1. **Patient Privacy First** - HIPAA compliance is non-negotiable
2. **Physician-Centric UX** - Optimize for busy doctors, not admins
3. **Data Integrity** - Never sacrifice data accuracy for speed
4. **Incremental Value** - Ship small, useful features frequently
5. **Open Standards** - Use HL7 FHIR where possible

## Decision Framework
When facing tradeoffs, prioritize in this order:
1. Patient safety and privacy
2. Regulatory compliance (HIPAA, HITECH)
3. Physician time savings
4. Implementation speed
5. Cost reduction

## Quality Guidelines
- All PHI must be encrypted at rest and in transit
- 99.9% uptime SLA for patient-facing features
- Sub-2-second response time for common workflows
- Accessibility: WCAG 2.1 AA minimum
- Mobile-responsive design required

## Constraints
- **Budget:** $150K for Year 1
- **Timeline:** MVP in 6 months
- **Team:** 2 developers, 1 designer, 1 PM
- **Technology:** Must integrate with existing Epic EHR
- **Regulatory:** HIPAA, HITECH, state medical privacy laws

## Success Criteria
- Adoption: 80% of physicians using within 3 months of launch
- Time savings: 30 minutes per physician per day
- Patient satisfaction: >4.5/5 rating
- Zero HIPAA violations
- ROI: Positive within 12 months
```

---

#### Tool 5: `generate_initial_roadmap`
**Status:** ❌ NOT IMPLEMENTED

**Purpose:** Create initial project roadmap with milestones and phases

**Input:**
```typescript
{
  projectPath: string;
  conversationId: string;
  goals: GoalSummary[];  // From extract_project_goals
  timeframe?: string;    // e.g., "6 months", "1 year"
}
```

**What it does:**
- Groups goals into logical phases
- Creates milestone structure
- Estimates timeline based on effort scores
- Identifies dependencies
- Generates ROADMAP.md

**Output:**
```typescript
{
  success: true;
  roadmapPath: string;
  phases: Array<{
    name: string;
    duration: string;
    goals: string[];
    milestones: Array<{
      name: string;
      deadline: string;
      deliverables: string[];
    }>;
  }>;
}
```

**Example Roadmap Structure:**
```markdown
# Project Roadmap: Medical Practice Management System

**Version:** 1.0
**Created:** 2025-10-26
**Timeline:** 6 months (Nov 2025 - Apr 2026)

## Phase 1: Foundation (Months 1-2)
**Goal:** Establish core infrastructure and authentication

### Milestones
- **M1.1:** Authentication & Authorization (Week 4)
  - HIPAA-compliant user management
  - Role-based access control
  - Audit logging

- **M1.2:** Database & API Foundation (Week 8)
  - PostgreSQL with encryption
  - RESTful API with FHIR support
  - Integration testing framework

### Goals from Project Setup
- Goal 01: User Authentication System
- Goal 02: Database Schema Design
- Goal 03: API Gateway

---

## Phase 2: Patient Portal (Months 3-4)
...
```

---

#### Tool 6: `identify_resources_and_assets`
**Status:** ❌ NOT IMPLEMENTED

**Purpose:** Create resource inventory and asset list from conversation

**Input:**
```typescript
{
  projectPath: string;
  conversationId: string;
}
```

**What it does:**
- Extracts mentioned resources from conversation:
  - **Team members** (developers, designers, etc.)
  - **Tools** (GitHub, Figma, AWS, etc.)
  - **Technologies** (React, Node.js, PostgreSQL, etc.)
  - **Budget** ($X for development, $Y for infrastructure)
  - **Timeline** (6 months to MVP, etc.)

- Extracts mentioned assets:
  - **Existing assets** (current EHR system, design system, etc.)
  - **Needed assets** (API documentation, user research, etc.)
  - **External dependencies** (third-party APIs, compliance certifications)

- Generates two files:
  - `project-setup/RESOURCES.md`
  - `project-setup/ASSETS.md`

**Output:**
```typescript
{
  success: true;
  resourcesPath: string;
  assetsPath: string;
  resources: {
    team: Array<{ name: string; role: string; allocation: string }>;
    tools: string[];
    technologies: string[];
    budget: { total: string; breakdown: Record<string, string> };
    timeline: { duration: string; milestones: string[] };
  };
  assets: {
    existing: Array<{ name: string; description: string; location: string }>;
    needed: Array<{ name: string; description: string; priority: string }>;
    external: Array<{ name: string; provider: string; cost?: string }>;
  };
}
```

**Example RESOURCES.md:**
```markdown
# Project Resources

## Team
| Name | Role | Allocation | Skills |
|------|------|------------|--------|
| Sarah Chen | Lead Developer | 100% | React, Node.js, FHIR |
| Alex Kumar | Backend Developer | 100% | PostgreSQL, AWS, Security |
| Jamie Lee | UI/UX Designer | 50% | Figma, User Research |
| Dr. Smith | Medical Advisor | 10% | Clinical Workflows |

## Tools & Platforms
- **Development:** GitHub, VS Code, Docker
- **Design:** Figma, Adobe Creative Suite
- **Infrastructure:** AWS (EC2, RDS, S3), CloudFlare
- **Communication:** Slack, Zoom
- **Project Management:** Linear, Notion

## Technologies
### Frontend
- React 18 with TypeScript
- TailwindCSS for styling
- React Query for state management

### Backend
- Node.js with Express
- PostgreSQL with pgcrypto
- Redis for session management

### Security & Compliance
- Auth0 for authentication
- AWS KMS for encryption
- HIPAA-compliant logging (Logz.io)

## Budget
**Total:** $150,000 for Year 1

| Category | Amount | Notes |
|----------|--------|-------|
| Development | $80,000 | 2 developers × 6 months |
| Infrastructure | $20,000 | AWS, Auth0, monitoring |
| Design | $15,000 | UI/UX, user research |
| Compliance | $25,000 | HIPAA audit, security review |
| Contingency | $10,000 | Buffer for unknowns |

## Timeline
**Total Duration:** 6 months (Nov 2025 - Apr 2026)
- Phase 1: Foundation (2 months)
- Phase 2: Patient Portal (2 months)
- Phase 3: Physician Dashboard (2 months)
```

**Example ASSETS.md:**
```markdown
# Project Assets

## Existing Assets

### Integration Points
- **Epic EHR System**
  - Location: On-premise servers
  - API: HL7 FHIR R4
  - Documentation: Available via Epic vendor portal
  - Contact: IT Director John Doe

- **Existing Patient Database**
  - Location: Legacy SQL Server
  - Records: 50,000+ patients
  - Migration needed: Yes
  - Compliance status: HIPAA compliant

### Design Assets
- **Brand Guidelines**
  - Location: `/design/brand-guidelines.pdf`
  - Last updated: 2024-06-15
  - Includes: Logo, colors, typography

## Needed Assets

### Documentation (High Priority)
- [ ] API documentation for Epic integration
- [ ] User research findings (patient personas)
- [ ] Workflow diagrams (current state)
- [ ] Security architecture review

### Design Deliverables (High Priority)
- [ ] UI component library in Figma
- [ ] Mobile responsive designs
- [ ] Accessibility guidelines

### Legal & Compliance (Critical)
- [ ] HIPAA Business Associate Agreement
- [ ] Privacy policy and terms of service
- [ ] Security incident response plan
- [ ] Data retention policy

## External Dependencies

### Third-Party Services
- **Auth0** (Authentication)
  - Cost: $240/month
  - Setup time: 1 week
  - Contact: sales@auth0.com

- **Twilio** (SMS notifications)
  - Cost: $0.0075 per message
  - Setup time: 2 days
  - API docs: Available

### Certifications & Audits
- **HIPAA Security Assessment**
  - Provider: SecureHealth Auditors
  - Cost: $15,000
  - Timeline: 4-6 weeks
  - Required before: Production launch
```

---

#### Tool 7: `identify_stakeholders`
**Status:** ❌ NOT IMPLEMENTED

**Purpose:** Extract and categorize stakeholders from conversation

**Input:**
```typescript
{
  projectPath: string;
  conversationId: string;
}
```

**What it does:**
- Identifies stakeholders mentioned in conversation
- Categorizes by type and influence level
- Determines communication needs
- Generates STAKEHOLDERS.md

**Output:**
```typescript
{
  success: true;
  stakeholdersPath: string;
  stakeholders: Array<{
    name: string;
    role: string;
    type: 'primary' | 'secondary' | 'external';
    influence: 'high' | 'medium' | 'low';
    interest: 'high' | 'medium' | 'low';
    communicationNeeds: string;
  }>;
}
```

**Example STAKEHOLDERS.md:**
```markdown
# Project Stakeholders

## Primary Stakeholders (Direct Impact)

### Dr. Emily Rodriguez - Chief Medical Officer
- **Role:** Executive Sponsor
- **Influence:** High
- **Interest:** High
- **Needs:** Monthly progress reports, demos before each release
- **Concerns:** Patient privacy, physician adoption, ROI
- **Communication:** Monthly executive briefing + ad-hoc escalations

### Medical Staff (15 physicians, 25 nurses)
- **Role:** End Users
- **Influence:** High (can make/break adoption)
- **Interest:** High
- **Needs:** Training, clear communication about changes, feedback loop
- **Concerns:** Workflow disruption, learning curve, reliability
- **Communication:** Weekly newsletter, monthly town hall, dedicated Slack channel

## Secondary Stakeholders (Indirect Impact)

### IT Department
- **Role:** Infrastructure support, integration
- **Influence:** Medium
- **Interest:** Medium
- **Needs:** Technical documentation, security reviews, deployment plans
- **Concerns:** Server load, security, maintenance burden
- **Communication:** Bi-weekly technical sync

### Patients (50,000+ registered)
- **Role:** Beneficiaries
- **Influence:** Low (indirect through feedback)
- **Interest:** Medium
- **Needs:** Clear privacy notices, easy-to-use portal
- **Concerns:** Data privacy, ease of use
- **Communication:** Release notes, help center

## External Stakeholders

### Health Insurance Partners
- **Role:** Data integration partners
- **Influence:** Medium
- **Interest:** Low
- **Needs:** API documentation, compliance certification
- **Concerns:** Data format compatibility
- **Communication:** Quarterly business reviews

### Regulatory Bodies (HHS, State Medical Board)
- **Role:** Compliance oversight
- **Influence:** High (can shut down project)
- **Interest:** Low (unless issues arise)
- **Needs:** HIPAA compliance documentation, audit trail
- **Concerns:** Patient privacy violations
- **Communication:** As required by audits/inspections

## Stakeholder Matrix

| Stakeholder | Influence | Interest | Strategy |
|-------------|-----------|----------|----------|
| CMO | High | High | **Manage Closely** - Weekly updates |
| Medical Staff | High | High | **Manage Closely** - Active engagement |
| IT Department | Medium | Medium | **Keep Informed** - Regular sync |
| Patients | Low | Medium | **Keep Informed** - Passive updates |
| Insurance Partners | Medium | Low | **Monitor** - Quarterly check-ins |
| Regulatory Bodies | High | Low | **Monitor** - Compliance documentation |
```

---

#### Tool 8: `finalize_project_setup`
**Status:** ❌ NOT IMPLEMENTED

**Purpose:** Complete project setup and transition to goal management

**Input:**
```typescript
{
  projectPath: string;
  conversationId: string;
}
```

**What it does:**
- Validates all required documents generated:
  - ✅ CONSTITUTION.md
  - ✅ ROADMAP.md
  - ✅ RESOURCES.md
  - ✅ ASSETS.md
  - ✅ STAKEHOLDERS.md
  - ✅ Conversation log
- Extracts initial goals and creates potential goal files
- Generates project summary
- Marks setup as complete

**Output:**
```typescript
{
  success: true;
  setupComplete: true;
  documentsGenerated: string[];
  initialGoalsCreated: number;
  nextStep: "Begin goal management with prioritize_goal tool";
  summary: string;
}
```

---

## Part 2: GOAL MANAGEMENT (PARTIALLY IMPLEMENTED)

### Purpose
Manage goal lifecycle from initial extraction through completion.

### Current Status: 70% Complete

✅ **IMPLEMENTED:**
- Goal brainstorming (extract_ideas)
- Goal evaluation (evaluate_goal)
- Potential goal creation (create_potential_goal)
- Goal promotion (promote_to_selected)
- Goal dashboard (view_goals_dashboard)
- Goal reordering (reorder_selected_goals)
- Progress tracking (update_goal_progress)
- Archive & review (archive_goal, check_review_needed, generate_review_report)
- Visualization (generate_goals_diagram)

❌ **MISSING:**
- Main goal → Sub-goal breakdown
- Automatic roadmap updates when goals change
- Integration with project setup (receive initial goals)

### Required Additions

#### Tool 9: `create_subgoals`
**Status:** ❌ NOT IMPLEMENTED

**Purpose:** Break down a main goal into actionable sub-goals

**Input:**
```typescript
{
  projectPath: string;
  mainGoalId: string;      // e.g., "01"
  numSubgoals?: number;    // Optional: suggested breakdown size
}
```

**What it does:**
- Reads main goal description and requirements
- Uses AI to break down into logical sub-goals (3-8 typically)
- Each sub-goal is a smaller, actionable piece
- Creates sub-goal files with IDs like "01.1", "01.2", "01.3"
- Updates main goal to reference sub-goals

**Output:**
```typescript
{
  success: true;
  mainGoalId: string;
  mainGoalName: string;
  subgoalsCreated: number;
  subgoals: Array<{
    id: string;           // "01.1", "01.2"
    name: string;
    description: string;
    estimatedEffort: string;
    dependencies: string[];
  }>;
}
```

**Example:**
```
Main Goal 01: Patient Portal MVP

Sub-goals created:
  01.1: Authentication & User Management
  01.2: View Medical Records
  01.3: Schedule Appointments
  01.4: Secure Messaging with Physicians
  01.5: Prescription Refill Requests
```

---

#### Tool 10: `update_roadmap_from_goals`
**Status:** ❌ NOT IMPLEMENTED

**Purpose:** Automatically update ROADMAP.md when goals change

**Input:**
```typescript
{
  projectPath: string;
  trigger: 'goal_added' | 'goal_completed' | 'goal_reprioritized' | 'manual';
}
```

**What it does:**
- Scans current selected goals
- Compares to roadmap phases/milestones
- Updates milestone completion percentages
- Adjusts timeline estimates based on velocity
- Adds new goals to appropriate phases
- Marks completed milestones
- Updates version number

**Output:**
```typescript
{
  success: true;
  roadmapUpdated: boolean;
  changes: string[];
  newVersion: string;  // e.g., "1.3"
}
```

---

## Part 3: GOAL EXECUTION (SPEC-DRIVEN MCP)

### Purpose
Execute individual goals with detailed specifications and task tracking.

### Current Status: Integration Points Defined

✅ **IMPLEMENTED (in Spec-Driven MCP):**
- Spec generation (sdd_guide)
- Task management (tasks.md)
- Progress tracking

✅ **IMPLEMENTED (in AI Planning MCP):**
- Cross-server goal context handoff (promote_to_selected with generateSpec=true)
- Progress sync (update_goal_progress can read from spec tasks.md)

❌ **NEEDS ENHANCEMENT:**
- Automatic progress sync from Spec-Driven MCP → AI Planning MCP
- Completion notification triggering archive workflow

---

## Complete User Flow

### Scenario: Starting a New Project

```
Step 1: PROJECT SETUP
───────────────────────────────────────
User: "I want to start a new medical practice management system project"

AI: start_project_setup({
  projectPath: "/path/to/medical-practice",
  projectName: "Medical Practice Management System",
  projectType: "software"
})

AI: "Great! Let's discuss your project. What's the main problem you're trying to solve?"

User: "Our physicians spend 30 minutes per day on administrative tasks..."

AI: continue_project_setup({ userResponse: "..." })

[... conversation continues for 10-15 minutes ...]

AI: "I have enough information. Let me generate your project documents."

AI: Calls in sequence:
  1. extract_project_goals()
  2. generate_project_constitution()
  3. generate_initial_roadmap()
  4. identify_resources_and_assets()
  5. identify_stakeholders()
  6. finalize_project_setup()

AI: "✅ Project setup complete! I've created:
     - CONSTITUTION.md with 5 core principles
     - ROADMAP.md with 3 phases over 6 months
     - RESOURCES.md (2 developers, $150K budget)
     - ASSETS.md (Epic integration, existing patient DB)
     - STAKEHOLDERS.md (CMO, 15 physicians, IT dept)
     - 8 initial goals extracted

     Ready to move to goal management?"

───────────────────────────────────────
Step 2: GOAL MANAGEMENT
───────────────────────────────────────

AI: "I found 8 initial goals from your project setup. Let me create potential goal files..."

AI: For each extracted goal:
  evaluate_goal() → create_potential_goal()

AI: "Now let's brainstorm additional goals. Do you have a brainstorming doc?"

User: "Yes, here: brainstorming/ongoing-discussion.md"

AI: extract_ideas({ filePath: "brainstorming/ongoing-discussion.md" })
AI: "Found 5 more ideas. Creating potential goals..."

AI: view_goals_dashboard()
AI: "You now have 13 potential goals. Let's prioritize the top ones."

User: "Promote Patient Portal MVP and Authentication System to selected"

AI: promote_to_selected({ goalId: "patient-portal-mvp", tier: "Now", priority: "High" })
AI: promote_to_selected({ goalId: "authentication-system", tier: "Now", priority: "High" })

AI: "Would you like me to break down the Patient Portal MVP into sub-goals?"

User: "Yes"

AI: create_subgoals({ mainGoalId: "01" })  # NEW TOOL
AI: "Created 5 sub-goals for Patient Portal MVP:
     01.1: Authentication & User Management
     01.2: View Medical Records
     01.3: Schedule Appointments
     01.4: Secure Messaging
     01.5: Prescription Refills"

AI: update_roadmap_from_goals({ trigger: "goal_added" })  # NEW TOOL
AI: "✅ Roadmap updated to v1.1 - added goals to Phase 1"

───────────────────────────────────────
Step 3: GOAL EXECUTION (with Spec-Driven MCP)
───────────────────────────────────────

User: "Let's start working on Authentication (sub-goal 01.1)"

AI: promote_to_selected({
  goalId: "authentication-system",
  tier: "Now",
  priority: "High",
  generateSpec: true  # Request goal context for handoff
})

AI: "I've prepared the goal context. Now calling Spec-Driven MCP..."

AI: [Spec-Driven MCP] sdd_guide({
  action: "start",
  projectPath: "/path/to/medical-practice",
  scenario: "add-feature",
  goalContext: { /* goal data from AI Planning MCP */ }
})

[... spec generation workflow ...]

AI: "✅ Specification created: specs/authentication-system/SPEC.md"

[... user implements feature ...]

AI: [Auto-sync] update_goal_progress({
  goalId: "01.1",
  specPath: "specs/authentication-system",
  # Reads tasks.md to calculate progress
})

AI: "Progress updated: Authentication System at 60% (12/20 tasks complete)"

[... feature completed ...]

AI: update_goal_progress({
  goalId: "01.1",
  progress: 100,
  status: "Completed"
})

AI: update_roadmap_from_goals({ trigger: "goal_completed" })  # NEW TOOL
AI: "✅ Roadmap updated - Milestone M1.1 now at 100%"

AI: "Would you like to archive this goal with a retrospective?"

User: "Yes"

AI: archive_goal({
  goalId: "01.1",
  archiveReason: "completed",
  retrospective: { ... }
})
```

---

## Implementation Roadmap

### Phase 6: Project Setup Tools (NEW - PRIORITY)

**Duration:** 3-4 weeks

**Tools to Build:**
1. ✅ `start_project_setup` - Initiate conversation
2. ✅ `continue_project_setup` - Multi-turn dialogue
3. ✅ `extract_project_goals` - Goal extraction from conversation
4. ✅ `generate_project_constitution` - Constitution generation
5. ✅ `generate_initial_roadmap` - Roadmap v1.0
6. ✅ `identify_resources_and_assets` - Resource & asset inventory
7. ✅ `identify_stakeholders` - Stakeholder analysis
8. ✅ `finalize_project_setup` - Complete setup, transition to Part 2

**Files to Create:**
```
src/tools/start-project-setup.ts
src/tools/continue-project-setup.ts
src/tools/extract-project-goals.ts
src/tools/generate-project-constitution.ts
src/tools/generate-initial-roadmap.ts
src/tools/identify-resources-and-assets.ts
src/tools/identify-stakeholders.ts
src/tools/finalize-project-setup.ts

src/utils/conversation-manager.ts
src/utils/nlp-extractor.ts
src/utils/constitution-generator.ts
src/utils/roadmap-builder.ts
src/utils/stakeholder-analyzer.ts

src/templates/project-setup/
  ├── CONSTITUTION.md
  ├── ROADMAP.md
  ├── RESOURCES.md
  ├── ASSETS.md
  └── STAKEHOLDERS.md
```

---

### Phase 7: Goal Management Enhancements (NEW)

**Duration:** 1-2 weeks

**Tools to Build:**
1. ✅ `create_subgoals` - Break main goals into sub-goals
2. ✅ `update_roadmap_from_goals` - Auto-sync roadmap with goals

**Files to Create:**
```
src/tools/create-subgoals.ts
src/tools/update-roadmap-from-goals.ts
src/utils/subgoal-generator.ts
src/utils/roadmap-updater.ts
```

---

### Phase 8: Integration & Polish

**Duration:** 1 week

**Tasks:**
1. End-to-end testing of complete flow
2. Cross-server integration testing
3. Documentation updates
4. Example project walkthroughs

---

## Final Tool Count

After all phases complete:

**Part 1: Project Setup** (8 tools)
- start_project_setup
- continue_project_setup
- extract_project_goals
- generate_project_constitution
- generate_initial_roadmap
- identify_resources_and_assets
- identify_stakeholders
- finalize_project_setup

**Part 2: Goal Management** (13 tools)
- extract_ideas ✅
- evaluate_goal ✅
- create_potential_goal ✅
- promote_to_selected ✅
- view_goals_dashboard ✅
- reorder_selected_goals ✅
- update_goal_progress ✅
- archive_goal ✅
- check_review_needed ✅
- generate_review_report ✅
- generate_goals_diagram ✅
- create_subgoals (NEW)
- update_roadmap_from_goals (NEW)

**Part 3: Goal Execution**
- Handled by Spec-Driven MCP with integration hooks

**Total:** 21 tools for complete project management workflow

---

## Next Steps

1. **Review & Approve** this vision document
2. **Implement Phase 6** (Project Setup Tools) - 3-4 weeks
3. **Implement Phase 7** (Goal Management Enhancements) - 1-2 weeks
4. **Integration Testing** - 1 week
5. **Documentation & Launch** - 1 week

**Total Additional Time:** 6-8 weeks to complete vision

---

## Questions for Clarification

1. **Project Setup Conversation Flow:**
   - Should it be guided (AI asks structured questions) or freeform (user talks, AI extracts)?
   - Recommendation: **Hybrid** - Start guided, allow freeform elaboration

2. **Constitution Complexity:**
   - How detailed should the constitution be? (Simple vs comprehensive)
   - Recommendation: **Tiered** - Quick mode (3-5 principles) vs Deep mode (full framework)

3. **Roadmap Integration:**
   - Should roadmap updates be automatic or require approval?
   - Recommendation: **Preview** - Show proposed changes, user approves

4. **Sub-goal Depth:**
   - How many levels? (Main → Sub only, or Main → Sub → Sub-sub?)
   - Recommendation: **Two levels max** (Main → Sub) to avoid complexity

---

**Status:** Ready for Phase 6 Implementation
**Owner:** To be assigned
**Priority:** High
**Created:** 2025-10-26
