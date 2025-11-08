---
type: template
tags: [integration-testing, test-templates, cross-mcp-testing, llm-testing]
---

# Integration Test Templates

**Purpose:** Ready-to-use templates for extended integration testing of MCP servers
**Audience:** MCP developers
**Usage:** Copy these templates into your MCP project's test suite

---

## Template 1: Cross-MCP Integration Test (TypeScript/Jest)

```typescript
// tests/integration/cross-mcp-integration.test.ts

import { YourMCP } from '../src';
import { DependentMCPClient } from '@modelcontextprotocol/dependent-mcp-client';

describe('Cross-MCP Integration: your-mcp + dependent-mcp', () => {

  beforeAll(async () => {
    // Setup: Initialize both MCPs
    await YourMCP.initialize();
    // Note: DependentMCP should already be running
  });

  afterAll(async () => {
    // Cleanup
    await YourMCP.cleanup();
  });

  describe('Happy Path - Successful Collaboration', () => {
    test('should work together in typical workflow', async () => {
      // Step 1: Your MCP performs its operation
      const result1 = await YourMCP.yourTool({
        input: 'test-data',
        otherParam: 'value'
      });

      expect(result1.success).toBe(true);
      expect(result1.output).toBeDefined();

      // Step 2: Dependent MCP uses your MCP's output
      const result2 = await DependentMCPClient.callTool('process_data', {
        data: result1.output
      });

      expect(result2.success).toBe(true);

      // Step 3: Verify final state is consistent
      const finalState = await YourMCP.getState();
      expect(finalState.processedBy).toContain('dependent-mcp');
    });

    test('should maintain state consistency across MCP calls', async () => {
      // Start a workflow
      const workflowId = await YourMCP.startWorkflow({ name: 'test-workflow' });

      // Call dependent MCP mid-workflow
      await DependentMCPClient.callTool('validate_workflow', {
        workflowId
      });

      // Complete workflow in your MCP
      await YourMCP.completeWorkflow({ workflowId });

      // Verify state is still consistent
      const workflow = await YourMCP.getWorkflow({ workflowId });
      expect(workflow.status).toBe('completed');
      expect(workflow.validatedBy).toBe('dependent-mcp');
    });
  });

  describe('Error Handling - Dependent MCP Failures', () => {
    test('should handle dependent MCP unavailable gracefully', async () => {
      // Simulate dependent MCP being unavailable
      jest.spyOn(DependentMCPClient, 'callTool')
        .mockRejectedValueOnce(new Error('MCP not available'));

      const result = await YourMCP.operationWithDependency({
        requiresDependentMCP: true
      });

      // Should not crash - should handle gracefully
      expect(result.success).toBe(false);
      expect(result.error).toContain('dependent-mcp unavailable');
      expect(result.warnings).toContain('Proceeding without dependent MCP');
      expect(result.partialResults).toBeDefined();
    });

    test('should handle dependent MCP returning invalid data', async () => {
      // Simulate dependent MCP returning malformed data
      jest.spyOn(DependentMCPClient, 'callTool')
        .mockResolvedValueOnce({ invalid: 'data' }); // Missing required fields

      const result = await YourMCP.operationWithDependency();

      // Should validate and handle bad data
      expect(result.success).toBe(false);
      expect(result.error).toContain('Invalid data from dependent-mcp');
    });

    test('should handle dependent MCP timeout', async () => {
      // Simulate timeout
      jest.spyOn(DependentMCPClient, 'callTool')
        .mockImplementationOnce(() => new Promise(resolve => {
          setTimeout(() => resolve({ success: true }), 30000); // 30s timeout
        }));

      const result = await YourMCP.operationWithDependency({ timeout: 5000 });

      // Should timeout and continue
      expect(result.success).toBe(true); // Succeeded without dependent MCP
      expect(result.warnings).toContain('dependent-mcp timed out');
    });
  });

  describe('Data Flow Integration', () => {
    test('should correctly pass data between MCPs', async () => {
      const inputData = {
        complexField: { nested: 'value' },
        arrayField: [1, 2, 3],
        stringField: 'test'
      };

      // Your MCP processes data
      const processed = await YourMCP.processData(inputData);

      // Dependent MCP receives processed data
      const validated = await DependentMCPClient.callTool('validate', {
        data: processed.output
      });

      // Verify data structure maintained
      expect(validated.data).toMatchObject({
        complexField: expect.any(Object),
        arrayField: expect.any(Array),
        stringField: expect.any(String)
      });
    });
  });

  describe('Concurrent Operations', () => {
    test('should handle both MCPs operating on same resource', async () => {
      const testFile = 'test-file.txt';

      // Both MCPs try to access same file simultaneously
      const [result1, result2] = await Promise.all([
        YourMCP.operateOnFile({ filePath: testFile }),
        DependentMCPClient.callTool('analyze_file', { filePath: testFile })
      ]);

      // Both should succeed without conflicts
      expect(result1.success).toBe(true);
      expect(result2.success).toBe(true);
    });
  });
});
```

---

## Template 2: LLM Integration Testing Log (Manual Testing)

```markdown
# LLM Integration Test Log: [Your MCP Name]

**MCP Version:** v[X.Y.Z]
**Test Date:** YYYY-MM-DD
**Tested By:** [Your Name]
**Claude Code Version:** [Version]
**Environment:** [dev-instance / production]

---

## Test Summary

**Total Tests:** [Number]
**Passed:** [Number]
**Failed:** [Number]
**Pass Rate:** [Percentage]%

---

## Tool 1: [tool_name]

### Test 1.1: Direct Request - Explicit Tool Call

**User Prompt:**
```
"[Type the exact prompt the user would say]"
```

**Expected Behavior:**
- Tool called: `your-mcp.tool_name`
- Parameters: `{ param1: "value1", param2: "value2" }`
- Result: [Brief description of expected result]

**Actual Behavior:**
- ✅ Tool called: `your-mcp.tool_name`
- ✅ Parameters: `{ param1: "value1", param2: "value2" }`
- ✅ Result: [What actually happened]

**Pass:** ✅

**Notes:** [Any observations about how well Claude understood the request]

---

### Test 1.2: Inferred Usage - Implicit Need

**User Prompt:**
```
"[Prompt that doesn't explicitly mention the tool but should trigger it]"
```

**Expected Behavior:**
- Tool should be called even though not explicitly mentioned
- Claude should infer the need based on context
- Parameters should be inferred from prompt

**Actual Behavior:**
- ✅/❌ Tool called: [Actual tool]
- ✅/❌ Parameters: [Actual parameters]
- ✅/❌ Inference quality: [How well did Claude infer the need?]

**Pass:** ✅/❌

**Notes:**

---

### Test 1.3: Multi-Turn Conversation - State Continuity

**Turn 1:**
```
User: "[First prompt]"
Expected: [What should happen]
Actual: [What did happen]
```

**Turn 2:**
```
User: "[Follow-up prompt referencing previous turn]"
Expected: [Claude should remember context from Turn 1]
Actual: [Did it remember? Was state maintained?]
```

**Turn 3:**
```
User: "[Final prompt completing the workflow]"
Expected: [Complete workflow based on all previous turns]
Actual: [Did it work end-to-end?]
```

**Pass:** ✅/❌

**State Continuity:** ✅/❌ [Was context maintained across turns?]

**Notes:**

---

### Test 1.4: Ambiguous Request - Clarification

**User Prompt:**
```
"[Intentionally ambiguous prompt]"
```

**Expected Behavior:**
- Claude should recognize ambiguity
- Should either ask clarifying questions OR
- Make reasonable assumptions and inform user

**Actual Behavior:**
- ✅/❌ Ambiguity recognized
- ✅/❌ Clarification requested / Assumptions stated
- ✅/❌ User informed of assumptions

**Pass:** ✅/❌

**Notes:**

---

### Test 1.5: Error Scenario - Graceful Handling

**User Prompt:**
```
"[Prompt that will cause an error - e.g., invalid input]"
```

**Expected Behavior:**
- Tool called with invalid input
- Error returned by tool
- Claude explains error to user clearly
- Claude suggests fix or alternative

**Actual Behavior:**
- ✅/❌ Error handled gracefully
- ✅/❌ Error message clear to user
- ✅/❌ Suggestions provided

**Pass:** ✅/❌

**Error Message Quality:** [Rate the user-friendliness of the error]

**Notes:**

---

## Tool 2: [second_tool_name]

[Repeat template for each tool...]

---

## Cross-Tool Workflow Tests

### Workflow Test 1: [Workflow Name]

**Scenario:** [Describe the complete workflow]

**Steps:**
1. Tool A called with X
2. Tool B uses result from Tool A
3. Tool C completes the workflow

**User Prompts:**
```
Turn 1: "[Prompt 1]"
Turn 2: "[Prompt 2]"
Turn 3: "[Prompt 3]"
```

**Results:**
- ✅/❌ All tools called correctly
- ✅/❌ Data flowed between tools
- ✅/❌ Workflow completed successfully

**Pass:** ✅/❌

**Notes:**

---

## Issues Identified

### Issue 1: [Issue Title]
**Severity:** High / Medium / Low
**Tool:** [Tool name]
**Problem:** [Describe the problem]
**Root Cause:** [Why did this happen?]
**Fix Required:** [What needs to change?]

### Issue 2: [Issue Title]
[Repeat...]

---

## Recommendations

1. **Tool Descriptions:** [Improvements needed in tool descriptions]
2. **Parameter Naming:** [Better parameter names]
3. **Error Messages:** [Clearer error messages]
4. **Examples:** [More examples needed]

---

## Overall Assessment

**Readiness for Production:** ✅ Ready / ⚠️ Minor Fixes Needed / ❌ Major Fixes Needed

**Key Strengths:**
- [What worked really well]
- [What worked really well]

**Key Weaknesses:**
- [What needs improvement]
- [What needs improvement]

**Next Steps:**
1. [Action item]
2. [Action item]
3. [Action item]

---

**Test Completed:** YYYY-MM-DD
**Signed Off By:** [Name]
```

---

## Template 3: End-to-End Workflow Test

```typescript
// tests/integration/e2e-workflow.test.ts

describe('E2E Workflow: [Workflow Name]', () => {

  test('Complete user journey from start to finish', async () => {
    // This test simulates a real user workflow
    // that involves your MCP and potentially others

    // Step 1: Project Setup
    const projectSetup = await ProjectManagementMCP.createProject({
      name: 'test-project',
      type: 'software'
    });
    expect(projectSetup.success).toBe(true);

    // Step 2: Create Specification (using your MCP or spec-driven)
    const spec = await YourMCP.createSpecification({
      projectId: projectSetup.projectId,
      type: 'feature',
      description: 'Test feature'
    });
    expect(spec.success).toBe(true);

    // Step 3: Create Tasks
    const tasks = await TaskExecutorMCP.createWorkflow({
      name: 'implement-feature',
      projectPath: projectSetup.path,
      tasks: spec.generatedTasks
    });
    expect(tasks.success).toBe(true);

    // Step 4: Use Your MCP's Main Functionality
    const result = await YourMCP.performMainOperation({
      context: {
        projectId: projectSetup.projectId,
        specId: spec.id,
        workflowId: tasks.workflowId
      }
    });
    expect(result.success).toBe(true);

    // Step 5: Run Tests (using testing-validation-mcp)
    const testResults = await TestingValidationMCP.runTests({
      projectPath: projectSetup.path,
      testType: 'integration'
    });
    expect(testResults.allPassed).toBe(true);

    // Step 6: Security Scan (using security-compliance-mcp)
    const securityScan = await SecurityComplianceMCP.scan({
      path: projectSetup.path,
      mode: 'comprehensive'
    });
    expect(securityScan.violations).toHaveLength(0);

    // Step 7: Complete Workflow
    const completion = await TaskExecutorMCP.completeWorkflow({
      workflowId: tasks.workflowId
    });
    expect(completion.success).toBe(true);

    // Verify: Check final state across all systems
    const projectState = await ProjectManagementMCP.getProjectState({
      projectId: projectSetup.projectId
    });
    expect(projectState.status).toBe('completed');
    expect(projectState.workflowsCompleted).toContain(tasks.workflowId);
  });

  test('Workflow handles interruption and resumption', async () => {
    // Start workflow
    const workflow = await YourMCP.startLongRunningOperation({
      estimatedDuration: '5 minutes'
    });

    // Simulate interruption after partial completion
    await new Promise(resolve => setTimeout(resolve, 2000)); // Wait 2s

    const interruptedState = await YourMCP.getOperationState({
      operationId: workflow.id
    });
    expect(interruptedState.percentComplete).toBeGreaterThan(0);
    expect(interruptedState.percentComplete).toBeLessThan(100);

    // Resume operation
    const resumed = await YourMCP.resumeOperation({
      operationId: workflow.id
    });
    expect(resumed.success).toBe(true);
    expect(resumed.resumedFrom).toBe(interruptedState.percentComplete);

    // Wait for completion
    await YourMCP.waitForCompletion({ operationId: workflow.id });

    // Verify completion
    const finalState = await YourMCP.getOperationState({
      operationId: workflow.id
    });
    expect(finalState.percentComplete).toBe(100);
    expect(finalState.status).toBe('completed');
  });

  test('Workflow handles partial failure and recovery', async () => {
    // Start multi-step workflow
    const workflow = await YourMCP.startMultiStepWorkflow({
      steps: ['step1', 'step2', 'step3', 'step4']
    });

    // Artificially cause step 3 to fail
    jest.spyOn(YourMCP, '_executeStep3')
      .mockRejectedValueOnce(new Error('Simulated failure'));

    // Execute workflow
    const result = await YourMCP.executeWorkflow({ workflowId: workflow.id });

    // Should have partial results
    expect(result.completedSteps).toEqual(['step1', 'step2']);
    expect(result.failedStep).toBe('step3');
    expect(result.status).toBe('partial-failure');

    // State should not be corrupted
    const state = await YourMCP.getWorkflowState({ workflowId: workflow.id });
    expect(state.step1Results).toBeDefined();
    expect(state.step2Results).toBeDefined();
    expect(state.step3Results).toBeUndefined();

    // Should be able to retry from step 3
    jest.restoreAllMocks(); // Remove the mock

    const retry = await YourMCP.retryFromStep({
      workflowId: workflow.id,
      fromStep: 'step3'
    });
    expect(retry.success).toBe(true);
    expect(retry.completedSteps).toEqual(['step1', 'step2', 'step3', 'step4']);
  });
});
```

---

## Template 4: Performance & Load Testing

```typescript
// tests/integration/performance.test.ts

describe('Performance & Load Testing', () => {

  test('should handle multiple MCPs loaded simultaneously', async () => {
    // Load multiple MCPs
    const mcps = [
      'project-management-mcp',
      'spec-driven-mcp',
      'task-executor-mcp',
      'security-compliance-mcp',
      'testing-validation-mcp',
      'your-mcp',
      // ... load 5-10 MCPs
    ];

    // Measure performance with all MCPs loaded
    const startTime = Date.now();

    const result = await YourMCP.performOperation({
      input: 'test-data'
    });

    const duration = Date.now() - startTime;

    // Should complete within acceptable time even with many MCPs loaded
    expect(duration).toBeLessThan(5000); // 5 seconds
    expect(result.success).toBe(true);
  });

  test('should maintain performance across multiple sequential calls', async () => {
    const iterations = 10;
    const durations: number[] = [];

    for (let i = 0; i < iterations; i++) {
      const startTime = Date.now();

      await YourMCP.performOperation({ iteration: i });

      durations.push(Date.now() - startTime);
    }

    // Calculate statistics
    const avgDuration = durations.reduce((a, b) => a + b) / durations.length;
    const maxDuration = Math.max(...durations);
    const minDuration = Math.min(...durations);

    // Performance should be consistent (no degradation)
    expect(maxDuration).toBeLessThan(avgDuration * 1.5); // Max within 50% of average
    expect(minDuration).toBeGreaterThan(avgDuration * 0.5); // Min within 50% of average

    // No memory leaks
    const memoryUsage = process.memoryUsage().heapUsed;
    expect(memoryUsage).toBeLessThan(100 * 1024 * 1024); // Less than 100MB
  });

  test('should handle large data sets efficiently', async () => {
    const largeDataset = Array(10000).fill(null).map((_, i) => ({
      id: i,
      data: `test-data-${i}`,
      nested: { value: i * 2 }
    }));

    const startTime = Date.now();

    const result = await YourMCP.processLargeDataset({
      data: largeDataset
    });

    const duration = Date.now() - startTime;

    // Should complete within reasonable time
    expect(duration).toBeLessThan(30000); // 30 seconds for 10k items
    expect(result.processedCount).toBe(10000);
  });
});
```

---

## Template 5: Integration Test Checklist

```markdown
# Integration Testing Checklist: [Your MCP Name]

**Version:** v[X.Y.Z]
**Date:** YYYY-MM-DD
**Tester:** [Name]
**Environment:** [dev-instance / staging / production]

---

## Part 1: Cross-MCP Integration Testing

### Direct Dependencies
- [ ] Tested with [Dependent MCP 1]
  - [ ] Happy path working
  - [ ] Error handling tested
  - [ ] State synchronization verified
- [ ] Tested with [Dependent MCP 2]
  - [ ] Happy path working
  - [ ] Error handling tested
  - [ ] State synchronization verified

### Common Workflow Combinations
- [ ] Workflow 1: [Name] - [MCP A + Your MCP + MCP B]
- [ ] Workflow 2: [Name] - [MCP C + Your MCP]
- [ ] Workflow 3: [Name] - [Your MCP + MCP D + MCP E]

### Integration Matrix
- [ ] Tested with Core Workflow MCPs (project-management, spec-driven, task-executor)
- [ ] Tested with Operational MCPs (git-assistant, smart-file-organizer)
- [ ] Tested with Advisory MCPs (learning-optimizer, arc-decision)
- [ ] Tested with Infrastructure MCPs (mcp-config-manager)

---

## Part 2: LLM Integration Testing

### Tool Discoverability
- [ ] Tool names are clear and intuitive
- [ ] Tool descriptions accurately convey purpose
- [ ] Parameter descriptions are unambiguous
- [ ] Examples provided in documentation

### Prompt-Driven Behavior
- [ ] Tested 5+ realistic user prompts
- [ ] Direct requests work (explicitly naming tool)
- [ ] Inferred usage works (tool triggered by context)
- [ ] Error messages are clear to user

### Multi-Turn Conversations
- [ ] State maintains across 3+ turns
- [ ] Context preserved between tool calls
- [ ] Previous results can be referenced
- [ ] Conversation recovers from errors

### LLM Understanding
- [ ] Claude Code picks correct tool for intent
- [ ] Tool parameters inferred correctly from natural language
- [ ] Response format integrates smoothly into conversation
- [ ] Tool doesn't conflict with similar tools from other MCPs

---

## Part 3: Production Workflow Testing

### End-to-End Workflows
- [ ] Workflow 1: [Complete user journey tested]
- [ ] Workflow 2: [Complete user journey tested]
- [ ] All workflow states reachable
- [ ] Workflows can be paused/resumed

### Performance Under Load
- [ ] Acceptable performance with 5+ MCPs loaded
- [ ] No degradation over 10+ sequential calls
- [ ] Memory usage stable over extended session
- [ ] No token budget issues

### Real-World Scenarios
- [ ] Tested with actual project data (not just test fixtures)
- [ ] Edge cases from production covered
- [ ] Backward compatibility verified (if updating existing MCP)
- [ ] Migration path tested (if applicable)

### Error Recovery & Resilience
- [ ] Handles external service failures gracefully
- [ ] File system errors don't corrupt state
- [ ] Network timeouts handled appropriately
- [ ] Partial failures allow workflow continuation

---

## Results Summary

**Total Tests:** ___/___
**Passed:** ___
**Failed:** ___
**Pass Rate:** ___%

**Critical Issues:** ___ (must fix before rollout)
**Non-Critical Issues:** ___ (can fix post-rollout)

---

## Issues Found

### Issue 1: [Title]
**Severity:** High / Medium / Low
**Category:** Cross-MCP / LLM / Performance / Error Handling
**Description:** [What's wrong]
**Steps to Reproduce:**
1. [Step 1]
2. [Step 2]
3. [Step 3]
**Expected:** [What should happen]
**Actual:** [What actually happened]
**Fix Required:** [What needs to change]
**Status:** Open / In Progress / Fixed

[Repeat for each issue...]

---

## Recommendations

**Immediate Fixes Required:**
1. [Fix 1]
2. [Fix 2]

**Post-Rollout Improvements:**
1. [Improvement 1]
2. [Improvement 2]

**Documentation Updates Needed:**
1. [Doc update 1]
2. [Doc update 2]

---

## Sign-Off

**Ready for Rollout:** ☐ Yes ☐ No ☐ With Conditions

**Conditions (if applicable):**
- [Condition 1]
- [Condition 2]

**Tested By:** _______________
**Date:** _______________

**Approved By:** _______________
**Date:** _______________

**Notes:**


```

---

## Usage Instructions

### For Cross-MCP Integration Tests:
1. Copy Template 1 to your MCP's `tests/integration/` directory
2. Replace placeholders with your MCP's actual tools and dependencies
3. Run tests: `npm test -- tests/integration/cross-mcp-integration.test.ts`

### For LLM Integration Testing:
1. Copy Template 2 to a new file or Google Doc
2. Load your MCP in Claude Code
3. Manually test each prompt and record results
4. Complete the log and identify improvements needed

### For E2E Workflow Testing:
1. Copy Template 3 to your MCP's `tests/integration/` directory
2. Identify the key workflows your MCP participates in
3. Write tests for complete user journeys
4. Run tests: `npm test -- tests/integration/e2e-workflow.test.ts`

### For Performance Testing:
1. Copy Template 4 to your MCP's `tests/integration/` directory
2. Customize performance thresholds for your MCP
3. Run tests: `npm test -- tests/integration/performance.test.ts`

### For Integration Test Checklist:
1. Copy Template 5 before starting integration testing
2. Work through checklist systematically
3. Document all issues found
4. Use checklist for sign-off before rollout

---

## Best Practices

1. **Run integration tests frequently** - Don't wait until rollout
2. **Test with real MCPs loaded** - Not mocks (for realistic testing)
3. **Document failures thoroughly** - Root cause analysis helps prevent recurrence
4. **Update templates as you learn** - Improve templates based on experience
5. **Automate what you can** - Manual testing for LLM integration only

---

**Last Updated:** 2025-10-29
**Version:** 1.0
