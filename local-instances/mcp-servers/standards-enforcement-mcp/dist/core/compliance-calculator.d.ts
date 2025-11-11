import { ValidationIssue } from '../types/rules.js';
import { ValidationSummary } from '../types/validation.js';
/**
 * Compliance Calculator
 * Calculates compliance scores and metrics from validation results
 */
export declare class ComplianceCalculator {
    /**
     * Calculate compliance summary from validation issues
     */
    calculateSummary(totalRules: number, issues: ValidationIssue[]): ValidationSummary;
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
    private calculateComplianceScore;
    /**
     * Count issues by severity
     */
    private countBySeverity;
    /**
     * Determine if project is compliant
     * Compliant = no critical violations and score >= 80
     */
    isCompliant(summary: ValidationSummary): boolean;
    /**
     * Get compliance grade
     */
    getComplianceGrade(score: number): string;
    /**
     * Calculate improvement needed to reach target score
     */
    calculateImprovementNeeded(currentScore: number, targetScore: number, summary: ValidationSummary): {
        criticalToFix: number;
        warningsToFix: number;
        pointsNeeded: number;
    };
}
/**
 * Global compliance calculator instance
 */
export declare const globalComplianceCalculator: ComplianceCalculator;
//# sourceMappingURL=compliance-calculator.d.ts.map