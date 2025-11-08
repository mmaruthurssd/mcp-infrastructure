---
type: readme
phase: stable
project: spec-driven-mcp-server
tags: [MCP, mcp-server, spec-driven]
category: mcp-servers
status: completed
priority: high
---

# Spec-Driven Development MCP Server

An interactive MCP server that guides you step-by-step through Specification-Driven Development (SDD), helping you create high-quality specifications, implementation plans, and task breakdowns for your projects.

## What is Spec-Driven Development?

Spec-Driven Development inverts traditional software development: **specifications become the source of truth**, and code is generated from those specs. This approach:

- Focuses on **WHAT** and **WHY** before **HOW**
- Creates **executable specifications** that drive implementation
- Maintains **living documentation** that stays in sync with code
- Enables **systematic iteration** and feature evolution

## Features

### Core Capabilities
✅ **Interactive Guided Workflow** - Step-by-step questions to build complete specs
✅ **Medical Practice Ready** - Built-in PHI/HIPAA compliance templates
✅ **Auto-Detection** - Detects project type and scenario automatically
✅ **Template-Driven** - Professional, consistent documentation
✅ **State Management** - Resume workflows across sessions
✅ **Multi-Scenario Support** - New projects, existing code, feature additions

### NEW in v0.2.0 (Taskmaster AI-Inspired Enhancements)
🆕 **Complexity Analysis** - Automated 1-10 scoring of task complexity with recommendations
🆕 **Task Status Tracking** - Track progress through backlog → in-progress → done states
🆕 **Research Guidance** - Structured best practices research for technology decisions
🆕 **Progress Monitoring** - Real-time visibility into feature implementation status

📖 **[See ENHANCEMENTS.md for detailed feature documentation](./ENHANCEMENTS.md)**

## Installation

### Prerequisites

- Node.js 18+ and npm
- Claude Code (or another MCP-compatible AI client)

### Setup

1. **Install dependencies**:
   ```bash
   cd spec-driven-mcp-server
   npm install
   ```

2. **Build the server**:
   ```bash
   npm run build
   ```

3. **Add to Claude Code configuration**:

   Edit your MCP configuration file:
   - **macOS**: `~/Library/Application Support/Claude/claude_desktop_config.json`
   - **Windows**: `%APPDATA%\Claude\claude_desktop_config.json`

   Add this server:
   ```json
   {
     "mcpServers": {
       "spec-driven": {
         "command": "node",
         "args": [
           "/absolute/path/to/spec-driven-mcp-server/dist/server.js"
         ]
       }
     }
   }
   ```

4. **Restart Claude Code**

## Usage

### Starting a New Project

```
USER: "I want to build a Google Sheets version control system"

CLAUDE: [Uses sdd_guide tool to start workflow]

The server will guide you through:
1. Constitution (project principles)
2. Specification (what/why)
3. Planning (how/tech stack)
4. Tasks (execution breakdown)
```

### Workflow Steps

#### Step 1: Constitution
Defines your project's governing principles:
- Testing requirements (TDD, integration, e2e)
- Code quality standards
- PHI/HIPAA compliance (if applicable)
- Technology stack constraints
- Simplicity principles

#### Step 2: Specification
Creates feature specification focusing on WHAT and WHY:
- Problem statement
- User stories with acceptance criteria
- Functional & non-functional requirements
- Constraints and assumptions
- Out-of-scope items

#### Step 3: Planning
Generates implementation plan with HOW:
- Technical approach and architecture
- Technology choices with rationale
- Implementation phases
- Testing strategy
- Risk assessment

#### Step 4: Tasks
Breaks down into executable tasks:
- Ordered task list with dependencies
- Parallel execution markers
- Test-first task structure
- Validation checkpoints

### Example Conversation Flow

```
USER: "Build a patient visit tracker for Google Sheets"

CLAUDE: [Calls sdd_guide({ action: "start", project_path: "...", description: "..." })]
→ Server responds with setup confirmation

CLAUDE: "I'm setting up Spec-Driven Development. I'll create specs in:
        /path/to/your/project/specs/
        Is this correct?"

USER: "Yes"

CLAUDE: [Calls sdd_guide({ action: "answer", project_path: "...", response: true })]
→ Server moves to constitution questions

CLAUDE: "Step 1/5: Constitution
        Question 1: Will this project handle PHI?"

USER: "Yes, it tracks patient visits"

CLAUDE: [Calls sdd_guide({ action: "answer", response: true })]
→ Server asks next question

[... continues through all questions ...]

CLAUDE: "✓ Constitution created at specs/.specify/memory/constitution.md

        Step 2/5: Specification
        Let me understand WHAT you want to build..."

[... continues through specification, planning, tasks ...]

CLAUDE: "✓ All artifacts created!
        - Constitution
        - Specification
        - Implementation Plan
        - Task Breakdown

        Ready to implement!"
```

## MCP Tools

This server provides 4 MCP tools:

### 1. `sdd_guide` - Main Workflow Tool

Core specification-driven development workflow.

#### Tool Definition

```typescript
{
  name: "sdd_guide",
  description: "Interactive guide for Spec-Driven Development",
  inputSchema: {
    action: "start" | "answer",
    project_path: string,      // Absolute path to project
    description?: string,       // For action=start
    response?: any,             // For action=answer
    scenario?: "new-project" | "existing-project" | "add-feature"
  }
}
```

### Actions

#### `start` - Begin new workflow
```typescript
sdd_guide({
  action: "start",
  project_path: "/Users/you/projects/my-app",
  description: "Google Sheets version control system",
  scenario: "new-project"  // optional, auto-detected if omitted
})
```

**Returns:**
```json
{
  "success": true,
  "data": {
    "step": "setup",
    "scenario": "new-project",
    "message": "Starting Spec-Driven Development...",
    "questions": [{"id": "confirm_path", ...}],
    "progress": "Setup"
  }
}
```

#### `answer` - Respond to question
```typescript
sdd_guide({
  action: "answer",
  project_path: "/Users/you/projects/my-app",
  response: true  // or string, number, array
})
```

**Returns:**
```json
{
  "success": true,
  "data": {
    "step": "constitution",
    "message": "Question 2/12",
    "question": {"id": "testing_requirements", ...},
    "progress": "1/5 (Constitution)"
  }
}
```

---

### 2. `research_best_practices` - Research Guidance Tool 🆕

Get structured guidance for researching technology topics and best practices.

```typescript
research_best_practices({
  topic: "React state management",
  context: "medical practice management system with PHI handling",
  specificQuestions: ["How to handle sensitive data?"],
  constraints: ["must support TypeScript", "HIPAA compliant"]
})
```

**Returns**: Optimized search queries, evaluation criteria, resource recommendations, and cautionary notes (especially for PHI/HIPAA contexts).

---

### 3. `update_task_status` - Task Status Tracking Tool 🆕

Update task execution status during implementation.

```typescript
update_task_status({
  projectPath: "/path/to/project",
  featureId: "001",
  taskId: "1.1",
  status: "in-progress" | "done" | "blocked",
  notes: "Optional progress notes",
  blockedReason: "If blocked, explain why"
})
```

**Returns**: Updated task state and overall progress summary.

---

### 4. `get_task_progress` - Progress Monitoring Tool 🆕

Get current progress and status of tasks for a feature.

```typescript
get_task_progress({
  projectPath: "/path/to/project",
  featureId: "001",
  taskId: "1.1"  // Optional: omit for all tasks
})
```

**Returns**: Progress summary with completion percentage, task statuses, and timestamps.

---

## Scenarios

### 1. New Project (Greenfield)
- Empty or minimal project directory
- Full workflow: Constitution → Spec → Plan → Tasks
- All questions asked

### 2. Existing Project (Brownfield)
- Has code but no specs
- Analyzes existing code
- Creates retroactive specs
- Plans integration of new features

### 3. Add Feature (Evolution)
- Has existing constitution and specs
- Loads existing principles
- Creates new feature spec
- References existing architecture

## Project Structure After Completion

```
your-project/
├── specs/
│   ├── .specify/
│   │   └── memory/
│   │       └── constitution.md          # Project principles
│   └── 001-feature-name/
│       ├── spec.md                      # Feature specification
│       ├── plan.md                      # Implementation plan
│       ├── tasks.md                     # Task breakdown
│       └── contracts/                   # API contracts (if applicable)
└── [your source code]
```

## Medical Practice Features

Built-in support for healthcare projects:

### PHI Protection
- Automatic PHI handling questions
- HIPAA compliance templates
- Encryption requirements
- Audit logging standards

### Compliance Templates
```markdown
## Article IV: PHI Protection (NON-NEGOTIABLE)

**Requirements:**
- All PHI must be encrypted at rest and in transit
- Access logging required with audit trails
- PHI never in logs or error messages
- Synthetic data for all testing
```

## Question Types

The server supports multiple question types:

- **text**: Free-form text input
- **number**: Numeric input with min/max
- **boolean**: Yes/no questions
- **single_select**: Choose one option
- **multi_select**: Choose multiple options

### Conditional Questions

Questions can be conditional:
```json
{
  "id": "session_timeout",
  "condition": {"field": "hipaa_compliance", "equals": true},
  "question": "Session timeout duration (minutes)?"
}
```

## State Management

Workflow state is persisted to `~/.sdd-mcp-data/workflows/`:
- Resume interrupted workflows
- Review previous answers
- Modify and regenerate artifacts

## Development

### Build
```bash
npm run build
```

### Watch Mode
```bash
npm run watch
```

### Directory Structure
```
spec-driven-mcp-server/
├── src/
│   ├── server.ts                    # Main MCP server
│   ├── types.ts                     # TypeScript definitions
│   ├── tools/
│   │   └── sdd-guide.ts             # Main tool implementation
│   ├── workflows/
│   │   └── orchestrator.ts          # Workflow management
│   ├── detection/
│   │   └── scenario-detector.ts     # Auto-detect scenario
│   ├── questions/
│   │   ├── constitution/
│   │   │   └── new-project.json     # Question definitions
│   │   ├── specification/
│   │   └── planning/
│   ├── templates/
│   │   └── base/
│   │       ├── constitution.md      # Constitution template
│   │       ├── specification.md     # Spec template
│   │       ├── plan.md              # Plan template
│   │       └── tasks.md             # Tasks template
│   ├── renderers/
│   │   └── template-renderer.ts     # Template rendering
│   └── utils/
│       ├── state-manager.ts         # Persist workflow state
│       ├── file-manager.ts          # File operations
│       └── question-loader.ts       # Load questions
├── package.json
├── tsconfig.json
└── README.md
```

## Customization

### Adding New Questions

Edit question files in `src/questions/{step}/{scenario}.json`:

```json
{
  "id": "new_question",
  "type": "text",
  "question": "Your question here?",
  "required": true,
  "variable": "TEMPLATE_VARIABLE"
}
```

### Modifying Templates

Edit templates in `src/templates/base/`:
- Use `{{VARIABLE}}` for simple replacement
- Use `{{#if VAR}}...{{/if}}` for conditionals
- Use `{{#each ARRAY}}...{{/each}}` for loops

### Adding New Scenarios

1. Create question files for the scenario
2. Add scenario detection logic in `ScenarioDetector`
3. Add workflow handling in `WorkflowOrchestrator`

## Troubleshooting

### Server Not Starting
- Check Node.js version (18+ required)
- Verify MCP config path is absolute
- Check build completed: `npm run build`

### Questions Not Appearing
- Ensure question JSON files are valid
- Check scenario detection is correct
- Verify state file isn't corrupted

### Templates Not Rendering
- Check variable names match question `variable` fields
- Verify template syntax ({{VAR}}, {{#if}}, {{#each}})
- Look for template rendering errors in logs

## Roadmap

- [ ] Brownfield scenario implementation
- [ ] Feature addition scenario
- [ ] Custom template snippets
- [ ] Checklist generation tool
- [ ] Analysis tool for spec consistency
- [ ] Implementation execution tool

## License

MIT

## Credits

Based on [GitHub's Spec-Kit](https://github.com/github/spec-kit) methodology.

Customized for medical practice and general use with MCP integration.
