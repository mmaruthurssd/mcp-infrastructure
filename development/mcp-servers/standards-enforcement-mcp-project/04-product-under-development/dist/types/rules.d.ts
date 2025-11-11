import { z } from 'zod';
/**
 * Rule Categories - Types of standards we enforce
 */
export type RuleCategory = 'dual-environment' | 'template-first' | 'project-structure' | 'configuration' | 'documentation' | 'security';
export declare const RuleCategorySchema: z.ZodEnum<["dual-environment", "template-first", "project-structure", "configuration", "documentation", "security"]>;
/**
 * Severity levels for violations
 */
export type RuleSeverity = 'critical' | 'warning' | 'info';
export declare const RuleSeveritySchema: z.ZodEnum<["critical", "warning", "info"]>;
/**
 * Rule documentation structure
 */
export interface RuleDocumentation {
    rationale: string;
    examples: {
        good: string[];
        bad: string[];
    };
    fixes: string[];
    references: string[];
}
export declare const RuleDocumentationSchema: z.ZodObject<{
    rationale: z.ZodString;
    examples: z.ZodObject<{
        good: z.ZodArray<z.ZodString, "many">;
        bad: z.ZodArray<z.ZodString, "many">;
    }, "strip", z.ZodTypeAny, {
        good: string[];
        bad: string[];
    }, {
        good: string[];
        bad: string[];
    }>;
    fixes: z.ZodArray<z.ZodString, "many">;
    references: z.ZodArray<z.ZodString, "many">;
}, "strip", z.ZodTypeAny, {
    rationale: string;
    examples: {
        good: string[];
        bad: string[];
    };
    fixes: string[];
    references: string[];
}, {
    rationale: string;
    examples: {
        good: string[];
        bad: string[];
    };
    fixes: string[];
    references: string[];
}>;
/**
 * Validator function signature
 */
export type ValidatorFunction = (context: ValidationContext) => Promise<ValidationIssue[]>;
/**
 * Auto-fix function signature
 */
export type AutoFixFunction = (context: ValidationContext, issue: ValidationIssue) => Promise<FixAction>;
/**
 * Validation context passed to validators
 */
export interface ValidationContext {
    workspacePath: string;
    targetPath: string;
    targetType: 'mcp' | 'project' | 'workspace';
    mcpName?: string;
    projectPath?: string;
}
/**
 * Issue found during validation
 */
export interface ValidationIssue {
    ruleId: string;
    severity: RuleSeverity;
    message: string;
    location?: {
        path: string;
        line?: number;
        column?: number;
    };
    suggestion?: string;
    autoFixAvailable?: boolean;
}
/**
 * Standard Rule Definition
 */
export interface StandardRule {
    id: string;
    name: string;
    category: RuleCategory;
    severity: RuleSeverity;
    description: string;
    rationale: string;
    validator: string;
    autoFix?: string;
    documentation: RuleDocumentation;
    enabled: boolean;
    exceptions?: string[];
}
export declare const StandardRuleSchema: z.ZodObject<{
    id: z.ZodString;
    name: z.ZodString;
    category: z.ZodEnum<["dual-environment", "template-first", "project-structure", "configuration", "documentation", "security"]>;
    severity: z.ZodEnum<["critical", "warning", "info"]>;
    description: z.ZodString;
    rationale: z.ZodString;
    validator: z.ZodString;
    autoFix: z.ZodOptional<z.ZodString>;
    documentation: z.ZodObject<{
        rationale: z.ZodString;
        examples: z.ZodObject<{
            good: z.ZodArray<z.ZodString, "many">;
            bad: z.ZodArray<z.ZodString, "many">;
        }, "strip", z.ZodTypeAny, {
            good: string[];
            bad: string[];
        }, {
            good: string[];
            bad: string[];
        }>;
        fixes: z.ZodArray<z.ZodString, "many">;
        references: z.ZodArray<z.ZodString, "many">;
    }, "strip", z.ZodTypeAny, {
        rationale: string;
        examples: {
            good: string[];
            bad: string[];
        };
        fixes: string[];
        references: string[];
    }, {
        rationale: string;
        examples: {
            good: string[];
            bad: string[];
        };
        fixes: string[];
        references: string[];
    }>;
    enabled: z.ZodBoolean;
    exceptions: z.ZodOptional<z.ZodArray<z.ZodString, "many">>;
}, "strip", z.ZodTypeAny, {
    category: "dual-environment" | "template-first" | "project-structure" | "configuration" | "documentation" | "security";
    severity: "critical" | "warning" | "info";
    documentation: {
        rationale: string;
        examples: {
            good: string[];
            bad: string[];
        };
        fixes: string[];
        references: string[];
    };
    rationale: string;
    id: string;
    name: string;
    description: string;
    validator: string;
    enabled: boolean;
    autoFix?: string | undefined;
    exceptions?: string[] | undefined;
}, {
    category: "dual-environment" | "template-first" | "project-structure" | "configuration" | "documentation" | "security";
    severity: "critical" | "warning" | "info";
    documentation: {
        rationale: string;
        examples: {
            good: string[];
            bad: string[];
        };
        fixes: string[];
        references: string[];
    };
    rationale: string;
    id: string;
    name: string;
    description: string;
    validator: string;
    enabled: boolean;
    autoFix?: string | undefined;
    exceptions?: string[] | undefined;
}>;
/**
 * Fix action types
 */
export type FixAction = {
    type: 'create-file';
    path: string;
    content: string;
} | {
    type: 'edit-file';
    path: string;
    changes: Edit[];
} | {
    type: 'rename';
    from: string;
    to: string;
} | {
    type: 'move';
    from: string;
    to: string;
} | {
    type: 'delete';
    path: string;
};
export interface Edit {
    line: number;
    oldText: string;
    newText: string;
}
/**
 * Rules registry - maps rule IDs to rule definitions
 */
export interface RulesRegistry {
    rules: Map<string, StandardRule>;
    categories: Map<RuleCategory, string[]>;
}
//# sourceMappingURL=rules.d.ts.map