export interface LearnedPattern {
    id: string;
    toolDescription: string;
    decision: 'mcp-server' | 'subagent' | 'hybrid';
    reasoning: string;
    externalSystems?: string[];
    complexity: 'simple' | 'moderate' | 'complex';
    stateManagement: boolean;
    outcome?: 'successful' | 'needed-refactoring' | 'abandoned';
    createdAt: string;
    timesReferenced: number;
}
export interface LearningEngineConfig {
    projectRoot: string;
    rulesFile?: string;
}
export declare class LearningEngine {
    private projectRoot;
    private rulesFile;
    private patterns;
    constructor(config: LearningEngineConfig);
    initialize(): Promise<void>;
    private get patternsPath();
    private loadPatterns;
    private savePatterns;
    addPattern(pattern: Omit<LearnedPattern, 'id' | 'createdAt' | 'timesReferenced'>): Promise<string>;
    findSimilarPatterns(description: string, limit?: number): Promise<LearnedPattern[]>;
    getPattern(id: string): Promise<LearnedPattern | null>;
    removePattern(id: string): Promise<boolean>;
    updateOutcome(id: string, outcome: LearnedPattern['outcome']): Promise<boolean>;
    listAllPatterns(): Promise<LearnedPattern[]>;
    getStatistics(): Promise<{
        total: number;
        byDecision: Record<string, number>;
        byOutcome: Record<string, number>;
        mostReferenced: LearnedPattern[];
    }>;
    private generateId;
}
//# sourceMappingURL=learning-engine.d.ts.map