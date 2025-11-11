# Arc Decision MCP Server - Enhancement Log

## 2025-10-26: Workflow Pattern Detection

### Problem
The `analyze_requirements` function was missing detection for tools that combine workflow patterns with AI thinking. It would recommend "Subagent Only" even when the tool description contained clear workflow components (decision matrices, comparison tables, frameworks) that would benefit from a Skill.

### Example Case
**Description:** "Decision framework tool... includes comparison matrices, decision trees, and usage patterns..."

**Old Behavior:** → Subagent Only
**New Behavior:** → Skill + Subagent

### Solution
Added workflow pattern detection with 15 keywords:
- decision, framework, matrix, comparison, compare
- guidelines, best practices, patterns, procedures
- checklist, template, workflow, process, steps
- standards, conventions, rules, format, structure

### Implementation
Enhanced `analyze_requirements` function (server.ts lines 580-631):

1. **Pattern Detection:**
   - Scans description for workflow-related keywords
   - Sets `hasWorkflowPatterns` flag

2. **Decision Tree Logic:**
   - **No external systems + simple complexity + patterns** → `simple_skill`
   - **No external systems + moderate/complex + patterns** → `skill_with_subagent`
   - **External systems + patterns** → `skill_with_mcp` or `skill_mcp_subagent`

### Impact
- More accurate recommendations for tools with workflow components
- Better token efficiency (Skills load only when needed)
- Follows decision tree more faithfully

### Backward Compatibility
✅ Maintained - existing recommendations unchanged unless workflow patterns detected

### Testing
Verified with planning MCP selector case:
- Detected: decision, framework, comparison, patterns (4 matches)
- Expected outcome: skill_with_subagent ✓

### To Verify Improvement
Restart Claude Code to reload arc-decision MCP server, then test:
```
analyze_requirements({
  description: "Decision framework tool... comparison matrices... decision trees...",
  complexity: "moderate"
})
```

Should now recommend: **Skill + Subagent** (not Subagent Only)
