import { z } from 'zod';
/**
 * Tool 1: validate_mcp_compliance
 */
export declare const ValidateMcpComplianceParamsSchema: z.ZodObject<{
    mcpName: z.ZodString;
    categories: z.ZodOptional<z.ZodArray<z.ZodString, "many">>;
    failFast: z.ZodDefault<z.ZodOptional<z.ZodBoolean>>;
    includeWarnings: z.ZodDefault<z.ZodOptional<z.ZodBoolean>>;
}, "strip", z.ZodTypeAny, {
    mcpName: string;
    failFast: boolean;
    includeWarnings: boolean;
    categories?: string[] | undefined;
}, {
    mcpName: string;
    categories?: string[] | undefined;
    failFast?: boolean | undefined;
    includeWarnings?: boolean | undefined;
}>;
export type ValidateMcpComplianceParams = z.infer<typeof ValidateMcpComplianceParamsSchema>;
/**
 * Tool 2: validate_project_structure
 */
export declare const ValidateProjectStructureParamsSchema: z.ZodObject<{
    projectPath: z.ZodString;
    expectedStructure: z.ZodDefault<z.ZodEnum<["8-folder", "4-folder", "custom"]>>;
    strictMode: z.ZodDefault<z.ZodOptional<z.ZodBoolean>>;
}, "strip", z.ZodTypeAny, {
    projectPath: string;
    expectedStructure: "8-folder" | "4-folder" | "custom";
    strictMode: boolean;
}, {
    projectPath: string;
    expectedStructure?: "8-folder" | "4-folder" | "custom" | undefined;
    strictMode?: boolean | undefined;
}>;
export type ValidateProjectStructureParams = z.infer<typeof ValidateProjectStructureParamsSchema>;
/**
 * Tool 3: validate_template_exists
 */
export declare const ValidateTemplateExistsParamsSchema: z.ZodObject<{
    mcpName: z.ZodString;
    checkInstallable: z.ZodDefault<z.ZodOptional<z.ZodBoolean>>;
    checkMetadata: z.ZodDefault<z.ZodOptional<z.ZodBoolean>>;
}, "strip", z.ZodTypeAny, {
    mcpName: string;
    checkInstallable: boolean;
    checkMetadata: boolean;
}, {
    mcpName: string;
    checkInstallable?: boolean | undefined;
    checkMetadata?: boolean | undefined;
}>;
export type ValidateTemplateExistsParams = z.infer<typeof ValidateTemplateExistsParamsSchema>;
/**
 * Tool 4: enforce_pre_deployment
 */
export declare const EnforcePreDeploymentParamsSchema: z.ZodObject<{
    mcpName: z.ZodString;
    targetEnvironment: z.ZodEnum<["local-instances", "production"]>;
    allowOverride: z.ZodDefault<z.ZodOptional<z.ZodBoolean>>;
    overrideReason: z.ZodOptional<z.ZodString>;
}, "strip", z.ZodTypeAny, {
    mcpName: string;
    targetEnvironment: "local-instances" | "production";
    allowOverride: boolean;
    overrideReason?: string | undefined;
}, {
    mcpName: string;
    targetEnvironment: "local-instances" | "production";
    allowOverride?: boolean | undefined;
    overrideReason?: string | undefined;
}>;
export type EnforcePreDeploymentParams = z.infer<typeof EnforcePreDeploymentParamsSchema>;
/**
 * Tool 5: generate_compliance_report
 */
export declare const GenerateComplianceReportParamsSchema: z.ZodObject<{
    scope: z.ZodEnum<["workspace", "mcp-servers", "projects", "single-mcp"]>;
    target: z.ZodOptional<z.ZodString>;
    format: z.ZodDefault<z.ZodEnum<["markdown", "html", "json"]>>;
    includeCompliant: z.ZodDefault<z.ZodOptional<z.ZodBoolean>>;
    groupBy: z.ZodOptional<z.ZodEnum<["category", "severity", "mcp"]>>;
}, "strip", z.ZodTypeAny, {
    scope: "workspace" | "mcp-servers" | "projects" | "single-mcp";
    format: "markdown" | "html" | "json";
    includeCompliant: boolean;
    target?: string | undefined;
    groupBy?: "category" | "severity" | "mcp" | undefined;
}, {
    scope: "workspace" | "mcp-servers" | "projects" | "single-mcp";
    target?: string | undefined;
    format?: "markdown" | "html" | "json" | undefined;
    includeCompliant?: boolean | undefined;
    groupBy?: "category" | "severity" | "mcp" | undefined;
}>;
export type GenerateComplianceReportParams = z.infer<typeof GenerateComplianceReportParamsSchema>;
/**
 * Tool 6: suggest_fixes
 */
export declare const SuggestFixesParamsSchema: z.ZodObject<{
    violations: z.ZodArray<z.ZodAny, "many">;
    applyFixes: z.ZodDefault<z.ZodOptional<z.ZodBoolean>>;
    dryRun: z.ZodDefault<z.ZodOptional<z.ZodBoolean>>;
}, "strip", z.ZodTypeAny, {
    violations: any[];
    applyFixes: boolean;
    dryRun: boolean;
}, {
    violations: any[];
    applyFixes?: boolean | undefined;
    dryRun?: boolean | undefined;
}>;
export type SuggestFixesParams = z.infer<typeof SuggestFixesParamsSchema>;
/**
 * Tool 7: track_violations
 */
export declare const TrackViolationsParamsSchema: z.ZodObject<{
    violations: z.ZodArray<z.ZodAny, "many">;
    mcpName: z.ZodOptional<z.ZodString>;
    context: z.ZodOptional<z.ZodString>;
}, "strip", z.ZodTypeAny, {
    violations: any[];
    mcpName?: string | undefined;
    context?: string | undefined;
}, {
    violations: any[];
    mcpName?: string | undefined;
    context?: string | undefined;
}>;
export type TrackViolationsParams = z.infer<typeof TrackViolationsParamsSchema>;
/**
 * Tool 8: generate_standards_docs
 */
export declare const GenerateStandardsDocsParamsSchema: z.ZodObject<{
    outputPath: z.ZodOptional<z.ZodString>;
    includeExamples: z.ZodDefault<z.ZodOptional<z.ZodBoolean>>;
    includeRationale: z.ZodDefault<z.ZodOptional<z.ZodBoolean>>;
    format: z.ZodDefault<z.ZodEnum<["markdown", "html"]>>;
}, "strip", z.ZodTypeAny, {
    format: "markdown" | "html";
    includeExamples: boolean;
    includeRationale: boolean;
    outputPath?: string | undefined;
}, {
    format?: "markdown" | "html" | undefined;
    outputPath?: string | undefined;
    includeExamples?: boolean | undefined;
    includeRationale?: boolean | undefined;
}>;
export type GenerateStandardsDocsParams = z.infer<typeof GenerateStandardsDocsParamsSchema>;
//# sourceMappingURL=tool-params.d.ts.map