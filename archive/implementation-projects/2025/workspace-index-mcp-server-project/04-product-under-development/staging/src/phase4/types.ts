/**
 * Phase 4: Autonomous Documentation Management - Type Definitions
 */

/**
 * Type of documentation issue detected
 */
export type IssueType = 'superseded' | 'redundant' | 'stale' | 'missing';

/**
 * Type of operation to perform on documentation
 */
export type OperationType = 'archive' | 'consolidate' | 'create' | 'restructure';

/**
 * Severity level of detected issue
 */
export type SeverityLevel = 'critical' | 'warning' | 'info';

/**
 * Confidence factors that contribute to overall confidence score
 */
export interface ConfidenceFactors {
  /** How well issue matches known detection patterns (0-1) */
  patternMatch: number;

  /** Past success rate for this issue type (0-1, learned over time) */
  historicalSuccess: number;

  /** Penalty for operation complexity (0-1, inverted - simple = higher) */
  complexityPenalty: number;

  /** How easily the operation can be undone (0-1) */
  reversibility: number;

  /** How clear the replacement/target/action is (0-1) */
  contextClarity: number;
}

/**
 * Evidence supporting an issue detection
 */
export interface Evidence {
  /** Type of evidence */
  type: 'keyword' | 'framework_match' | 'overlap' | 'age' | 'cross_reference' | 'pattern';

  /** Description of the evidence */
  description: string;

  /** Location of evidence (file path, line number, etc.) */
  location?: string;

  /** Weight/importance of this evidence (0-1) */
  weight: number;
}

/**
 * Recommended action for resolving an issue
 */
export interface RecommendedAction {
  /** Operation to perform */
  operation: OperationType;

  /** Human-readable description */
  description: string;

  /** Step-by-step instructions */
  steps: string[];

  /** Whether this requires user approval (based on confidence) */
  requiresApproval: boolean;
}

/**
 * Overlap analysis between two documents
 */
export interface OverlapAnalysis {
  /** File being compared */
  file: string;

  /** Percentage of content overlap (0-1) */
  percentage: number;

  /** Similar sections found */
  similarSections?: Array<{
    section1: string;
    section2: string;
    similarity: number;
  }>;
}

/**
 * Analysis details for a detected issue
 */
export interface IssueAnalysis {
  /** Reason this issue was detected */
  reason: string;

  /** Evidence supporting the detection */
  evidence: Evidence[];

  /** If superseded, what replaced it */
  supersededBy?: string;

  /** If redundant, overlap details */
  overlaps?: OverlapAnalysis[];

  /** If consolidation recommended, target path */
  consolidationTarget?: string;

  /** If missing, what should be created */
  missingContent?: string;
}

/**
 * A detected documentation issue
 */
export interface DocumentationIssue {
  /** Unique identifier for this issue */
  id: string;

  /** Type of issue */
  type: IssueType;

  /** Confidence score (0-1) */
  confidence: number;

  /** Confidence factors breakdown */
  confidenceFactors: ConfidenceFactors;

  /** Severity level */
  severity: SeverityLevel;

  /** Affected file(s) */
  files: string[];

  /** Analysis details */
  analysis: IssueAnalysis;

  /** Recommended action */
  recommendedAction: RecommendedAction;

  /** When this issue was detected */
  detectedAt: string;

  /** Whether this is a first-time pattern (requires approval even if high confidence) */
  firstTimePattern?: boolean;
}

/**
 * Summary of health analysis results
 */
export interface HealthAnalysisSummary {
  /** Total issues detected */
  totalIssues: number;

  /** Breakdown by issue type */
  superseded: number;
  redundant: number;
  stale: number;
  missing: number;

  /** Issues by confidence level */
  highConfidence: number; // >= auto_execute threshold
  mediumConfidence: number; // >= 0.70, < auto_execute
  lowConfidence: number; // < 0.70

  /** Number of issues that can be auto-executed */
  autoExecutable: number;

  /** Number of issues requiring user approval */
  requiresApproval: number;
}

/**
 * Result of documentation health analysis
 */
export interface HealthAnalysisResult {
  /** Number of files scanned */
  scannedFiles: number;

  /** Total issues detected */
  issuesDetected: number;

  /** Summary breakdown */
  summary: HealthAnalysisSummary;

  /** Detailed issue list */
  issues: DocumentationIssue[];

  /** Recommendations for user */
  recommendations: string[];

  /** When analysis was performed */
  timestamp: string;
}

/**
 * Options for documentation operation execution
 */
export interface OperationOptions {
  /** Path for archive operations */
  archivePath?: string;

  /** Whether to create replacement doc after archival */
  createReplacement?: boolean;

  /** Template to use for replacement ('minimal' | 'detailed') */
  replacementTemplate?: 'minimal' | 'detailed';

  /** Target path for consolidation */
  targetPath?: string;

  /** Sections to preserve during consolidation */
  preserveSections?: string[];

  /** Template to use for creation */
  template?: string;

  /** Variables to fill in template */
  variables?: Record<string, string>;
}

/**
 * Change made during an operation
 */
export interface OperationChange {
  /** Type of change */
  type: 'created' | 'moved' | 'archived' | 'modified' | 'deleted';

  /** Path of affected file */
  path: string;

  /** Preview of change (diff or content) */
  preview?: string;
}

/**
 * Validation result after an operation
 */
export interface OperationValidation {
  /** Is markdown syntax valid? */
  syntaxValid: boolean;

  /** Are all internal links valid? */
  linksValid: boolean;

  /** Validation errors */
  errors: string[];

  /** Validation warnings */
  warnings: string[];
}

/**
 * Audit trail for an operation
 */
export interface OperationAuditTrail {
  /** When operation was performed */
  timestamp: string;

  /** Confidence score at time of execution */
  confidence: number;

  /** Who/what approved the operation */
  approvedBy: 'autonomous' | 'user' | 'system';

  /** Outcome of operation */
  outcome: 'success' | 'failed' | 'rolled_back' | 'partial';

  /** Additional context */
  context?: Record<string, any>;
}

/**
 * Result of executing a documentation operation
 */
export interface OperationResult {
  /** Was the operation executed? */
  executed: boolean;

  /** Was this a dry run? */
  dryRun: boolean;

  /** Was user approval obtained? */
  approved: boolean;

  /** Operation type performed */
  operation: OperationType;

  /** Changes made or proposed */
  changes: OperationChange[];

  /** Path to backup (if created) */
  backupPath?: string;

  /** Validation results */
  validation: OperationValidation;

  /** Git commit hash (if committed) */
  gitCommit?: string;

  /** Audit trail */
  auditTrail: OperationAuditTrail;

  /** Error message (if failed) */
  error?: string;
}

/**
 * Pattern learned from past operations
 */
export interface LearnedPattern {
  /** Pattern identifier */
  id: string;

  /** Issue type this pattern applies to */
  issueType: IssueType;

  /** Pattern description */
  description: string;

  /** Detection criteria */
  criteria: Record<string, any>;

  /** Historical success rate */
  successRate: number;

  /** Number of times this pattern was seen */
  occurrences: number;

  /** Last updated timestamp */
  lastUpdated: string;
}
