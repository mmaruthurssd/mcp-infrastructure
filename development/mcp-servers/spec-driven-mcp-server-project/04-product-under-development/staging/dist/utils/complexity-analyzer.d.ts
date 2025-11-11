/**
 * Complexity Analyzer - Scores task complexity based on multiple factors
 *
 * Inspired by Taskmaster AI's complexity analysis system
 */
export interface ComplexityFactors {
    dependencies: number;
    unknownFactors: boolean;
    requiresResearch: boolean;
    integrationPoints: number;
    testingScope: 'unit' | 'integration' | 'e2e';
    estimatedHours?: number;
    phiHandling?: boolean;
}
export interface ComplexityResult {
    score: number;
    level: 'trivial' | 'simple' | 'moderate' | 'complex' | 'very-complex';
    reasoning: string[];
    recommendations: string[];
}
export declare class ComplexityAnalyzer {
    /**
     * Calculate complexity score for a task
     */
    static analyze(factors: ComplexityFactors): ComplexityResult;
    /**
     * Get complexity level from score
     */
    private static getComplexityLevel;
    /**
     * Analyze task description to estimate factors
     */
    static estimateFromDescription(description: string, context?: any): ComplexityFactors;
    /**
     * Get emoji for complexity level
     */
    static getComplexityEmoji(level: ComplexityResult['level']): string;
}
//# sourceMappingURL=complexity-analyzer.d.ts.map