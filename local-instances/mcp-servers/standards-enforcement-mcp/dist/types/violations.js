import { z } from 'zod';
export const FileLocationSchema = z.object({
    path: z.string(),
    line: z.number().optional(),
    column: z.number().optional(),
});
export const ViolationSchema = z.object({
    ruleId: z.string(),
    ruleName: z.string(),
    category: z.string(),
    severity: z.enum(['critical', 'warning', 'info']),
    message: z.string(),
    location: FileLocationSchema,
    suggestion: z.string(),
    autoFixAvailable: z.boolean(),
});
export const AutoFixSuggestionSchema = z.object({
    violationId: z.string(),
    description: z.string(),
    preview: z.string(),
    safe: z.boolean(),
});
export const ChangePreviewSchema = z.object({
    path: z.string(),
    before: z.string(),
    after: z.string(),
    lineNumber: z.number().optional(),
});
//# sourceMappingURL=violations.js.map