---
type: checklist
tags: [rollout, quality-gates, production-deployment]
---

# MCP Rollout Checklist

**Purpose:** Quality gates before rolling MCP from staging to production
**Status:** Mandatory for all MCP rollouts

---

## Pre-Development Checklist

- [ ] **Specification Complete**
  - Technical design documented
  - Integration points identified
  - State management approach defined
  - Tools and APIs specified

- [ ] **Dependencies Identified**
  - workflow-orchestrator needed? (if stateful)
  - Other MCP dependencies documented
  - External library requirements listed

- [ ] **Test Plan Defined**
  - Unit test requirements
  - Integration test scenarios
  - Performance benchmarks
  - Security scanning requirements

---

## Development Phase Checklist

- [ ] **Code Complete**
  - All features implemented per specification
  - No placeholder or TODO code in critical paths
  - Error handling implemented
  - Logging added for key operations

- [ ] **Follows Standards**
  - Uses workflow-orchestrator if stateful
  - Adapter pattern implemented correctly
  - Naming conventions followed
  - Code style consistent

- [ ] **Build Successful**
  - `npm run build` completes without errors
  - No TypeScript type errors
  - All imports resolve correctly
  - dist/ folder generated

---

## Testing Phase Checklist

### Unit Testing
- [ ] **Unit Tests Written**
  - Core functionality covered
  - Edge cases tested
  - Error conditions tested
  - Test coverage >70%

- [ ] **Unit Tests Pass**
  - All unit tests passing
  - No skipped tests without justification
  - Tests run in <2 minutes

### Integration Testing
- [ ] **Integration Tests Written**
  - Tool calls tested end-to-end
  - State management tested (if applicable)
  - Cross-MCP integrations tested
  - Real workflow scenarios covered

- [ ] **Integration Tests Pass**
  - All integration tests passing
  - Tests with real file system operations
  - Tests with actual MCP tool invocations

### Performance Testing
- [ ] **Performance Benchmarks Met**
  - State operations <10ms (if stateful)
  - Tool calls complete in reasonable time
  - No memory leaks detected
  - Resource usage acceptable

### Security Testing
- [ ] **Security Scanned**
  - security-compliance-mcp scan passed
  - No credentials in code
  - No PHI in logs
  - Dependencies vulnerability-free

### Extended Integration Validation

#### Cross-MCP Testing
- [ ] **Dependent MCP Integration**
  - Tested with all directly dependent MCPs
  - State synchronization verified (if stateful)
  - Error handling across MCP boundaries tested
  - Data flow between MCPs validated

- [ ] **Common Workflow Combinations**
  - Tested with frequently used MCP pairs (e.g., project-management + spec-driven)
  - Multi-MCP workflows validated (3+ MCPs working together)
  - Tool chaining tested (output of one tool as input to another)
  - Conflict detection tested (when MCPs have overlapping functionality)

- [ ] **Integration Matrix Coverage**
  - Tested with MCPs from different layers (operational, advisory, infrastructure)
  - Both synchronous and asynchronous interactions tested
  - Timeout and retry logic verified
  - Resource contention scenarios tested

#### LLM (Claude Code) Integration Testing
- [ ] **Tool Discoverability**
  - Tool names are clear and descriptive
  - Tool descriptions accurately convey purpose
  - Parameter descriptions are unambiguous
  - Examples provided in documentation

- [ ] **Prompt-Driven Behavior**
  - Claude Code successfully calls tools with realistic user prompts
  - Tool selection is appropriate for various user intents
  - Tools work correctly in both direct requests and inferred usage
  - Error messages are clear to both LLM and end user

- [ ] **Multi-Turn Conversations**
  - State maintains consistency across multiple turns
  - Context is preserved between tool calls
  - Previous results can be referenced in follow-up actions
  - Conversation can recover gracefully from errors

- [ ] **LLM Understanding**
  - Claude Code understands when to use this MCP vs alternatives
  - Tool parameters are correctly inferred from natural language
  - Response format is easily interpretable by LLM
  - Tool results integrate smoothly into conversation flow

#### Production Workflow Testing
- [ ] **End-to-End User Workflows**
  - Complete user journeys tested (e.g., "Create project → Spec → Build → Deploy")
  - All workflow states reachable and valid
  - Workflow can be paused and resumed
  - Incomplete workflows handle gracefully

- [ ] **Performance Under Load**
  - Acceptable performance with 5+ MCPs loaded simultaneously
  - No degradation when called multiple times in sequence
  - Memory usage remains stable over extended sessions
  - No token budget issues in typical usage

- [ ] **Real-World Scenarios**
  - Tested with actual project data (not just test fixtures)
  - Edge cases from production usage covered
  - Backward compatibility with existing workflows verified
  - Migration path from previous versions tested (if applicable)

- [ ] **Error Recovery & Resilience**
  - Graceful handling of external service failures
  - File system errors don't corrupt state
  - Network timeouts handled appropriately
  - Partial failures allow workflow continuation

---

## Documentation Checklist

- [ ] **README.md Updated**
  - MCP purpose and features described
  - Architecture documented (especially if using workflow-orchestrator)
  - Tool descriptions included
  - Integration points documented

- [ ] **API Documentation Complete**
  - All tools documented
  - Parameter descriptions clear
  - Return values documented
  - Example usage provided

- [ ] **CHANGELOG.md Updated**
  - Version number incremented
  - Changes documented
  - Breaking changes highlighted (if any)
  - Integration details noted

- [ ] **Integration Guide Written** (if complex)
  - How other MCPs should use this MCP
  - Common integration patterns
  - Troubleshooting guide

---

## Pre-Rollout Checklist

### Staging Validation
- [ ] **Tested in dev-instance**
  - All features work as expected
  - No critical bugs
  - Performance acceptable
  - Integration with other MCPs successful

- [ ] **Code Review Complete**
  - Code reviewed by peer or AI
  - Feedback addressed
  - Best practices followed
  - No obvious issues

### Dual-Environment Compliance (MANDATORY)

- [ ] **Staging Project Exists** [RULE-ARCH-001]
  - **CRITICAL:** MCP MUST have staging project in mcp-server-development/
  - **STOP:** Do NOT deploy directly to production
  - Staging project: `mcp-server-development/[mcp-name]-project/`
  - dev-instance: `04-product-under-development/dev-instance/`
  - **Automated validation:** See enforcement-rules/architecture-rules.json
  - Run validation: `./validate-dual-environment.sh [mcp-name]` (if available)
  - ✅ Validation passed: ☐ Yes ☐ No
  - If validation fails, STOP and fix issues before proceeding
  - **Prevention mechanism:** This check prevents VIOL-2025-10-30-001 recurrence

- [ ] **Production Feedback Loop Ready**
  - Issue logging location exists: `08-archive/issues/`
  - EVENT-LOG.md exists in staging project
  - NEXT-STEPS.md exists in staging project
  - README.md documents staging → production workflow
  - Production issues can be routed back to staging
  - Clear process for: Production Issue → Staging Fix → Test → Deploy

- [ ] **Build Verification in Staging**
  - Code built successfully in dev-instance/
  - `npm run build` completes without errors
  - dist/ or build/ folder generated
  - All tests pass in staging environment
  - No direct builds in production path

### Rollout Preparation
- [ ] **Production Backup**
  - Backup of current production MCP (if updating)
  - Rollback plan documented
  - Backup tested

- [ ] **Configuration Complete**
  - **MANDATORY:** Follow [MCP-CONFIGURATION-CHECKLIST.md](../MCP-CONFIGURATION-CHECKLIST.md) step-by-step
  - **STOP:** Do NOT proceed with deployment until ALL items in MCP-CONFIGURATION-CHECKLIST.md are verified
  - Configuration checklist version: _____ (record version number from checklist)
  - All 8 sections of configuration checklist completed: ☐ Yes ☐ No
  - Pre-flight checks passed (Node, npm, git, disk space, network)
  - Configuration location validated (Claude Code CLI = ~/.claude.json ONLY)
  - **CRITICAL:** Workspace .mcp.json does NOT exist (violates Claude Code CLI standards)
  - No duplicate registrations detected
  - Absolute paths used (no relative paths, no ${workspaceFolder} variables)
  - Path points to dist/server.js (compiled output)
  - Environment variables defined correctly
  - Credentials in global config ONLY (if needed)
  - No credentials in workspace config
  - JSON syntax validated with jq or JSON validator
  - Configuration backup created before changes
  - Manual registration completed (avoid mcp-config-manager if it creates workspace configs)
  - Server loads successfully in Claude Code
  - Configuration validation script passed (if available)

- [ ] **Coordination Complete**
  - Dependencies deployed first
  - Dependent MCPs notified (if breaking changes)
  - Team informed of rollout

---

## Rollout Checklist

### Deployment Steps
- [ ] **Copy to Production**
  ```bash
  cp -r staging-instances/[mcp-name]/dev-instance/ \
        /local-instances/mcp-servers/[mcp-name]/
  ```

- [ ] **Register MCP**
  ```bash
  # Use mcp-config-manager
  mcp-config-manager register_mcp_server --serverName=[mcp-name]
  ```

- [ ] **Verify Registration**
  - Check .mcp.json has correct entry
  - Verify path is correct
  - Check build artifacts exist

- [ ] **Restart Claude Code**
  - Close Claude Code
  - Reopen to load new MCP
  - Verify MCP loads successfully

### Verification
- [ ] **Smoke Tests Pass**
  - MCP tools available
  - Basic tool calls work
  - No obvious errors

- [ ] **Integration Verification**
  - Test integration with key MCPs
  - Verify workflow state (if applicable)
  - Check cross-MCP communication

---

## Post-Rollout Checklist

### Documentation Updates
- [ ] **MCP-COMPLETION-TRACKER.md Updated**
  - Status changed to Complete
  - Version documented
  - Integration status noted
  - Completion date recorded

- [ ] **Master EVENT-LOG.md Updated**
  - Rollout event logged
  - Key details documented
  - Impact noted

- [ ] **WORKSPACE_GUIDE.md Updated** (if needed)
  - New MCP added to Quick Lookup
  - MCP Servers section updated
  - Integration notes added

### Monitoring Setup
- [ ] **Issue Logging Configured**
  - Production issues log to 08-archive/issues/
  - Issue template available
  - learning-optimizer integration (if available)

- [ ] **Monitoring Active**
  - Usage tracked (if BI Analyst available)
  - Performance monitored
  - Error tracking enabled

---

## Rollback Checklist (If Needed)

If critical issues discovered after rollout:

- [ ] **Stop Using MCP**
  - Unregister from .mcp.json
  - Restart Claude Code

- [ ] **Restore Backup**
  - Copy backup back to production
  - Re-register if needed
  - Verify working

- [ ] **Document Failure**
  - Log issue to MCP project
  - Document what went wrong
  - Update troubleshooting guide

- [ ] **Plan Fix**
  - Return to dev-instance
  - Address issues
  - Re-test thoroughly
  - Attempt rollout again

---

## Sign-Off (Optional but Recommended)

**MCP Name:** _______________
**Version:** _______________
**Rollout Date:** _______________

**Checklist Completed By:** _______________
**Date:** _______________

**Approved By:** _______________
**Date:** _______________

**Verification Passed:** ☐ Yes ☐ No

**Notes:**


---

## Process Improvement Integration

This checklist is part of the **self-improving process system**:

- **Violations Tracked:** Process violations logged to `../../process-improvements/violations/`
- **Improvements Applied:** Enforcement rules automatically added to prevent recurrence
- **Effectiveness Monitored:** Track how often violations are prevented
- **System Learns:** Each violation improves the checklist and adds automated validation

**See:** `../../process-improvements/README.md` for process improvement workflow

---

**Last Updated:** 2025-10-30 (Enhanced with enforcement rule references)
**Version:** 1.1
**Next Review:** After 3 MCP rollouts
**Changes:** Added RULE-ARCH-001 reference, linked to process improvement system
