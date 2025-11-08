/**
 * Review Workflow - Human review system for promoted issues
 *
 * Prevents automation bias by requiring human approval before promotion
 */

import { TrackedIssue, PromotionCandidate, ReviewDecision, DomainConfig } from './types.js';
import { QualityScorer } from './quality-scorer.js';

export class ReviewWorkflow {
  private qualityScorer: QualityScorer;

  constructor() {
    this.qualityScorer = new QualityScorer();
  }

  /**
   * Get all issues pending review for a domain
   */
  getPendingReviews(issues: TrackedIssue[]): TrackedIssue[] {
    return issues.filter(issue => issue.promotionPending && !issue.promoted);
  }

  /**
   * Get promotion candidates (issues that should be reviewed)
   */
  getPromotionCandidates(issues: TrackedIssue[], config: DomainConfig): PromotionCandidate[] {
    const candidates: PromotionCandidate[] = [];
    const threshold = config.optimizationTriggers.highImpactThreshold;

    for (const issue of issues) {
      // Skip already promoted, excluded, or merged
      if (issue.promoted || issue.excludeFromPromotion || issue.mergedInto) {
        continue;
      }

      // Only consider high-frequency issues
      if (issue.frequency >= threshold) {
        const candidate = this.qualityScorer.analyzePromotionCandidate(issue, config);
        candidates.push(candidate);
      }
    }

    // Sort by confidence score descending
    candidates.sort((a, b) => b.confidence - a.confidence);

    return candidates;
  }

  /**
   * Mark issue as pending review
   */
  markForReview(issue: TrackedIssue, config: DomainConfig): void {
    issue.promotionPending = true;
    issue.promotionConfidence = this.qualityScorer.calculatePromotionConfidence(issue);
    issue.qualityScore = this.qualityScorer.calculateQualityScore(issue, config);
  }

  /**
   * Apply review decision
   */
  applyReviewDecision(issue: TrackedIssue, decision: ReviewDecision): void {
    issue.promotionPending = false;
    issue.reviewedBy = decision.reviewedBy;
    issue.reviewedAt = new Date().toISOString();
    issue.reviewNotes = decision.reviewNotes;

    switch (decision.action) {
      case 'approve':
        issue.promoted = true;
        break;
      case 'reject':
        issue.excludeFromPromotion = true;
        break;
      case 'defer':
        // Keep as-is, can be reviewed again later
        break;
    }
  }

  /**
   * Check if human review is required for optimization
   */
  requiresHumanReview(config: DomainConfig): boolean {
    // Default to true for safety
    return config.optimizationTriggers.requireHumanReview !== false;
  }

  /**
   * Generate review report for pending issues
   */
  generateReviewReport(candidates: PromotionCandidate[]): string {
    let report = '# Promotion Review Required\n\n';
    report += `**${candidates.length} issue(s) pending review**\n\n`;
    report += '---\n\n';

    for (let i = 0; i < candidates.length; i++) {
      const candidate = candidates[i];
      const issue = candidate.issue;

      report += `## ${i + 1}. Issue #${issue.issueNumber}: ${issue.title}\n\n`;

      // Recommendation
      if (candidate.recommendApprove) {
        report += '**Recommendation:** ✅ APPROVE\n\n';
      } else {
        report += '**Recommendation:** ⚠️ REVIEW CAREFULLY\n\n';
      }

      // Scores
      report += `**Quality Score:** ${candidate.qualityScore}/100\n`;
      report += `**Confidence Score:** ${candidate.confidence}/100\n\n`;

      // Frequency and pattern
      report += `**Frequency:** ${issue.frequency} occurrences\n`;
      if (issue.temporalDistribution) {
        report += `**Time Span:** ${issue.temporalDistribution.spanDays} days\n`;
      }
      report += `**Category:** ${issue.category || 'Uncategorized'}\n\n`;

      // Reasons for promotion
      if (candidate.reasons.length > 0) {
        report += '**Reasons for Promotion:**\n';
        for (const reason of candidate.reasons) {
          report += `- ${reason}\n`;
        }
        report += '\n';
      }

      // Warnings
      if (candidate.warnings.length > 0) {
        report += '**⚠️ Warnings:**\n';
        for (const warning of candidate.warnings) {
          report += `- ${warning}\n`;
        }
        report += '\n';
      }

      // Issue details
      report += '**Symptom:**\n';
      report += `\`\`\`\n${issue.symptom}\n\`\`\`\n\n`;

      report += '**Solution:**\n';
      report += `\`\`\`\n${issue.solution}\n\`\`\`\n\n`;

      if (issue.rootCause) {
        report += '**Root Cause:**\n';
        report += `${issue.rootCause}\n\n`;
      }

      if (issue.prevention) {
        report += '**Prevention:**\n';
        report += `${issue.prevention}\n\n`;
      }

      // False positive checks
      const falsePositiveWarnings = this.qualityScorer.detectFalsePositives(issue);
      if (falsePositiveWarnings.length > 0) {
        report += '**🚨 False Positive Checks:**\n';
        for (const warning of falsePositiveWarnings) {
          report += `- ${warning}\n`;
        }
        report += '\n';
      }

      report += '---\n\n';
    }

    // Summary statistics
    report += '## Summary\n\n';
    const recommended = candidates.filter(c => c.recommendApprove).length;
    const needsReview = candidates.length - recommended;
    report += `- ${recommended} recommended for approval\n`;
    report += `- ${needsReview} need careful review\n\n`;

    // Decision guide
    report += '## Review Decision Guide\n\n';
    report += '**Approve if:**\n';
    report += '- Quality score ≥ 60\n';
    report += '- Confidence score ≥ 50\n';
    report += '- Has root cause and prevention guidance\n';
    report += '- Time span ≥ 3 days (not coincidental)\n';
    report += '- No dangerous flags in solution\n\n';

    report += '**Reject if:**\n';
    report += '- All occurrences on same day (coincidental)\n';
    report += '- Generic symptom with no detail\n';
    report += '- Solution uses dangerous force flags without justification\n';
    report += '- Missing critical context\n\n';

    report += '**Defer if:**\n';
    report += '- Need more occurrences to confirm pattern\n';
    report += '- Waiting for more context/details\n';
    report += '- Uncertain if this is a real pattern\n\n';

    return report;
  }

  /**
   * Auto-approve issues that clearly meet all criteria
   * (Only used if requireHumanReview is false)
   */
  autoApproveIfEligible(issue: TrackedIssue, config: DomainConfig): boolean {
    // Never auto-approve if human review is required
    if (this.requiresHumanReview(config)) {
      return false;
    }

    const candidate = this.qualityScorer.analyzePromotionCandidate(issue, config);

    // Very strict criteria for auto-approval
    const eligible =
      candidate.qualityScore >= 80 &&
      candidate.confidence >= 80 &&
      candidate.warnings.length === 0 &&
      candidate.recommendApprove &&
      !!issue.rootCause &&
      !!issue.prevention &&
      !!issue.temporalDistribution &&
      issue.temporalDistribution.spanDays >= 3;

    if (eligible) {
      issue.promoted = true;
      issue.reviewedBy = 'auto-approved';
      issue.reviewedAt = new Date().toISOString();
      issue.reviewNotes = 'Auto-approved: met all quality and confidence criteria';
    }

    return eligible;
  }
}
