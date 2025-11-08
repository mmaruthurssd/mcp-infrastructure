# Changelog

All notable changes to task-executor-mcp-server will be documented in this file.

## [2.0.0] - 2025-10-29

### Changed
- **ARCHITECTURE:** Integrated workflow-orchestrator-mcp-server as library dependency
- Updated WorkflowManager to use workflow-orchestrator generic WorkflowState<T> internally
- Renamed workflow-manager.ts to workflow-manager-v2.ts with orchestrator integration
- All tools continue to work with zero API changes

### Added
- `src/types-extended.ts` - Extended types for task-executor workflow data
- `src/utils/workflow-manager-v2.ts` - Refactored manager using workflow-orchestrator (~551 lines)
- `test-integration.js` - Comprehensive integration test suite (18 tests)
- Integration with workflow-orchestrator-mcp-server v0.1.0
- Added 'passed' to VerificationStatus type enum

### Removed
- `src/utils/workflow-manager.ts` (~513 lines) - Replaced by workflow-manager-v2.ts
- Duplicate state management logic (~200 lines eliminated)

### Fixed
- Verification status now returns 'passed' instead of 'verified' for clarity
- Documentation re-detection on getStatus() to catch files added after workflow creation
- Archive timestamp format now includes time (YYYY-MM-DD-HHMMSS-)
- Progress string format now matches expected pattern: "X/Y tasks complete (Z%)"
- Error messages now include "not all tasks are completed" for better clarity
- Force archive now properly collects and returns warnings array

### Technical Details
- **Zero breaking changes** - all tool APIs remain identical
- **Full backward compatibility** - existing workflows work unchanged
- **State storage unchanged** - still in `projectPath/temp/workflows/workflowName/`
- **Type safety maintained** - TaskExecutorWorkflowState extends WorkflowState<TaskExecutorWorkflowData>
- **All 18 integration tests passing**
- **Preserved ALL task-specific logic**:
  - ComplexityAnalyzer for task scoring (1-10 scale with emoji indicators)
  - Basic verification system (evidence, concerns, recommendations)
  - Documentation detection and tracking
  - plan.md generation with detailed task status
  - Temp→Archive lifecycle with timestamped archiving

### Benefits
- Unified state management across workflow-aware MCP servers
- Reduced code duplication (~200 lines eliminated)
- Access to workflow orchestration capabilities (RuleEngine, StateDetector)
- Easier maintenance and future enhancements
- Consistent patterns with project-management-mcp-server v1.0.0 and spec-driven-mcp-server v0.2.0

## [1.0.0] - 2025-10-XX

### Added
- Initial release of task-executor MCP server
- Core workflow management (create, complete, status, archive)
- Automatic complexity analysis with 1-10 scoring
- Basic task verification (MVP)
- Temp→Archive lifecycle management
- Documentation detection and tracking
- plan.md generation for human-readable workflow plans
- Support for PHI/HIPAA compliance context
- Task constraints tracking
- Estimated hours tracking
