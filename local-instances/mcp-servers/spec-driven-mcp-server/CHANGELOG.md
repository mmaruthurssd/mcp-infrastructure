# Changelog

All notable changes to spec-driven-mcp-server will be documented in this file.

## [0.2.0] - 2025-10-29

### Changed
- **ARCHITECTURE:** Integrated workflow-orchestrator-mcp-server as library dependency
- Updated StateManager to use workflow-orchestrator generic WorkflowState<T> internally
- Created StateManager adapter that maintains backward compatibility with legacy API
- All tools continue to use original StateManager interface with zero changes

### Added
- `src/types-extended.ts` - Extended types for spec-driven workflow data
- `src/utils/state-manager-adapter.ts` - Adapter providing backward-compatible API
- `test-integration.js` - Comprehensive integration test suite (23 tests)
- Integration with workflow-orchestrator-mcp-server v0.1.0

### Removed
- `src/utils/state-manager.ts` (~158 lines) - Now provided by workflow-orchestrator
- Duplicate state management logic

### Technical Details
- **Zero breaking changes** - all tool APIs remain identical
- **Full backward compatibility** - existing workflows work unchanged
- **State storage unchanged** - still in `~/.sdd-mcp-data/workflows/`
- **Type safety maintained** - SpecDrivenWorkflowState extends WorkflowState<SpecDrivenWorkflowData>
- **All 23 integration tests passing**

### Benefits
- Unified state management across workflow-aware MCP servers
- Reduced code duplication (~158 lines eliminated)
- Access to workflow orchestration capabilities (RuleEngine, StateDetector)
- Easier maintenance and future enhancements
- Consistent patterns with project-management-mcp-server v1.0.0

## [0.1.0] - 2025-10-XX

### Added
- Initial release of spec-driven MCP server
- Interactive guided workflow for spec generation
- Support for three scenarios: new-project, existing-project, add-feature
- Constitution, specification, plan, and task document generation
- PHI/HIPAA compliance templates
- State persistence for resumable workflows
- Template-driven documentation generation
