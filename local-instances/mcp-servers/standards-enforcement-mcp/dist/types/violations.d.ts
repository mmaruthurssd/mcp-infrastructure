import { z } from 'zod';
import { RuleCategory, RuleSeverity } from './rules.js';
/**
 * File location where violation occurred
 */
export interface FileLocation {
    path: string;
    line?: number;
    column?: number;
}
export declare const FileLocationSchema: z.ZodObject<{
    path: z.ZodString;
    line: z.ZodOptional<z.ZodNumber>;
    column: z.ZodOptional<z.ZodNumber>;
}, "strip", z.ZodTypeAny, {
    path: string;
    line?: number | undefined;
    column?: number | undefined;
}, {
    path: string;
    line?: number | undefined;
    column?: number | undefined;
}>;
/**
 * Violation - An instance where code does not meet a standard
 */
export interface Violation {
    ruleId: string;
    ruleName: string;
    category: RuleCategory;
    severity: RuleSeverity;
    message: string;
    location: FileLocation;
    suggestion: string;
    autoFixAvailable: boolean;
}
export declare const ViolationSchema: z.ZodObject<{
    ruleId: z.ZodString;
    ruleName: z.ZodString;
    category: z.ZodString;
    severity: z.ZodEnum<["critical", "warning", "info"]>;
    message: z.ZodString;
    location: z.ZodObject<{
        path: z.ZodString;
        line: z.ZodOptional<z.ZodNumber>;
        column: z.ZodOptional<z.ZodNumber>;
    }, "strip", z.ZodTypeAny, {
        path: string;
        line?: number | undefined;
        column?: number | undefined;
    }, {
        path: string;
        line?: number | undefined;
        column?: number | undefined;
    }>;
    suggestion: z.ZodString;
    autoFixAvailable: z.ZodBoolean;
}, "strip", z.ZodTypeAny, {
    message: string;
    category: string;
    severity: "critical" | "warning" | "info";
    ruleId: string;
    ruleName: string;
    location: {
        path: string;
        line?: number | undefined;
        column?: number | undefined;
    };
    suggestion: string;
    autoFixAvailable: boolean;
}, {
    message: string;
    category: string;
    severity: "critical" | "warning" | "info";
    ruleId: string;
    ruleName: string;
    location: {
        path: string;
        line?: number | undefined;
        column?: number | undefined;
    };
    suggestion: string;
    autoFixAvailable: boolean;
}>;
/**
 * Auto-fix suggestion
 */
export interface AutoFixSuggestion {
    violationId: string;
    description: string;
    preview: string;
    safe: boolean;
}
export declare const AutoFixSuggestionSchema: z.ZodObject<{
    violationId: z.ZodString;
    description: z.ZodString;
    preview: z.ZodString;
    safe: z.ZodBoolean;
}, "strip", z.ZodTypeAny, {
    description: string;
    violationId: string;
    preview: string;
    safe: boolean;
}, {
    description: string;
    violationId: string;
    preview: string;
    safe: boolean;
}>;
/**
 * Change preview for file edits
 */
export interface ChangePreview {
    path: string;
    before: string;
    after: string;
    lineNumber?: number;
}
export declare const ChangePreviewSchema: z.ZodObject<{
    path: z.ZodString;
    before: z.ZodString;
    after: z.ZodString;
    lineNumber: z.ZodOptional<z.ZodNumber>;
}, "strip", z.ZodTypeAny, {
    path: string;
    before: string;
    after: string;
    lineNumber?: number | undefined;
}, {
    path: string;
    before: string;
    after: string;
    lineNumber?: number | undefined;
}>;
//# sourceMappingURL=violations.d.ts.map