---
type: readme
phase: stable
project: ai-planning-mcp-server
tags: [goal-management, planning, roadmap, mcp-server, workflow]
category: mcp-servers
status: completed
priority: high
---

# AI Planning MCP Server

**Version:** 0.6.0
**Status:** ✅ Phase 6 Complete (19 tools implemented)

MCP server for AI-assisted project planning and goal workflow management. Combines conversational project setup with structured goal management throughout the project lifecycle.

**Phase 6 Complete:** Now includes conversational project setup workflow with goal extraction, constitution generation, roadmap building, resource/stakeholder identification, and automatic potential goal creation!

---

## What is This?

A comprehensive project management MCP server that handles:
1. **Project Setup** (Phase 6) - Conversational planning with goal extraction, constitution generation, roadmap building, resource/stakeholder identification
2. **Goal Discovery** (Phase 3) - Extract actionable ideas from brainstorming discussions
3. **Goal Evaluation** (Phase 1) - AI-assisted Impact/Effort estimation and tier suggestions
4. **Goal Selection** (Phase 2) - Promote goals to selected status with cross-server integration
5. **Goal Management** (Phase 3) - Dashboard views, reordering, and progress tracking
6. **Goal Archive & Review** (Phase 4) - Archive completed goals, detect review needs, generate health reports
7. **Visualization** (Phase 5) - Generate visual workflow diagrams in draw.io format

**Perfect for:**
- Conversational project setup with NLP-driven information extraction
- Generating project constitutions, roadmaps, and stakeholder analysis
- Extracting actionable ideas from brainstorming notes
- Strategic project planning with Impact/Effort analysis
- Visualizing all goals across the lifecycle (potential → selected → archived)
- Tracking goal progress with velocity-based completion estimates
- Managing project roadmaps with priority ordering
- Learning from completed goals with retrospectives
- Maintaining goal health with automated review detection
- Generating visual workflow diagrams for presentations and planning sessions

---

## Quick Start

### Installation

1. **Build the server**:
   ```bash
   cd ai-planning-mcp-server
   npm install
   npm run build
   ```

2. **Add to MCP configuration** (`~/.mcp.json` or project `.mcp.json`):
   ```json
   {
     "mcpServers": {
       "ai-planning": {
         "command": "node",
         "args": [
           "/absolute/path/to/ai-planning-mcp-server/dist/server.js"
         ]
       }
     }
   }
   ```

3. **Restart Claude Code**

---

## MCP Tools (Phases 1-6)

---

## Phase 6: Project Setup (8 Tools)

### 1. `start_project_setup`

Initiate a conversational project planning session with multi-turn dialogue.

**Input:**
```typescript
{
  projectPath: string;           // Absolute path to project
  projectName: string;           // Name of the project
  projectType: string;           // e.g., "software", "medical", "web-app"
  constitutionMode: 'quick' | 'deep';  // Depth of constitution generation
  initialDescription?: string;   // Optional initial project description
}
```

**Output:**
```json
{
  "success": true,
  "conversationId": "conv-20251026-1234",
  "sessionFile": "/path/to/project-setup/conversation-conv-20251026-1234.json",
  "projectSetupPath": "/path/to/project-setup/",
  "nextQuestion": "What is the main problem this project aims to solve?",
  "message": "Project setup conversation started..."
}
```

**What it does:**
- Creates project-setup/ directory for all setup documents
- Initializes conversation state with project metadata
- Returns first guiding question to extract project information
- Tracks completeness (0-100%) based on information gathered

### 2. `continue_project_setup`

Continue the multi-turn conversation to gather project information.

**Input:**
```typescript
{
  projectPath: string;
  conversationId: string;        // From start_project_setup
  userResponse: string;          // User's answer to the current question
}
```

**Output:**
```json
{
  "success": true,
  "nextQuestion": "Who are the main stakeholders?",
  "readyToGenerate": false,
  "extractedSoFar": {
    "goals": 3,
    "stakeholders": 2,
    "resources": 5,
    "assets": 4,
    "constraints": 2
  },
  "completeness": 65,
  "message": "Continue the conversation..."
}
```

**What it does:**
- Uses NLP to extract structured information from user response
- Detects: goals, stakeholders, resources, assets, constraints, success criteria
- Calculates completeness percentage (0-100%)
- Returns next intelligent question or signals readiness to generate documents

### 3. `extract_project_goals`

Extract structured goals from the conversation with AI-estimated impact/effort/tier.

**Input:**
```typescript
{
  projectPath: string;
  conversationId: string;
}
```

**Output:**
```json
{
  "success": true,
  "goalsExtracted": 5,
  "mainGoals": [
    {
      "id": "setup-goal-001",
      "name": "User Authentication System",
      "description": "Build secure login and authentication",
      "suggestedImpact": "High",
      "suggestedEffort": "Medium",
      "suggestedTier": "Now",
      "extractedFrom": "Explicit goal mention",
      "confidence": 0.9
    }
  ]
}
```

**What it does:**
- Uses NLP pattern matching to find goal mentions
- Runs ImpactEstimator and EffortEstimator on each goal
- Suggests tier (Now/Next/Later/Someday) based on Impact/Effort matrix
- Returns goals sorted by confidence (highest first)

### 4. `generate_project_constitution`

Generate project-specific constitution with principles, decision frameworks, and guidelines.

**Input:**
```typescript
{
  projectPath: string;
  conversationId: string;
  mode?: 'quick' | 'deep';       // Default from start_project_setup
  customPrinciples?: string[];   // Optional user-defined principles
}
```

**Output:**
```json
{
  "success": true,
  "constitutionPath": "/path/to/project-setup/CONSTITUTION.md",
  "sections": {
    "principles": 5,
    "decisionFramework": true,
    "guidelines": 8,
    "ethicsStatement": true
  }
}
```

**What it does:**
- Derives project-specific principles based on project type and constraints
- Creates decision framework prioritizing tradeoffs
- Generates domain-specific guidelines (HIPAA, GDPR, SOC 2 awareness)
- Renders CONSTITUTION.md template with all sections

**Creates file:** `project-setup/CONSTITUTION.md`

### 5. `generate_initial_roadmap`

Create initial roadmap with phases and milestones from extracted goals.

**Input:**
```typescript
{
  projectPath: string;
  conversationId: string;
  extractedGoals: ExtractedGoal[];  // From extract_project_goals
  timeframe?: string;               // e.g., "6 months", "1 year"
}
```

**Output:**
```json
{
  "success": true,
  "roadmapPath": "/path/to/project-setup/ROADMAP.md",
  "version": "1.0",
  "duration": "6 months",
  "phases": [
    {
      "number": 1,
      "name": "Foundation",
      "duration": "6 weeks",
      "goalsCount": 3,
      "milestonesCount": 5
    }
  ]
}
```

**What it does:**
- Groups goals by tier (Now → Phase 1, Next → Phase 2, etc.)
- Creates dependency-aware milestones
- Calculates phase duration based on effort estimates (1.5x buffer)
- Renders ROADMAP.md with all phases, goals, and milestones

**Creates file:** `project-setup/ROADMAP.md`

### 6. `identify_resources_and_assets`

Extract resource inventory (team, tools, technologies, budget) and asset list.

**Input:**
```typescript
{
  projectPath: string;
  conversationId: string;
}
```

**Output:**
```json
{
  "success": true,
  "resourcesPath": "/path/to/project-setup/RESOURCES.md",
  "assetsPath": "/path/to/project-setup/ASSETS.md",
  "resources": {
    "team": 5,
    "tools": 8,
    "technologies": 6,
    "budget": 1
  },
  "assets": {
    "existing": 3,
    "needed": 5,
    "external": 2
  }
}
```

**What it does:**
- Extracts team members with roles and allocations
- Categorizes tools (Development, Design, Infrastructure, Communication)
- Categorizes technologies (Frontend, Backend, Database)
- Identifies existing assets, needed assets, and external dependencies
- Parses budget information if provided

**Creates files:**
- `project-setup/RESOURCES.md`
- `project-setup/ASSETS.md`

### 7. `identify_stakeholders`

Extract and categorize stakeholders with influence/interest analysis.

**Input:**
```typescript
{
  projectPath: string;
  conversationId: string;
}
```

**Output:**
```json
{
  "success": true,
  "stakeholdersPath": "/path/to/project-setup/STAKEHOLDERS.md",
  "stakeholders": [
    {
      "name": "Dr. Sarah Chen",
      "role": "Medical Director",
      "type": "primary",
      "influence": "high",
      "interest": "high",
      "communicationNeeds": "Weekly updates, active engagement"
    }
  ],
  "matrix": {
    "manageClosely": 2,
    "keepSatisfied": 1,
    "keepInformed": 3,
    "monitor": 1
  }
}
```

**What it does:**
- Uses NLP to extract stakeholder mentions
- Categorizes as primary, secondary, or external
- Assesses influence (high/medium/low) based on role
- Assesses interest (high/medium/low) based on involvement
- Creates stakeholder matrix for communication planning
- Identifies concerns from conversation context

**Creates file:** `project-setup/STAKEHOLDERS.md`

### 8. `finalize_project_setup`

Complete project setup by validating documents and creating initial potential goals.

**Input:**
```typescript
{
  projectPath: string;
  conversationId: string;
  extractedGoals: ExtractedGoal[];
  createPotentialGoals?: boolean;  // Default: true
}
```

**Output:**
```json
{
  "success": true,
  "setupComplete": true,
  "documentsGenerated": {
    "constitution": "/path/to/CONSTITUTION.md",
    "roadmap": "/path/to/ROADMAP.md",
    "resources": "/path/to/RESOURCES.md",
    "assets": "/path/to/ASSETS.md",
    "stakeholders": "/path/to/STAKEHOLDERS.md",
    "conversationLog": "/path/to/conversation-log.md"
  },
  "initialGoals": {
    "created": 5,
    "goalIds": ["user-auth.md", "dashboard.md", ...],
    "location": "/path/to/potential-goals/"
  },
  "summary": {
    "projectName": "Medical Practice Portal",
    "projectType": "software",
    "duration": "6 months",
    "phases": 3,
    "mainGoals": 5,
    "stakeholders": 7,
    "budget": "$50,000"
  },
  "nextSteps": [...]
}
```

**What it does:**
- Validates all required documents have been generated
- Creates potential goal files for each extracted goal using `create_potential_goal`
- Marks conversation as completed
- Generates conversation-log.md for reference
- Provides summary and next steps for goal management workflow

**Creates files:**
- `project-setup/conversation-log.md`
- `brainstorming/future-goals/potential-goals/[goal-name].md` (for each goal)

---

## Phase 1-5: Goal Management (11 Tools)

### 9. `evaluate_goal`

Analyze a goal description to estimate Impact, Effort, and suggest a tier (Now/Next/Later/Someday).

**Input:**
```typescript
{
  goalDescription: string;  // What you want to accomplish
  context?: string;         // Additional context
  projectType?: string;     // e.g., "medical", "healthcare"
}
```

**Output:**
```json
{
  "impact": {
    "score": "High",
    "reasoning": "Affects 50+ people. Addresses critical issue.",
    "factors": {
      "people_affected": 50,
      "problem_severity": "High",
      "strategic_value": "Medium"
    },
    "confidence": "High"
  },
  "effort": {
    "score": "Medium",
    "reasoning": "Est. 2-3 days. Moderate complexity.",
    "factors": {
      "time_estimate": "2-3 days",
      "technical_complexity": "Medium",
      "dependencies_count": 1,
      "scope_clarity": "High"
    },
    "confidence": "Medium"
  },
  "tier": {
    "tier": "Now",
    "reasoning": "High Impact, Medium Effort - Quick win",
    "confidence": "High"
  },
  "suggestions": [...],
  "nextSteps": [...]
}
```

**Tier Matrix:**
- **Now** = High Impact, Low Effort (quick wins)
- **Next** = High Impact, High Effort (major projects)
- **Later** = Low Impact, Low Effort (nice-to-haves)
- **Someday** = Low Impact, High Effort (low ROI)

### 2. `create_potential_goal`

Create a potential goal markdown file from an evaluation result.

**Input:**
```typescript
{
  projectPath: string;
  goalName: string;
  goalDescription: string;

  // From evaluate_goal (or manual)
  impactScore: "High" | "Medium" | "Low";
  impactReasoning: string;
  // ... all other evaluation fields

  // Optional: 7 evaluation questions
  problem?: string;
  expectedValue?: string;
  effortDetails?: string;
  dependencies?: string;
  risks?: string;
  alternatives?: string;
  decisionCriteria?: string;
}
```

**Output:**
```json
{
  "success": true,
  "filePath": "/path/to/potential-goals/goal-name.md",
  "fileName": "goal-name.md",
  "message": "Successfully created potential goal"
}
```

**Creates file:** `brainstorming/future-goals/potential-goals/[goal-name].md`

### 3. `promote_to_selected` ✨ NEW (Phase 2)

Promote a potential goal to selected status, add it to SELECTED-GOALS.md, and optionally prepare goal context for cross-server handoff to Spec-Driven MCP.

**Input:**
```typescript
{
  projectPath: string;           // Absolute path to project
  potentialGoalFile: string;     // Relative path to potential goal file
  priority: "High" | "Medium" | "Low";
  owner?: string;                // Person/team responsible
  targetDate?: string;           // YYYY-MM-DD or "Q1 2025"
  generateSpec?: boolean;        // If true, return goalContext for sdd_guide
}
```

**Output (without generateSpec):**
```json
{
  "success": true,
  "goalId": "03",
  "goalName": "Mobile App for Field Staff",
  "addedToFile": "/path/to/SELECTED-GOALS.md",
  "message": "Successfully promoted goal to selected status"
}
```

**Output (with generateSpec=true):**
```json
{
  "success": true,
  "goalId": "03",
  "goalName": "Mobile App for Field Staff",
  "addedToFile": "/path/to/SELECTED-GOALS.md",
  "goalContext": {
    "goalId": "03",
    "goalName": "Mobile App for Field Staff",
    "goalDescription": "Build React Native app...",
    "impactScore": "High",
    "impactReasoning": "Saves 25 field staff 30 min/day each",
    "effortScore": "High",
    "effortReasoning": "8-12 weeks, React Native, offline sync",
    "tier": "Next",
    "priority": "High",
    "owner": "Sarah",
    "targetDate": "Q2 2025",
    "problem": "...",
    "expectedValue": "...",
    "dependencies": "...",
    "risks": "..."
  },
  "message": "Successfully promoted goal and prepared for spec generation"
}
```

**What it does:**
1. Parses potential goal file to extract all evaluation data
2. Assigns next sequential goal ID (e.g., "03")
3. Adds goal entry to SELECTED-GOALS.md in "Active Goals" section
4. Updates statistics (goal counts by priority/status)
5. If `generateSpec=true`, returns goalContext for handoff to Spec-Driven MCP

**Creates/Updates:** `brainstorming/future-goals/selected-goals/SELECTED-GOALS.md`

### 4. `extract_ideas` ✨ NEW (Phase 3)

Scan brainstorming discussion files for actionable ideas using AI pattern matching.

**Input:**
```typescript
{
  projectPath: string;           // Absolute path to project
  filePath?: string;             // Optional: specific file to scan
                                 // Default: brainstorming/future-goals/brainstorming/ongoing-brainstorming-discussion.md
  minConfidence?: number;        // Optional: 0-1 confidence threshold (default: 0.6)
}
```

**Output:**
```json
{
  "success": true,
  "ideasFound": 10,
  "ideas": [
    {
      "id": "idea-001",
      "text": "Build a React Native app with offline mode",
      "context": "Users are frustrated they can't log mileage...",
      "confidence": 0.85,
      "location": {
        "lineNumber": 11,
        "sectionHeading": "Ideas"
      },
      "suggestedName": "React Native Offline App",
      "reasoning": "High confidence: contains action verb, includes technical details"
    }
  ],
  "formatted": "..."
}
```

**What it detects:**
- **Action verbs:** build, create, implement, fix, add, develop
- **Problem statements:** need to, users want, frustrated, missing
- **Feature patterns:** app for, system to, tool that, solution for
- **Technical details:** React, Python, mobile, API, time estimates

**Confidence scoring:**
- **High (0.8-1.0):** Explicit action items with clear scope and technical details
- **Medium (0.6-0.79):** Actionable but less specific
- **Low (0-0.59):** Questions, vague ideas, tangential mentions

### 5. `view_goals_dashboard` ✨ NEW (Phase 3)

Comprehensive overview of all goals with filtering, sorting, statistics, and alerts.

**Input:**
```typescript
{
  projectPath: string;

  // Filters (all optional)
  tier?: 'Now' | 'Next' | 'Later' | 'Someday';
  priority?: 'High' | 'Medium' | 'Low';
  status?: 'Planning' | 'Not Started' | 'In Progress' | 'Blocked' | 'On Hold';
  owner?: string;

  // Sorting
  sortBy?: 'impact' | 'effort' | 'priority' | 'date' | 'progress';

  // Display options
  includeAlerts?: boolean;      // Default: true
  includeStats?: boolean;       // Default: true
}
```

**Output:**
```
═══════════════════════════════════════════════════════
  GOALS DASHBOARD
═══════════════════════════════════════════════════════

📊 STATISTICS
   Potential: 2    Selected: 3    Completed: 0    Shelved: 0

   By Tier:  Now: 1  Next: 2  Later: 2  Someday: 0
   By Priority:  High: 2  Medium: 1  Low: 0

🔴 ALERTS (2)
   [URGENT] Goal 02 blocked for 45 days - escalate or shelve?
   [ATTENTION] Goal 05 at 100% progress - mark as completed?

🎯 SELECTED GOALS (3)
   01. Fix Save Button Bug [Now]
       High Impact / Medium Effort - In Progress
       Progress: [██████░░░░] 60%  Owner: Alex  Target: 2025-11-01

   02. Automated Timesheet Validation [Next]
       High Impact / Medium Effort - Planning
       Progress: [░░░░░░░░░░] 0%  Owner: Sarah  Target: Q1 2025

💡 POTENTIAL GOALS (2)
   • Mobile App for Field Staff [Next]
     High Impact / High Effort - Updated: 2025-10-15
```

**Alert types:**
- **Stale:** Potential goals >90 days old, never promoted
- **Blocked:** Selected goals blocked >30 days
- **Completed:** Goals at 100% progress not marked complete
- **Duplicate:** Goals with similar names

### 6. `reorder_selected_goals` ✨ NEW (Phase 3)

Change the priority order of selected goals in SELECTED-GOALS.md.

**Input:**
```typescript
{
  projectPath: string;
  goalOrder: string[];          // e.g., ["03", "01", "02"]
  updatePriorities?: boolean;   // Auto-update High/Medium/Low based on position
}
```

**Output:**
```
📋 ORDER CHANGES

Before:
  1. Goal 01
  2. Goal 02
  3. Goal 03

After:
  1. Goal 03
  2. Goal 01
  3. Goal 02

✨ PRIORITIES UPDATED (if enabled)
  • Top 33% → High priority
  • Middle 33% → Medium priority
  • Bottom 33% → Low priority
```

**What it does:**
1. Validates all goal IDs exist
2. Reorders goals in SELECTED-GOALS.md
3. Optionally updates priority based on position
4. Updates statistics and timestamp

### 7. `update_goal_progress` ✨ NEW (Phase 3)

Update goal progress and calculate velocity estimates for completion.

**Input:**
```typescript
{
  projectPath: string;
  goalId: string;               // e.g., "01"

  // Progress (at least one required)
  tasksCompleted?: number;      // e.g., 8
  totalTasks?: number;          // e.g., 10
  progress?: number;            // Direct percentage (0-100)
  specPath?: string;            // Auto-read from spec-driven tasks.md

  // Optional updates
  status?: 'Planning' | 'Not Started' | 'In Progress' | 'Blocked' | 'On Hold' | 'Completed';
  blockers?: string;
  nextAction?: string;
}
```

**Output:**
```
📊 Goal 01: Fix Save Button Bug

Progress: 60% → 75% (+15%)
[ █ █ █ █ █ █ █░░░] 75%

Status: In Progress

📈 VELOCITY ESTIMATE (Medium confidence)
   Based on 4 progress updates over 3 weeks
   Current velocity: 15.2% per week
   Estimated completion: 2025-11-15
```

**Features:**
- **Multiple input methods:** Direct %, tasks completed/total, or auto-read from spec
- **Progress history:** Tracks last 10 updates for velocity calculation
- **Velocity estimates:** Calculates completion date based on historical velocity
- **Auto-status updates:** 100% → Completed, >0% → In Progress
- **Confidence levels:** Low (<3 updates), Medium (3-5), High (>5)

### 8. `archive_goal` ✨ NEW (Phase 4)

Archive completed or shelved goals with comprehensive retrospective documentation and learning data extraction.

**Input:**
```typescript
{
  projectPath: string;
  goalId: string;                    // e.g., "01", "02"
  archiveType: 'implemented' | 'shelved';

  retrospective: {
    // For implemented goals
    completionDate?: string;         // YYYY-MM-DD
    actualEffort?: string;           // e.g., "2 weeks", "3 months"
    actualImpact?: 'High' | 'Medium' | 'Low';
    whatWentWell?: string;
    whatCouldImprove?: string;
    lessonsLearned?: string;
    wouldDoAgain?: boolean;

    // For shelved goals
    reasonShelved?: string;
    mightRevisit?: boolean;
    alternativesTried?: string;
  }
}
```

**Output:**
```
═══════════════════════════════════════════════════════
  GOAL ARCHIVED ✅
═══════════════════════════════════════════════════════

📦 Goal 01: Fix Save Button Bug
   Type: Implemented

📊 ESTIMATE ACCURACY
   Impact: High → High (Accurate)
   Effort: Medium → Low (Overestimated)

📁 Archived to: fix-save-button-bug.md
   Location: archive/implemented/

✅ Actions completed:
   • Retrospective file created
   • Removed from SELECTED-GOALS.md
   • Statistics updated
   • Learning data recorded
```

**What it does:**
1. Extracts goal from SELECTED-GOALS.md with all metadata
2. Compares estimated vs. actual Impact/Effort for learning
3. Creates comprehensive retrospective file in archive/{implemented|shelved}/
4. Removes goal from active selected goals
5. Updates statistics
6. Records estimate accuracy for improving future evaluations

**Creates file:** `brainstorming/future-goals/archive/{implemented|shelved}/[goal-name].md`

### 9. `check_review_needed` ✨ NEW (Phase 4)

Proactively detect goals that need review based on configurable criteria.

**Input:**
```typescript
{
  projectPath: string;
  checkType?: 'all' | 'selected' | 'potential';  // Default: 'all'

  // Optional custom thresholds
  staleDays?: number;          // Default: 90 for potential, 30 for selected
  longRunningDays?: number;    // Default: 60
  noProgressDays?: number;     // Default: 14
  blockedDays?: number;        // Default: 30
}
```

**Output:**
```
═══════════════════════════════════════════════════════
  GOAL REVIEW CHECK
═══════════════════════════════════════════════════════

📊 SUMMARY
   Total Reviews Needed: 5

   By Urgency:
   🔴 High: 2
   ⚠️  Medium: 2
   🟡 Low: 1

   By Reason:
   • Stale: 1
   • Long-Running: 1
   • No Progress: 1
   • Blocked: 1
   • Completed Not Archived: 1

🔴 HIGH PRIORITY REVIEWS
───────────────────────────────────────────────────────

Goal 02: Automated Timesheet Validation
   Reason: Blocked too long
   Days Since: 45
   Last Updated: 2025-09-10
   Action: Escalate blocker or shelve goal
```

**Detection criteria:**
- **Stale potential goals:** >90 days old, never promoted
- **Long-running selected goals:** In progress >60 days
- **No progress updates:** >14 days without update
- **Blocked too long:** Blocked >30 days
- **Completed not archived:** Progress 100% but still active

**Urgency levels:**
- **High:** Requires immediate attention
- **Medium:** Should address soon
- **Low:** Monitor and review in next cycle

### 10. `generate_review_report` ✨ NEW (Phase 4)

Generate comprehensive goal health reports for periodic reviews (weekly, monthly, quarterly).

**Input:**
```typescript
{
  projectPath: string;
  reportType: 'weekly' | 'monthly' | 'quarterly';

  // Optional date range
  startDate?: string;              // YYYY-MM-DD
  endDate?: string;                // YYYY-MM-DD

  // Include sections (all default true)
  includeSummary?: boolean;
  includeVelocity?: boolean;
  includeAlerts?: boolean;
  includeRecommendations?: boolean;
}
```

**Output:**
```
═══════════════════════════════════════════════════════
  GOAL REVIEW REPORT - MONTHLY
═══════════════════════════════════════════════════════

📅 Generated: 2025-10-26
📊 Report Period: Monthly

📋 EXECUTIVE SUMMARY
───────────────────────────────────────────────────────

   Total Goals: 8
   • Selected: 5
   • Potential: 3
   • Completed This Period: 2
   • Shelved This Period: 0

🌟 OVERALL HEALTH: 85/100 (Excellent)

   Activity Score:   25/30
   Balance Score:    18/20
   Review Score:     27/30
   Completion Score: 15/20

📈 VELOCITY METRICS
───────────────────────────────────────────────────────

   Goals Completed: 2 this month (vs 1.5 average)
   Average Completion Time: 3.2 weeks
   Estimated Backlog Completion: 8 weeks
   Trend: ↗️ Improving

🚨 ALERTS & ACTIONS NEEDED
───────────────────────────────────────────────────────

🔴 HIGH PRIORITY (2)
   1. Goal 02 - Escalate blocker or shelve
   2. Goal 05 - Archive with retrospective

💡 RECOMMENDATIONS
───────────────────────────────────────────────────────

   1. ✅ Archive 2 completed goals (05, 07)
   2. 🔄 Break down Goal 03 into smaller milestones
   3. ⚖️ Rebalance tiers - too many in "Now"

🏆 TOP PERFORMERS
───────────────────────────────────────────────────────

   • Goal 04: Dark Mode Feature
     Delivered 2 weeks early with excellent user feedback
```

**Report sections:**
- **Executive Summary:** Goal counts, health score (0-100)
- **Velocity Metrics:** Completion rate, trends, backlog estimates
- **Alerts:** High/medium/low priority issues
- **Recommendations:** Actionable next steps
- **Top Performers:** Recently completed goals with achievements

**Health score calculation:**
- Activity (30 pts): Progress updates, active work, blocked goals
- Balance (20 pts): Tier distribution, goal count, pipeline health
- Review (30 pts): Goals needing attention by urgency
- Completion (20 pts): Completion rate, unarchived completed goals

### 11. `generate_goals_diagram` ✨ NEW (Phase 5)

Generate visual workflow diagrams in draw.io format with multiple layout styles.

**Input:**
```typescript
{
  projectPath: string;
  diagramType: 'roadmap' | 'kanban' | 'timeline';

  // Options
  includePotential?: boolean;      // Include potential goals (default: false)
  includeArchived?: boolean;       // Include archived goals (default: false)

  // Filters
  tier?: 'Now' | 'Next' | 'Later' | 'Someday';
  priority?: 'High' | 'Medium' | 'Low';

  // Output
  outputPath?: string;             // Default: brainstorming/future-goals/GOALS-{TYPE}.drawio
}
```

**Output:**
```
═══════════════════════════════════════════════════════
  GOALS DIAGRAM GENERATED
═══════════════════════════════════════════════════════

🗺️ Diagram Type: Roadmap
📦 Goals Included: 5
📁 Saved to: GOALS-ROADMAP.drawio

✅ Next steps:
   1. Open in draw.io: /path/to/GOALS-ROADMAP.drawio
   2. Customize layout and styling as needed
   3. Export to PNG/SVG for sharing
```

**Diagram Types:**

**1. Roadmap (Horizontal Flow by Tier)**
```
┌─────────┐    ┌─────────┐    ┌─────────┐    ┌─────────┐
│   NOW   │    │  NEXT   │    │  LATER  │    │ SOMEDAY │
└─────────┘    └─────────┘    └─────────┘    └─────────┘
  ┌──────┐      ┌──────┐      ┌──────┐
  │Goal 01│      │Goal 02│      │Goal 04│
  │60%    │      │Goal 03│      └──────┘
  └──────┘      └──────┘
```

**2. Kanban (Column View)**
```
│ Potential │  Now  │ Next  │ Later │ Someday │ Archived │
│───────────│───────│───────│───────│─────────│──────────│
│  Goal A   │ G01   │ G02   │ G04   │         │   G10    │
│  Goal B   │ G03   │ G05   │       │         │          │
```

**3. Timeline (Gantt-style)**
```
Goal 01 [█████████░] 60%
Goal 02 [███░░░░░░░] 25%
Goal 03 [██████████] 100%
```

**Visual Features:**
- **Color-coded by priority:** High (green), Medium (yellow), Low (gray)
- **Status indicators:** Dashed borders for planning, red for blocked
- **Progress bars:** Visual representation of completion percentage
- **Goal details:** Impact, Effort, Owner, Progress embedded in each box
- **Fully editable:** Open in draw.io desktop or web to customize

**Creates file:** `brainstorming/future-goals/GOALS-{TYPE}.drawio`

**Use cases:**
- Visualize roadmap for stakeholder presentations
- See full kanban board view of all goals
- Track timeline and progress across goals
- Export to PNG/SVG for documentation
- Share visual roadmap with team members

---

## Complete Workflow Example

```typescript
// Step 1: Evaluate a goal
const evaluation = await callTool({
  name: 'evaluate_goal',
  arguments: {
    goalDescription: 'Fix critical bug where users cannot save their work, affecting 50+ users daily',
    context: 'Medical practice management system. Users are losing work and re-entering data manually',
    projectType: 'medical'
  }
});

// Result: High Impact, Medium Effort, "Now" tier

// Step 2: Create potential goal file
const result = await callTool({
  name: 'create_potential_goal',
  arguments: {
    projectPath: '/path/to/project',
    goalName: 'Fix Save Button Bug',
    goalDescription: 'Fix critical bug where users cannot save their work',
    ...evaluation.impact.factors,
    ...evaluation.effort.factors,
    suggestedTier: evaluation.tier.tier,
    problem: 'Users cannot save their work, leading to data loss',
    expectedValue: 'Eliminate data loss, save 50+ users 10-20 min/day'
  }
});

// Creates: brainstorming/future-goals/potential-goals/fix-save-button-bug.md
```

---

## AI Evaluation Heuristics

### Impact Estimation
- **People Affected:** Parses numbers from description or infers from qualitative terms
- **Problem Severity:** Keywords like "critical", "urgent", "broken", "losing"
- **Strategic Value:** Keywords like "revenue", "business", "automation", "efficiency"
- **Domain-specific:** HIPAA, PHI, patient safety = High value for medical projects

### Effort Estimation
- **Time:** Parses explicit time mentions or infers from complexity keywords
- **Technical Complexity:** Algorithms, integrations, HIPAA, mobile apps = High
- **Dependencies:** Counts integration points, approvals, infrastructure changes
- **Scope Clarity:** Detailed descriptions = High clarity, vague = Low

### Test Results
All 5 test scenarios passing (100% accuracy):
- Critical Bug Fix → Now ✓
- Mobile App Project → Next ✓
- Dark Mode Feature → Later ✓
- Microservices Rebuild → Someday ✓
- Timesheet Automation → Next ✓

---

## Roadmap

### Phase 1: Goal Evaluation ✅ (COMPLETE)
- [x] `evaluate_goal` - AI-assisted Impact/Effort estimation
- [x] `create_potential_goal` - Create potential goal files

### Phase 2: Goal Selection & Cross-Server Integration ✅ (COMPLETE)
- [x] `promote_to_selected` - Move goals to selected status
- [x] Integration with SELECTED-GOALS.md
- [x] Goal context handoff to Spec-Driven MCP
- [x] Cross-server workflow documentation

### Phase 3: Goal Management ✅ (COMPLETE)
- [x] `extract_ideas` - Pull ideas from brainstorming
- [x] `view_goals_dashboard` - Overview of all goals
- [x] `reorder_selected_goals` - Prioritize roadmap
- [x] `update_goal_progress` - Track implementation

### Phase 4: Archive & Review ✅ (COMPLETE)
- [x] `archive_goal` - Archive completed/shelved goals with retrospectives
- [x] `check_review_needed` - Proactive goal review detection
- [x] `generate_review_report` - Comprehensive health reports with velocity insights

### Phase 5: Visualization ✅ (COMPLETE)
- [x] `generate_goals_diagram` - Draw.io diagram generation with 3 layout types (roadmap, kanban, timeline)

### Phase 6: Project Setup ✅ (COMPLETE)
- [x] `start_project_setup` - Initiate conversational planning session
- [x] `continue_project_setup` - Multi-turn dialogue with NLP extraction
- [x] `extract_project_goals` - Extract goals with AI estimation
- [x] `generate_project_constitution` - Generate project principles and frameworks
- [x] `generate_initial_roadmap` - Create roadmap with phases and milestones
- [x] `identify_resources_and_assets` - Extract resource inventory and assets
- [x] `identify_stakeholders` - Stakeholder analysis with influence/interest matrix
- [x] `finalize_project_setup` - Complete setup and create initial potential goals

---

## Integration with Spec-Driven MCP

**Phase 2 Cross-Server Integration Complete! ✅**

AI Planning MCP and Spec-Driven MCP now work together seamlessly:

```
1. AI PLANNING MCP: Evaluate → Create Potential Goal
   ↓
2. AI PLANNING MCP: promote_to_selected (generateSpec=true)
   - Adds to SELECTED-GOALS.md
   - Returns goalContext object
   ↓
3. SPEC-DRIVEN MCP: sdd_guide (with goal_context)
   - Receives goal data
   - Shows: "Starting SDD for Goal 03: Mobile App..."
   - Generates: Constitution, Spec, Plan, Tasks
   ↓
4. Implementation & Progress Tracking (Future: Phase 3)
```

**Key Features:**
- `promote_to_selected` returns goalContext when `generateSpec=true`
- `sdd_guide` accepts optional `goal_context` parameter
- Goal data (Impact/Effort, tier, dependencies, risks) flows into spec generation
- Seamless handoff from project management to feature implementation

**See:** `CROSS-SERVER-INTEGRATION.md` for detailed usage examples

**AI Planning** = What should we build? (project-level decisions)
**Spec-Driven** = How do we build this specific thing? (feature-level execution)

---

## Project Structure

After using the tools:

```
your-project/
├── project-setup/                          # Phase 6: Project Setup
│   ├── CONSTITUTION.md                    # Project principles and guidelines
│   ├── ROADMAP.md                         # Initial roadmap with phases
│   ├── RESOURCES.md                       # Team, tools, technologies, budget
│   ├── ASSETS.md                          # Existing/needed/external assets
│   ├── STAKEHOLDERS.md                    # Stakeholder analysis matrix
│   ├── conversation-log.md                # Planning conversation transcript
│   └── conversation-*.json                # Conversation state files
└── brainstorming/
    └── future-goals/
        ├── brainstorming/
        │   └── ongoing-brainstorming-discussion.md
        ├── potential-goals/
        │   ├── fix-save-button-bug.md
        │   ├── mobile-app-for-field-staff.md
        │   └── dark-mode-feature.md
        ├── selected-goals/
        │   └── SELECTED-GOALS.md
        └── archive/
            ├── implemented/
            └── shelved/
```

---

## Files

### Core Server
- `src/server.ts` - MCP server implementation
- `src/types.ts` - Shared type definitions

### Tools (Phases 1-6)
- `src/tools/start-project-setup.ts` - Initiate conversational planning session (Phase 6)
- `src/tools/continue-project-setup.ts` - Multi-turn dialogue with NLP extraction (Phase 6)
- `src/tools/extract-project-goals.ts` - Extract goals with AI estimation (Phase 6)
- `src/tools/generate-project-constitution.ts` - Generate project constitution (Phase 6)
- `src/tools/generate-initial-roadmap.ts` - Create roadmap with phases and milestones (Phase 6)
- `src/tools/identify-resources-and-assets.ts` - Extract resources and assets (Phase 6)
- `src/tools/identify-stakeholders.ts` - Stakeholder analysis with matrix (Phase 6)
- `src/tools/finalize-project-setup.ts` - Complete setup and create potential goals (Phase 6)
- `src/tools/evaluate-goal.ts` - Impact/Effort evaluation (Phase 1)
- `src/tools/create-potential-goal.ts` - Create potential goal files (Phase 1)
- `src/tools/promote-to-selected.ts` - Promote goals and prepare cross-server handoff (Phase 2)
- `src/tools/extract-ideas.ts` - Extract actionable ideas from brainstorming (Phase 3)
- `src/tools/view-goals-dashboard.ts` - Comprehensive goal overview with alerts (Phase 3)
- `src/tools/reorder-selected-goals.ts` - Change goal priority order (Phase 3)
- `src/tools/update-goal-progress.ts` - Track progress and calculate velocity (Phase 3)
- `src/tools/archive-goal.ts` - Archive completed/shelved goals with retrospectives (Phase 4)
- `src/tools/check-review-needed.ts` - Detect goals needing review (Phase 4)
- `src/tools/generate-review-report.ts` - Generate comprehensive health reports (Phase 4)
- `src/tools/generate-goals-diagram.ts` - Generate visual workflow diagrams (Phase 5)

### Evaluators
- `src/evaluators/impact-estimator.ts` - Impact scoring logic
- `src/evaluators/effort-estimator.ts` - Effort scoring logic
- `src/evaluators/tier-suggester.ts` - Tier recommendation logic

### Templates
- `src/templates/project-setup/CONSTITUTION.md` - Project constitution template (Phase 6)
- `src/templates/project-setup/ROADMAP.md` - Project roadmap template (Phase 6)
- `src/templates/project-setup/RESOURCES.md` - Resource inventory template (Phase 6)
- `src/templates/project-setup/ASSETS.md` - Asset list template (Phase 6)
- `src/templates/project-setup/STAKEHOLDERS.md` - Stakeholder analysis template (Phase 6)
- `src/templates/goal-workflow/potential-goal.md` - Potential goal template (Phase 1)
- `src/templates/goal-workflow/selected-goal-entry.md` - Selected goal entry template (Phase 1)
- `src/templates/goal-workflow/selected-goals-index.md` - SELECTED-GOALS.md template (Phase 2)
- `src/templates/goal-workflow/retrospective-implemented.md` - Implemented goal retrospective template (Phase 4)
- `src/templates/goal-workflow/retrospective-shelved.md` - Shelved goal retrospective template (Phase 4)

### Utilities
- `src/utils/conversation-manager.ts` - Multi-turn conversation state management (Phase 6)
- `src/utils/nlp-extractor.ts` - NLP pattern matching for goals, stakeholders, resources (Phase 6)
- `src/utils/constitution-generator.ts` - Project-specific principle derivation (Phase 6)
- `src/utils/roadmap-builder.ts` - Roadmap generation with phases and milestones (Phase 6)
- `src/utils/project-setup-renderer.ts` - Template renderer for project setup documents (Phase 6)
- `src/utils/goal-template-renderer.ts` - Template rendering with camelCase support
- `src/utils/goal-scanner.ts` - Scan and parse goal directories (Phase 3)
- `src/utils/alert-detector.ts` - Detect stale/blocked/duplicate goals (Phase 3)
- `src/utils/velocity-calculator.ts` - Calculate velocity and ETA estimates (Phase 3)
- `src/utils/tasks-parser.ts` - Parse tasks.md checkbox completion (Phase 3)
- `src/utils/review-detector.ts` - Detect goals needing review with urgency levels (Phase 4)
- `src/utils/health-score-calculator.ts` - Calculate goal health score (0-100) (Phase 4)
- `src/utils/report-generator.ts` - Generate comprehensive review reports (Phase 4)
- `src/utils/drawio-xml-builder.ts` - Build draw.io XML format with shapes and styling (Phase 5)
- `src/utils/diagram-generator.ts` - Generate diagrams with roadmap, kanban, timeline layouts (Phase 5)

---

## Testing

Run the test suite:
```bash
npm run build
node dist/evaluate-goal-examples.js
```

Tests validate 5 real-world scenarios across all tier combinations.

---

## Contributing

This server is under active development. Future enhancements may include diagram updates, export formats, and project initialization.

**Phase 6 Complete!** All 19 tools are fully functional and tested.

---

## License

MIT

---

**Questions?** See the integration plan for full technical details and roadmap.
