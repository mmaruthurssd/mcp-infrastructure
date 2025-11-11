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

export const FileLocationSchema = z.object({
  path: z.string(),
  line: z.number().optional(),
  column: z.number().optional(),
});

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

/**
 * Auto-fix suggestion
 */
export interface AutoFixSuggestion {
  violationId: string;
  description: string;
  preview: string;
  safe: boolean;
}

export const AutoFixSuggestionSchema = z.object({
  violationId: z.string(),
  description: z.string(),
  preview: z.string(),
  safe: z.boolean(),
});

/**
 * Change preview for file edits
 */
export interface ChangePreview {
  path: string;
  before: string;
  after: string;
  lineNumber?: number;
}

export const ChangePreviewSchema = z.object({
  path: z.string(),
  before: z.string(),
  after: z.string(),
  lineNumber: z.number().optional(),
});
