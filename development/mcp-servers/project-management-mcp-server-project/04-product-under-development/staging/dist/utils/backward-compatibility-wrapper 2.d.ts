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
export type ToolHandler<T> = (adapter: ProjectStructureAdapter, paths: GoalPathInfo, version: ProjectVersion) => Promise<T>;
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
export declare function withBackwardCompatibility<T>(projectPath: string, featureName: keyof FeatureAvailability, featureDisplayName: string, handler: ToolHandler<T>): Promise<T>;
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
export declare function withDualMode<T>(projectPath: string, handler: ToolHandler<T>): Promise<T>;
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
export declare function getFeatureUnavailableMessage(projectPath: string, featureName: keyof FeatureAvailability, featureDisplayName: string): Promise<string | null>;
/**
 * Helper: Check if should show upgrade prompt
 */
export declare function shouldShowUpgradePrompt(projectPath: string): Promise<boolean>;
/**
 * Helper: Get upgrade prompt text
 */
export declare function getUpgradePromptText(projectPath: string): Promise<string | null>;
/**
 * Example: Dual-mode tool wrapper
 *
 * This shows how to wrap an existing tool for dual-mode support
 */
export declare function exampleDualModeTool(projectPath: string, goalId: string): Promise<{
    success: boolean;
    message: string;
}>;
/**
 * Example: v1.0.0-only tool wrapper
 *
 * This shows how to wrap a v1.0.0-only tool
 */
export declare function exampleV100OnlyTool(projectPath: string, componentName: string): Promise<{
    success: boolean;
    componentId: string;
}>;
//# sourceMappingURL=backward-compatibility-wrapper%202.d.ts.map