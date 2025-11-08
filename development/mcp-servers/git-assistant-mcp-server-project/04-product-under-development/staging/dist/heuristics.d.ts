import { CommitReadinessResult, DiffSummary } from './types.js';
export declare class HeuristicsEngine {
    private userPreferences;
    constructor(userPreferences?: any);
    analyzeCommitReadiness(diffSummary: DiffSummary, timeSinceLastCommit: number, hasStagedFiles: boolean): CommitReadinessResult;
    private evaluateFileCount;
    private evaluateLineChanges;
    private evaluateTimeSinceLastCommit;
    private checkForDebugCode;
    private generateRecommendation;
    private generateNextSteps;
}
//# sourceMappingURL=heuristics.d.ts.map