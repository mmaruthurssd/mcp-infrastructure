# Changelog

All notable changes to the Project Management MCP Server will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

---

## [1.0.1] - 2025-11-07

### 🐛 Bug Fixes

#### Component-Driven Framework: Critical Heading Level Bug

**Issue:** Component tools (create/update/move/split/merge/component_to_goal) all failed with "Component not found" errors.

**Root Cause:** Markdown parsing conflict in `component-manager.ts`:
- Stage sections used `###` (level 3): `### Exploring`
- Component headings ALSO used `###` (level 3): `### Patient Portal`
- The markdown parser treated ALL `###` headings as section boundaries
- Result: Components became separate sections instead of content within stage sections
- Components were created in memory but not written to/read from file properly

**Fix:**
- Changed component heading level from `###` to `####` (level 4)
- Updated serialization in `serializeComponents()` (line 522)
- Updated parsing regex in `parseComponentsFromSection()` (line 356)
- Files affected: `src/lib/component-manager.ts`, `dist/lib/component-manager.js`

**Impact:** All 6 component tools now work correctly. Components are properly serialized to and parsed from `project-overview-working.md`.

**Note:** Requires Claude Code restart to reload MCP server with fixed code.

---

## [1.0.3] - 2025-11-07

### 🐛 Bug Fixes

#### Component-Driven Framework: Parameter Mismatch in update_component

**Issue:** `update_component` tool failed with parameter validation error.

**Root Cause:** Parameter name inconsistency in `component-manager.ts`:
- Tool schema defined parameter as `name` (line 93)
- Implementation expected `componentName` (line 143)
- Result: Tool always failed with "Missing required parameter: componentName"

**Fix:**
- Updated tool implementation to use `name` parameter (matching schema)
- File affected: `src/lib/component-manager.ts` line 143
- Built at 13:17 (1:17 PM)

**Impact:** `update_component` tool now works correctly. Can update component descriptions, sub-components, priorities, dependencies, and notes.

**Testing:** Verified with Authentication System component - successfully updated description, added Session Manager sub-component, added notes field.

---

## [1.0.2] - 2025-11-07

### 🐛 Bug Fixes

#### Component-Driven Framework: Architectural Bug in addComponentToStage

**Issue:** Components created but not propagated to PROJECT_OVERVIEW.md file.

**Root Cause:** Architectural bug in `addComponentToStage` method (line 445):
- Component added to in-memory projectState
- `await this.saveProjectState()` called to save state
- But `serializeComponents()` was NEVER called to write markdown
- Result: Components existed in .ai-planning/project-state.json but not in visible PROJECT_OVERVIEW.md

**Fix:**
- Added `await this.saveProjectOverview(projectPath)` after `saveProjectState()` call (line 452)
- This ensures markdown file is regenerated after any component creation/modification
- File affected: `src/lib/component-manager.ts`
- Built at 12:18 (12:18 PM)

**Impact:** All component creation/modification operations now correctly propagate to PROJECT_OVERVIEW.md.

**Testing:** Verified with Patient Portal component - created component appeared in EXPLORING section of markdown file.

---

## [1.0.0] - 2025-10-29

### 🎉 Major Release: Workflow Orchestrator Integration

**This release extracts workflow orchestration into a reusable library, achieving clean architecture and zero code duplication.**

### Added
- **Workflow Orchestrator Integration** - Added `workflow-orchestrator-mcp-server` as library dependency
- **ARCHITECTURE.md** - Comprehensive architecture documentation explaining integration
- **CHANGELOG.md** - This file! Tracking version history going forward
- **Integration Test Suite** - `test-integration.js` for verifying workflow-orchestrator integration

### Changed
- **Updated 9 tools** to import from `workflow-orchestrator-mcp-server` instead of local utils:
  - `initialize-project-orchestration.ts`
  - `get-next-steps.ts`
  - `advance-workflow-phase.ts`
  - `get-project-status.ts`
  - `validate-project-readiness.ts`
  - `generate-completion-checklist.ts`
  - `wrap-up-project.ts`
  - `prepare-spec-handoff.ts`
  - `prepare-task-executor-handoff.ts`
- **package.json** - Updated version to 1.0.0, added workflow-orchestrator dependency
- **README.md** - Updated with v1.0.0 features, architecture diagrams, and integration details

### Removed
- **`src/utils/state-manager.ts`** (~7KB) - Now provided by workflow-orchestrator
- **`src/utils/rule-engine.ts`** (~12KB) - Now provided by workflow-orchestrator
- **`src/utils/state-detector.ts`** (~10KB) - Now provided by workflow-orchestrator
- **Total duplicate code removed:** ~28KB

### Technical Details
- **Zero Breaking Changes** - All tool APIs remain unchanged
- **100% Test Pass Rate** - All integration tests passing
- **Type Safety Maintained** - Full TypeScript type checking across boundaries
- **Performance** - No regression, direct imports maintain exceptional performance

### Migration Notes
**For users:** No action required - all tools work identically with improved architecture.

**For developers:**
- Run `npm install` to install workflow-orchestrator dependency
- Run `npm run build` to compile with new imports
- Run `node test-integration.js` to verify integration

---

## [0.9.0] - 2025-10-27

### Added - Workflow Orchestration System

**9 new orchestration tools** for intelligent workflow guidance:

#### New Tools
1. **initialize_project_orchestration** - Initialize workflow state tracking
2. **get_next_steps** - Get AI-powered suggestions with ready-to-execute tool calls
3. **get_project_status** - High-level project overview with health indicators
4. **advance_workflow_phase** - Move between workflow phases with validation
5. **validate_project_readiness** - Check project completion criteria
6. **generate_completion_checklist** - Create comprehensive pre-closure checklist
7. **wrap_up_project** - Finalize project with completion report
8. **prepare_spec_handoff** - Seamless handoff to Spec-Driven MCP
9. **prepare_task_executor_handoff** - Seamless handoff to Task Executor MCP

#### Core Components (Now in workflow-orchestrator as of v1.0.0)
- **StateManager** - Persistent state tracking in `.ai-planning/project-state.json`
- **RuleEngine** - 11 intelligent rules for workflow suggestions
- **StateDetector** - Auto-sync state with file system changes

#### Features
- ✅ Stateful workflow tracking across 4 phases (initialization, goal-development, execution, completion)
- ✅ Intelligent next-step suggestions with priority ranking
- ✅ Auto-sync with file system to prevent state drift
- ✅ MCP integration with ready-to-execute tool calls
- ✅ Completion validation with comprehensive checks
- ✅ Health monitoring and progress tracking

#### Documentation
- Added `docs/USER-GUIDE-ORCHESTRATION.md` - Complete user guide
- Added `docs/INTEGRATION-PATTERNS.md` - Integration best practices
- Added `docs/DEVELOPER-GUIDE-ORCHESTRATION.md` - Architecture and extension points

---

## [0.8.1] - 2025-10-25

### Added
- **validate_project** - Comprehensive project structure validation
- **migrate_existing_project** - Migrate projects to standardized structure
- **confirm_migration** - Execute migration with user-reviewed suggestions

### Changed
- Improved error messages for validation failures
- Enhanced migration conflict resolution

---

## [0.8.0] - 2025-10-23

### Added - Initial Release

**22 tools** for project setup and goal management:

#### Project Setup Tools (8 tools)
- `start_project_setup` - Conversational project initialization
- `continue_project_setup` - Multi-turn conversation flow
- `extract_project_goals` - Extract goals from conversation
- `generate_project_constitution` - Create project guidelines
- `generate_initial_roadmap` - Create project roadmap
- `identify_stakeholders` - Document stakeholders
- `identify_resources_and_assets` - Catalog resources
- `finalize_project_setup` - Complete setup process

#### Goal Management Tools (11 tools)
- `evaluate_goal` - Estimate impact/effort/tier for goals
- `create_potential_goal` - Create potential goal files
- `promote_to_selected` - Move goals to selected status
- `extract_ideas` - Extract actionable ideas from brainstorming
- `view_goals_dashboard` - Comprehensive goal overview
- `reorder_selected_goals` - Manage goal priorities
- `update_goal_progress` - Track goal progress
- `archive_goal` - Archive goals with retrospectives
- `check_review_needed` - Detect stale/blocked goals
- `generate_review_report` - Generate periodic reviews
- `generate_goals_diagram` - Create visual workflow diagrams

#### Migration Tools (2 tools)
- `migrate_existing_project` - Migrate to template structure
- `confirm_migration` - Execute migration plan

#### Documentation
- Initial README.md
- USER_GUIDE.md
- DEVELOPER_GUIDE.md

---

## Version Numbering

- **Major (X.0.0)**: Breaking changes or significant architectural improvements
- **Minor (0.X.0)**: New features, backward compatible
- **Patch (0.0.X)**: Bug fixes, backward compatible

---

## Links

- **Repository:** [medical-practice-workspace/local-instances/mcp-servers/project-management-mcp-server](../../project-management-mcp-server)
- **Workflow Orchestrator:** [workflow-orchestrator-mcp-server](../workflow-orchestrator-mcp-server)
- **Documentation:** [docs/](./docs/)

---

**Maintained by:** Medical Practice Workspace Team
**Last Updated:** October 29, 2025
