/**
 * Lifecycle Manager
 * Manages file lifecycle transitions (planning → active → development → stable → archived)
 */
export type LifecycleStage = 'planning' | 'active' | 'development' | 'stable' | 'static' | 'archived' | 'temporary';
export interface LifecycleTransition {
    from: LifecycleStage;
    to: LifecycleStage;
    reason: string;
    confidence: number;
    suggestedAction: string;
}
export interface LifecycleInfo {
    currentStage: LifecycleStage;
    suggestedStage: LifecycleStage;
    shouldTransition: boolean;
    transition?: LifecycleTransition;
    reasoning: string[];
}
export declare class LifecycleManager {
    private folderMap;
    constructor(folderMap: any);
    /**
     * Determine current lifecycle stage based on file location
     */
    determineCurrentStage(filePath: string, projectRoot: string): LifecycleStage;
    /**
     * Analyze if a file should transition to a different lifecycle stage
     */
    analyzeLifecycle(filePath: string, projectRoot: string): Promise<LifecycleInfo>;
    /**
     * Check if active work should graduate to projects-in-development or projects
     */
    private checkForGraduation;
    /**
     * Check if project in development is stable enough for projects/
     */
    private checkStability;
    /**
     * Check if stable project should be archived
     */
    private checkForArchival;
    /**
     * Get recommended next stage for a file/folder
     */
    getNextStage(currentStage: LifecycleStage): LifecycleStage | null;
    /**
     * Get all possible transitions from current stage
     */
    getPossibleTransitions(currentStage: LifecycleStage): LifecycleStage[];
    /**
     * Helper: Check if file exists
     */
    private fileExists;
    /**
     * Helper: Check if directory exists
     */
    private directoryExists;
}
//# sourceMappingURL=lifecycle-manager.d.ts.map