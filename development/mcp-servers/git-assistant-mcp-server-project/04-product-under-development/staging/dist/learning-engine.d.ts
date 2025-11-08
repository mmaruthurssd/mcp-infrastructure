import { LearnedPattern, Commit } from './types.js';
export declare class LearningEngine {
    private preferencesFile;
    private patterns;
    private metadata;
    constructor(repoPath: string);
    loadPatterns(): Promise<void>;
    savePatterns(): Promise<void>;
    addPattern(tool: string, condition: string, action: string, reason: string, createdBy?: string): Promise<LearnedPattern>;
    listPatterns(tool?: string): Promise<LearnedPattern[]>;
    removePattern(patternId: string): Promise<boolean>;
    checkPatterns(tool: string, params: any): Promise<LearnedPattern | null>;
    suggestPattern(tool: string, params: any, result: any): Promise<string | null>;
    /**
     * Record security-related pattern
     */
    addSecurityPattern(pattern: string, severity: string, file: string, remediation: string): Promise<LearnedPattern>;
    /**
     * Check if a security issue has been seen before
     */
    hasSeenSecurityIssue(pattern: string, file: string): Promise<boolean>;
    /**
     * Get security-related patterns
     */
    getSecurityPatterns(): Promise<LearnedPattern[]>;
    analyzeCommitHistory(commits: Commit[]): Promise<{
        typical_file_count: number;
        typical_line_count: number;
        typical_commit_frequency: number;
    }>;
    private evaluateCondition;
    private generateId;
    getPatternUsageStats(patternId?: string): any;
}
//# sourceMappingURL=learning-engine.d.ts.map