import { ValidationIssue, RuleSeverity } from '../types/rules.js';
import { ValidationSummary } from '../types/validation.js';

/**
 * Compliance Calculator
 * Calculates compliance scores and metrics from validation results
 */
export class ComplianceCalculator {
  /**
   * Calculate compliance summary from validation issues
   */
  calculateSummary(
    totalRules: number,
    issues: ValidationIssue[]
  ): ValidationSummary {
    const criticalViolations = this.countBySeverity(issues, 'critical');
    const warningViolations = this.countBySeverity(issues, 'warning');
    const infoViolations = this.countBySeverity(issues, 'info');

    // Failed rules = unique rule IDs that have issues
    const failedRuleIds = new Set(issues.map((issue) => issue.ruleId));
    const failedRules = failedRuleIds.size;
    const passedRules = Math.max(0, totalRules - failedRules);

    // Calculate compliance score (0-100)
    const complianceScore = this.calculateComplianceScore(
      totalRules,
      passedRules,
      criticalViolations,
      warningViolations,
      infoViolations
    );

    return {
      totalRules,
      passedRules,
      failedRules,
      criticalViolations,
      warningViolations,
      infoViolations,
      complianceScore,
    };
  }

  /**
   * Calculate compliance score (0-100)
   *
   * Scoring formula:
   * - Base score: passedRules / totalRules * 100
   * - Critical violations: -10 points each
   * - Warning violations: -2 points each
   * - Info violations: -0.5 points each
   * - Minimum score: 0
   */
  private calculateComplianceScore(
    totalRules: number,
    passedRules: number,
    criticalViolations: number,
    warningViolations: number,
    infoViolations: number
  ): number {
    if (totalRules === 0) {
      return 100;
    }

    // Base score from passed rules
    let score = (passedRules / totalRules) * 100;

    // Deduct points for violations
    score -= criticalViolations * 10;
    score -= warningViolations * 2;
    score -= infoViolations * 0.5;

    // Clamp to 0-100 range
    return Math.max(0, Math.min(100, Math.round(score)));
  }

  /**
   * Count issues by severity
   */
  private countBySeverity(
    issues: ValidationIssue[],
    severity: RuleSeverity
  ): number {
    return issues.filter((issue) => issue.severity === severity).length;
  }

  /**
   * Determine if project is compliant
   * Compliant = no critical violations and score >= 80
   */
  isCompliant(summary: ValidationSummary): boolean {
    return summary.criticalViolations === 0 && summary.complianceScore >= 80;
  }

  /**
   * Get compliance grade
   */
  getComplianceGrade(score: number): string {
    if (score >= 95) return 'A+';
    if (score >= 90) return 'A';
    if (score >= 85) return 'B+';
    if (score >= 80) return 'B';
    if (score >= 75) return 'C+';
    if (score >= 70) return 'C';
    if (score >= 60) return 'D';
    return 'F';
  }

  /**
   * Calculate improvement needed to reach target score
   */
  calculateImprovementNeeded(
    currentScore: number,
    targetScore: number,
    summary: ValidationSummary
  ): {
    criticalToFix: number;
    warningsToFix: number;
    pointsNeeded: number;
  } {
    const pointsNeeded = Math.max(0, targetScore - currentScore);

    // Estimate violations to fix
    // Priority: fix all criticals first, then warnings
    const criticalToFix = Math.min(
      summary.criticalViolations,
      Math.ceil(pointsNeeded / 10)
    );

    const remainingPoints = pointsNeeded - criticalToFix * 10;
    const warningsToFix = Math.min(
      summary.warningViolations,
      Math.ceil(remainingPoints / 2)
    );

    return {
      criticalToFix,
      warningsToFix,
      pointsNeeded,
    };
  }
}

/**
 * Global compliance calculator instance
 */
export const globalComplianceCalculator = new ComplianceCalculator();
