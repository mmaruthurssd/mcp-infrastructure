import { z } from 'zod';
/**
 * Tool 1: validate_mcp_compliance
 */
export const ValidateMcpComplianceParamsSchema = z.object({
    mcpName: z.string(),
    categories: z.array(z.string()).optional(),
    failFast: z.boolean().optional().default(false),
    includeWarnings: z.boolean().optional().default(true),
});
/**
 * Tool 2: validate_project_structure
 */
export const ValidateProjectStructureParamsSchema = z.object({
    projectPath: z.string(),
    expectedStructure: z.enum(['8-folder', '4-folder', 'custom']).default('8-folder'),
    strictMode: z.boolean().optional().default(false),
});
/**
 * Tool 3: validate_template_exists
 */
export const ValidateTemplateExistsParamsSchema = z.object({
    mcpName: z.string(),
    checkInstallable: z.boolean().optional().default(false),
    checkMetadata: z.boolean().optional().default(true),
});
/**
 * Tool 4: enforce_pre_deployment
 */
export const EnforcePreDeploymentParamsSchema = z.object({
    mcpName: z.string(),
    targetEnvironment: z.enum(['local-instances', 'production']),
    allowOverride: z.boolean().optional().default(false),
    overrideReason: z.string().optional(),
});
/**
 * Tool 5: generate_compliance_report
 */
export const GenerateComplianceReportParamsSchema = z.object({
    scope: z.enum(['workspace', 'mcp-servers', 'projects', 'single-mcp']),
    target: z.string().optional(),
    format: z.enum(['markdown', 'html', 'json']).default('markdown'),
    includeCompliant: z.boolean().optional().default(false),
    groupBy: z.enum(['category', 'severity', 'mcp']).optional(),
});
/**
 * Tool 6: suggest_fixes
 */
export const SuggestFixesParamsSchema = z.object({
    violations: z.array(z.any()), // Will use ViolationSchema
    applyFixes: z.boolean().optional().default(false),
    dryRun: z.boolean().optional().default(true),
});
/**
 * Tool 7: track_violations
 */
export const TrackViolationsParamsSchema = z.object({
    violations: z.array(z.any()), // Will use ViolationSchema
    mcpName: z.string().optional(),
    context: z.string().optional(),
});
/**
 * Tool 8: generate_standards_docs
 */
export const GenerateStandardsDocsParamsSchema = z.object({
    outputPath: z.string().optional(),
    includeExamples: z.boolean().optional().default(true),
    includeRationale: z.boolean().optional().default(true),
    format: z.enum(['markdown', 'html']).default('markdown'),
});
//# sourceMappingURL=tool-params.js.map