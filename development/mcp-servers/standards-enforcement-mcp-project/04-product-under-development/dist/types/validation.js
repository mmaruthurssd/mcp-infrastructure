import { z } from 'zod';
export const ValidationSummarySchema = z.object({
    totalRules: z.number(),
    passedRules: z.number(),
    failedRules: z.number(),
    criticalViolations: z.number(),
    warningViolations: z.number(),
    infoViolations: z.number(),
    complianceScore: z.number().min(0).max(100),
});
export const ValidationResultSchema = z.object({
    success: z.boolean(),
    compliant: z.boolean(),
    violations: z.array(z.any()), // Will use ViolationSchema
    summary: ValidationSummarySchema,
    timestamp: z.string(),
});
export const WorkspaceSummarySchema = z.object({
    totalMcps: z.number(),
    compliantMcps: z.number(),
    nonCompliantMcps: z.number(),
    overallScore: z.number().min(0).max(100),
    criticalViolations: z.number(),
    warningViolations: z.number(),
});
export const ComplianceTrendSchema = z.object({
    date: z.string(),
    complianceScore: z.number(),
    violationCount: z.number(),
});
export const ViolationTrendsSchema = z.object({
    topViolations: z.array(z.object({
        ruleId: z.string(),
        count: z.number(),
    })),
    repeatOffenders: z.array(z.string()),
    improvementScore: z.number(),
});
//# sourceMappingURL=validation.js.map