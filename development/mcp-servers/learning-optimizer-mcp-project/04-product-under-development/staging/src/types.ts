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
    requireHumanReview?: boolean; // Default: true - promoted issues need approval
    optimizationCooldown?: number; // Minutes between optimizations (default: 1440 = 24hrs)
  };
  categories: Category[];
  issueNumberPrefix?: string; // e.g., "AUTO-" for "AUTO-26"
  qualityStandards?: {
    requireRootCauseForPromotion?: boolean; // Default: true
    requirePreventionForPromotion?: boolean; // Default: true
    minimumContextFields?: number; // Default: 2
  };
}

export interface Category {
  name: string;
  description: string;
  keywords: string[];
  priority?: number; // For sorting
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
  firstEncountered: string; // ISO date
  lastSeen: string; // ISO date
  category?: string;
  promoted?: boolean;
  promotionPending?: boolean; // Awaiting human review
  promotionConfidence?: number; // 0-100 score
  qualityScore?: number; // 0-100 based on completeness
  excludeFromPromotion?: boolean; // Manual override
  reviewNotes?: string; // Human review comments
  reviewedBy?: string; // Who approved/rejected
  reviewedAt?: string; // ISO date
  mergedInto?: number;
  mergedFrom?: number[];
  temporalDistribution?: {
    // Track when occurrences happened
    dates: string[]; // ISO dates of each occurrence
    spanDays: number; // Days between first and last occurrence
  };
}

export interface IssueContext {
  domain: string;
  os?: string;
  nodeVersion?: string;
  step?: string;
  template?: string;
  [key: string]: any; // Allow custom context fields
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
  preventionRate: number; // 0-100
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
  lastOptimization?: string; // ISO timestamp of last optimization
  issues: TrackedIssue[];
}

export interface PromotionCandidate {
  issue: TrackedIssue;
  confidence: number; // 0-100
  qualityScore: number; // 0-100
  reasons: string[]; // Why it's a candidate
  warnings: string[]; // Potential issues
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
