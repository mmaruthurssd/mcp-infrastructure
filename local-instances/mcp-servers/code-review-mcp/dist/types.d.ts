/**
 * Type definitions for Code Review MCP Server
 */
export interface CodeIssue {
    file: string;
    line: number;
    column?: number;
    rule: string;
    severity: 'error' | 'warning' | 'info';
    message: string;
    fixable: boolean;
    suggestion?: string;
}
export interface CodeMetrics {
    complexity: number;
    maintainability: number;
    linesOfCode: number;
}
export interface AnalyzeQualityParams {
    target: string;
    languages?: string[];
    severity?: 'error' | 'warning' | 'info' | 'all';
    fixable?: boolean;
    includeMetrics?: boolean;
}
export interface AnalyzeQualityResult {
    success: boolean;
    summary: {
        totalIssues: number;
        bySeverity: {
            error: number;
            warning: number;
            info: number;
        };
        fixable: number;
        filesAnalyzed: number;
    };
    issues: CodeIssue[];
    metrics?: CodeMetrics;
    error?: string;
}
export interface ComplexityFunction {
    file: string;
    function: string;
    line: number;
    cyclomatic: number;
    cognitive: number;
    nestingDepth: number;
    recommendation: string;
}
export interface ComplexityHotspot {
    file: string;
    complexity: number;
    impact: 'high' | 'medium' | 'low';
    reason: string;
}
export interface DetectComplexityParams {
    target: string;
    threshold?: {
        cyclomatic?: number;
        cognitive?: number;
        nesting?: number;
    };
    includeTests?: boolean;
    format?: 'summary' | 'detailed' | 'hotspots';
}
export interface DetectComplexityResult {
    success: boolean;
    summary: {
        averageComplexity: number;
        maxComplexity: number;
        filesOverThreshold: number;
        hotspots: number;
    };
    functions: ComplexityFunction[];
    hotspots?: ComplexityHotspot[];
}
export interface CodeSmell {
    file: string;
    line: number;
    category: string;
    severity: 'critical' | 'major' | 'minor';
    description: string;
    example: string;
    refactoringHint: string;
}
export interface FindCodeSmellsParams {
    target: string;
    categories?: string[];
    severity?: 'critical' | 'major' | 'minor' | 'all';
    language?: string;
}
export interface FindCodeSmellsResult {
    success: boolean;
    summary: {
        totalSmells: number;
        bySeverity: {
            critical: number;
            major: number;
            minor: number;
        };
        byCategory: Record<string, number>;
    };
    smells: CodeSmell[];
}
export interface TechnicalDebtItem {
    id: string;
    title: string;
    description: string;
    location: string;
    type: 'code-quality' | 'architecture' | 'documentation' | 'testing' | 'security' | 'performance';
    severity: 'critical' | 'high' | 'medium' | 'low';
    status: 'open' | 'in-progress' | 'resolved' | 'wontfix';
    estimatedEffort: string;
    impact: string;
    createdAt: string;
    lastUpdated: string;
    resolvedAt?: string;
    notes: string[];
}
export interface TrackTechnicalDebtParams {
    action: 'add' | 'list' | 'update' | 'resolve' | 'report';
    projectPath: string;
    debt?: Partial<Omit<TechnicalDebtItem, 'id' | 'createdAt' | 'lastUpdated'>>;
    debtId?: string;
    status?: 'open' | 'in-progress' | 'resolved' | 'wontfix';
    notes?: string;
    filters?: {
        type?: string;
        severity?: string;
        status?: string;
    };
}
export interface Improvement {
    id: string;
    title: string;
    category: string;
    priority: 'high' | 'medium' | 'low';
    description: string;
    rationale: string;
    location: {
        file: string;
        line?: number;
        function?: string;
    };
    impact: {
        performance?: string;
        maintainability?: string;
        readability?: string;
    };
    effort: 'trivial' | 'small' | 'medium' | 'large';
    example?: {
        before: string;
        after: string;
    };
}
export interface SuggestImprovementsParams {
    target: string;
    context?: string;
    focus?: 'performance' | 'maintainability' | 'readability' | 'security' | 'all';
    maxSuggestions?: number;
    prioritize?: boolean;
}
export interface SuggestImprovementsResult {
    success: boolean;
    summary: {
        totalSuggestions: number;
        byCategory: Record<string, number>;
        estimatedImpact: 'high' | 'medium' | 'low';
    };
    suggestions: Improvement[];
}
export interface ReviewReport {
    reportPath: string;
    summary: {
        overallScore: number;
        grade: 'A' | 'B' | 'C' | 'D' | 'F';
        totalIssues: number;
        criticalIssues: number;
        technicalDebtItems: number;
        filesReviewed: number;
        linesOfCode: number;
    };
    metrics: {
        maintainabilityIndex: number;
        averageComplexity: number;
        testCoverage?: number;
        duplicationRate: number;
    };
    trends?: {
        issueChange: number;
        complexityChange: number;
        debtChange: number;
    };
    topIssues: Array<{
        file: string;
        severity: string;
        count: number;
    }>;
    recommendations: string[];
}
export interface GenerateReviewReportParams {
    projectPath: string;
    target?: string;
    format?: 'markdown' | 'html' | 'json';
    includeHistory?: boolean;
    outputPath?: string;
    sections?: string[];
}
export interface GenerateReviewReportResult {
    success: boolean;
    report: ReviewReport;
}
//# sourceMappingURL=types.d.ts.map