/**
 * Scenario Detector - Auto-detects project scenario
 */
import { Scenario } from '../types.js';
export declare class ScenarioDetector {
    /**
     * Detect the scenario based on project path contents
     */
    static detect(projectPath: string): Scenario;
    /**
     * Check if project has a constitution file
     */
    private static hasConstitution;
    /**
     * Check if project has spec files
     */
    private static hasSpecs;
    /**
     * Check if project has existing code
     */
    private static hasCode;
    /**
     * Get project type based on directory contents
     */
    static detectProjectType(projectPath: string): string;
    /**
     * Get suggested spec directory path
     */
    static getSuggestedSpecPath(projectPath: string): string;
    /**
     * Get next feature number based on existing specs
     */
    static getNextFeatureNumber(projectPath: string): string;
    /**
     * Create a feature directory name from feature name
     */
    static createFeatureDirectoryName(featureName: string, featureNumber?: string): string;
}
//# sourceMappingURL=scenario-detector.d.ts.map