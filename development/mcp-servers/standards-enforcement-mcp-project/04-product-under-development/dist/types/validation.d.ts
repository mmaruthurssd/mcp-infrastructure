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
    complianceScore: number;
}
export declare const ValidationSummarySchema: z.ZodObject<{
    totalRules: z.ZodNumber;
    passedRules: z.ZodNumber;
    failedRules: z.ZodNumber;
    criticalViolations: z.ZodNumber;
    warningViolations: z.ZodNumber;
    infoViolations: z.ZodNumber;
    complianceScore: z.ZodNumber;
}, "strip", z.ZodTypeAny, {
    totalRules: number;
    passedRules: number;
    failedRules: number;
    criticalViolations: number;
    warningViolations: number;
    infoViolations: number;
    complianceScore: number;
}, {
    totalRules: number;
    passedRules: number;
    failedRules: number;
    criticalViolations: number;
    warningViolations: number;
    infoViolations: number;
    complianceScore: number;
}>;
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
export declare const ValidationResultSchema: z.ZodObject<{
    success: z.ZodBoolean;
    compliant: z.ZodBoolean;
    violations: z.ZodArray<z.ZodAny, "many">;
    summary: z.ZodObject<{
        totalRules: z.ZodNumber;
        passedRules: z.ZodNumber;
        failedRules: z.ZodNumber;
        criticalViolations: z.ZodNumber;
        warningViolations: z.ZodNumber;
        infoViolations: z.ZodNumber;
        complianceScore: z.ZodNumber;
    }, "strip", z.ZodTypeAny, {
        totalRules: number;
        passedRules: number;
        failedRules: number;
        criticalViolations: number;
        warningViolations: number;
        infoViolations: number;
        complianceScore: number;
    }, {
        totalRules: number;
        passedRules: number;
        failedRules: number;
        criticalViolations: number;
        warningViolations: number;
        infoViolations: number;
        complianceScore: number;
    }>;
    timestamp: z.ZodString;
}, "strip", z.ZodTypeAny, {
    violations: any[];
    success: boolean;
    compliant: boolean;
    summary: {
        totalRules: number;
        passedRules: number;
        failedRules: number;
        criticalViolations: number;
        warningViolations: number;
        infoViolations: number;
        complianceScore: number;
    };
    timestamp: string;
}, {
    violations: any[];
    success: boolean;
    compliant: boolean;
    summary: {
        totalRules: number;
        passedRules: number;
        failedRules: number;
        criticalViolations: number;
        warningViolations: number;
        infoViolations: number;
        complianceScore: number;
    };
    timestamp: string;
}>;
/**
 * Workspace compliance summary
 */
export interface WorkspaceSummary {
    totalMcps: number;
    compliantMcps: number;
    nonCompliantMcps: number;
    overallScore: number;
    criticalViolations: number;
    warningViolations: number;
}
export declare const WorkspaceSummarySchema: z.ZodObject<{
    totalMcps: z.ZodNumber;
    compliantMcps: z.ZodNumber;
    nonCompliantMcps: z.ZodNumber;
    overallScore: z.ZodNumber;
    criticalViolations: z.ZodNumber;
    warningViolations: z.ZodNumber;
}, "strip", z.ZodTypeAny, {
    criticalViolations: number;
    warningViolations: number;
    totalMcps: number;
    compliantMcps: number;
    nonCompliantMcps: number;
    overallScore: number;
}, {
    criticalViolations: number;
    warningViolations: number;
    totalMcps: number;
    compliantMcps: number;
    nonCompliantMcps: number;
    overallScore: number;
}>;
/**
 * Compliance trend over time
 */
export interface ComplianceTrend {
    date: string;
    complianceScore: number;
    violationCount: number;
}
export declare const ComplianceTrendSchema: z.ZodObject<{
    date: z.ZodString;
    complianceScore: z.ZodNumber;
    violationCount: z.ZodNumber;
}, "strip", z.ZodTypeAny, {
    date: string;
    complianceScore: number;
    violationCount: number;
}, {
    date: string;
    complianceScore: number;
    violationCount: number;
}>;
/**
 * Violation trends
 */
export interface ViolationTrends {
    topViolations: Array<{
        ruleId: string;
        count: number;
    }>;
    repeatOffenders: string[];
    improvementScore: number;
}
export declare const ViolationTrendsSchema: z.ZodObject<{
    topViolations: z.ZodArray<z.ZodObject<{
        ruleId: z.ZodString;
        count: z.ZodNumber;
    }, "strip", z.ZodTypeAny, {
        ruleId: string;
        count: number;
    }, {
        ruleId: string;
        count: number;
    }>, "many">;
    repeatOffenders: z.ZodArray<z.ZodString, "many">;
    improvementScore: z.ZodNumber;
}, "strip", z.ZodTypeAny, {
    topViolations: {
        ruleId: string;
        count: number;
    }[];
    repeatOffenders: string[];
    improvementScore: number;
}, {
    topViolations: {
        ruleId: string;
        count: number;
    }[];
    repeatOffenders: string[];
    improvementScore: number;
}>;
//# sourceMappingURL=validation.d.ts.map