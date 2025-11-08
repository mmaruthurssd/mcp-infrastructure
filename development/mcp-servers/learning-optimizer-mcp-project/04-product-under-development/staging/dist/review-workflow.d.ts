/**
 * Review Workflow - Human review system for promoted issues
 *
 * Prevents automation bias by requiring human approval before promotion
 */
import { TrackedIssue, PromotionCandidate, ReviewDecision, DomainConfig } from './types.js';
export declare class ReviewWorkflow {
    private qualityScorer;
    constructor();
    /**
     * Get all issues pending review for a domain
     */
    getPendingReviews(issues: TrackedIssue[]): TrackedIssue[];
    /**
     * Get promotion candidates (issues that should be reviewed)
     */
    getPromotionCandidates(issues: TrackedIssue[], config: DomainConfig): PromotionCandidate[];
    /**
     * Mark issue as pending review
     */
    markForReview(issue: TrackedIssue, config: DomainConfig): void;
    /**
     * Apply review decision
     */
    applyReviewDecision(issue: TrackedIssue, decision: ReviewDecision): void;
    /**
     * Check if human review is required for optimization
     */
    requiresHumanReview(config: DomainConfig): boolean;
    /**
     * Generate review report for pending issues
     */
    generateReviewReport(candidates: PromotionCandidate[]): string;
    /**
     * Auto-approve issues that clearly meet all criteria
     * (Only used if requireHumanReview is false)
     */
    autoApproveIfEligible(issue: TrackedIssue, config: DomainConfig): boolean;
}
//# sourceMappingURL=review-workflow.d.ts.map