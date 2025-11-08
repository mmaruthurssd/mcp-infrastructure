# Quick Reference: Agent 1 Autonomous Detection Tools

## 🎯 Overview

Three core tools for autonomous issue detection and resolution.

---

## 📦 Tool Files

| Tool | File | Lines | Purpose |
|------|------|-------|---------|
| **detect_issue** | `src/tools/detect-issue.ts` | 248 | Scan errors, match patterns, calculate confidence |
| **suggest_approaches** | `src/tools/suggest-approaches.ts` | 202 | Rank resolution approaches by confidence |
| **resolve_autonomously** | `src/tools/resolve-autonomously.ts` | 461 | Orchestrate full autonomous resolution |

---

## 🔧 Tool Usage

### 1. detect_issue

**Purpose:** Scan error log and find resolvable issues

**Parameters:**
- `source` (optional): "error-log" | "mcp-logs" | "performance-metrics"
- `limit` (optional): Max issues to return (default: 10)
- `minConfidence` (optional): Minimum confidence 0-1 (default: 0.5)

**Returns:**
- Array of detected issues with confidence scores
- Summary statistics
- Autonomous eligibility flags

**Example:**
```json
{
  "source": "error-log",
  "limit": 5,
  "minConfidence": 0.7
}
```

---

### 2. suggest_approaches

**Purpose:** Get ranked resolution approaches for an error

**Parameters:**
- `errorMessage` (required): Error text to analyze
- `issueId` (optional): Issue ID from detect_issue
- `context` (optional): Additional context object

**Returns:**
- Ranked list of suggested approaches
- Adjusted confidence scores
- Resolution steps and estimated duration
- Recommendation (autonomous/assisted/manual)

**Example:**
```json
{
  "errorMessage": "Cannot find module '@types/node'",
  "context": {
    "component": "build-system",
    "severity": "high"
  }
}
```

---

### 3. resolve_autonomously

**Purpose:** Execute full autonomous resolution workflow

**Parameters:**
- `issueId` (required): Issue ID to resolve
- `approachId` (optional): Specific approach (uses highest confidence if not provided)
- `dryRun` (optional): Simulate without executing (default: false)

**Safety Checks:**
1. ✅ Confidence ≥ 0.95
2. ✅ No blocked keywords
3. ✅ Pattern doesn't require approval
4. ✅ Daily limit not exceeded (5/day)

**Workflow Steps:**
1. Create goal (Project Management MCP)
2. Generate spec (Spec-Driven MCP)
3. Create workflow (Task Executor MCP)
4. Execute tasks (Task Executor MCP)
5. Validate resolution
6. Record performance
7. Mark resolved

**Example:**
```json
{
  "issueId": "err-002",
  "dryRun": true
}
```

---

## 📊 Data Files

| File | Location | Purpose |
|------|----------|---------|
| **patterns.json** | `src/data/patterns.json` | Pattern library (10 initial patterns) |
| **thresholds.json** | `src/data/thresholds.json` | Safety thresholds (0.95 autonomous, 0.70 assisted) |
| **pattern-performance.json** | `src/data/pattern-performance.json` | Historical success rates |
| **error-log.json** | `.ai-planning/issues/error-log.json` | Workspace error log (7 sample errors) |

---

## 🎨 Pattern Types in Library

1. **MCP Connection Timeout** (0.75 confidence)
2. **MCP Server Not Responding** (0.80 confidence)
3. **TypeScript Compilation Error** (0.70 confidence)
4. **Missing Dependency** (0.85 confidence)
5. **Port Already in Use** (0.90 confidence)
6. **Environment Variable Missing** (0.85 confidence)
7. **File Not Found** (0.75 confidence)
8. **Permission Denied** (0.80 confidence)
9. **API Rate Limit** (0.70 confidence)
10. **Database Connection Failed** (0.65 confidence, requires approval)

---

## 🚨 Safety Features

### Blocked Keywords
Issues containing these keywords require manual resolution:
- production
- database
- migration
- PHI
- patient
- delete
- drop
- truncate

### Daily Limits
- **Max Autonomous Per Day:** 5
- **Max Autonomous Per Hour:** 2
- **Require Approval First Time:** Yes

### Confidence Thresholds
- **Autonomous:** ≥ 0.95 (95%+)
- **Assisted:** 0.70 - 0.94 (70-94%)
- **Manual:** < 0.70 (< 70%)

---

## 🧪 Testing

### Build
```bash
npm run build
# ✅ Build successful
```

### Test Script
```bash
./test-agent1-tools.sh
# Verifies all 3 tools are registered
```

### Start MCP Server
```bash
npm start
# Server ready for MCP protocol calls
```

---

## 📈 Confidence Calculation

```typescript
confidence = baseConfidence * confidenceMultiplier (if present)
confidence = confidence * 0.7 + historicalSuccessRate * 0.3
confidence = min(confidence, 1.0)
```

**Factors:**
- Pattern base confidence (from patterns.json)
- Optional confidence multiplier
- Historical success rate (70% weight on base, 30% on history)
- Capped at 1.0 (100%)

---

## 🔄 Workflow Integration

```
detect_issue
    ↓
suggest_approaches
    ↓
resolve_autonomously
    ↓
    ├─→ create_potential_goal (Project Management MCP)
    ├─→ sdd_guide (Spec-Driven MCP)
    ├─→ create_workflow (Task Executor MCP)
    ├─→ complete_task × N (Task Executor MCP)
    ├─→ validate (build, test, health)
    ├─→ record_outcome (pattern-performance.json)
    └─→ mark_resolved (error-log.json)
```

---

## 🎯 Success Criteria

- [x] All 3 tools implemented
- [x] TypeScript compilation passes
- [x] Proper MCP response format
- [x] Comprehensive error handling
- [x] Full type safety
- [x] Inline documentation
- [x] Sample data created
- [x] Test script provided

---

## 📝 Key Features

### detect_issue
- ✅ Regex pattern matching
- ✅ Confidence scoring with history
- ✅ Autonomous eligibility flags
- ✅ Summary statistics
- ✅ Sorted by confidence

### suggest_approaches
- ✅ Pattern matching
- ✅ Confidence adjustment
- ✅ Approach ranking
- ✅ Clear recommendations
- ✅ No-match guidance

### resolve_autonomously
- ✅ 4-layer safety checks
- ✅ 7-step workflow orchestration
- ✅ Dry-run mode
- ✅ Performance tracking
- ✅ Error log updates
- ✅ Mock MCP calls (ready for integration)

---

## 🚀 Quick Start

1. **Detect issues:**
   ```bash
   Call detect_issue with default params
   ```

2. **Get approaches:**
   ```bash
   Call suggest_approaches with error message
   ```

3. **Test resolution (dry-run):**
   ```bash
   Call resolve_autonomously with dryRun:true
   ```

4. **Execute resolution:**
   ```bash
   Call resolve_autonomously with dryRun:false
   ```

---

**Agent 1 Complete** ✅ | **911 total lines** | **3 tools ready**
