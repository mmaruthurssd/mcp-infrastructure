/**
 * All Code Review MCP tools
 */
import { AnalyzeQualityParams, AnalyzeQualityResult, DetectComplexityParams, DetectComplexityResult, FindCodeSmellsParams, FindCodeSmellsResult, TrackTechnicalDebtParams, SuggestImprovementsParams, SuggestImprovementsResult, GenerateReviewReportParams, GenerateReviewReportResult } from '../types.js';
export declare function analyzeCodeQuality(params: AnalyzeQualityParams): Promise<AnalyzeQualityResult>;
export declare function detectComplexity(params: DetectComplexityParams): Promise<DetectComplexityResult>;
export declare function findCodeSmells(params: FindCodeSmellsParams): Promise<FindCodeSmellsResult>;
export declare function trackTechnicalDebt(params: TrackTechnicalDebtParams): Promise<{
    success: boolean;
    debtId: string;
    items?: undefined;
    report?: undefined;
    error?: undefined;
} | {
    success: boolean;
    items: import("../types.js").TechnicalDebtItem[];
    debtId?: undefined;
    report?: undefined;
    error?: undefined;
} | {
    success: boolean;
    debtId?: undefined;
    items?: undefined;
    report?: undefined;
    error?: undefined;
} | {
    success: boolean;
    report: {
        totalDebt: number;
        byType: Record<string, number>;
        bySeverity: Record<string, number>;
        openDebt: number;
        resolvedDebt: number;
        oldestDebt: string | null;
    };
    debtId?: undefined;
    items?: undefined;
    error?: undefined;
} | {
    success: boolean;
    error: string;
    debtId?: undefined;
    items?: undefined;
    report?: undefined;
}>;
export declare function suggestImprovements(params: SuggestImprovementsParams): Promise<SuggestImprovementsResult>;
export declare function generateReviewReport(params: GenerateReviewReportParams): Promise<GenerateReviewReportResult>;
//# sourceMappingURL=index.d.ts.map