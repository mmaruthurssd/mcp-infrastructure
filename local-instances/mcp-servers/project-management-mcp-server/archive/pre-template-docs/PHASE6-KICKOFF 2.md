---
type: reference
phase: stable
project: ai-planning-mcp-server
tags: [MCP, ai-planning, mcp-server, workflow]
category: mcp-servers
status: completed
priority: medium
---

# Phase 6 Kickoff: Project Setup Tools

**Created:** 2025-10-26
**Status:** Implementation Starting
**Duration:** 3-4 weeks
**Goal:** Build conversational project setup workflow (Part 1 of Project Management Vision)

---

## Overview

Phase 6 implements the **Project Setup** portion of the complete Project Management MCP Server vision. This is the foundation that precedes goal management.

### User Flow
```
User has project idea
    ↓
start_project_setup (initiate conversation)
    ↓
continue_project_setup (multi-turn dialogue, 5-15 exchanges)
    ↓
AI gathers information about:
  - Problems to solve
  - Stakeholders
  - Resources (team, tools, budget)
  - Assets (existing, needed, external)
  - Constraints
  - Success criteria
    ↓
extract_project_goals (from conversation)
generate_project_constitution (principles, guidelines)
generate_initial_roadmap (phases, milestones)
identify_resources_and_assets (team, tools, budget, assets)
identify_stakeholders (influence, communication needs)
    ↓
finalize_project_setup
    ↓
Creates 8 initial potential goals → Part 2 (Goal Management)
```

---

## Design Decisions (Approved)

✅ **Conversation Style:** Hybrid
- Start with structured guiding questions
- Allow freeform elaboration and natural dialogue
- AI adapts based on information completeness

✅ **Constitution Depth:** Tiered
- **Quick Mode:** 3-5 core principles, basic framework (5 min)
- **Deep Mode:** Comprehensive constitution with decision framework, guidelines, constraints (15 min)
- User chooses at setup start

✅ **Roadmap Updates:** Preview + User Confirmation
- AI generates proposed changes
- Shows before/after comparison
- User approves or requests modifications

✅ **Sub-goal Levels:** Two levels maximum
- Main goals (e.g., "01")
- Sub-goals (e.g., "01.1", "01.2")
- No sub-sub-goals to avoid complexity

---

## Tools to Implement (8 total)

### Tool 1: `start_project_setup`

**Purpose:** Initiate conversational project planning session

**Input Schema:**
```typescript
interface StartProjectSetupInput {
  projectPath: string;
  projectName: string;
  projectType?: 'software' | 'research' | 'business' | 'product';
  constitutionMode?: 'quick' | 'deep';  // Default: 'quick'
  initialDescription?: string;           // Optional seed
}
```

**Output Schema:**
```typescript
interface StartProjectSetupOutput {
  success: boolean;
  conversationId: string;
  sessionFile: string;
  projectSetupPath: string;  // e.g., project-setup/
  nextQuestion: string;
  mode: {
    constitutionDepth: 'quick' | 'deep';
    estimatedTime: string;
    questionsRemaining: number;
  };
}
```

**Implementation:**
1. Create project directory structure:
   ```
   project-setup/
   ├── conversation-log.md
   ├── conversation-state.json
   └── [generated docs will go here]
   ```
2. Initialize conversation state (ConversationManager)
3. Store project metadata
4. Generate first question based on project type
5. Return conversation ID and first question

**Guiding Questions (Hybrid Mode):**
- **Opening:** "What problem are you trying to solve with this project?"
- **Users/Stakeholders:** "Who will be impacted by this project?"
- **Resources:** "What team, tools, and budget do you have?"
- **Constraints:** "What constraints should we be aware of?"
- **Success:** "How will you measure success?"
- **Freeform:** "Is there anything else important I should know?"

---

### Tool 2: `continue_project_setup`

**Purpose:** Continue multi-turn planning conversation

**Input Schema:**
```typescript
interface ContinueProjectSetupInput {
  projectPath: string;
  conversationId: string;
  userResponse: string;
}
```

**Output Schema:**
```typescript
interface ContinueProjectSetupOutput {
  success: boolean;
  conversationId: string;
  nextQuestion?: string;
  readyToGenerate: boolean;
  extractedSoFar: {
    goals: number;
    stakeholders: number;
    resources: number;
    assets: number;
    constraints: number;
  };
  completeness: number;  // 0-100 percentage
  message: string;
}
```

**Implementation:**
1. Load conversation state
2. Append user response to conversation log
3. Extract information from response using NLPExtractor:
   - Goal mentions
   - Stakeholder mentions
   - Resource mentions (team, tools, budget)
   - Asset mentions (existing, needed)
   - Constraint mentions
4. Update conversation state with extracted info
5. Calculate completeness score
6. Determine next question or signal ready to generate
7. Return updated state

**Completeness Criteria:**
- Minimum requirements met:
  - At least 1 problem statement
  - At least 1 stakeholder identified
  - At least 1 resource mentioned
  - Success criteria defined
- Recommended: 80%+ completeness for best results

---

### Tool 3: `extract_project_goals`

**Purpose:** Extract structured goals from planning conversation

**Input Schema:**
```typescript
interface ExtractProjectGoalsInput {
  projectPath: string;
  conversationId: string;
}
```

**Output Schema:**
```typescript
interface ExtractProjectGoalsOutput {
  success: boolean;
  goalsExtracted: number;
  mainGoals: Array<{
    id: string;              // Temporary ID: "setup-goal-001"
    name: string;
    description: string;
    suggestedImpact: 'High' | 'Medium' | 'Low';
    suggestedEffort: 'Very High' | 'High' | 'Medium' | 'Low' | 'Very Low';
    suggestedTier: 'Now' | 'Next' | 'Later' | 'Someday';
    extractedFrom: string;   // Quote from conversation
    confidence: number;      // 0-1 confidence score
  }>;
  formatted: string;
}
```

**Implementation:**
1. Load conversation log
2. Use NLPExtractor to identify goal-related statements:
   - Action verbs: "build", "create", "implement", "fix"
   - Problem statements: "we need to", "users want"
   - Feature mentions: "app for", "system to"
3. For each detected goal:
   - Generate descriptive name
   - Extract context as description
   - Use Impact/Effort estimators for initial scores
   - Use TierSuggester for tier recommendation
   - Calculate confidence based on explicitness
4. Return structured goal list
5. Format as readable output

**Example:**
```
From conversation:
"We need to build a patient portal so patients can view their medical records online."

Extracted goal:
  Name: "Patient Portal for Medical Records"
  Description: "Enable patients to securely view their medical records online"
  Impact: High (improves patient experience)
  Effort: High (requires authentication, HIPAA compliance, EHR integration)
  Tier: Now (user-mentioned priority)
  Extracted from: "We need to build a patient portal..."
  Confidence: 0.9 (explicit action item)
```

---

### Tool 4: `generate_project_constitution`

**Purpose:** Generate project-specific constitution with principles and guidelines

**Input Schema:**
```typescript
interface GenerateProjectConstitutionInput {
  projectPath: string;
  conversationId: string;
  mode: 'quick' | 'deep';
  customPrinciples?: string[];  // Optional: user-provided principles to include
}
```

**Output Schema:**
```typescript
interface GenerateProjectConstitutionOutput {
  success: boolean;
  constitutionPath: string;
  mode: 'quick' | 'deep';
  sections: {
    principles: string[];
    decisionFramework?: string;   // Deep mode only
    guidelines?: string[];        // Deep mode only
    constraints: string[];
    successCriteria: string[];
    ethicsStatement?: string;     // Deep mode only
  };
  formatted: string;
}
```

**Implementation:**

**Quick Mode (3-5 minutes):**
1. Extract key themes from conversation
2. Generate 3-5 core principles
3. List main constraints
4. Define success criteria
5. Create simple CONSTITUTION.md

**Deep Mode (15 minutes):**
1. All of Quick Mode, plus:
2. Decision framework (how to prioritize tradeoffs)
3. Quality guidelines (standards to uphold)
4. Ethics statement (if applicable)
5. Detailed constraint analysis
6. Comprehensive CONSTITUTION.md

**Constitution Generator Logic:**
- Analyze project type (software, research, business)
- Extract domain-specific requirements (e.g., HIPAA for healthcare)
- Identify competing priorities from conversation
- Generate principles that resolve common tensions
- Use templates customized by project type

**Example Principles (Healthcare Software):**
```
1. Patient Privacy First - HIPAA compliance is non-negotiable
2. Physician-Centric UX - Optimize for busy doctors, not admins
3. Data Integrity - Never sacrifice accuracy for speed
4. Incremental Value - Ship small, useful features frequently
5. Open Standards - Use HL7 FHIR where possible
```

---

### Tool 5: `generate_initial_roadmap`

**Purpose:** Create initial project roadmap with phases and milestones

**Input Schema:**
```typescript
interface GenerateInitialRoadmapInput {
  projectPath: string;
  conversationId: string;
  extractedGoals: Array<{ id: string; name: string; effort: string; tier: string }>;
  timeframe?: string;  // e.g., "6 months", "1 year", default: auto-calculate
}
```

**Output Schema:**
```typescript
interface GenerateInitialRoadmapOutput {
  success: boolean;
  roadmapPath: string;
  version: string;  // "1.0"
  duration: string;
  phases: Array<{
    number: number;
    name: string;
    duration: string;
    goals: string[];
    milestones: Array<{
      id: string;      // e.g., "M1.1"
      name: string;
      deadline: string;
      deliverables: string[];
      dependencies: string[];
    }>;
  }>;
  formatted: string;
}
```

**Implementation:**
1. Group goals by tier and dependencies:
   - Now tier → Phase 1 (earliest)
   - Next tier → Phase 2
   - Later tier → Phase 3
   - Someday tier → Future considerations
2. Calculate phase durations based on effort estimates:
   - Sum effort scores per phase
   - Apply velocity multiplier (conservative: 1.5x)
3. Create milestones within phases:
   - Group related goals into milestones
   - Typical: 2-4 milestones per phase
   - Each milestone = 2-4 weeks of work
4. Identify dependencies between goals/milestones
5. Generate ROADMAP.md from template
6. Return structured roadmap data

**Roadmap Structure:**
```markdown
# Project Roadmap: [Project Name]

**Version:** 1.0
**Created:** 2025-10-26
**Timeline:** 6 months (Nov 2025 - Apr 2026)
**Status:** Initial Plan

---

## Executive Summary

This roadmap outlines the implementation plan for [project]. The project is divided into 3 phases over 6 months, with 8 major milestones.

**Key Deliverables:**
- Phase 1: Foundation (Months 1-2)
- Phase 2: Core Features (Months 3-4)
- Phase 3: Advanced Features (Months 5-6)

---

## Phase 1: Foundation (Months 1-2)

**Goal:** Establish core infrastructure and authentication

### Milestones

**M1.1: Authentication & Authorization (Week 4)**
- Deliverables:
  - HIPAA-compliant user management
  - Role-based access control
  - Audit logging
- Goals: 01 (Authentication System)
- Dependencies: None

**M1.2: Database & API Foundation (Week 8)**
- Deliverables:
  - PostgreSQL with encryption
  - RESTful API with FHIR support
  - Integration testing framework
- Goals: 02 (Database Schema), 03 (API Gateway)
- Dependencies: M1.1 (authentication)

---

[... more phases ...]
```

---

### Tool 6: `identify_resources_and_assets`

**Purpose:** Extract resource inventory and asset list from conversation

**Input Schema:**
```typescript
interface IdentifyResourcesAndAssetsInput {
  projectPath: string;
  conversationId: string;
}
```

**Output Schema:**
```typescript
interface IdentifyResourcesAndAssetsOutput {
  success: boolean;
  resourcesPath: string;
  assetsPath: string;
  resources: {
    team: Array<{
      name?: string;
      role: string;
      allocation: string;  // "100%", "50%"
      skills?: string[];
    }>;
    tools: string[];
    technologies: string[];
    budget: {
      total?: string;
      breakdown: Record<string, string>;
    };
    timeline: {
      duration: string;
      milestones?: string[];
    };
  };
  assets: {
    existing: Array<{
      name: string;
      description: string;
      location?: string;
      type: 'integration' | 'data' | 'design' | 'documentation' | 'other';
    }>;
    needed: Array<{
      name: string;
      description: string;
      priority: 'critical' | 'high' | 'medium' | 'low';
      type: string;
    }>;
    external: Array<{
      name: string;
      provider: string;
      cost?: string;
      setupTime?: string;
    }>;
  };
  formatted: string;
}
```

**Implementation:**
1. Load conversation log
2. Use NLPExtractor to identify:
   - **Team mentions:** "2 developers", "Sarah is the designer", "Dr. Smith will advise"
   - **Tool mentions:** "GitHub", "Figma", "AWS"
   - **Technology mentions:** "React", "PostgreSQL", "Node.js"
   - **Budget mentions:** "$150K budget", "20K for infrastructure"
   - **Timeline mentions:** "6 months", "MVP by Q2"
   - **Existing assets:** "current EHR system", "patient database"
   - **Needed assets:** "API docs", "user research", "design system"
   - **External dependencies:** "Auth0 for authentication", "Twilio for SMS"
3. Categorize and structure findings
4. Generate RESOURCES.md and ASSETS.md from templates
5. Return structured data

---

### Tool 7: `identify_stakeholders`

**Purpose:** Extract and categorize stakeholders from conversation

**Input Schema:**
```typescript
interface IdentifyStakeholdersInput {
  projectPath: string;
  conversationId: string;
}
```

**Output Schema:**
```typescript
interface IdentifyStakeholdersOutput {
  success: boolean;
  stakeholdersPath: string;
  stakeholders: Array<{
    name: string;
    role: string;
    type: 'primary' | 'secondary' | 'external';
    influence: 'high' | 'medium' | 'low';
    interest: 'high' | 'medium' | 'low';
    concerns?: string[];
    communicationNeeds?: string;
  }>;
  matrix: {
    manageClosely: string[];     // High influence, High interest
    keepSatisfied: string[];     // High influence, Low interest
    keepInformed: string[];      // Low influence, High interest
    monitor: string[];           // Low influence, Low interest
  };
  formatted: string;
}
```

**Implementation:**
1. Load conversation log
2. Use NLPExtractor to identify stakeholder mentions:
   - Roles: "CMO", "physicians", "patients", "IT department"
   - Names: "Dr. Emily Rodriguez"
   - Groups: "medical staff", "insurance partners"
3. For each stakeholder, infer:
   - **Type:** Primary (direct users), Secondary (indirect), External (third-party)
   - **Influence:** High (can approve/block), Medium, Low
   - **Interest:** High (daily users), Medium, Low
   - **Concerns:** Extract from conversation context
4. Classify using stakeholder matrix
5. Generate STAKEHOLDERS.md from template
6. Return structured data

**Stakeholder Matrix:**
```
           High Interest
                 │
     Keep        │      Manage
   Satisfied     │      Closely
                 │
─────────────────┼─────────────── High Influence
                 │
    Monitor      │    Keep
                 │   Informed
                 │
           Low Interest
```

---

### Tool 8: `finalize_project_setup`

**Purpose:** Complete project setup and transition to goal management

**Input Schema:**
```typescript
interface FinalizeProjectSetupInput {
  projectPath: string;
  conversationId: string;
  createPotentialGoals?: boolean;  // Default: true
}
```

**Output Schema:**
```typescript
interface FinalizeProjectSetupOutput {
  success: boolean;
  setupComplete: boolean;
  documentsGenerated: {
    constitution: string;
    roadmap: string;
    resources: string;
    assets: string;
    stakeholders: string;
    conversationLog: string;
  };
  initialGoals: {
    created: number;
    goalIds: string[];
    location: string;  // potential-goals/
  };
  summary: {
    projectName: string;
    duration: string;
    phases: number;
    mainGoals: number;
    stakeholders: number;
    budget?: string;
  };
  nextSteps: string[];
  formatted: string;
}
```

**Implementation:**
1. Validate all required documents exist:
   - ✅ CONSTITUTION.md
   - ✅ ROADMAP.md
   - ✅ RESOURCES.md
   - ✅ ASSETS.md
   - ✅ STAKEHOLDERS.md
   - ✅ conversation-log.md
2. If `createPotentialGoals = true`:
   - For each extracted goal from extract_project_goals
   - Run evaluate_goal() to refine estimates
   - Run create_potential_goal() to create goal file
   - Store in potential-goals/ directory
3. Generate project summary
4. Mark conversation as complete in state
5. Provide next steps for user:
   - "Review generated documents"
   - "Prioritize goals with view_goals_dashboard"
   - "Promote top goals with promote_to_selected"
6. Return complete status and paths

---

## Supporting Utilities

### ConversationManager (conversation-manager.ts)

**Purpose:** Manage multi-turn conversation state

**Key Functions:**
```typescript
class ConversationManager {
  initConversation(projectPath: string, metadata: ProjectMetadata): ConversationState
  loadConversation(projectPath: string, conversationId: string): ConversationState
  saveConversation(state: ConversationState): void
  appendMessage(state: ConversationState, role: 'user' | 'assistant', content: string): void
  updateExtractedInfo(state: ConversationState, newInfo: ExtractedInfo): void
  calculateCompleteness(state: ConversationState): number
  getNextQuestion(state: ConversationState): string | null
  isReadyToGenerate(state: ConversationState): boolean
}
```

**Conversation State Structure:**
```typescript
interface ConversationState {
  conversationId: string;
  projectPath: string;
  projectName: string;
  projectType: 'software' | 'research' | 'business' | 'product';
  constitutionMode: 'quick' | 'deep';

  startedAt: string;
  lastUpdatedAt: string;
  status: 'in-progress' | 'ready-to-generate' | 'completed';

  messages: Array<{
    role: 'user' | 'assistant';
    content: string;
    timestamp: string;
  }>;

  extractedInfo: {
    problems: string[];
    goals: string[];
    stakeholders: string[];
    resources: {
      team: string[];
      tools: string[];
      technologies: string[];
      budget: string[];
    };
    assets: {
      existing: string[];
      needed: string[];
      external: string[];
    };
    constraints: string[];
    successCriteria: string[];
  };

  completeness: {
    overall: number;
    hasProblems: boolean;
    hasStakeholders: boolean;
    hasResources: boolean;
    hasSuccessCriteria: boolean;
  };
}
```

---

### NLPExtractor (nlp-extractor.ts)

**Purpose:** Extract structured information from natural language

**Key Functions:**
```typescript
class NLPExtractor {
  extractGoals(text: string): GoalMention[]
  extractStakeholders(text: string): StakeholderMention[]
  extractResources(text: string): ResourceMention[]
  extractAssets(text: string): AssetMention[]
  extractConstraints(text: string): ConstraintMention[]
  extractSuccessCriteria(text: string): CriteriaMention[]
}
```

**Pattern Matching Heuristics:**

**Goals:**
- Action verbs: "build", "create", "implement", "develop", "add", "fix"
- Modal verbs: "need to", "want to", "should", "must"
- Feature patterns: "app for", "system to", "tool that"
- Problem statements: "users can't", "we're missing"

**Stakeholders:**
- Roles: "CMO", "developer", "physician", "patient", "admin"
- Groups: "medical staff", "IT team", "insurance partners"
- Names with titles: "Dr. Smith", "Sarah Chen"

**Resources:**
- Team size: "2 developers", "5 person team"
- Tools: Proper nouns (GitHub, Figma, AWS)
- Technologies: Framework names (React, PostgreSQL)
- Budget: Currency amounts ("$150K", "twenty thousand dollars")
- Timeline: Duration phrases ("6 months", "by Q2 2025")

**Assets:**
- Existing: "current system", "existing database", "legacy code"
- Needed: "we need", "missing", "require"
- External: "third-party", "vendor", "API from"

**Constraints:**
- Regulatory: "HIPAA", "GDPR", "compliance"
- Budget: "budget limit", "cost constraint"
- Timeline: "deadline", "must launch by"
- Technical: "must integrate with", "limited to"

---

### ConstitutionGenerator (constitution-generator.ts)

**Purpose:** Generate project-specific constitutions

**Key Functions:**
```typescript
class ConstitutionGenerator {
  generateQuick(info: ExtractedInfo, projectType: string): ConstitutionSections
  generateDeep(info: ExtractedInfo, projectType: string): ConstitutionSections

  private derivePrinciples(info: ExtractedInfo, projectType: string): string[]
  private createDecisionFramework(principles: string[], constraints: string[]): string
  private generateGuidelines(projectType: string, constraints: string[]): string[]
  private createEthicsStatement(projectType: string, info: ExtractedInfo): string | null
}
```

**Principle Derivation Logic:**
1. Identify domain from project type + conversation
2. Extract key tensions (e.g., speed vs. quality, cost vs. features)
3. Prioritize based on constraints and success criteria
4. Generate 3-5 principles that resolve tensions
5. Make principles actionable and measurable

**Project Type Templates:**
- **Software:** Quality, security, user experience, maintainability
- **Research:** Rigor, reproducibility, ethics, collaboration
- **Business:** ROI, customer satisfaction, scalability, risk management
- **Product:** User value, market fit, innovation, iteration speed

---

### RoadmapBuilder (roadmap-builder.ts)

**Purpose:** Generate initial roadmaps from goals

**Key Functions:**
```typescript
class RoadmapBuilder {
  buildRoadmap(goals: GoalSummary[], timeframe?: string): RoadmapStructure

  private groupGoalsByPhase(goals: GoalSummary[]): Phase[]
  private createMilestones(phase: Phase): Milestone[]
  private calculateDurations(goals: GoalSummary[]): PhaseDurations
  private identifyDependencies(goals: GoalSummary[]): Dependency[]
  private generateTimeline(phases: Phase[]): Timeline
}
```

**Phase Grouping Algorithm:**
1. Sort goals by tier (Now → Next → Later → Someday)
2. Group consecutive tiers into phases (max 3-4 goals per phase)
3. Ensure dependencies are respected (dependee before depender)
4. Balance phase sizes (avoid one huge phase)

**Duration Calculation:**
- Very Low effort: 1-2 weeks
- Low effort: 2-3 weeks
- Medium effort: 3-4 weeks
- High effort: 4-8 weeks
- Very High effort: 8-12 weeks
- Apply 1.5x buffer for uncertainty
- Round up to milestone boundaries (2-week increments)

---

## Templates

### CONSTITUTION.md Template

```markdown
# Project Constitution: {{projectName}}

**Version:** 1.0
**Created:** {{date}}
**Type:** {{projectType}}

---

## Core Principles

{{#each principles}}
{{@index}}. **{{this.name}}** - {{this.description}}
{{/each}}

---

{{#if deepMode}}
## Decision Framework

When facing tradeoffs, prioritize in this order:

{{#each decisionFramework}}
{{@index}}. {{this}}
{{/each}}

---

## Quality Guidelines

{{#each guidelines}}
- {{this}}
{{/each}}

---
{{/if}}

## Constraints

{{#each constraints}}
- **{{this.type}}:** {{this.description}}
{{/each}}

---

## Success Criteria

{{#each successCriteria}}
- {{this}}
{{/each}}

{{#if ethicsStatement}}
---

## Ethics Statement

{{ethicsStatement}}
{{/if}}
```

---

### ROADMAP.md Template

```markdown
# Project Roadmap: {{projectName}}

**Version:** {{version}}
**Created:** {{date}}
**Timeline:** {{duration}} ({{startDate}} - {{endDate}})
**Status:** {{status}}

---

## Executive Summary

This roadmap outlines the implementation plan for {{projectName}}. The project is divided into {{phaseCount}} phases over {{duration}}, with {{milestoneCount}} major milestones.

**Key Deliverables:**
{{#each phases}}
- Phase {{this.number}}: {{this.name}} ({{this.duration}})
{{/each}}

---

{{#each phases}}
## Phase {{this.number}}: {{this.name}} ({{this.duration}})

**Goal:** {{this.goal}}

### Milestones

{{#each this.milestones}}
**{{this.id}}: {{this.name}} ({{this.deadline}})**
{{#if this.deliverables}}
- Deliverables:
{{#each this.deliverables}}
  - {{this}}
{{/each}}
{{/if}}
{{#if this.goals}}
- Goals: {{#each this.goals}}{{this}}{{#unless @last}}, {{/unless}}{{/each}}
{{/if}}
{{#if this.dependencies}}
- Dependencies: {{#each this.dependencies}}{{this}}{{#unless @last}}, {{/unless}}{{/each}}
{{/if}}

{{/each}}

---

{{/each}}

## Version History

| Version | Date | Changes | Author |
|---------|------|---------|--------|
| {{version}} | {{date}} | Initial roadmap created | AI Planning MCP |
```

---

### RESOURCES.md Template

```markdown
# Project Resources: {{projectName}}

**Last Updated:** {{date}}

---

## Team

{{#if team.length}}
| Name | Role | Allocation | Skills |
|------|------|------------|--------|
{{#each team}}
| {{this.name}} | {{this.role}} | {{this.allocation}} | {{this.skills}} |
{{/each}}
{{else}}
*No team members specified yet*
{{/if}}

---

## Tools & Platforms

{{#if tools.length}}
{{#each toolCategories}}
### {{this.category}}
{{#each this.tools}}
- {{this}}
{{/each}}

{{/each}}
{{else}}
*No tools specified yet*
{{/if}}

---

## Technologies

{{#if technologies.length}}
{{#each techStacks}}
### {{this.category}}
{{#each this.technologies}}
- {{this}}
{{/each}}

{{/each}}
{{else}}
*No technologies specified yet*
{{/if}}

---

## Budget

{{#if budget.total}}
**Total:** {{budget.total}}

{{#if budget.breakdown}}
| Category | Amount | Notes |
|----------|--------|-------|
{{#each budget.breakdown}}
| {{this.category}} | {{this.amount}} | {{this.notes}} |
{{/each}}
{{/if}}
{{else}}
*No budget specified yet*
{{/if}}

---

## Timeline

{{#if timeline.duration}}
**Total Duration:** {{timeline.duration}}

{{#if timeline.milestones}}
{{#each timeline.milestones}}
- {{this}}
{{/each}}
{{/if}}
{{else}}
*No timeline specified yet*
{{/if}}
```

---

### ASSETS.md Template

```markdown
# Project Assets: {{projectName}}

**Last Updated:** {{date}}

---

## Existing Assets

{{#if existingAssets.length}}
{{#each existingAssets}}
### {{this.name}}
- **Type:** {{this.type}}
- **Description:** {{this.description}}
{{#if this.location}}
- **Location:** {{this.location}}
{{/if}}

{{/each}}
{{else}}
*No existing assets documented yet*
{{/if}}

---

## Needed Assets

{{#if neededAssets.length}}
{{#each neededAssets}}
### {{this.name}} ({{this.priority}} priority)
- **Type:** {{this.type}}
- **Description:** {{this.description}}

{{/each}}
{{else}}
*No needed assets identified yet*
{{/if}}

---

## External Dependencies

{{#if externalDependencies.length}}
{{#each externalDependencies}}
### {{this.name}}
- **Provider:** {{this.provider}}
{{#if this.cost}}
- **Cost:** {{this.cost}}
{{/if}}
{{#if this.setupTime}}
- **Setup Time:** {{this.setupTime}}
{{/if}}
{{#if this.notes}}
- **Notes:** {{this.notes}}
{{/if}}

{{/each}}
{{else}}
*No external dependencies identified yet*
{{/if}}
```

---

### STAKEHOLDERS.md Template

```markdown
# Project Stakeholders: {{projectName}}

**Last Updated:** {{date}}

---

## Primary Stakeholders (Direct Impact)

{{#each primaryStakeholders}}
### {{this.name}} - {{this.role}}
- **Influence:** {{this.influence}}
- **Interest:** {{this.interest}}
{{#if this.concerns}}
- **Concerns:** {{#each this.concerns}}{{this}}{{#unless @last}}, {{/unless}}{{/each}}
{{/if}}
{{#if this.communicationNeeds}}
- **Communication:** {{this.communicationNeeds}}
{{/if}}

{{/each}}

---

## Secondary Stakeholders (Indirect Impact)

{{#each secondaryStakeholders}}
### {{this.name}} - {{this.role}}
- **Influence:** {{this.influence}}
- **Interest:** {{this.interest}}
{{#if this.communicationNeeds}}
- **Communication:** {{this.communicationNeeds}}
{{/if}}

{{/each}}

---

## External Stakeholders

{{#each externalStakeholders}}
### {{this.name}} - {{this.role}}
- **Influence:** {{this.influence}}
- **Interest:** {{this.interest}}
{{#if this.communicationNeeds}}
- **Communication:** {{this.communicationNeeds}}
{{/if}}

{{/each}}

---

## Stakeholder Matrix

| Stakeholder | Influence | Interest | Strategy |
|-------------|-----------|----------|----------|
{{#each allStakeholders}}
| {{this.name}} | {{this.influence}} | {{this.interest}} | {{this.strategy}} |
{{/each}}

**Strategies:**
- **Manage Closely:** High influence, High interest - Weekly updates, active engagement
- **Keep Satisfied:** High influence, Low interest - Keep informed of major decisions
- **Keep Informed:** Low influence, High interest - Regular communication, feedback loops
- **Monitor:** Low influence, Low interest - Minimal communication, status updates only
```

---

## Implementation Order

### Week 1: Foundation & Templates
**Days 1-2:**
- ✅ Create template files (CONSTITUTION, ROADMAP, RESOURCES, ASSETS, STAKEHOLDERS)
- ✅ Implement ConversationManager utility
- ✅ Implement NLPExtractor utility

**Days 3-5:**
- ✅ Implement ConstitutionGenerator utility
- ✅ Implement RoadmapBuilder utility
- ✅ Test all utilities with sample data

### Week 2: Tools 1-4
**Days 1-2:**
- ✅ Implement start_project_setup tool
- ✅ Test conversation initiation flow

**Days 3-4:**
- ✅ Implement continue_project_setup tool
- ✅ Test multi-turn conversation

**Day 5:**
- ✅ Implement extract_project_goals tool
- ✅ Implement generate_project_constitution tool

### Week 3: Tools 5-8
**Days 1-2:**
- ✅ Implement generate_initial_roadmap tool
- ✅ Implement identify_resources_and_assets tool

**Days 3-4:**
- ✅ Implement identify_stakeholders tool
- ✅ Implement finalize_project_setup tool

**Day 5:**
- ✅ Register all 8 tools in server.ts
- ✅ Build and fix any TypeScript errors

### Week 4: Testing & Documentation
**Days 1-3:**
- ✅ End-to-end testing of complete project setup flow
- ✅ Test with different project types
- ✅ Test quick vs deep constitution modes

**Days 4-5:**
- ✅ Update README.md with Phase 6 tools
- ✅ Create example walkthrough
- ✅ Bump version to 0.6.0

---

## Files to Create

### Tools (8 files)
```
src/tools/start-project-setup.ts
src/tools/continue-project-setup.ts
src/tools/extract-project-goals.ts
src/tools/generate-project-constitution.ts
src/tools/generate-initial-roadmap.ts
src/tools/identify-resources-and-assets.ts
src/tools/identify-stakeholders.ts
src/tools/finalize-project-setup.ts
```

### Utilities (5 files)
```
src/utils/conversation-manager.ts
src/utils/nlp-extractor.ts
src/utils/constitution-generator.ts
src/utils/roadmap-builder.ts
src/utils/stakeholder-analyzer.ts
```

### Templates (5 files)
```
src/templates/project-setup/CONSTITUTION.md
src/templates/project-setup/ROADMAP.md
src/templates/project-setup/RESOURCES.md
src/templates/project-setup/ASSETS.md
src/templates/project-setup/STAKEHOLDERS.md
```

### Files to Modify
```
src/server.ts           # Register 8 new tools
src/types.ts            # Add new types
package.json            # Bump to 0.6.0
README.md               # Document Phase 6
```

---

## Success Criteria

Phase 6 complete when:

- ✅ All 8 tools implemented and registered
- ✅ Can complete project setup conversation in 5-15 minutes
- ✅ Generates all 5 project documents (CONSTITUTION, ROADMAP, RESOURCES, ASSETS, STAKEHOLDERS)
- ✅ Quick mode takes ~5 minutes, Deep mode takes ~15 minutes
- ✅ Extracts 5-15 initial goals from conversation
- ✅ Creates potential goal files automatically
- ✅ Roadmap has realistic phases and milestones
- ✅ Constitution principles are actionable and relevant
- ✅ All documents are professional and complete
- ✅ TypeScript compiles with 0 errors
- ✅ End-to-end test passes

---

## Next Steps After Phase 6

1. **Phase 7:** Goal Management Enhancements
   - create_subgoals (break main goals into sub-goals)
   - update_roadmap_from_goals (auto-sync roadmap)

2. **Phase 8:** Integration & Polish
   - End-to-end testing
   - Documentation
   - Example projects

---

**Status:** Ready to Begin Implementation
**Version Target:** 0.6.0
**Created:** 2025-10-26
