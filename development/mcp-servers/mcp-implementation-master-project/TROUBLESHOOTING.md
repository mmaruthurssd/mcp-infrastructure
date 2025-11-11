---
type: guide
tags: [troubleshooting, common-issues, solutions]
---

# MCP Implementation Master Project - Troubleshooting

**Purpose:** Document common issues and solutions during MCP build-out
**Format:** Problem → Solution → Prevention

---

## Build Issues

### Issue: npm install fails for workflow-orchestrator dependency
**Symptom:** `Cannot find module 'workflow-orchestrator-mcp-server'`

**Solution:**
```bash
cd your-mcp-server
rm -rf node_modules package-lock.json
npm install
cd ../workflow-orchestrator-mcp-server
npm run build
cd ../your-mcp-server
npm install
```

**Prevention:** Ensure workflow-orchestrator is built before installing in dependent MCPs

---

### Issue: TypeScript build errors with WorkflowState<T>
**Symptom:** Type mismatch errors

**Solution:**
```typescript
// Problem: Not using generic correctly
const state: WorkflowState; // ❌ Missing <T>

// Solution: Specify custom data type
const state: WorkflowState<YourWorkflowData>; // ✅ Correct
```

**Prevention:** Always use WorkflowState<T> with custom data type

---

## Integration Issues

### Issue: Integration prompt execution takes longer than estimated
**Symptom:** 2-3 hour estimate becomes 4-5 hours

**Solution:**
- Break into smaller sessions
- Follow integration prompt step-by-step
- Don't skip testing phases
- Document deviations from plan

**Prevention:** Add 50% buffer to integration estimates

---

### Issue: Existing workflows break after integration
**Symptom:** Old project state files don't load

**Solution:**
- Check state serialization/deserialization
- Ensure backward compatibility in adapter
- Test with real existing workflows before rollout
- Keep backup of old state files

**Prevention:** Test backward compatibility thoroughly before rollout

---

## Rollout Issues

### Issue: MCP not loading after registration
**Symptom:** New MCP tools not available

**Solution:**
1. Verify registration: `mcp-config-manager list_mcp_servers`
2. Check .mcp.json has correct path
3. Restart Claude Code
4. Check build succeeded: `ls local-instances/mcp-servers/[mcp]/dist/`

**Prevention:** Always restart Claude Code after registration

---

### Issue: MCP shows "Failed to connect" - Missing Dependencies
**Symptom:** Server registered but shows ✗ Failed to connect in claude mcp list

**Solution:**
```bash
cd local-instances/mcp-servers/[mcp-name]
npm install
npm run build
# Test: claude mcp list
```

**Prevention:**
- Always run `npm install` after copying server to production location
- Check node_modules exists before configuration
- See Issue #002 in troubleshooting/configuration-issues.md

**Reference:** [Issue #002](troubleshooting/configuration-issues.md#issue-002-mcp-server-fails-to-connect---missing-dependencies-at-production-location)

---

### Issue: Conflicts between dev-instance and production
**Symptom:** Production MCP broken after dev changes

**Solution:**
- Never edit production MCP directly
- Always develop in dev-instance
- Test thoroughly before rollout
- Use version control (git)

**Prevention:** Strict separation of staging and production

---

## Testing Issues

### Issue: Integration tests fail in CI but pass locally
**Symptom:** Environment-specific failures

**Solution:**
- Check environment variables
- Verify file paths (absolute vs relative)
- Check Node.js version compatibility
- Review CI logs for specific errors

**Prevention:** Test in CI-like environment locally before rollout

---

## Performance Issues

### Issue: MCP operations slower than expected
**Symptom:** State read/write taking >10ms

**Solution:**
- Profile with console.time/timeEnd
- Check file system performance
- Optimize JSON serialization
- Consider caching strategy

**Prevention:** Benchmark early, set performance targets

---

## Cross-MCP Issues

### Issue: Circular dependencies between MCPs
**Symptom:** MCP A needs MCP B, MCP B needs MCP A

**Solution:**
- Redesign to break circular dependency
- Introduce coordinator MCP (orchestrator)
- Use event-driven communication
- Refactor to shared library

**Prevention:** Design integration points early, avoid tight coupling

---

### Issue: State conflicts between MCPs
**Symptom:** Two MCPs trying to manage same workflow

**Solution:**
- Clarify ownership boundaries
- Use orchestrator for coordination
- Document which MCP owns which state
- Implement conflict detection

**Prevention:** Clear ownership model from start

---

## Documentation Issues

### Issue: Documentation out of sync with code
**Symptom:** README describes features that don't exist

**Solution:**
- Update docs alongside code changes
- Check documentation in rollout checklist
- Use Documentation Generator MCP (when built)
- Regular doc audits

**Prevention:** Documentation updates mandatory in rollout checklist

---

## Common Mistakes

### 1. Skipping Testing Phase
**Problem:** Rollout to production without thorough testing
**Impact:** Production issues, user disruption
**Solution:** Always test in dev-instance first

### 2. Not Updating Completion Tracker
**Problem:** MCP-COMPLETION-TRACKER.md out of date
**Impact:** Lost track of progress, duplicate work
**Solution:** Update tracker immediately after rollout

### 3. Building Without Specification
**Problem:** Starting development without clear spec
**Impact:** Rework, scope creep, delays
**Solution:** Write specification first, then build

### 4. Ignoring Workflow Orchestrator Patterns
**Problem:** Reinventing state management
**Impact:** Duplicate code, inconsistent patterns
**Solution:** Use workflow-orchestrator for stateful MCPs

### 5. No Issue Logging
**Problem:** Production issues not captured
**Impact:** Repeat issues, no improvement
**Solution:** Log all issues to MCP project 08-archive/issues/

---

## Escalation Path

**If issue can't be resolved:**

1. **Document thoroughly**
   - What you tried
   - Error messages
   - Expected vs actual behavior

2. **Check existing resources**
   - MCP-BUILD-INTEGRATION-GUIDE.md
   - workflow-orchestrator docs
   - Similar MCP implementations

3. **Create issue in MCP project**
   - Use issue template
   - Include reproduction steps
   - Tag with severity

4. **Review with team**
   - Discuss in planning session
   - Consider architectural changes
   - Update troubleshooting guide

---

## Prevention Checklist

Before starting each MCP build:
- [ ] Specification complete and reviewed
- [ ] Dependencies identified and available
- [ ] Integration pattern selected (stateful vs stateless)
- [ ] Test plan defined
- [ ] Rollout checklist reviewed

Before each rollout:
- [ ] All tests passing
- [ ] Documentation updated
- [ ] Rollout checklist complete
- [ ] Backup of current production version
- [ ] Rollback plan documented

---

## Learning from Issues

**Process:**
1. Document issue in this file
2. Log to individual MCP project if MCP-specific
3. Update to learning-optimizer MCP (when available)
4. Update prevention strategies
5. Share learnings with team

---

**Last Updated:** 2025-10-29
**Issues Logged:** 2 (Issue #001, Issue #002)
**Next Review:** After next MCP rollout or when 3+ occurrences trigger optimization
