---
type: reference
tags: [api, documentation, mcp-tools]
---

# Checklist Manager MCP - API Reference

**Version:** 0.1.0
**Last Updated:** 2025-11-01
**Status:** Phase 2 Complete

This document provides comprehensive API documentation for all 10 Checklist Manager MCP tools.

---

## Table of Contents

### Phase 1 - Core Infrastructure
1. [register_checklist](#register_checklist)
2. [get_checklist_status](#get_checklist_status)
3. [update_checklist_item](#update_checklist_item)

### Phase 2 - Advanced Features
4. [validate_checklist_compliance](#validate_checklist_compliance)
5. [generate_progress_report](#generate_progress_report)
6. [detect_stale_checklists](#detect_stale_checklists)
7. [suggest_consolidation](#suggest_consolidation)
8. [enforce_dependencies](#enforce_dependencies)
9. [create_from_template](#create_from_template)
10. [archive_checklist](#archive_checklist)

---

## Phase 1 - Core Infrastructure

### register_checklist

Register a new checklist in the central registry with metadata extraction and auto-scanning.

**Parameters:**
- `path` (string, required): Absolute path to checklist markdown file
- `metadata` (object, optional): Metadata to override auto-extracted values
  - `name` (string): Checklist name
  - `version` (string): Version number
  - `owner` (string): Owner/responsible party
  - `project` (string): Associated project
  - `tags` (array of strings): Classification tags
- `enforcement` (object, optional): Enforcement configuration
  - `level` (enum): `"mandatory"` | `"recommended"` | `"optional"`
  - `dependencies` (array of strings): Prerequisite checklist IDs
- `autoScan` (boolean, optional): Auto-detect checkbox item count (default: `true`)

**Returns:**
```json
{
  "success": true,
  "checklistId": "checklist-abc123",
  "entry": {
    "id": "checklist-abc123",
    "type": "checklist",
    "path": "/path/to/checklist.md",
    "metadata": {
      "name": "MCP Rollout Checklist",
      "version": "1.0",
      "owner": "Infrastructure Team"
    },
    "items": {
      "total": 45,
      "completed": 12,
      "percentage": 27
    },
    "created": "2025-11-01T08:00:00.000Z",
    "lastUpdated": "2025-11-01T08:00:00.000Z"
  },
  "message": "Checklist registered successfully"
}
```

**Example Usage:**
```javascript
const result = await mcp.tools.register_checklist({
  path: "/workspace/checklists/deployment-checklist.md",
  metadata: {
    name: "Production Deployment Checklist",
    owner: "DevOps Team",
    tags: ["deployment", "production"]
  },
  enforcement: {
    level: "mandatory",
    dependencies: ["testing-checklist-001"]
  }
});
```

---

### get_checklist_status

Get current completion status of a checklist with real-time parsing and progress calculation.

**Parameters:**
- `id` (string, optional): Checklist ID (if registered)
- `path` (string, optional): Or direct path to checklist markdown file
- `includeItems` (boolean, optional): Include individual item details (default: `false`)
- `includeSections` (boolean, optional): Include section breakdown (default: `true`)

**Note:** Must provide either `id` or `path`.

**Returns:**
```json
{
  "success": true,
  "checklist": {
    "id": "checklist-abc123",
    "metadata": {
      "name": "MCP Rollout Checklist"
    },
    "items": {
      "total": 45,
      "completed": 28,
      "percentage": 62,
      "sections": [
        {
          "name": "Pre-Development",
          "total": 5,
          "completed": 5,
          "percentage": 100
        },
        {
          "name": "Testing",
          "total": 10,
          "completed": 6,
          "percentage": 60
        }
      ]
    }
  },
  "formatted": "# MCP Rollout Checklist\n**Progress**: 28/45 (62%)\n\n## Sections\n..."
}
```

**Example Usage:**
```javascript
// Get status by ID
const status = await mcp.tools.get_checklist_status({
  id: "checklist-abc123",
  includeSections: true
});

// Get status by path (unregistered)
const status = await mcp.tools.get_checklist_status({
  path: "/path/to/checklist.md",
  includeItems: true
});
```

---

### update_checklist_item

Update checkbox state in markdown file with dry-run preview and safe atomic writes.

**Parameters:**
- `id` (string, required): Checklist ID
- `itemIndex` (number, optional): Index of item to update (0-based)
- `itemText` (string, optional): Or search by item text
- `completed` (boolean, required): New checkbox state
- `dryRun` (boolean, optional): Preview changes only (default: `false`)
- `addTimestamp` (boolean, optional): Append timestamp to item (default: `false`)
- `addSignature` (string, optional): Append signature (e.g., "✓ by Claude")

**Note:** Must provide either `itemIndex` or `itemText`.

**Returns:**
```json
{
  "success": true,
  "updated": true,
  "changes": [
    {
      "lineNumber": 42,
      "before": "- [ ] Deploy to production",
      "after": "- [x] Deploy to production ✓ 2025-11-01 by DevOps"
    }
  ],
  "newStatus": {
    "total": 45,
    "completed": 29,
    "percentage": 64
  },
  "message": "Updated 1 item in checklist"
}
```

**Example Usage:**
```javascript
// Update by index
const result = await mcp.tools.update_checklist_item({
  id: "checklist-abc123",
  itemIndex: 5,
  completed: true,
  addTimestamp: true,
  addSignature: "✓ by Claude"
});

// Update by text search
const result = await mcp.tools.update_checklist_item({
  id: "checklist-abc123",
  itemText: "Deploy to production",
  completed: true
});

// Dry run (preview only)
const preview = await mcp.tools.update_checklist_item({
  id: "checklist-abc123",
  itemIndex: 10,
  completed: true,
  dryRun: true
});
```

---

## Phase 2 - Advanced Features

### validate_checklist_compliance

Validate checklist compliance by checking mandatory items, dependencies, and stale status.

**Parameters:**
- `id` (string, required): Checklist ID
- `enforceDependencies` (boolean, optional): Check prerequisite checklists (default: `true`)
- `strictMode` (boolean, optional): Fail on any incomplete items (default: `false`)

**Returns:**
```json
{
  "success": true,
  "compliant": false,
  "violations": [
    "Mandatory item incomplete: 'Unit tests passing (80%+ coverage)'",
    "Dependency 'testing-checklist-001' is incomplete (75% complete)"
  ],
  "summary": {
    "totalItems": 45,
    "completedItems": 28,
    "mandatoryItems": 12,
    "mandatoryCompleted": 10,
    "dependenciesSatisfied": false
  },
  "message": "2 compliance violations detected"
}
```

**Example Usage:**
```javascript
// Standard compliance check
const result = await mcp.tools.validate_checklist_compliance({
  id: "deployment-checklist",
  enforceDependencies: true
});

if (!result.compliant) {
  console.log("Violations:", result.violations);
}

// Strict mode (require 100% completion)
const strictResult = await mcp.tools.validate_checklist_compliance({
  id: "pre-deployment-checklist",
  strictMode: true
});
```

---

### generate_progress_report

Generate comprehensive progress reports with velocity metrics and blocked item detection.

**Parameters:**
- `checklistIds` (array of strings, optional): Specific checklists (default: all active)
- `format` (enum, optional): `"text"` | `"markdown"` | `"json"` (default: `"markdown"`)
- `includeVelocity` (boolean, optional): Calculate completion rate (default: `true`)
- `includeBlocked` (boolean, optional): Identify blocked items (default: `true`)

**Returns:**
```json
{
  "success": true,
  "report": "# Checklist Progress Report\n\n**Generated**: 2025-11-01T08:00:00.000Z\n\n## Summary...",
  "summary": {
    "totalChecklists": 8,
    "activeChecklists": 5,
    "completedChecklists": 3,
    "overallCompletion": 67.3,
    "velocity": 1.8
  },
  "checklists": [
    {
      "id": "checklist-001",
      "name": "MCP Deployment",
      "completion": 85,
      "itemsCompleted": 34,
      "itemsTotal": 40,
      "velocity": 2.1,
      "estimatedCompletion": "2025-11-03",
      "blocked": false
    }
  ],
  "message": "Generated progress report for 8 checklists"
}
```

**Example Usage:**
```javascript
// All checklists, markdown format
const report = await mcp.tools.generate_progress_report({
  format: "markdown",
  includeVelocity: true,
  includeBlocked: true
});

console.log(report.report);

// Specific checklists, JSON format
const jsonReport = await mcp.tools.generate_progress_report({
  checklistIds: ["checklist-001", "checklist-002"],
  format: "json"
});
```

---

### detect_stale_checklists

Identify checklists with no progress >N days and suggest actions (archive/reassign/review).

**Parameters:**
- `threshold` (number, optional): Days without progress (default: `30`)
- `notifyOwners` (boolean, optional): Send alerts via communications-mcp (default: `false`)
- `suggestActions` (boolean, optional): Recommend archive/reassign (default: `true`)

**Returns:**
```json
{
  "success": true,
  "staleChecklists": [
    {
      "id": "checklist-old",
      "name": "Q3 Deployment Checklist",
      "daysSinceUpdate": 92,
      "lastUpdate": "2025-08-01T10:00:00.000Z",
      "owner": "John Doe",
      "suggestedAction": "archive",
      "reason": "No activity for 92 days (3x threshold). Consider archiving if no longer relevant."
    }
  ],
  "count": 1,
  "formatted": "⚠️ Found 1 stale checklist\n\n🗑️ **Q3 Deployment Checklist** (checklist-old)...",
  "message": "Found 1 stale checklist (inactive >30 days)"
}
```

**Example Usage:**
```javascript
// Default 30-day threshold
const stale = await mcp.tools.detect_stale_checklists({
  suggestActions: true
});

stale.staleChecklists.forEach(checklist => {
  console.log(`${checklist.name}: ${checklist.suggestedAction}`);
});

// Custom threshold with notifications
const criticalStale = await mcp.tools.detect_stale_checklists({
  threshold: 60,
  notifyOwners: true
});
```

---

### suggest_consolidation

Find duplicate checklists using similarity analysis and suggest consolidation.

**Parameters:**
- `threshold` (number, optional): Similarity threshold 0-1 (default: `0.8`)
- `checklistIds` (array of strings, optional): Limit to specific checklists (default: all)
- `autoArchive` (boolean, optional): Auto-archive exact duplicates (default: `false`)

**Returns:**
```json
{
  "success": true,
  "duplicateGroups": [
    {
      "similarity": 0.95,
      "checklists": [
        {
          "id": "checklist-001",
          "metadata": { "name": "Deployment Checklist v1" },
          "items": { "completed": 40, "total": 45 }
        },
        {
          "id": "checklist-002",
          "metadata": { "name": "Deployment Checklist v2" },
          "items": { "completed": 30, "total": 45 }
        }
      ],
      "suggestedKeep": "checklist-002",
      "suggestedArchive": ["checklist-001"],
      "reason": "Nearly identical checklists (95% similar). Consolidate to avoid confusion and reduce maintenance overhead."
    }
  ],
  "count": 1,
  "formatted": "⚠️ Found 1 duplicate group\n\n**Group 1** (95% similar)...",
  "message": "Found 1 duplicate group (similarity ≥80%)"
}
```

**Example Usage:**
```javascript
// Find all duplicates
const duplicates = await mcp.tools.suggest_consolidation({
  threshold: 0.8
});

duplicates.duplicateGroups.forEach(group => {
  console.log(`Keep: ${group.suggestedKeep}`);
  console.log(`Archive: ${group.suggestedArchive.join(', ')}`);
});

// High precision (only very similar)
const exactDupes = await mcp.tools.suggest_consolidation({
  threshold: 0.95,
  autoArchive: false
});
```

---

### enforce_dependencies

Block operations if prerequisite checklists are incomplete.

**Parameters:**
- `checklistId` (string, required): Checklist ID
- `operation` (string, optional): Operation being blocked (for logging)
- `override` (boolean, optional): Emergency override (logged to workspace-brain)

**Returns:**
```json
{
  "success": true,
  "allowed": false,
  "unsatisfiedDependencies": [
    "testing-checklist (65% complete)",
    "security-scan-checklist (not found in registry)"
  ],
  "message": "❌ BLOCKED: 2 unsatisfied dependencies for 'Production Deployment'. Cannot proceed with 'deploy'."
}
```

**Example Usage:**
```javascript
// Check dependencies before deployment
const check = await mcp.tools.enforce_dependencies({
  checklistId: "deployment-checklist",
  operation: "deploy-to-production"
});

if (!check.allowed) {
  console.error("Deployment blocked:", check.unsatisfiedDependencies);
  return;
}

// Emergency override (logged)
const override = await mcp.tools.enforce_dependencies({
  checklistId: "deployment-checklist",
  override: true
});
```

---

### create_from_template

Create new checklist from template with variable substitution.

**Parameters:**
- `templateId` (string, required): Template name (e.g., `"rollout-checklist"`)
- `outputPath` (string, required): Where to create new checklist
- `variables` (object, required): Template placeholders
  - Key-value pairs matching `{{variable}}` patterns in template
- `autoRegister` (boolean, optional): Register after creation (default: `true`)

**Available Templates:**
- `rollout-checklist` - MCP/feature rollout
- `mcp-configuration` - MCP server setup
- `project-wrap-up` - Project completion
- `go-live` - Production go-live
- `gcp-setup` - GCP environment provisioning
- `vps-deployment` - VPS deployment

**Returns:**
```json
{
  "success": true,
  "checklistPath": "/workspace/checklists/mcp-auth-rollout.md",
  "checklistId": "checklist-xyz789",
  "message": "Checklist created from template 'rollout-checklist' and registered (ID: checklist-xyz789)"
}
```

**Example Usage:**
```javascript
// Create from rollout template
const result = await mcp.tools.create_from_template({
  templateId: "rollout-checklist",
  outputPath: "/workspace/checklists/auth-mcp-rollout.md",
  variables: {
    projectName: "Authentication MCP",
    version: "1.0.0",
    owner: "Security Team",
    targetDate: "2025-12-01",
    coverageTarget: "85",
    date: "2025-11-01"
  },
  autoRegister: true
});

// Create VPS deployment checklist
const vpsChecklist = await mcp.tools.create_from_template({
  templateId: "vps-deployment",
  outputPath: "/workspace/deployment-checklist.md",
  variables: {
    applicationName: "API Server",
    vpsProvider: "DigitalOcean",
    serverIP: "192.168.1.100",
    domain: "api.example.com",
    deploymentLead: "DevOps Team"
  }
});
```

---

### archive_checklist

Archive completed checklist with metadata preservation.

**Parameters:**
- `checklistId` (string, required): Checklist ID
- `outcome` (enum, required): `"completed"` | `"cancelled"` | `"superseded"`
- `notes` (string, optional): Archival notes
- `compress` (boolean, optional): Gzip compression (default: `false`)

**Returns:**
```json
{
  "success": true,
  "archivePath": "/workspace/checklists/archive/deployment-checklist-2025-11-01.md",
  "metadata": {
    "originalPath": "/workspace/checklists/deployment-checklist.md",
    "archiveDate": "2025-11-01T08:00:00.000Z",
    "outcome": "completed",
    "completionPercentage": 100,
    "timeToComplete": 14,
    "notes": "Successfully deployed to production"
  },
  "message": "Checklist 'Production Deployment' archived successfully (completed)"
}
```

**Example Usage:**
```javascript
// Archive completed checklist
const result = await mcp.tools.archive_checklist({
  checklistId: "deployment-checklist-001",
  outcome: "completed",
  notes: "All deployment tasks completed successfully. Production stable for 7 days."
});

// Archive cancelled checklist
const cancelled = await mcp.tools.archive_checklist({
  checklistId: "feature-x-checklist",
  outcome: "cancelled",
  notes: "Feature cancelled due to changed priorities"
});

// Archive superseded checklist
const superseded = await mcp.tools.archive_checklist({
  checklistId: "old-deployment-checklist",
  outcome: "superseded",
  notes: "Replaced by v2.0 deployment checklist with updated security requirements"
});
```

---

## Common Patterns

### End-to-End Workflow

```javascript
// 1. Create checklist from template
const created = await mcp.tools.create_from_template({
  templateId: "rollout-checklist",
  outputPath: "/workspace/checklists/new-feature.md",
  variables: { projectName: "New Feature", owner: "Team A" }
});

// 2. Track progress
const status = await mcp.tools.get_checklist_status({
  id: created.checklistId,
  includeSections: true
});

// 3. Update items as work completes
await mcp.tools.update_checklist_item({
  id: created.checklistId,
  itemText: "Unit tests written",
  completed: true,
  addTimestamp: true
});

// 4. Validate before deployment
const validation = await mcp.tools.validate_checklist_compliance({
  id: created.checklistId,
  enforceDependencies: true
});

if (!validation.compliant) {
  throw new Error(`Cannot deploy: ${validation.violations.join(', ')}`);
}

// 5. Archive when complete
await mcp.tools.archive_checklist({
  checklistId: created.checklistId,
  outcome: "completed",
  notes: "Feature successfully deployed"
});
```

### Progress Monitoring

```javascript
// Weekly progress report
const weeklyReport = await mcp.tools.generate_progress_report({
  format: "markdown",
  includeVelocity: true,
  includeBlocked: true
});

// Detect stale checklists
const stale = await mcp.tools.detect_stale_checklists({
  threshold: 30,
  suggestActions: true
});

// Find and consolidate duplicates
const dupes = await mcp.tools.suggest_consolidation({
  threshold: 0.85
});
```

---

## Error Handling

All tools return a consistent error structure:

```json
{
  "success": false,
  "message": "Brief error description",
  "error": "Detailed error message with context"
}
```

**Common Error Codes:**
- Validation errors (invalid parameters)
- File not found errors
- Registry errors (checklist not registered)
- Dependency errors (unsatisfied prerequisites)

**Example Error Handling:**

```javascript
try {
  const result = await mcp.tools.register_checklist({
    path: "/invalid/path.md"
  });

  if (!result.success) {
    console.error(`Error: ${result.error}`);
  }
} catch (error) {
  console.error(`Unexpected error: ${error.message}`);
}
```

---

## Performance Benchmarks

- **register_checklist**: <100ms
- **get_checklist_status**: <100ms (cached), <200ms (fresh parse)
- **update_checklist_item**: <50ms
- **validate_checklist_compliance**: <150ms
- **generate_progress_report**: <200ms (10 checklists)
- **detect_stale_checklists**: <150ms (50 checklists)
- **suggest_consolidation**: <5s (50 checklists)
- **enforce_dependencies**: <100ms
- **create_from_template**: <100ms
- **archive_checklist**: <150ms

---

## Integration Examples

### With project-management-mcp

```javascript
// Auto-create checklist when goal promoted
const goal = await project_management.promote_to_selected({
  potentialGoalFile: "new-feature.md",
  priority: "High"
});

const checklist = await checklist_manager.create_from_template({
  templateId: "rollout-checklist",
  outputPath: `/checklists/${goal.id}-checklist.md`,
  variables: {
    projectName: goal.name,
    owner: goal.owner
  }
});
```

### With workspace-brain-mcp

```javascript
// Log checklist completion
const archived = await checklist_manager.archive_checklist({
  checklistId: "deployment-001",
  outcome: "completed"
});

await workspace_brain.log_event({
  event_type: "checklist-completion",
  event_data: {
    checklistId: archived.metadata.checklistId,
    timeToComplete: archived.metadata.timeToComplete,
    outcome: archived.metadata.outcome
  }
});
```

---

**For more information:**
- [SPECIFICATION.md](../01-planning/SPECIFICATION.md) - Technical details
- [INTEGRATION-GUIDE.md](./INTEGRATION-GUIDE.md) - MCP integration patterns
- [ROLLOUT-CHECKLIST.md](./ROLLOUT-CHECKLIST.md) - Deployment guide
