import { z } from 'zod';
import { Violation } from './violations.js';

/**
 * Validation summary statistics
 */
export interface ValidationSummary {
  totalRules: number;
  passedRules: number;
  failedRules: number;
  criticalViolations: number;
  warningViolations: number;
  infoViolations: number;
  complianceScore: number; // 0-100
}

export const ValidationSummarySchema = z.object({
  totalRules: z.number(),
  passedRules: z.number(),
  failedRules: z.number(),
  criticalViolations: z.number(),
  warningViolations: z.number(),
  infoViolations: z.number(),
  complianceScore: z.number().min(0).max(100),
});

/**
 * Validation result
 */
export interface ValidationResult {
  success: boolean;
  compliant: boolean;
  violations: Violation[];
  summary: ValidationSummary;
  timestamp: string;
}

export const ValidationResultSchema = z.object({
  success: z.boolean(),
  compliant: z.boolean(),
  violations: z.array(z.any()), // Will use ViolationSchema
  summary: ValidationSummarySchema,
  timestamp: z.string(),
});

/**
 * Workspace compliance summary
 */
export interface WorkspaceSummary {
  totalMcps: number;
  compliantMcps: number;
  nonCompliantMcps: number;
  overallScore: number; // 0-100
  criticalViolations: number;
  warningViolations: number;
}

export const WorkspaceSummarySchema = z.object({
  totalMcps: z.number(),
  compliantMcps: z.number(),
  nonCompliantMcps: z.number(),
  overallScore: z.number().min(0).max(100),
  criticalViolations: z.number(),
  warningViolations: z.number(),
});

/**
 * Compliance trend over time
 */
export interface ComplianceTrend {
  date: string;
  complianceScore: number;
  violationCount: number;
}

export const ComplianceTrendSchema = z.object({
  date: z.string(),
  complianceScore: z.number(),
  violationCount: z.number(),
});

/**
 * Violation trends
 */
export interface ViolationTrends {
  topViolations: Array<{ ruleId: string; count: number }>;
  repeatOffenders: string[];
  improvementScore: number;
}

export const ViolationTrendsSchema = z.object({
  topViolations: z.array(
    z.object({
      ruleId: z.string(),
      count: z.number(),
    })
  ),
  repeatOffenders: z.array(z.string()),
  improvementScore: z.number(),
});
