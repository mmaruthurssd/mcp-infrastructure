/**
 * Backward Compatibility Wrapper
 *
 * Provides wrapper functions to add dual-mode support to existing MCP tools.
 * Integrates with ProjectStructureAdapter to detect version and adapt behavior.
 *
 * Usage Pattern:
 * ```typescript
 * export async function myMCPTool(params: MyParams): Promise<MyResult> {
 *   return withBackwardCompatibility(
 *     params.projectPath,
 *     'myFeatureName',
 *     'My Feature Display Name',
 *     async (adapter, paths) => {
 *       // Tool implementation here
 *       // Use adapter.detectVersion() if needed
 *       // Use paths for goal locations
 *       return result;
 *     }
 *   );
 * }
 * ```
 */

import { ProjectStructureAdapter, FeatureAvailability, GoalPathInfo, ProjectVersion } from './project-structure-adapter.js';

/**
 * Tool handler function type
 */
export type ToolHandler<T> = (
  adapter: ProjectStructureAdapter,
  paths: GoalPathInfo,
  version: ProjectVersion
) => Promise<T>;

/**
 * Wrap tool with backward compatibility support
 *
 * This function:
 * 1. Creates ProjectStructureAdapter
 * 2. Detects project version
 * 3. Checks feature availability
 * 4. Calls handler with adapter and paths
 * 5. Handles errors gracefully
 *
 * @param projectPath Path to project
 * @param featureName Feature key from FeatureAvailability
 * @param featureDisplayName Human-readable feature name for errors
 * @param handler Tool implementation function
 * @returns Tool result
 */
export async function withBackwardCompatibility<T>(
  projectPath: string,
  featureName: keyof FeatureAvailability,
  featureDisplayName: string,
  handler: ToolHandler<T>
): Promise<T> {
  const adapter = new ProjectStructureAdapter(projectPath);

  // Check feature availability first
  await adapter.assertFeatureAvailable(featureName, featureDisplayName);

  // Get version and paths
  const detection = await adapter.detectVersion();
  const paths = await adapter.getGoalPaths();

  // Call handler
  try {
    return await handler(adapter, paths, detection.version);
  } catch (error) {
    // Re-throw with additional context
    if (error instanceof Error) {
      throw new Error(`${featureDisplayName} failed: ${error.message}`);
    }
    throw error;
  }
}

/**
 * Wrap tool with dual-mode support (works in both v0.8.0 and v1.0.0)
 *
 * Unlike withBackwardCompatibility, this doesn't check feature availability
 * (because the feature should work in both versions).
 *
 * @param projectPath Path to project
 * @param handler Tool implementation function
 * @returns Tool result
 */
export async function withDualMode<T>(
  projectPath: string,
  handler: ToolHandler<T>
): Promise<T> {
  const adapter = new ProjectStructureAdapter(projectPath);
  const detection = await adapter.detectVersion();
  const paths = await adapter.getGoalPaths();

  return handler(adapter, paths, detection.version);
}

/**
 * Get formatted feature unavailable message
 *
 * Use this when you want to return a message instead of throwing
 *
 * @param projectPath Path to project
 * @param featureName Feature key
 * @param featureDisplayName Human-readable name
 * @returns Formatted message or null if available
 */
export async function getFeatureUnavailableMessage(
  projectPath: string,
  featureName: keyof FeatureAvailability,
  featureDisplayName: string
): Promise<string | null> {
  const adapter = new ProjectStructureAdapter(projectPath);
  const available = await adapter.isFeatureAvailable(featureName);

  if (available) {
    return null;
  }

  return adapter.formatFeatureUnavailableMessage(featureName, featureDisplayName);
}

/**
 * Helper: Check if should show upgrade prompt
 */
export async function shouldShowUpgradePrompt(projectPath: string): Promise<boolean> {
  const adapter = new ProjectStructureAdapter(projectPath);
  const prompt = await adapter.getUpgradePrompt();
  return prompt?.shouldPrompt ?? false;
}

/**
 * Helper: Get upgrade prompt text
 */
export async function getUpgradePromptText(projectPath: string): Promise<string | null> {
  const adapter = new ProjectStructureAdapter(projectPath);
  const prompt = await adapter.getUpgradePrompt();

  if (!prompt || !prompt.shouldPrompt) {
    return null;
  }

  let text = `\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n`;
  text += `✨ Upgrade Available: v0.8.0 → v1.0.0\n`;
  text += `━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n\n`;
  text += `${prompt.reason}\n\n`;
  text += `Benefits of upgrading:\n`;
  prompt.benefits.forEach(benefit => {
    text += `  ✓ ${benefit}\n`;
  });
  text += `\n`;
  text += `⏱️  Estimated migration time: ${prompt.migrationTime}\n`;
  text += `🔒 Risk level: ${prompt.riskLevel} (automatic backup + rollback)\n\n`;
  text += `To upgrade: Use the analyze_project_for_migration tool\n`;
  text += `━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n`;

  return text;
}

/**
 * Example: Dual-mode tool wrapper
 *
 * This shows how to wrap an existing tool for dual-mode support
 */
export async function exampleDualModeTool(
  projectPath: string,
  goalId: string
): Promise<{ success: boolean; message: string }> {
  return withDualMode(projectPath, async (adapter, paths, version) => {
    // Detect which version we're in
    if (version === ProjectVersion.V0_8_0) {
      // v0.8.0 implementation
      // - Read from SELECTED-GOALS.md
      // - Flat structure
      return {
        success: true,
        message: `Processed goal ${goalId} in v0.8.0 mode (flat structure)`
      };
    } else {
      // v1.0.0 implementation
      // - Read from hierarchical components
      // - Use paths.selectedGoalsPath
      return {
        success: true,
        message: `Processed goal ${goalId} in v1.0.0 mode (hierarchical structure)`
      };
    }
  });
}

/**
 * Example: v1.0.0-only tool wrapper
 *
 * This shows how to wrap a v1.0.0-only tool
 */
export async function exampleV100OnlyTool(
  projectPath: string,
  componentName: string
): Promise<{ success: boolean; componentId: string }> {
  return withBackwardCompatibility(
    projectPath,
    'createComponent', // Feature key
    'Create Component', // Display name
    async (adapter, paths, version) => {
      // This code only runs if v1.0.0 detected
      // If v0.8.0, withBackwardCompatibility throws error with upgrade prompt

      return {
        success: true,
        componentId: `component-${componentName}`
      };
    }
  );
}
