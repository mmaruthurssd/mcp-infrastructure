import { z } from 'zod';

/**
 * Rule Categories - Types of standards we enforce
 */
export type RuleCategory =
  | 'dual-environment'
  | 'template-first'
  | 'project-structure'
  | 'configuration'
  | 'documentation'
  | 'security';

export const RuleCategorySchema = z.enum([
  'dual-environment',
  'template-first',
  'project-structure',
  'configuration',
  'documentation',
  'security',
]);

/**
 * Severity levels for violations
 */
export type RuleSeverity = 'critical' | 'warning' | 'info';

export const RuleSeveritySchema = z.enum(['critical', 'warning', 'info']);

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

export const RuleDocumentationSchema = z.object({
  rationale: z.string(),
  examples: z.object({
    good: z.array(z.string()),
    bad: z.array(z.string()),
  }),
  fixes: z.array(z.string()),
  references: z.array(z.string()),
});

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
  validator: string; // Validator function name
  autoFix?: string; // Auto-fix function name
  documentation: RuleDocumentation;
  enabled: boolean;
  exceptions?: string[]; // Paths to exclude
}

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

/**
 * Fix action types
 */
export type FixAction =
  | { type: 'create-file'; path: string; content: string }
  | { type: 'edit-file'; path: string; changes: Edit[] }
  | { type: 'rename'; from: string; to: string }
  | { type: 'move'; from: string; to: string }
  | { type: 'delete'; path: string };

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
  categories: Map<RuleCategory, string[]>; // category -> rule IDs
}
