/**
 * Quality Scorer - Calculate quality and confidence scores for issues
 *
 * Prevents automation bias by scoring issue completeness and promotion confidence
 */
import { TrackedIssue, DomainConfig, PromotionCandidate } from './types.js';
export declare class QualityScorer {
    /**
     * Calculate quality score (0-100) based on issue completeness
     */
    calculateQualityScore(issue: TrackedIssue, config: DomainConfig): number;
    /**
     * Calculate promotion confidence (0-100) based on frequency patterns
     */
    calculatePromotionConfidence(issue: TrackedIssue): number;
    /**
     * Evaluate if issue meets quality standards for promotion
     */
    meetsQualityStandards(issue: TrackedIssue, config: DomainConfig): {
        meets: boolean;
        reasons: string[];
    };
    /**
     * Analyze issue for promotion candidacy
     */
    analyzePromotionCandidate(issue: TrackedIssue, config: DomainConfig): PromotionCandidate;
    /**
     * Detect potential false positives
     */
    detectFalsePositives(issue: TrackedIssue): string[];
}
//# sourceMappingURL=quality-scorer.d.ts.map