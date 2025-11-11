import { z } from 'zod';
export const RuleCategorySchema = z.enum([
    'dual-environment',
    'template-first',
    'project-structure',
    'configuration',
    'documentation',
    'security',
]);
export const RuleSeveritySchema = z.enum(['critical', 'warning', 'info']);
export const RuleDocumentationSchema = z.object({
    rationale: z.string(),
    examples: z.object({
        good: z.array(z.string()),
        bad: z.array(z.string()),
    }),
    fixes: z.array(z.string()),
    references: z.array(z.string()),
});
export const StandardRuleSchema = z.object({
    id: z.string(),
    name: z.string(),
    category: RuleCategorySchema,
    severity: RuleSeveritySchema,
    description: z.string(),
    rationale: z.string(),
    validator: z.string(),
    autoFix: z.string().optional(),
    documentation: RuleDocumentationSchema,
    enabled: z.boolean(),
    exceptions: z.array(z.string()).optional(),
});
//# sourceMappingURL=rules.js.map