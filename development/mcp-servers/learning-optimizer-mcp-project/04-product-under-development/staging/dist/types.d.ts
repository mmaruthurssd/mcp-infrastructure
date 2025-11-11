/**
 * Core types for Learning Optimizer MCP Server
 */
export interface DomainConfig {
    domain: string;
    displayName: string;
    description: string;
    knowledgeBaseFile: string;
    preventiveCheckFile?: string;
    optimizationTriggers: {
        highImpactThreshold: number;
        technicalDebtThreshold: number;
        enableDuplicateDetection: boolean;
        requireHumanReview?: boolean;
        optimizationCooldown?: number;
    };
    categories: Category[];
    issueNumberPrefix?: string;
    qualityStandards?: {
        requireRootCauseForPromotion?: boolean;
        requirePreventionForPromotion?: boolean;
        minimumContextFields?: number;
    };
}
export interface Category {
    name: string;
    description: string;
    keywords: string[];
    priority?: number;
}
export interface TrackedIssue {
    issueNumber: number;
    title: string;
    symptom: string;
    rootCause?: string;
    solution: string;
    prevention?: string;
    context: IssueContext;
    frequency: number;
    firstEncountered: string;
    lastSeen: string;
    category?: string;
    promoted?: boolean;
    promotionPending?: boolean;
    promotionConfidence?: number;
    qualityScore?: number;
    excludeFromPromotion?: boolean;
    reviewNotes?: string;
    reviewedBy?: string;
    reviewedAt?: string;
    mergedInto?: number;
    mergedFrom?: number[];
    temporalDistribution?: {
        dates: string[];
        spanDays: number;
    };
}
export interface IssueContext {
    domain: string;
    os?: string;
    nodeVersion?: string;
    step?: string;
    template?: string;
    [key: string]: any;
}
export interface OptimizationTrigger {
    triggered: boolean;
    type: 'high_impact' | 'technical_debt' | 'duplicate_detected';
    reason: string;
    affectedIssues?: number[];
}
export interface OptimizationResult {
    triggered: OptimizationTrigger[];
    actions: {
        duplicatesMerged: number;
        issuesPromoted: number;
        categoriesCreated: number;
        preventiveChecksAdded: number;
    };
    beforeState: {
        totalIssues: number;
        promotedIssues: number;
    };
    afterState: {
        totalIssues: number;
        promotedIssues: number;
    };
    preventionImpact?: {
        issueNumber: number;
        expectedPreventionRate: string;
    }[];
}
export interface PreventionMetrics {
    issueNumber: number;
    title: string;
    occurrencesBeforePromotion: number;
    promotionDate: string;
    installationsSincePromotion: number;
    preventedOccurrences: number;
    preventionRate: number;
}
export interface DomainStats {
    domain: string;
    totalIssues: number;
    promotedIssues: number;
    categories: {
        name: string;
        count: number;
    }[];
    highestFrequencyIssue: {
        issueNumber: number;
        frequency: number;
    };
    optimizationHistory: {
        date: string;
        triggeredBy: string[];
        actionsTaken: string[];
    }[];
}
export interface KnowledgeBase {
    domain: string;
    lastUpdated: string;
    totalIssuesDocumented: number;
    autoLearnedIssues: number;
    promotedToPreFlight: number;
    lastOptimization?: string;
    issues: TrackedIssue[];
}
export interface PromotionCandidate {
    issue: TrackedIssue;
    confidence: number;
    qualityScore: number;
    reasons: string[];
    warnings: string[];
    recommendApprove: boolean;
}
export interface ReviewDecision {
    issueNumber: number;
    action: 'approve' | 'reject' | 'defer';
    reviewedBy: string;
    reviewNotes?: string;
}
export interface ValidationResult {
    valid: boolean;
    errors: string[];
    warnings: string[];
}
//# sourceMappingURL=types.d.ts.map