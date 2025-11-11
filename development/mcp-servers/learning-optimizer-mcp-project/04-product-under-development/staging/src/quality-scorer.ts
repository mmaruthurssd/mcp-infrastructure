/**
 * Quality Scorer - Calculate quality and confidence scores for issues
 *
 * Prevents automation bias by scoring issue completeness and promotion confidence
 */

import { TrackedIssue, DomainConfig, PromotionCandidate } from './types.js';

export class QualityScorer {
  /**
   * Calculate quality score (0-100) based on issue completeness
   */
  calculateQualityScore(issue: TrackedIssue, config: DomainConfig): number {
    let score = 0;
    const standards = config.qualityStandards || {};

    // Base score: all required fields present (30 points)
    if (issue.title && issue.symptom && issue.solution) {
      score += 30;
    }

    // Root cause provided (20 points)
    if (issue.rootCause && issue.rootCause.length > 10) {
      score += 20;
    }

    // Prevention guidance provided (20 points)
    if (issue.prevention && issue.prevention.length > 10) {
      score += 20;
    }

    // Context richness (15 points)
    const contextFields = Object.keys(issue.context).length;
    const minContext = standards.minimumContextFields || 2;
    if (contextFields >= minContext) {
      score += 15;
    } else if (contextFields >= 1) {
      score += 7;
    }

    // Solution detail (10 points)
    if (issue.solution.length > 50) {
      score += 10;
    } else if (issue.solution.length > 20) {
      score += 5;
    }

    // Symptom detail (5 points)
    if (issue.symptom.length > 30) {
      score += 5;
    }

    return Math.min(100, score);
  }

  /**
   * Calculate promotion confidence (0-100) based on frequency patterns
   */
  calculatePromotionConfidence(issue: TrackedIssue): number {
    let confidence = 0;

    // Frequency contribution (max 40 points)
    if (issue.frequency >= 5) {
      confidence += 40;
    } else if (issue.frequency >= 3) {
      confidence += 30;
    } else if (issue.frequency >= 2) {
      confidence += 15;
    }

    // Temporal distribution (max 30 points)
    if (issue.temporalDistribution) {
      const { spanDays, dates } = issue.temporalDistribution;

      // Good: occurrences spread over time (not all on same day)
      if (spanDays >= 7) {
        confidence += 30;
      } else if (spanDays >= 3) {
        confidence += 20;
      } else if (spanDays >= 1) {
        confidence += 10;
      } else {
        // Warning: all occurrences on same day (likely coincidence)
        confidence += 0;
      }
    } else {
      // No temporal data, assume moderate
      confidence += 15;
    }

    // Context diversity (max 20 points)
    const contextKeys = Object.keys(issue.context);
    if (contextKeys.length >= 4) {
      confidence += 20;
    } else if (contextKeys.length >= 2) {
      confidence += 10;
    }

    // Category assigned (10 points - shows it fits a pattern)
    if (issue.category && issue.category !== 'Uncategorized') {
      confidence += 10;
    }

    return Math.min(100, confidence);
  }

  /**
   * Evaluate if issue meets quality standards for promotion
   */
  meetsQualityStandards(issue: TrackedIssue, config: DomainConfig): {
    meets: boolean;
    reasons: string[];
  } {
    const standards = config.qualityStandards || {};
    const reasons: string[] = [];

    // Check root cause requirement
    if (standards.requireRootCauseForPromotion !== false) {
      if (!issue.rootCause || issue.rootCause.length < 10) {
        reasons.push('Missing or insufficient root cause analysis');
      }
    }

    // Check prevention requirement
    if (standards.requirePreventionForPromotion !== false) {
      if (!issue.prevention || issue.prevention.length < 10) {
        reasons.push('Missing or insufficient prevention guidance');
      }
    }

    // Check minimum context
    const minContext = standards.minimumContextFields || 2;
    const contextFields = Object.keys(issue.context).length;
    if (contextFields < minContext) {
      reasons.push(`Insufficient context (${contextFields}/${minContext} fields)`);
    }

    return {
      meets: reasons.length === 0,
      reasons,
    };
  }

  /**
   * Analyze issue for promotion candidacy
   */
  analyzePromotionCandidate(issue: TrackedIssue, config: DomainConfig): PromotionCandidate {
    const qualityScore = this.calculateQualityScore(issue, config);
    const confidence = this.calculatePromotionConfidence(issue);
    const qualityCheck = this.meetsQualityStandards(issue, config);

    const reasons: string[] = [];
    const warnings: string[] = [];

    // Build reasons list
    if (issue.frequency >= config.optimizationTriggers.highImpactThreshold) {
      reasons.push(`High frequency: ${issue.frequency} occurrences`);
    }

    if (issue.temporalDistribution && issue.temporalDistribution.spanDays >= 3) {
      reasons.push(`Consistent pattern over ${issue.temporalDistribution.spanDays} days`);
    }

    if (issue.category) {
      reasons.push(`Fits category: ${issue.category}`);
    }

    if (qualityScore >= 80) {
      reasons.push('High quality documentation');
    }

    // Build warnings list
    if (qualityScore < 60) {
      warnings.push('Low quality score - consider adding more detail');
    }

    if (!qualityCheck.meets) {
      warnings.push(...qualityCheck.reasons);
    }

    if (issue.temporalDistribution && issue.temporalDistribution.spanDays < 1) {
      warnings.push('All occurrences on same day - may be coincidental');
    }

    if (confidence < 50) {
      warnings.push('Low confidence score - may not be a true pattern');
    }

    if (!issue.rootCause) {
      warnings.push('Missing root cause - preventive check may address symptoms only');
    }

    // Recommendation algorithm
    const recommendApprove =
      qualityScore >= 60 &&
      confidence >= 50 &&
      qualityCheck.meets &&
      warnings.length < 3;

    return {
      issue,
      confidence,
      qualityScore,
      reasons,
      warnings,
      recommendApprove,
    };
  }

  /**
   * Detect potential false positives
   */
  detectFalsePositives(issue: TrackedIssue): string[] {
    const warnings: string[] = [];

    // Same-day occurrences
    if (issue.temporalDistribution && issue.temporalDistribution.spanDays === 0) {
      warnings.push('All occurrences happened on the same day');
    }

    // Suspicious frequency patterns
    if (issue.frequency >= 5 && issue.temporalDistribution && issue.temporalDistribution.spanDays < 2) {
      warnings.push('High frequency in very short time span - likely same session');
    }

    // Generic symptoms
    const genericKeywords = ['error', 'failed', 'issue', 'problem', 'broke'];
    const symptomLower = issue.symptom.toLowerCase();
    if (genericKeywords.every(kw => symptomLower.includes(kw)) && issue.symptom.length < 30) {
      warnings.push('Symptom description is too generic');
    }

    // Force-flag solutions (often bad practices)
    const forceFlagPatterns = ['--force', '-f ', 'rm -rf', 'sudo '];
    if (forceFlagPatterns.some(pattern => issue.solution.includes(pattern))) {
      warnings.push('Solution contains potentially dangerous flags - review carefully');
    }

    return warnings;
  }
}
