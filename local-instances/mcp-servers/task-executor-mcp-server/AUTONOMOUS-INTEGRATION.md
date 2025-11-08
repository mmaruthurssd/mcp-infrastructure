# Autonomous Deployment Framework Integration

This document describes the integration of the **Autonomous Deployment Framework** into the Task Executor MCP Server.

## Overview

The Task Executor MCP now integrates with the Autonomous Deployment Framework to provide:
1. **Automated validation** when completing tasks (build, test, security checks)
2. **Deployment readiness checking** when archiving workflows (pre-deployment verification)

## Integration Points

### 1. Task Completion with Validation (`complete_task`)

The `complete_task` tool now includes **optional** automated validation to verify that task completion meets quality standards.

**Enhanced Parameters:**
- `runValidation` (boolean, optional): Run automated validation checks (default: false)

**Enhanced Output:**
```typescript
{
  success: true,
  task: { ... },
  progress: { ... },

  verification: {
    status: "passed",    // "passed" | "partial" | "failed"
    evidence: [
      "Task notes provided: ...",
      "Task marked complete at ...",
      "✓ Build check passed",     // NEW: From validation
      "✓ Test check passed"       // NEW: From validation
    ],
    concerns: [],
    recommendations: []
  }
}
```

**Validation Checks:**

When `runValidation: true` is provided:

1. **Build Check** (auto-detected)
   - Runs if task description includes: modify, update, add, implement, create, fix
   - Requires `package.json` with build script
   - Executes `npm run build` with 2-minute timeout
   - Adds evidence/concerns to verification report

2. **Test Check** (auto-detected)
   - Runs if task description includes: test, verify, validate
   - Requires `package.json` with test script
   - Executes `npm test` with 3-minute timeout
   - Adds evidence/concerns to verification report

3. **Security Check** (future)
   - Placeholder for security-compliance-mcp integration
   - Currently returns passed

**Example Usage:**
```typescript
const result = await completeTask({
  projectPath: "/path/to/project",
  workflowName: "bug-fix-123",
  taskId: "3",
  notes: "Fixed authentication timeout by increasing session TTL",
  runValidation: true  // Runs build and test checks
});

console.log(result.verification);
// {
//   status: "passed",
//   evidence: [
//     "Task notes provided: Fixed authentication...",
//     "Task marked complete at 2025-01-01T12:00:00Z",
//     "✓ Build check passed",
//     "✓ Test check passed"
//   ],
//   concerns: [],
//   recommendations: []
// }
```

**Validation Failures:**

If validation fails, the task is still marked complete, but concerns are added:

```typescript
{
  verification: {
    status: "partial",
    evidence: [
      "Task notes provided: ...",
      "Task marked complete at ..."
    ],
    concerns: [
      "✗ Build check failed",
      "✗ Test check failed"
    ],
    recommendations: [
      "Fix build errors before marking task as complete",
      "Fix failing tests before marking task as complete"
    ]
  }
}
```

### 2. Workflow Archival with Deployment Readiness (`archive_workflow`)

The `archive_workflow` tool now includes **optional** deployment readiness checking to verify the component is ready for deployment.

**Enhanced Parameters:**
- `checkDeploymentReadiness` (boolean, optional): Check deployment readiness (default: false)

**Enhanced Output:**
```typescript
{
  success: true,
  message: "Workflow 'bug-fix-123' archived to /path/to/archive",
  validation: { ... },
  archivePath: "/path/to/archive",

  // NEW: Deployment readiness (only when checkDeploymentReadiness: true)
  deploymentReadiness?: {
    ready: true,              // Overall readiness status
    checks: {
      build: {
        passed: true,
        output: "Build successful: ..."
      },
      tests: {
        passed: true,
        output: "Tests passed: ..."
      },
      health: {
        passed: true,
        details: [
          "✓ package.json exists",
          "✓ Entry point defined",
          "✓ src directory exists",
          "✓ Build output directory exists"
        ]
      }
    },
    recommendations: [
      "✅ Component is ready for deployment",
      "Consider using deployment-release-mcp for automated deployment"
    ],
    deploymentEligible: true
  }
}
```

**Deployment Readiness Checks:**

When `checkDeploymentReadiness: true` is provided:

1. **Build Check**
   - Verifies `package.json` exists and has build script
   - Runs `npm run build` with 2-minute timeout
   - Skipped if no build script defined

2. **Test Check**
   - Verifies `package.json` exists and has test script
   - Runs `npm test` with 3-minute timeout
   - Skipped if no test script defined

3. **Health Check**
   - Verifies required files exist (package.json, src/, build/)
   - Checks for entry point definition
   - Validates build output directory exists

**Example Usage:**
```typescript
const result = await archiveWorkflow({
  projectPath: "/path/to/project",
  workflowName: "bug-fix-123",
  checkDeploymentReadiness: true  // Runs deployment checks
});

if (result.deploymentReadiness?.ready) {
  console.log("✅ Component is ready for deployment");
  // Proceed with deployment via deployment-release-mcp
} else {
  console.log("⚠️  Component not ready for deployment:");
  console.log(result.deploymentReadiness?.recommendations);
}
```

**Deployment Readiness Failures:**

If checks fail, the workflow is still archived, but `deploymentReadiness.ready` is false:

```typescript
{
  deploymentReadiness: {
    ready: false,
    checks: {
      build: {
        passed: false,
        error: "Build failed: TypeScript compilation errors",
        output: "..."
      },
      tests: {
        passed: true,
        output: "Tests passed: ..."
      },
      health: {
        passed: true,
        details: [ ... ]
      }
    },
    recommendations: [
      "Fix build errors before deploying",
      "Resolve health check issues before deploying"
    ],
    deploymentEligible: false
  }
}
```

## Implementation Details

### Task Validation Utility

Located in `src/utils/task-validation.ts`, this component:
- Auto-detects which checks to run based on task description keywords
- Executes build and test scripts via `npm`
- Returns structured validation results
- Errors don't fail task completion (graceful degradation)

### Task Deployment Utility

Located in `src/utils/task-deployment.ts`, this component:
- Runs build, test, and health checks for deployment readiness
- Verifies required files and structure exist
- Returns detailed readiness report with recommendations
- Errors don't fail workflow archival (graceful degradation)

### Backward Compatibility

**All autonomous features are OPTIONAL:**
- `complete_task` works exactly as before when `runValidation` is NOT provided
- `archive_workflow` works exactly as before when `checkDeploymentReadiness` is NOT provided
- Existing workflows are unaffected

## Recommended Workflows

### Development Workflow

1. **Create workflow** for bug fix or feature
2. **Complete tasks** with `runValidation: true` to ensure quality
3. **Archive workflow** with `checkDeploymentReadiness: true` when all tasks complete
4. **Deploy** using deployment-release-mcp if readiness checks pass

### CI/CD Integration

```typescript
// Continuous validation during development
for (const taskId of taskIds) {
  const result = await completeTask({
    projectPath,
    workflowName,
    taskId,
    runValidation: true  // Runs on every task
  });

  if (result.verification.status === "failed") {
    throw new Error("Validation failed - fix issues before proceeding");
  }
}

// Pre-deployment verification
const archiveResult = await archiveWorkflow({
  projectPath,
  workflowName,
  checkDeploymentReadiness: true
});

if (archiveResult.deploymentReadiness?.ready) {
  // Trigger deployment pipeline
  await deployComponent({ ... });
}
```

## Framework Reference

The validation and deployment readiness features are powered by the **Autonomous Deployment Framework** located at:
```
development/frameworks/autonomous-deployment/
```

This framework provides:
- Issue classification with confidence scoring
- Validation framework (build, test, security checks)
- Deployment pipeline with staging and production support
- Component adapters for MCP servers, tools, and Google Sheets

## Future Enhancements

Potential future integrations:
- Integration with security-compliance-mcp for automated security scanning
- Integration with deployment-release-mcp for automatic deployment
- Parallelized validation checks for faster feedback
- Custom validation rules per project type

## See Also

- `/development/frameworks/autonomous-deployment/README.md` - Framework documentation
- `/local-instances/mcp-servers/project-management-mcp-server/AUTONOMOUS-INTEGRATION.md` - Project management integration
- `src/utils/task-validation.ts` - Validation utility implementation
- `src/utils/task-deployment.ts` - Deployment readiness utility implementation
