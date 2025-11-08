# Autonomous Deployment MCP Server

**Version:** 1.0.0
**Status:** ✅ Production Ready

Intelligent issue detection and resolution with learning-based pattern matching and confidence scoring.

---

## 🎯 Overview

The Autonomous Deployment MCP provides:

- **Automatic Issue Detection** - Scans error logs and matches against learned patterns
- **Confidence-Based Resolution** - Autonomous (≥95%), Assisted (70-94%), or Manual (<70%)
- **Learning System** - Improves pattern confidence based on resolution outcomes
- **Safety First** - Conservative thresholds, approval gates, daily limits
- **Pattern Management** - Add/update/delete patterns, track performance
- **Full Observability** - Statistics, performance metrics, learning data export

---

## 🚀 Quick Start

### Prerequisites

- Node.js ≥18
- TypeScript
- Registered in `~/.claude.json`

### Installation

```bash
cd local-instances/mcp-servers/autonomous-deployment-mcp-server
npm install
npm run build
```

### Registration

Already registered in `~/.claude.json` as:
```json
{
  "mcpServers": {
    "autonomous-deployment": {
      "command": "node",
      "args": [
        "/Users/mmaruthurnew/Desktop/medical-practice-workspace/local-instances/mcp-servers/autonomous-deployment-mcp-server/dist/index.js"
      ]
    }
  }
}
```

### Restart Claude Code

For the MCP to be available, restart Claude Code:
```bash
# macOS
Cmd+Q and reopen

# Or use restart slash command
/restart-vscode
```

---

## 🛠️ Available Tools (10 Total)

### Core Detection Tools

#### 1. `detect_issue`
Scan error logs and detect issues with pattern matching.

**Parameters:**
- `source` (string, optional): "error-log" | "mcp-logs" | "performance-metrics" (default: error-log)
- `limit` (number, optional): Max issues to return (default: 10)
- `minConfidence` (number, optional): Min confidence threshold 0-1 (default: 0.5)

**Returns:** Detected issues with matched patterns, confidence scores, and suggested approaches.

**Example:**
```typescript
mcp__autonomous-deployment__detect_issue({
  source: "error-log",
  limit: 5,
  minConfidence: 0.7
})
```

#### 2. `suggest_approaches`
Get ranked resolution approaches for a specific error.

**Parameters:**
- `errorMessage` (string, required): Error message to analyze
- `issueId` (string, optional): Issue ID from detect_issue
- `context` (object, optional): Additional context (component, severity, etc.)

**Returns:** Ranked list of approaches with confidence scores, steps, and estimated duration.

#### 3. `resolve_autonomously`
Execute autonomous resolution for high-confidence issues (≥95%).

**Parameters:**
- `issueId` (string, required): Issue ID to resolve
- `approachId` (string, optional): Specific approach (uses highest confidence if not provided)
- `dryRun` (boolean, optional): Simulate without executing (default: false)

**Returns:** Full resolution workflow result with all IDs and stage completion status.

**Safety Checks:**
- Confidence ≥ 0.95
- Not blocked by safety rules (production, database, PHI keywords)
- Daily autonomous limit not exceeded (default: 5)
- Requires approval if first-time pattern

### Assisted Resolution Tools

#### 4. `resolve_with_approval`
Execute assisted resolution for medium-confidence issues (70-94%).

**Parameters:**
- `issueId` (string, required): Issue ID to resolve
- `approachId` (string, required): Approved approach ID
- `approvedBy` (string, required): Name/ID of person approving

**Returns:** Resolution result with approval metadata logged.

#### 5. `record_manual_resolution`
Learn from manually-resolved issues to improve patterns.

**Parameters:**
- `errorMessage` (string, required): Original error message
- `solution` (string, required): How the issue was resolved
- `solutionSteps` (array, optional): Step-by-step resolution process
- `duration` (number, optional): Time taken (minutes)
- `outcome` (string, required): "success" | "partial" | "failed"

**Returns:** Learning insights including pattern matching and qualification status.

#### 6. `get_stats`
Get comprehensive framework statistics.

**Parameters:**
- `timeRange` (string, optional): "day" | "week" | "month" | "all" (default: week)
- `groupBy` (string, optional): "type" | "severity" | "pattern" | "none" (default: none)

**Returns:** Metrics including resolution counts, success rates, confidence scores, and top patterns.

### Pattern Management Tools

#### 7. `manage_patterns`
Add, update, delete, or list patterns in the library.

**Parameters:**
- `action` (string, required): "add" | "update" | "delete" | "list"
- `pattern` (object, optional): Pattern definition (for add/update)
- `patternId` (string, optional): Pattern ID (for update/delete)

**Returns:** Success/failure with operation details.

**Example - Add Pattern:**
```typescript
mcp__autonomous-deployment__manage_patterns({
  action: "add",
  pattern: {
    name: "Module Not Found",
    regex: "Cannot find module ['\"](.*?)['\"]",
    type: "broken",
    severity: "high",
    baseConfidence: 0.85,
    suggestedApproaches: [
      {
        id: "install-module",
        approach: "Install missing module",
        description: "Install the missing Node.js module via npm",
        steps: [
          "Extract module name from error",
          "Run npm install <module>",
          "Verify module loads"
        ],
        estimatedDuration: 1,
        confidence: 0.90
      }
    ]
  }
})
```

#### 8. `get_pattern_performance`
Analyze pattern matching accuracy and success rates.

**Parameters:**
- `patternId` (string, optional): Specific pattern (shows all if not provided)
- `minUsage` (number, optional): Min usage count to include (default: 1)
- `sortBy` (string, optional): "success-rate" | "usage-count" | "confidence" (default: success-rate)

**Returns:** Per-pattern metrics including success rate, trend analysis, and review flags.

#### 9. `adjust_thresholds`
Update confidence thresholds and safety limits.

**Parameters:**
- `autonomousThreshold` (number, optional): New threshold for autonomous (0-1)
- `assistedThreshold` (number, optional): New threshold for assisted (0-1)
- `maxAutonomousPerDay` (number, optional): Daily autonomous limit
- `dryRun` (boolean, optional): Preview changes without applying (default: false)

**Returns:** Before/after comparison with validation results.

**Example - Lower Autonomous Threshold After Week 2:**
```typescript
mcp__autonomous-deployment__adjust_thresholds({
  autonomousThreshold: 0.90,  // Lower from 0.95 to 0.90
  maxAutonomousPerDay: 10,    // Increase from 5 to 10
  dryRun: false
})
```

#### 10. `export_learning_data`
Export patterns, outcomes, and metrics for analysis.

**Parameters:**
- `format` (string, optional): "json" | "csv" (default: json)
- `includePatterns` (boolean, optional): Include pattern library (default: true)
- `includeOutcomes` (boolean, optional): Include resolution outcomes (default: true)
- `includeMetrics` (boolean, optional): Include performance metrics (default: true)
- `outputPath` (string, optional): Custom output path

**Returns:** Export file path and summary statistics.

---

## 📊 Initial Pattern Library (10 Patterns)

1. **MCP Connection Timeout** (confidence: 0.75)
2. **MCP Server Not Responding** (confidence: 0.80)
3. **TypeScript Compilation Error** (confidence: 0.70)
4. **Missing Dependency** (confidence: 0.85)
5. **Port Already in Use** (confidence: 0.90) ⭐
6. **Environment Variable Missing** (confidence: 0.85)
7. **File Not Found** (confidence: 0.75)
8. **Permission Denied** (confidence: 0.80)
9. **API Rate Limit Exceeded** (confidence: 0.70)
10. **Database Connection Failed** (confidence: 0.65) ⚠️ Requires approval

---

## 🔒 Safety Mechanisms

### Conservative Defaults

```json
{
  "autonomousThreshold": 0.95,
  "assistedThreshold": 0.70,
  "maxAutonomousPerDay": 5,
  "maxAutonomousPerHour": 2,
  "requireApprovalFirstTime": true,
  "emergencyOverrideEnabled": false
}
```

### Block Patterns

Patterns matching these keywords **never** run autonomously:
- `production`
- `database`
- `migration`
- `PHI`
- `patient`
- `delete`
- `drop`
- `truncate`

### Audit Trail

All autonomous actions logged to:
- `.ai-planning/issues/audit-log.json` (workspace)
- workspace-brain-mcp (external brain for analytics)

---

## 📈 Typical Workflow

### Week 1: Conservative Mode

**Settings:**
- Autonomous threshold: 0.95
- Max per day: 5
- Require approval: true

**Activities:**
- Monitor all detections
- Review all resolutions
- Add 5-10 new patterns
- Verify 0 false positives

### Week 2: Increase Confidence

**Adjustments:**
- Lower autonomous threshold to 0.90
- Increase max per day to 10

**Activities:**
- Continue adding patterns (target: 20+)
- Review pattern performance
- Adjust confidence based on outcomes

### Week 3: Expand Scope

**Additions:**
- Multi-step resolution patterns
- Infrastructure issue patterns
- Deployment failure patterns

### Week 4: Production Ready

**Final Settings:**
- Autonomous threshold: 0.85-0.90
- Max per day: 20
- Require approval: false (for known patterns)

---

## 🎯 Usage Examples

### Example 1: Daily Error Check

```typescript
// Check for errors
const issues = await mcp__autonomous-deployment__detect_issue({
  minConfidence: 0.70
});

// If high-confidence issue found
if (issues.content[0].text.includes("confidence: 0.9")) {
  // Try autonomous resolution
  await mcp__autonomous-deployment__resolve_autonomously({
    issueId: "issue-id-from-detection"
  });
}
```

### Example 2: Assisted Resolution

```typescript
// Get suggestions for medium-confidence issue
const approaches = await mcp__autonomous-deployment__suggest_approaches({
  errorMessage: "MCP server workspace-brain not responding"
});

// Human reviews and approves
await mcp__autonomous-deployment__resolve_with_approval({
  issueId: "issue-123",
  approachId: "restart-mcp-server",
  approvedBy: "john@example.com"
});
```

### Example 3: Learn from Manual Fix

```typescript
// After manually fixing an issue
await mcp__autonomous-deployment__record_manual_resolution({
  errorMessage: "Failed to connect to Redis cache",
  solution: "Restart Redis service and verify connection",
  solutionSteps: [
    "Check Redis service status",
    "Restart Redis: sudo systemctl restart redis",
    "Verify connection with redis-cli ping",
    "Update connection timeout in config"
  ],
  duration: 5,
  outcome: "success"
});
```

### Example 4: Weekly Review

```typescript
// Get weekly statistics
const stats = await mcp__autonomous-deployment__get_stats({
  timeRange: "week",
  groupBy: "type"
});

// Check pattern performance
const performance = await mcp__autonomous-deployment__get_pattern_performance({
  sortBy: "success-rate",
  minUsage: 3
});

// Export learning data
await mcp__autonomous-deployment__export_learning_data({
  format: "csv",
  includePatterns: true,
  includeOutcomes: true,
  includeMetrics: true
});
```

---

## 🔧 Configuration Files

### `src/data/patterns.json`
Pattern library with regex matching rules, confidence scores, and resolution approaches.

### `src/data/thresholds.json`
Confidence thresholds and safety limits (autonomous: 0.95, assisted: 0.70, max/day: 5).

### `src/data/pattern-performance.json`
Performance tracking data populated as resolutions occur (success rates, usage counts, trends).

### `.ai-planning/issues/error-log.json`
Centralized error log where MCPs log errors for autonomous detection.

### `.ai-planning/issues/audit-log.json`
Audit trail for all autonomous actions (timestamps, outcomes, rollback status).

---

## 📚 Integration with Other MCPs

Autonomous resolution workflow orchestrates multiple MCPs:

1. **project-management-mcp**: `create_potential_goal()` - Create goal for the fix
2. **spec-driven-mcp**: `sdd_guide()` - Generate specification
3. **task-executor-mcp**: `create_workflow()` - Create task workflow
4. **task-executor-mcp**: `complete_task()` - Execute each task
5. **workspace-brain-mcp**: Learning data storage and ROI tracking

---

## 📊 Success Metrics

### Operational
- Total issues detected
- Autonomous resolution rate
- Success rate by confidence bucket
- Average resolution time
- False positive rate

### Learning
- Patterns added per week
- Confidence adjustments (auto-calibration)
- Pattern qualification (eligible for autonomous)

### ROI
- API cost for resolutions
- Time saved vs manual
- Net ROI (validated target: >200x)

---

## 🚨 Troubleshooting

### Error: "No issues detected"

**Cause:** Error log is empty or no patterns match recent errors.

**Solution:**
1. Check error log exists: `.ai-planning/issues/error-log.json`
2. Verify MCPs are logging errors (workspace-brain-mcp updated)
3. Lower minConfidence threshold temporarily

### Error: "Confidence too low for autonomous resolution"

**Cause:** Issue confidence < 0.95 threshold.

**Solution:**
1. Use `suggest_approaches()` to get recommendations
2. Use `resolve_with_approval()` for assisted resolution
3. After successful resolution, pattern confidence will increase

### Error: "Daily autonomous limit exceeded"

**Cause:** Reached maxAutonomousPerDay safety limit (default: 5).

**Solution:**
1. Wait until tomorrow for auto-reset
2. Use `resolve_with_approval()` for urgent issues
3. Increase limit with `adjust_thresholds()` if Week 2+

---

## 📖 Related Documentation

- `IMPLEMENTATION-PLAN.md` - Full deployment plan (Week 1-4 roadmap)
- `development/frameworks/autonomous-deployment/PRODUCTION-READY-STATUS.md` - Original framework status
- `workspace-brain-mcp-server/COST-TRACKING-README.md` - ROI tracking integration
- `workspace-brain-mcp-server/CALIBRATION-DELIVERABLES.md` - Confidence calibration

---

## 🎉 Status

**Production Ready:** ✅
**Build Status:** 0 TypeScript errors
**MCP Registration:** Registered in ~/.claude.json as "autonomous-deployment"
**Tools Available:** 10/10
**Pattern Library:** 10 initial patterns
**Safety Checks:** All enabled

**Next Steps:**
1. Restart Claude Code to load the MCP
2. Run `detect_issue()` to verify error detection
3. Monitor first week with conservative thresholds
4. Gradually increase autonomy based on calibration

**The autonomous future is here!** 🚀

---

*Generated: November 8, 2025*
*Version: 1.0.0*
*Build: Production Ready*
