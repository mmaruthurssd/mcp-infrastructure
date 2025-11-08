# Backward Compatibility Guide

**Project Management MCP Server v1.0.0**

## Overview

Project Management MCP Server v1.0.0 maintains full backward compatibility with v0.8.0 projects through a dual-mode system. Existing v0.8.0 projects continue to work unchanged, while users can opt to migrate to v1.0.0 hierarchical structure at their convenience.

## Version Detection

The system automatically detects project version on every tool call by checking for version markers:

**v0.8.0 Markers:**
- `brainstorming/future-goals/potential-goals/` folder
- `brainstorming/future-goals/SELECTED-GOALS.md` file
- Flat goal structure

**v1.0.0 Markers:**
- `01-planning/PROJECT-OVERVIEW.md` file
- `02-goals-and-roadmap/components/` folder structure
- Hierarchical goal organization

## Feature Compatibility

### Core Features (Work in Both Versions)

These tools work with both v0.8.0 and v1.0.0 projects:

| Tool | Description | v0.8.0 | v1.0.0 |
|------|-------------|--------|--------|
| `create_potential_goal` | Create potential goals | ✅ | ✅ |
| `promote_to_selected` | Promote goals to selected | ✅ | ✅ |
| `view_goals_dashboard` | View goal dashboard | ✅ | ✅ |
| `update_goal_progress` | Update goal progress | ✅ | ✅ |
| `extract_ideas` | Extract ideas from discussions | ✅ | ✅ |
| `generate_review_report` | Generate review reports | ✅ | ✅ |
| `generate_goals_diagram` | Generate diagrams | ✅ | ✅ |
| `check_review_needed` | Check if review needed | ✅ | ✅ |

### v1.0.0 Only Features

These tools require v1.0.0 hierarchical structure:

| Tool | Description | Reason |
|------|-------------|--------|
| `generate_project_overview` | Create PROJECT OVERVIEW | Requires component structure |
| `create_component` | Create component | v1.0.0 concept |
| `identify_components` | Identify components | v1.0.0 concept |
| `handoff_to_spec_driven` | Handoff to Spec-Driven MCP | Needs hierarchical context |
| `create_major_goal` | Create major goal | v1.0.0 concept |
| `promote_to_major_goal` | Promote to major goal | v1.0.0 concept |
| `update_major_goal_progress` | Update major goal progress | Hierarchical aggregation |
| `get_major_goal_status` | Get major goal status | v1.0.0 concept |

### Migration Features

These tools help migrate v0.8.0 projects to v1.0.0:

| Tool | Description | Works On |
|------|-------------|----------|
| `analyze_project_for_migration` | Analyze readiness | v0.8.0, v1.0.0 |
| `suggest_goal_clustering` | Suggest component grouping | v0.8.0, v1.0.0 |
| `migrate_to_hierarchical` | Execute migration | v0.8.0 |
| `validate_migration` | Validate migration | v1.0.0 (after migration) |
| `rollback_migration` | Rollback migration | v1.0.0 (after migration) |

## Using v1.0.0-Only Features in v0.8.0

When you try to use a v1.0.0-only feature in a v0.8.0 project, you'll receive a helpful error message:

```
⚠️  Create Component requires v1.0.0 hierarchical structure.

Current project version: v0.8.0

This project uses v0.8.0 flat structure (15 goals).

✨ Consider upgrading to v1.0.0 for:
   • Better organization with 5 components
   • Progress tracking across 7 hierarchical levels
   • Seamless Spec-Driven MCP integration
   • Advanced visualization and documentation
   • Automatic progress aggregation

⏱️  Migration time: ~10-20 minutes
🔒 Risk level: low (automatic backup + rollback available)

To migrate: Use analyze_project_for_migration tool
```

## Migration Path

### Step 1: Analyze Your Project

```bash
# Analyze readiness for migration
mcp-tool analyze_project_for_migration --projectPath /path/to/project
```

This will:
- Detect v0.8.0 structure
- Count your goals
- Provide confidence score
- Recommend whether to migrate

### Step 2: Review Clustering Suggestions

```bash
# Get component clustering suggestions
mcp-tool suggest_goal_clustering --projectPath /path/to/project --targetComponents 3
```

This groups your goals into components using keyword-based AI clustering.

### Step 3: Preview Migration (Dry Run)

```bash
# Preview changes without applying
mcp-tool migrate_to_hierarchical \
  --projectPath /path/to/project \
  --dryRun true
```

This shows what would change without making any modifications.

### Step 4: Execute Migration

```bash
# Perform actual migration
mcp-tool migrate_to_hierarchical \
  --projectPath /path/to/project \
  --dryRun false
```

This:
- Creates automatic backup
- Builds v1.0.0 structure
- Moves goals to components
- Generates PROJECT OVERVIEW
- Preserves all data

### Step 5: Validate Migration

```bash
# Validate successful migration
mcp-tool validate_migration \
  --projectPath /path/to/project \
  --originalGoalCount 15
```

### Optional: Rollback

If you need to revert:

```bash
# Rollback to v0.8.0
mcp-tool rollback_migration \
  --projectPath /path/to/project \
  --confirm true
```

## Developer Guide: Adding Dual-Mode Support

### Wrapper Patterns

#### Pattern 1: Dual-Mode Tool (Works in Both Versions)

```typescript
import { withDualMode } from '../utils/backward-compatibility-wrapper.js';
import { ProjectVersion } from '../utils/project-structure-adapter.js';

export async function myDualModeTool(params: {
  projectPath: string;
  goalId: string;
}): Promise<Result> {
  return withDualMode(params.projectPath, async (adapter, paths, version) => {
    if (version === ProjectVersion.V0_8_0) {
      // v0.8.0 implementation
      const goals = await readSelectedGoalsFile(paths.selectedGoalsPath);
      return processGoalFlat(goals, params.goalId);
    } else {
      // v1.0.0 implementation
      const goals = await loadHierarchicalGoals(paths.selectedGoalsPath);
      return processGoalHierarchical(goals, params.goalId);
    }
  });
}
```

#### Pattern 2: v1.0.0-Only Tool (Graceful Degradation)

```typescript
import { withBackwardCompatibility } from '../utils/backward-compatibility-wrapper.js';

export async function myV100OnlyTool(params: {
  projectPath: string;
  componentName: string;
}): Promise<Result> {
  return withBackwardCompatibility(
    params.projectPath,
    'createComponent', // Feature key
    'Create Component', // Display name for error
    async (adapter, paths, version) => {
      // This only runs if v1.0.0 detected
      // Automatic error with upgrade prompt if v0.8.0

      const componentPath = path.join(
        paths.selectedGoalsPath,
        params.componentName
      );

      await createComponentStructure(componentPath);
      return { success: true };
    }
  );
}
```

#### Pattern 3: Custom Version Handling

```typescript
import { ProjectStructureAdapter, ProjectVersion } from '../utils/project-structure-adapter.js';

export async function myCustomTool(params: {
  projectPath: string;
}): Promise<Result> {
  const adapter = new ProjectStructureAdapter(params.projectPath);
  const detection = await adapter.detectVersion();

  // Check if feature available
  const available = await adapter.isFeatureAvailable('myFeature');
  if (!available) {
    const message = await adapter.formatFeatureUnavailableMessage(
      'myFeature',
      'My Feature'
    );
    return { success: false, message };
  }

  // Get appropriate paths
  const paths = await adapter.getGoalPaths();

  // Your implementation
  return { success: true };
}
```

### Testing Both Versions

Always test tools with both v0.8.0 and v1.0.0 project structures:

```typescript
describe('myTool - Dual Mode', () => {
  test('should work with v0.8.0 project', async () => {
    const result = await myTool({ projectPath: V080_PROJECT });
    expect(result.success).toBe(true);
  });

  test('should work with v1.0.0 project', async () => {
    const result = await myTool({ projectPath: V100_PROJECT });
    expect(result.success).toBe(true);
  });

  test('should handle feature unavailable gracefully', async () => {
    await expect(
      myV100OnlyTool({ projectPath: V080_PROJECT })
    ).rejects.toThrow('requires v1.0.0');
  });
});
```

## Sunset Timeline

**Support Period:**
- **v1.0.0 Launch:** January 2026
- **Full v0.8.0 Support:** January 2026 - January 2027 (12 months)
- **Deprecation Notice:** January 2027 - July 2027 (6 months)
- **Strong Migration Encouragement:** July 2027 - January 2028 (6 months)
- **v0.8.0 Support Ends:** January 2028 (24 months after launch)

Users can always snapshot and remain on older versions if needed.

## Best Practices

### For Users

1. **Don't Rush:** Take time to evaluate v1.0.0 before migrating
2. **Use Dry Run:** Always preview migration before executing
3. **Backup First:** Automatic backup is created, but manual backup recommended
4. **Test After Migration:** Validate all goals migrated correctly
5. **Keep Backup:** Keep v0.8.0 backup for at least 1 month

### For Developers

1. **Always Detect Version:** Use adapter for every tool call
2. **Graceful Degradation:** Provide helpful errors for unavailable features
3. **Test Both Versions:** Integration tests for v0.8.0 and v1.0.0
4. **Document Compatibility:** Update feature matrix when adding tools
5. **Cache Wisely:** Use adapter caching to avoid repeated file checks

## Troubleshooting

### Issue: Tool says "requires v1.0.0" but I have v1.0.0

**Cause:** Version detection didn't find v1.0.0 markers

**Solution:**
1. Check `01-planning/PROJECT-OVERVIEW.md` exists
2. Check `02-goals-and-roadmap/components/` folder exists
3. Run `analyze_project_for_migration` to see detected version

### Issue: Some goals missing after migration

**Cause:** Migration didn't capture all goals

**Solution:**
1. Run `validate_migration` to check counts
2. If mismatch, run `rollback_migration`
3. Check goal files have valid YAML frontmatter
4. Re-run migration after fixing

### Issue: Can't rollback after migration

**Cause:** Backup not found or corrupted

**Solution:**
1. Check `08-archive/project-snapshots/` for backups
2. Manual restore from backup if needed
3. Contact support if backup missing

## API Reference

### ProjectStructureAdapter

```typescript
class ProjectStructureAdapter {
  constructor(projectPath: string);

  // Detect project version
  async detectVersion(): Promise<VersionDetectionResult>;

  // Get feature availability
  async getFeatureAvailability(): Promise<FeatureAvailability>;

  // Check specific feature
  async isFeatureAvailable(feature: string): Promise<boolean>;

  // Get goal paths
  async getGoalPaths(): Promise<GoalPathInfo>;

  // Get upgrade prompt
  async getUpgradePrompt(): Promise<UpgradePrompt | null>;

  // Assert feature available (throws if not)
  async assertFeatureAvailable(
    feature: string,
    displayName: string
  ): Promise<void>;

  // Clear detection cache
  clearCache(): void;
}
```

### Wrapper Functions

```typescript
// Dual-mode tool wrapper
function withDualMode<T>(
  projectPath: string,
  handler: ToolHandler<T>
): Promise<T>;

// v1.0.0-only tool wrapper
function withBackwardCompatibility<T>(
  projectPath: string,
  featureName: string,
  featureDisplayName: string,
  handler: ToolHandler<T>
): Promise<T>;

// Check upgrade prompt needed
function shouldShowUpgradePrompt(
  projectPath: string
): Promise<boolean>;

// Get upgrade prompt text
function getUpgradePromptText(
  projectPath: string
): Promise<string | null>;
```

## Support

For questions about backward compatibility:
1. Read this guide
2. Check feature compatibility matrix
3. Use migration tools' dry-run mode
4. Open GitHub issue if problems persist

## Changelog

**v1.0.0 (2025-01-XX):**
- Initial backward compatibility system
- Dual-mode support for v0.8.0 and v1.0.0
- Migration tools with backup/rollback
- Automatic version detection
- Feature compatibility matrix
- Graceful degradation for v1.0.0-only features
