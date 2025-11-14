# Checklist Manager MCP - Integration Examples

This document shows how to integrate checklist-manager with other MCPs for automatic checklist completion.

## Integration Pattern

```typescript
// 1. Before operation: Validate compliance
const validation = await checklistManager.validate_checklist_compliance({
  operation_type: 'deployment',
  skip_enforcement: false
});

if (validation.blocking) {
  return { error: 'Blocked by mandatory checklist', violations: validation.violations };
}

// 2. Perform operation
const result = await performOperation();

// 3. After operation: Auto-update checklist
if (result.success) {
  await checklistManager.update_checklist_item({
    checklist_path: './deployment-checklist.md',
    item_text: 'Deploy to production',
    completed: true,
    triggered_by: 'deployment-release-mcp'
  });
}
```

## Example 1: Task Executor MCP Integration

**Use Case:** Auto-complete deployment checklist items as tasks finish

```typescript
// In task-executor MCP's complete_task tool

export async function complete_task(params) {
  const task = getTask(params.taskId);

  // Standard task completion logic
  markTaskComplete(task);

  // NEW: Auto-update checklist if task matches checklist item
  if (task.workflowName === 'deployment' && params.runValidation) {
    // Map task description to checklist item
    const checklistItemMap = {
      'Run unit tests': 'Run tests',
      'Build production bundle': 'Build',
      'Deploy to staging': 'Deploy staging',
      'Run smoke tests': 'Verify deployment',
    };

    const checklistItem = checklistItemMap[task.description];
    if (checklistItem) {
      try {
        await checklistManager.update_checklist_item({
          checklist_type: 'deployment',
          item_text: checklistItem,
          completed: true,
          triggered_by: 'task-executor-mcp',
          notes: `Auto-completed via task: ${task.description}`
        });
        console.log(`✅ Checklist updated: ${checklistItem}`);
      } catch (error) {
        // Non-blocking: Log but don't fail task completion
        console.warn('Failed to update checklist:', error.message);
      }
    }
  }

  return { success: true, task };
}
```

**Result:** When "Run unit tests" task completes, the "Run tests" checklist item auto-checks.

## Example 2: Deployment Release MCP Integration

**Use Case:** Block deployments until mandatory checklists complete

```typescript
// In deployment-release MCP's deploy_application tool

export async function deploy_application(params) {
  // NEW: Validate deployment checklist before deploying
  const validation = await checklistManager.validate_checklist_compliance({
    operation_type: 'deployment',
    skip_enforcement: params.environment === 'dev' // Allow dev deployments
  });

  if (validation.blocking) {
    return {
      success: false,
      blocked: true,
      message: 'Deployment blocked by mandatory checklist compliance',
      violations: validation.violations,
      help: 'Complete the following items before deploying:',
      pending_items: validation.violations[0].pending_items
    };
  }

  // Proceed with deployment
  console.log('✅ Checklist compliance validated');

  const deployment = await executeDeployment(params);

  // NEW: Auto-update checklist after successful deployment
  if (deployment.success) {
    await checklistManager.update_checklist_item({
      checklist_path: params.checklistPath,
      item_text: `Deploy to ${params.environment}`,
      completed: true,
      triggered_by: 'deployment-release-mcp',
      notes: `Deployment ID: ${deployment.id}`
    });
  }

  return deployment;
}
```

**Result:** Production deployments blocked until all mandatory checklist items complete.

## Example 3: Project Management MCP Integration

**Use Case:** Update project wrap-up checklist as goals are archived

```typescript
// In project-management MCP's archive_goal tool

export async function archive_goal(params) {
  const goal = getGoal(params.goalId);

  // Standard archival logic
  const archived = await archiveGoalToFile(goal, params.retrospective);

  // NEW: Update project wrap-up checklist
  if (archived.success && params.archiveType === 'implemented') {
    // Check if this was a high-priority goal
    if (goal.priority === 'High') {
      await checklistManager.update_checklist_item({
        checklist_type: 'cleanup',
        item_text: 'Archive completed high-priority goals',
        completed: true,
        triggered_by: 'project-management-mcp',
        notes: `Archived goal: ${goal.name}`
      });
    }

    // Update documentation checklist
    await checklistManager.update_checklist_item({
      checklist_type: 'cleanup',
      item_text: 'Update project documentation',
      completed: true,
      triggered_by: 'project-management-mcp'
    });
  }

  return archived;
}
```

**Result:** Project wrap-up checklist auto-updates as goals are archived.

## Example 4: MCP Installation Workflow

**Use Case:** Track MCP deployment checklist during rollout

```typescript
// Workflow: Deploy new MCP from dev to production

async function deployMCP(mcpName) {
  // 1. Create checklist from template
  const checklist = await checklistManager.create_from_template({
    template_path: './templates/mcp-deployment.md',
    output_path: `./checklists/${mcpName}-deployment.md`,
    variables: {
      mcp_name: mcpName,
      date: new Date().toISOString().split('T')[0],
      environment: 'production'
    },
    owner: 'DevOps',
    enforcement: 'mandatory'
  });

  // 2. Register checklist
  const registered = await checklistManager.register_checklist({
    checklist_path: checklist.output_path,
    checklist_type: 'deployment',
    enforcement: 'mandatory',
    auto_update: true
  });

  console.log(`📋 Deployment checklist created: ${registered.checklist_id}`);

  // 3. Build MCP
  console.log('🔨 Building MCP...');
  await buildMCP(mcpName);
  await checklistManager.update_checklist_item({
    checklist_id: registered.checklist_id,
    item_text: 'Build MCP',
    completed: true
  });

  // 4. Run tests
  console.log('🧪 Running tests...');
  await runTests(mcpName);
  await checklistManager.update_checklist_item({
    checklist_id: registered.checklist_id,
    item_text: 'Run tests',
    completed: true
  });

  // 5. Deploy to local-instances
  console.log('📦 Deploying to local-instances...');
  await deployToLocalInstances(mcpName);
  await checklistManager.update_checklist_item({
    checklist_id: registered.checklist_id,
    item_text: 'Deploy to local-instances',
    completed: true
  });

  // 6. Register in claude.json
  console.log('📝 Registering in claude.json...');
  await registerInClaudeConfig(mcpName);
  await checklistManager.update_checklist_item({
    checklist_id: registered.checklist_id,
    item_text: 'Register in claude.json',
    completed: true
  });

  // 7. Validate compliance before final step
  const validation = await checklistManager.validate_checklist_compliance({
    operation_type: 'deployment',
    skip_enforcement: false
  });

  if (validation.blocking) {
    console.error('❌ Deployment incomplete. Pending items:', validation.violations[0].pending_items);
    return { success: false, violations: validation.violations };
  }

  console.log('✅ MCP deployment complete and validated');
  return { success: true, checklist_id: registered.checklist_id };
}
```

**Result:** Full MCP deployment workflow with automated checklist tracking.

## Example 5: Google Sheets Sync Integration (Future)

**Use Case:** View checklist status in Google Sheets dashboard

```typescript
// In checklist-manager's sync_with_google_sheets tool (Phase 4)

export async function sync_with_google_sheets(params) {
  const checklists = await getChecklistStatus({});

  // Format for spreadsheet
  const rows = checklists.checklists.map(c => [
    c.id,
    c.type,
    c.metadata.owner,
    c.items.total,
    c.items.completed,
    c.items.percentage + '%',
    c.status,
    c.metadata.enforcement,
    c.items.pending.join(', ')
  ]);

  // Update Google Sheet
  await googleSheets.updateRange({
    spreadsheetId: params.spreadsheet_id,
    range: 'Checklists!A2:I',
    values: rows
  });

  return { success: true, rows_updated: rows.length };
}
```

## Integration Best Practices

### 1. Non-Blocking Updates
Always wrap checklist updates in try-catch to avoid breaking primary workflows:

```typescript
try {
  await checklistManager.update_checklist_item({ ... });
} catch (error) {
  console.warn('Checklist update failed (non-blocking):', error.message);
}
```

### 2. Use Fuzzy Matching
Leverage partial text matching for flexibility:

```typescript
// Instead of exact match:
item_text: 'Run unit tests and integration tests (all passing)'

// Use fuzzy match:
item_text: 'Run tests'  // Matches any item containing "Run tests"
```

### 3. Add Context with triggered_by
Track which MCP updated the checklist:

```typescript
await checklistManager.update_checklist_item({
  item_text: 'Deploy',
  completed: true,
  triggered_by: 'deployment-release-mcp',
  notes: 'Deployment ID: 12345, Environment: production'
});
```

### 4. Validate Before Critical Operations
Use compliance validation as a quality gate:

```typescript
const validation = await checklistManager.validate_checklist_compliance({
  operation_type: 'deployment',
  skip_enforcement: params.environment === 'dev'  // Relax for dev
});

if (validation.blocking) {
  // Halt operation, show violations
}
```

### 5. Create Checklists from Templates
Standardize workflows with templates:

```typescript
await checklistManager.create_from_template({
  template_path: './templates/standard-deployment.md',
  output_path: `./checklists/${projectName}-deployment.md`,
  variables: {
    project_name: projectName,
    target_date: deadline,
    team_owner: teamName
  },
  enforcement: 'mandatory'
});
```

## Telemetry Integration (Planned)

All checklist operations will log to workspace-brain MCP:

```typescript
// Automatically logged:
{
  event_type: 'checklist-operation',
  event_data: {
    operation: 'update_checklist_item',
    checklist_id: 'checklist-abc123',
    checklist_type: 'deployment',
    success: true,
    duration_ms: 45
  }
}
```

This enables:
- Automation opportunity detection (frequent manual checklist completions)
- Compliance metrics (% of deployments blocked by checklists)
- Workflow optimization (time saved by auto-completion)

## Summary

Checklist Manager MCP provides:

1. **Enforcement Layer:** Block operations until checklists complete
2. **Auto-Completion:** Fuzzy matching for flexible item updates
3. **Template System:** Standardized workflows with variable substitution
4. **Real-Time Status:** Always current, file-based state
5. **MCP Integration:** Designed for seamless integration with existing MCPs

**Key Benefit:** Turn manual checklists into automated workflow gates that enforce compliance while saving time.
