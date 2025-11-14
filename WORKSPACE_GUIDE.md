---
type: guide
tags: [workspace-standards, AI-collaboration, constitution, resource-index]
---

# Workspace Guide

**Purpose:** Single source of truth for workspace standards, AI collaboration preferences, and available resources.

**When to read this guide:**
- Start of any new conversation where user requests work
- Before starting significant tasks (creating files, organizing, building workflows)
- When unsure about workspace conventions or available tools
- Every ~10 messages if conversation is long and ongoing

---

# PART 1: CONSTITUTION

## Core Directives

### Communication Style
- Be concise and direct - actionable responses over formality
- Ask clarifying questions when ambiguous - don't assume
- No emojis unless requested

### Automation Preference
- Always prefer AI/automated solutions over manual work
- Suggest automation opportunities proactively
- Build reusable solutions over one-off fixes

### Resource-First Approach
- Always check Part 2 before creating new solutions
- Use existing templates, MCPs, patterns - don't reinvent
- Document new resources immediately (see Meta-Directives)

---

## File & Project Standards

### Organization Principles
Follow patterns from **smart-file-organizer MCP** and these principles:

**Primary directories:**
- `development/` - Staging environments (mirrors local-instances/)
  - `mcp-servers/` - MCP development projects (22 active MCPs projects)
  - `tools/` - Tool development projects
- `local-instances/` - Production environments
  - `mcp-servers/` - Production MCP instances (22 active MCPs + 1 library MCP)
  - `tools/` - Production tool instances
- `templates-and-patterns/` - Reusable templates and documented patterns
  - `mcp-server-templates/` - 24 MCP server templates (drop-in ready)
  - `simple-templates/` - Documentation-based templates (markdown guides)
  - `MCP-DEVELOPMENT-STANDARD.md` - **MANDATORY** template-first development pattern
  - [Other template categories as they emerge]
- `projects-in-development/` - Active work, incomplete projects
- `live-practice-management-system/` - Production system and documentation
- `planning-and-roadmap/` - Strategic planning documents
  - `future-ideas/` - Active exploration and brainstorming
  - `implemented-ideas/2025/` - Completed ideas (archived by year)
- `temp/` - Temporary files (plans, roadmaps, working documents) - archived when completed
- `archive/` - Completed or obsolete items
- `configuration/` - Workspace configuration files

**Key rules:**
- **Template-First Development (MANDATORY):** ALL MCP and tool development follows template-first pattern
  - Design as template FIRST in `templates-and-patterns/`
  - Include TEMPLATE-INFO.json with AI installation instructions
  - Include config schema with {{AUTO_DETECT}} placeholders for workspace-agnostic deployment
  - Build in staging, deploy to production, template remains drop-in ready
  - **See:** `templates-and-patterns/MCP-DEVELOPMENT-STANDARD.md` (mandatory standard)
- **Dual-environment pattern:** Build in staging (development/), deploy to production (local-instances/)
  - Staging code: `development/mcp-servers/[project]/04-product-under-development/staging/`
  - Production code: `local-instances/mcp-servers/[name]/`
  - MCP config points to production only
- **MCP Configuration:** MUST follow `templates-and-patterns/mcp-server-templates/MCP-CONFIGURATION-CHECKLIST.md`
  - Register in `~/.claude.json` ONLY (NO workspace .mcp.json)
  - Use absolute paths (NO ${workspaceFolder})
  - Validate before registration, backup config, verify installation
- Templates are reference material, never modify in place - copy first
- Active work goes in projects-in-development
- Production/live systems have dedicated top-level folders
- Use smart-file-organizer MCP for complex organization decisions

### Naming Conventions
- Use kebab-case for directories: `my-project-name/`
- Use kebab-case for files: `workflow-diagram.drawio`
- Be descriptive but concise: `deployment-workflow.md` not `workflow.md`
- Add context when needed: `google-sheets-migration-project/` not `migration/`
- Avoid generic names: `testing-framework-planning/` not `planning/`

### Documentation Requirements
- Every significant project should have README.md or START_HERE.md
- Templates must include usage documentation
- Keep documentation close to what it documents (in same directory)
- **Always update documentation alongside code changes** - Check for affected docs (README, Quick Start, templates, config files) and update them in the same session
- Documentation debt compounds - update now, not "later"

### File Metadata Standard (CRITICAL)
**ALWAYS add YAML frontmatter to new `.md` files:**

```yaml
---
type: [guide/readme/plan/template/reference/specification]
tags: [relevant, keywords]
---
```

**Why minimal format (2 fields only):**
- Smart File Organizer uses `type` for 90-95% confidence (vs 50-60% without)
- `tags` improve searchability and keyword matching
- Other fields (`phase`, `category`, `status`, `priority`) are NOT used by Smart File Organizer
- Lifecycle stage determined by folder location, not metadata

**How to add metadata:**
1. **VS Code Snippets**: Type `meta-guide`, `meta-readme`, `meta-plan` + Tab (`.vscode/markdown.code-snippets`)
2. **Ask Claude**: Request "Create [file] with metadata" - Claude adds automatically
3. **Copy from templates**: `templates-and-patterns/simple-templates/file-templates/`

---

## Autonomous Deployment Framework (Standard Pattern)

**Location:** `development/frameworks/autonomous-deployment/`
**Status:** 🟢 Active - THE standard for all component development
**Documentation:** `development/frameworks/autonomous-deployment/README.md`

### Overview

**Every component you build should use this framework.** It provides:
- Automated issue detection, classification, and resolution
- Confidence-based autonomy (90%+ autonomous, 70-89% assisted, <70% manual)
- Tiered storage (workspace fast access + external brain learning)
- Dual environment OR production-only deployment
- 5-stage validation with automatic rollback
- Integration with all MCP workflow systems

### The Three Issue Types

Framework handles ALL issues through three base types (extensible to any custom type):

**1. Broken (Fix)** - Component exists but not working
- Examples: MCP errors, failing tests, broken API integration
- Can achieve high confidence (0.90+) with resolution history
- Fully autonomous when similar issues resolved before
- Maps from: configuration, integration, security, dependency, data-migration, deployment

**2. Missing (Build)** - Capability doesn't exist, needs creation
- Examples: New MCP tool, missing feature, new integration
- Moderate confidence (max 0.85) - always requires human input
- AI suggests approaches, human selects direction
- Maps from: infrastructure

**3. Improvement (Enhance)** - Component works but could be better
- Examples: Performance optimization, better error handling, refactoring
- Variable confidence based on scope
- Simple optimizations autonomous, complex improvements need review
- Maps from: performance, documentation, testing

**Custom types allowed** - Framework is fully extensible via TypeMappingConfig

### When to Use Framework

**Always use for:**
- MCP server development (all phases)
- Standalone tool creation
- Google Sheets automation projects
- Application deployment
- Script development with dual environments

**Framework adapters available:**
- MCPAdapter - TypeScript MCP servers (5-stage validation)
- ToolAdapter - Language-agnostic tools (Node.js/Python/Go/Bash)
- SheetAdapter - Google Sheets with Apps Script

### Dual Environment vs Production-Only

**Dual Environment (Preferred):**
- Development (staging): `development/[component-type]/[name]/`
- Production: `local-instances/[component-type]/[name]/`
- Validate → Deploy to dev → Monitor → Deploy to prod

**Production-Only (When Practical):**
- Only production instance: `local-instances/[component-type]/[name]/`
- Creates temporary staging → Validates → Deploys → Cleans up
- Use when: staging environment impractical, resource constraints, simple components

### Confidence-Based Autonomy

Framework decides autonomy level based on confidence score:

- **≥0.90**: Fully autonomous - Deploy without approval
- **0.70-0.89**: Assisted - AI suggests, human approves
- **<0.70**: Manual - Human-led with AI support

**Safety mechanisms:**
- First-time patterns always require approval
- Security/data-migration issues get confidence multiplier (0.8x, 0.7x)
- PHI handling requires human review
- Automatic rollback on deployment failure

### Integration with MCP Workflow

**✨ NEW (November 2025): Direct MCP Integration**

The framework is now **built into** project-management and task-executor MCPs:

**project-management MCP:**
- `evaluate_goal(workspacePath=...)` → Returns autonomous classification
- `create_potential_goal(autonomous*=...)` → Displays classification in goal files
- Enables early detection of autonomous-eligible issues
- **Optional** - works without workspacePath parameter

**task-executor MCP:**
- `complete_task(runValidation=true)` → Auto-validates build/tests
- `archive_workflow(checkDeploymentReadiness=true)` → Pre-deployment checks
- Continuous validation throughout development
- **Optional** - works without validation parameters

**Standard workflow (enhanced):**
1. **Issue Detection** - Framework detects and classifies issue
2. **project-management** - Evaluate goal WITH autonomous classification
3. **spec-driven** - Generate specification (for "missing" issues)
4. **task-executor** - Execute tasks WITH continuous validation
5. **parallelization** - Deploy sub-agents if beneficial
6. **task-executor** - Archive WITH deployment readiness check
7. **Deployment** - Dual or production-only pipeline (if needed)
8. **workspace-brain** - Log resolution for learning

**Storage:**
- Active issues: `.ai-planning/issues/*.json` (workspace)
- Historical: workspace-brain MCP (external brain)
- Archive: `08-archive/issues/` (after 90 days)

### Quick Start

```typescript
// See: development/frameworks/autonomous-deployment/README.md
// Example: Deploy MCP server with dual environment
import { MCPAdapter } from './adapters/mcp-adapter.js';
import { createDeploymentPipeline } from './core/deployment-pipeline.js';

const adapter = new MCPAdapter();
const pipeline = createDeploymentPipeline({
  workspacePath: '/path/to/workspace',
  componentName: 'my-mcp-server',
  componentType: 'mcp-server',
  environmentMode: 'dual',
  adapter,
  targetEnvironment: 'production'
});

const result = await pipeline.deploy();
```

**For complete documentation, examples, and patterns:** See `development/frameworks/autonomous-deployment/README.md`

---

## AI Collaboration Preferences

### Task Management with task-executor MCP

**ALWAYS use task-executor MCP for task tracking** (not TodoWrite).

**Use task-executor for:**
- Bug fixes (5-8 tasks)
- Small features (3-10 tasks)
- Refactoring workflows (4-7 tasks)
- Deployment checklists (6-10 tasks)
- ANY multi-step work that needs persistence

**Why task-executor over TodoWrite:**
- ✅ **Persistent** - Survives session restarts
- ✅ **Verification** - Checks tasks actually completed
- ✅ **Documentation tracking** - Never forget doc updates
- ✅ **Temp→Archive lifecycle** - Clean project management
- ✅ **Complexity analysis** - Auto-scores task difficulty

**When starting work:**
1. Use `create_workflow` to define tasks
2. Use `complete_task` as you finish each task (with verification)
3. Use `get_workflow_status` to check progress
4. Use `archive_workflow` when all tasks done

**Only use TodoWrite when:**
- task-executor MCP not available
- Extremely trivial single-step reminders

### Time Estimation Standards

**When providing time estimates for tasks Claude will complete:**
- Provide **AI-assisted development time** (what it takes Claude to complete)
- NOT traditional human-only development time
- Be realistic about actual AI capabilities and workflow speed
- Account for: file reading, analysis, implementation, verification, documentation updates
- Example: "This will take 2-3 minutes" not "This would take 2-3 hours for a developer"

**When estimating for user-completed tasks:**
- Provide human development time estimates
- Clearly indicate: "If you were implementing this manually..."

### Parallel Sub-Agent Execution

**Deploy sub-agents when ALL conditions met:**
1. ✅ Analysis shows `recommended: true` with speedup ≥2.0x
2. ✅ 3+ independent tasks (minimal dependencies)
3. ✅ Clear scope per task (distinct file boundaries)
4. ✅ Non-trivial work (5+ minutes per task)

**When NOT to use:**
- Sequential dependencies (tasks must run in order)
- High file conflict risk (same files edited)
- Exploratory work (unclear requirements)
- Trivial tasks (coordination overhead > time savings)

**For deployment workflow and integration patterns:** See WORKSPACE_ARCHITECTURE.md "Sub-Agent Deployment Pattern"

### When to Read WORKSPACE_ARCHITECTURE.md

**Read architecture doc when:**
- **Understanding the "team mental model"** (how all components work together)
- Working with MCP integrations or multi-MCP workflows
- Setting up parallelization or sub-agent deployment
- Understanding specific MCP capabilities (tool listings, integration patterns)
- Troubleshooting MCP issues or designing complex automation
- User asks "how X MCP works" or "what tools does X have"
- **Learning the feedback loops** (how the workspace improves over time)

**The Team Mental Model (WORKSPACE_ARCHITECTURE.md):**

The workspace operates like a **distributed team** with 5 strategic functions:

1. **Organization & Discovery** (Smart File Organizer) - Where things go
2. **Quality & Validation** (Autonomous Framework) - Ensures quality before deployment
3. **Planning & Coordination** (project-management) - Breaks down work into goals
4. **Execution & Tracking** (task-executor) - Manages tasks, validates completion
5. **Memory & Learning** (workspace-brain) - Remembers solutions, detects patterns

**Primary Feedback Loop:**
Work → Organize → Classify → Plan → Execute → Deploy → Learn → Improve Future Work

**Key Insight:** Every action feeds back into the system, making it smarter over time. Issue resolution today = higher confidence tomorrow = potential auto-resolution next time.

**For complete details:** See "Team Mental Model: How the Workspace Works" section in WORKSPACE_ARCHITECTURE.md

**Skip if:**
- Simple file operations or organization tasks
- Following existing patterns from templates
- Standard git/documentation work
- Task doesn't involve MCP coordination

### When to Read This Guide

**Tier 1 - Always read (Significant tasks):**
- Creating/modifying files or templates
- Organizing files or projects
- Starting new projects or features
- Building workflows, diagrams, or documentation
- Making structural workspace changes
- Installing/configuring tools or systems

**Tier 2 - Read if unsure (Medium tasks):**
- Multi-step tasks spanning multiple files
- Editing existing resources extensively
- Complex questions about workspace structure
- Haven't read guide in last ~10 messages

**Tier 3 - Skip reading (Simple tasks):**
- Quick file reads
- Simple questions or explanations
- Minor text edits (typos, formatting)
- Conversational requests
- Already read guide recently in conversation

### Tool Selection Priority
When solving a problem, check resources in this order:

1. **Existing resources** (Part 2: Quick Lookup) - Use what exists
2. **MCP servers** (Part 2: MCP Reference) - Leverage loaded tools
3. **Create new template/tool** - Only if nothing exists AND it's reusable
4. **Ad-hoc solution** - Only for truly one-off needs

### Handling Ambiguity
- **When unclear, ASK** - Don't guess at user intent
- **Propose options** - Use AskUserQuestion tool for choices
- **State assumptions** - If proceeding without full clarity, say what you're assuming
- **Verify before major changes** - Confirm destructive operations

### Issue Logging & Continuous Learning

**CRITICAL: Automatic feedback loop for troubleshooting system**

**You MUST log issues when you observe yourself doing ANY of these patterns:**

1. ⏱️ **Time Threshold**: Spent >5 minutes troubleshooting one problem
2. 🔍 **Multiple Diagnostics**: Ran 3+ diagnostic commands (ls, grep, cat, test, jq, file)
3. 💾 **Backup/Restore**: Used backup files to recover from errors
4. 📖 **Research Required**: Read documentation files to solve a problem
5. ⚠️ **Breaking Change**: Fixed something that broke other things
6. ⚙️ **Configuration Change**: Modified .mcp.json or config files due to errors
7. 🔨 **Build/Rebuild**: Ran npm install, npm build, or tsc to fix errors
8. 🧪 **Test Failures**: Debugged and fixed failing tests
9. 🔄 **Multiple Attempts**: Tried 3+ different solutions before finding fix
10. 📝 **Workaround Needed**: Applied a workaround instead of ideal solution

**If ANY pattern detected → IMMEDIATELY after resolving:**
1. Stop and run Post-Resolution Checklist (mcp-server-development/mcp-implementation-master-project/troubleshooting/README.md)
2. Classify domain: configuration/build/testing/deployment/integration/documentation
3. Try: `mcp__learning-optimizer__track_issue(...)`
4. If MCP unavailable: Manually log to troubleshooting/[domain]-issues.md
5. NEVER skip logging - this is how the system improves

**Reference:** See mcp-server-development/mcp-implementation-master-project/troubleshooting/README.md for complete Post-Resolution Checklist

### Self-Improving Feedback Loop

**Purpose:** Workspace autonomously detects, logs, triages, resolves, and learns from issues
**Status:** 🟢 Phase 1 Active (Pre-commit integration complete)

**Active Features:**
- Pre-commit hooks scan for credentials/PHI (blocks commits with violations)
- Automatic security scanning on every commit
- Issue logging to learning-optimizer-mcp
- Scan reports in `.security-scans/` (gitignored)

**For complete 7-step process, autonomous resolution, and safety mechanisms:** See WORKSPACE_ARCHITECTURE.md "Self-Improving Feedback Loop Architecture"

---

## Quality Standards

- **Avoid over-engineering**: Simple, maintainable approaches over clever architectures; build what's needed now
- **Consistency over speed**: Follow established patterns even if ad-hoc seems faster; quality worth token cost
- **Pattern following**: Use existing patterns; if modifying, update template/guide too
- **No duplication**: Check if similar resource exists before creating; consolidate when discovered
- **Workspace integrity**: Clean up temp files, keep structure organized, update docs with changes, commit completed work

---

## Meta-Directives

### Constitution Maintenance
- Keep guide under 400 lines; remove redundant directives during reviews
- Consolidate overlapping rules; expand existing rules vs adding new ones
- Periodic review every 2-4 weeks for optimization
- Review process: Read guide → Identify redundancy/gaps → Suggest changes → Update

### Resource Index Maintenance (MANDATORY)
When creating new resource: (1) Create it, (2) IMMEDIATELY update Part 2 Quick Lookup with entry/triggers/location, (3) If not immediate, create task-executor workflow. When removing: delete from Part 2, note in commit.

### Token Efficiency
- Concise docs, efficient formats; use tables for structured data
- One good example per concept; reference files vs duplicating content
- Regular audit: "Is every line necessary?"

### Usage Tracking & Optimization
- Note resource usage in Part 2; quarterly reorganize Quick Lookup by frequency
- Keep descriptions minimal (5-10 words max)

---

# PART 2: AVAILABLE RESOURCES

## Quick Lookup Table

**High-priority resources (sorted by expected usage):**

| Resource | Trigger Keywords | Path | Type |
|----------|------------------|------|------|
| **[KEY]** Onboarding & Setup | "new computer", "workspace setup", "onboard user", "setup automation", "new machine", "setup issues", "installation guide", "setup history", "AI-to-AI communication setup" | /workspace-management/onboarding-and-setup/ | System |
| **[KEY]** MCP Development Standard | "create MCP", "develop tool", "template-first", "drop-in ready", "transferable", "workspace-agnostic", "TEMPLATE-INFO.json", "auto-detect", "MCP configuration checklist" | /templates-and-patterns/MCP-DEVELOPMENT-STANDARD.md | Standard (MANDATORY) |
| **[KEY]** Template Management | "install templates", "test templates", "version templates", "bump version", "validate template", "install all MCPs", "unified installer" | /docs/TEMPLATE_MANAGEMENT.md | Guide |
| **[KEY]** Autonomous Deployment Framework | "deploy component", "issue classification", "autonomous deployment", "dual environment", "production-only", "confidence scoring", "broken/missing/improvement", "standard development pattern" | /development/frameworks/autonomous-deployment/README.md | Framework |
| **[KEY]** Workspace Architecture | "MCP tools", "MCP integration", "workflow orchestration", "parallelization", "sub-agents", "MCP architecture", "how MCPs work", "feedback loop details" | /WORKSPACE_ARCHITECTURE.md | Guide |
| **[KEY]** MCP Configuration Checklist | "register MCP", "install MCP", "configure MCP", "~/.claude.json", "absolute paths", "no workspace .mcp.json", "duplicate prevention", "pre-flight checks" | /templates-and-patterns/mcp-server-templates/MCP-CONFIGURATION-CHECKLIST.md | Checklist (MANDATORY) |
| **[KEY]** Troubleshooting System | "issue logging", "feedback loop", "track issue", "troubleshooting", "post-resolution", "continuous learning" | mcp-server-development/mcp-implementation-master-project/troubleshooting/ | System |
| **[KEY]** Security Git Integration | "pre-commit", "security scanning", "credential detection", "PHI scanning", "git hooks", "security integration" | /mcp-server-development/mcp-implementation-master-project/03-resources-docs-assets-tools/SECURITY-GIT-INTEGRATION-GUIDE.md | Guide |
| task-executor MCP | "tasks", "workflow", "bug fix", "feature", "checklist" | local-instances/mcp-servers/task-executor-mcp-server/ | MCP |
| **[KEY]** MCP Server System | "MCP setup", "create MCP", "install MCP", "troubleshoot MCP", "MCP servers", "MCP not loading" | mcp-server-templates/START_HERE.md | Guide |
| Project Structure Templates | "new project", "project template", "project structure", "initialize project", "create project", "folder structure", "8 folders", "EVENT_LOG", "NEXT_STEPS" | project-structure-templates/START_HERE.md | Template |
| file-metadata-guide | "metadata", "frontmatter", "YAML", "discoverability", "file organization" | simple-templates/file-metadata-guide/ | Guide |
| goal-workflow | "brainstorm", "goals", "ideas", "prioritize", "potential goals", "selected goals" | simple-templates/goal-workflow-template/ | Template |
| diagram-workflows | "workflow diagram", "flowchart", "draw.io" | simple-templates/diagram-workflows/ | Template |
| communications-mcp-server-template | "email", "gmail", "smtp", "google chat", "webhook", "send message", "staging", "approval workflow" | mcp-server-templates/templates/communications-mcp-server-template/ | Template |
| SECURITY_BEST_PRACTICES | "security", "credentials", "tokens", "PHI" | /SECURITY_BEST_PRACTICES.md | Guide |
| Pattern Extraction Framework | "audit sheets", "find patterns", "legacy code" | frameworks/Google-Sheets-Pattern-Extraction-Framework-and-Library/ | Framework |
| System Builder Framework | "generate automation", "build sheets", "87% faster" | frameworks/Google-Sheets-System-Framework-and-Builder/ | Framework |
| Business Testing Framework | "write tests", "business validation", "test methodology" | frameworks/Business-Process-Testing-Framework/ | Framework |
| OAuth Authenticator | "google oauth", "token generation", "API access" | tools-templates/google-oauth-authenticator-tool/ | Tool |
| Clasp Authenticator | "clasp auth", "apps script CLI" | tools-templates/clasp-authenticator-tool/ | Tool |
| Apps Script Cloner | "bulk clone", "backup apps script", "migration" | tools-templates/apps-script-cloner-tool/ | Tool |
| Metadata Extractor | "extract metadata", "sheet structure", "PHI-safe" | tools-templates/metadata-extractor-tool/ | Tool |
| **[KEY]** MCP Server Templates | "create MCP", "build server", "new MCP", "install MCP template" | mcp-server-templates/templates/ | Template (24 templates available) |
| GitHub Repo Templates | "new repository", "create repo", "github setup" | github-repo-templates/ | Template |
| Repository Creation Guide | "repo standards", "github conventions" | github-repo-templates/REPOSITORY_CREATION_GUIDE.md | Guide |
| Git Staging Monitor | "git safety", "mass staging", "auto-unstage", "git forensics", "prevent deletions" | /local-instances/tools/git-staging-monitor/ | Tool |

**All paths relative to:** `templates-and-patterns/` (unless starts with `/`)

**Usage:** When user request matches triggers, read the resource before proceeding.

---

## MCP Servers (Pre-loaded)

**22 active MCPs available across 5 categories** (+ 1 library MCP used as dependency). For complete tool listings, integration patterns, and architecture details: **See WORKSPACE_ARCHITECTURE.md**

### Core Workflow (4 MCPs)
- **git-assistant** - Git workflow guidance and commit messages
- **smart-file-organizer** - Intelligent file and project organization
- **spec-driven** (v0.2.0) - Spec-driven development with orchestration integration
- **task-executor** (v2.0.0) - Persistent task workflow management (use for ALL multi-step work)

### Foundation (3 MCPs)
- **mcp-config-manager** - Validate and manage MCP configurations
- **security-compliance-mcp** - Credential detection, PHI scanning, pre-commit hooks
- **testing-validation-mcp** - Test execution, coverage tracking, quality gates

### Operations (5 MCPs)
- **project-management** (v1.0.3) - Project orchestration with workflow guidance and component-driven framework (31 tools)
- **parallelization** (v1.0.1) - Parallel task execution with sub-agent coordination
- **configuration-manager-mcp** - Secrets management, environment configs
- **deployment-release-mcp** - Deployment automation, rollback, release coordination
- **code-review-mcp** - Linting, complexity analysis, technical debt tracking

### Intelligence (3 MCPs)
- **workspace-brain** (v1.0.1) - External brain for telemetry, analytics, learning (15 tools)
- **performance-monitor-mcp** - Performance tracking, anomaly detection, alerting
- **documentation-generator** (v1.0.0) - Automated documentation for TypeScript projects

### Supporting (7 MCPs)
- **arc-decision** - Architecture decisions (Skills/MCP/Subagents/Hybrids)
- **communications** - Email and Google Chat with staging/approval
- **learning-optimizer** - Troubleshooting optimization with auto-learning
- **workspace-index** - Workspace indexing, documentation validation/drift detection, **Phase 4: Autonomous documentation management** (supersession detection, consolidation, archival with confidence-based autonomy)
- **checklist-manager-mcp** - Checklist tracking, validation, dependency enforcement
- **test-generator-mcp** - Automated test generation for TypeScript/JavaScript
- **backup-dr-mcp** - Backup automation, disaster recovery, HIPAA compliance

**For tool inventories, use cases, and integration patterns:** See WORKSPACE_ARCHITECTURE.md "Complete MCP Server Listings"

---

## Category Indexes

For comprehensive lists of templates, frameworks, and tools: See WORKSPACE_ARCHITECTURE.md "Resource Category Indexes"

---

## Usage Tracking

**Resources used this quarter:** (Update as resources are accessed)
- diagram-workflows: Used [count] times
- [Add others as they're used]

**Last updated:** 2025-10-25
**Next quarterly review:** 2026-01-25

**Note:** During quarterly review, reorganize Quick Lookup table by actual usage frequency.

---

## Maintenance Log

**Last reviewed:** 2025-11-03 (MCP Template System Complete)
**Next review:** 2025-11-17
**Lines:** 370 (optimized from 590, 37% reduction)

**Recent Critical Changes:**
- 2025-11-03: **MCP Template System Complete** - Created 24 MCP server templates (100% coverage of deployed MCPs). All templates include TEMPLATE-INFO.json, INSTALL-INSTRUCTIONS.md, install.sh, configure-mcp.sh for AI-driven installation. Templates ready for drop-in deployment to new workspaces.
- 2025-11-03: **Workspace Architecture Split** - Created WORKSPACE_ARCHITECTURE.md, reduced guide to 370 lines, added three reference mechanisms for architecture doc
- 2025-11-01: **Security Git Integration Guide** - Added SECURITY-GIT-INTEGRATION-GUIDE.md to Quick Lookup, documented active pre-commit hook integration
- 2025-10-30: **Parallel Sub-Agent Execution Guidance** - Added dedicated section on when/how to deploy sub-agents, updated MCP descriptions to be action-oriented, added agent-coordinator MCP listing
- 2025-10-29: **Automatic Parallelization Analysis** - Added parallelization-mcp v1.0.1, documented workflow-orchestrator ParallelizationAnalyzer integration in project-management and task-executor MCPs
- 2025-10-29: **MCP Integration Architecture** - Added workflow-orchestrator integration, updated spec-driven v0.2.0, task-executor v2.0.0, project-management v1.0.0 with orchestration patterns
- 2025-10-26: **Token optimization** - Reduced from 534→348 lines (35% reduction), preserved all functionality
- 2025-10-26: Time Estimation Standards - AI-assisted dev time (not human-only)
- 2025-10-26: Project Structure Templates added (8-folder system with EVENT_LOG, NEXT_STEPS, TROUBLESHOOTING)
- 2025-10-26: MCP Server System v2.0 - unified 5 guides into START_HERE.md
- 2025-10-26: Added 5 missing MCPs (project-management, arc-decision, communications, learning-optimizer, workspace-index)
- 2025-10-25: Task-executor MCP primary task tool (replaced TodoWrite)
