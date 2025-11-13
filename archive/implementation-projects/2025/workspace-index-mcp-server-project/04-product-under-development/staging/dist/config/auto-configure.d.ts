/**
 * Phase 4: Auto-Configuration Logic
 *
 * Detects workspace structure and customizes workspace-index-config.json
 * by replacing {{AUTO_DETECT:...}} placeholders with actual paths.
 */
import { WorkspaceConfig } from '../adapters/workspace-adapter.js';
interface DetectionResult {
    developmentDir?: string;
    productionDir?: string;
    archiveDir?: string;
    frameworksDir?: string;
    templatesDir?: string;
    documentationRoots: string[];
    workspaceName: string;
    workspaceType: string;
    maturityLevel: 'new' | 'mature';
    maturityThreshold: number;
}
/**
 * Scan workspace to detect structure patterns
 */
export declare function detectWorkspaceStructure(workspaceRoot: string): Promise<DetectionResult>;
/**
 * Replace {{AUTO_DETECT:...}} placeholders in config
 */
export declare function autoConfigureWorkspace(workspaceRoot: string, templateConfigPath: string): Promise<WorkspaceConfig>;
/**
 * Save customized config to workspace
 */
export declare function saveCustomizedConfig(config: WorkspaceConfig, outputPath: string): Promise<void>;
export {};
