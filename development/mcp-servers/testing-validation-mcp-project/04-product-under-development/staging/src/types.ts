/**
 * Core type definitions for Testing & Validation MCP Server
 */

// Test execution types
export type TestType = 'unit' | 'integration' | 'all';
export type TestFramework = 'jest' | 'mocha' | 'custom';
export type ReportFormat = 'text' | 'html' | 'json';
export type GateStatus = 'pass' | 'fail';
export type ValidationSeverity = 'error' | 'warning' | 'info';

// Tool input types
export interface RunMcpTestsInput {
  mcpPath: string;
  testType?: TestType;
  coverage?: boolean;
  verbose?: boolean;
}

export interface ValidateMcpImplementationInput {
  mcpPath: string;
  standards?: string[];
}

export interface CheckQualityGatesInput {
  mcpPath: string;
  phase?: 'pre-development' | 'development' | 'testing' | 'documentation' | 'pre-rollout' | 'all';
}

export interface GenerateCoverageReportInput {
  mcpPath: string;
  format?: ReportFormat;
  outputPath?: string;
}

export interface RunSmokeTestsInput {
  mcpPath: string;
  tools?: string[];
}

export interface ValidateToolSchemaInput {
  mcpPath: string;
  toolName?: string;
}

// Test results types
export interface TestRunResults {
  passed: number;
  failed: number;
  skipped: number;
  executionTime: number;
}

export interface TestFailure {
  test: string;
  suite: string;
  error: string;
  stack: string;
}

export interface FileCoverage {
  path: string;
  statements: number;
  branches: number;
  functions: number;
  lines: number;
  uncoveredLines: number[];
}

export interface CoverageReport {
  overall: number;
  statements: number;
  branches: number;
  functions: number;
  lines: number;
  files: FileCoverage[];
}

// Tool output types
export interface RunMcpTestsOutput {
  success: boolean;
  results: {
    unit?: TestRunResults;
    integration?: TestRunResults;
    total: TestRunResults;
  };
  coverage?: CoverageReport;
  failures?: TestFailure[];
  error?: string;
}

export interface ValidationIssue {
  severity: ValidationSeverity;
  message: string;
  file?: string;
  line?: number;
  recommendation?: string;
}

export interface CategoryResults {
  passed: number;
  failed: number;
  score: number;
  issues: ValidationIssue[];
}

export interface ValidateMcpImplementationOutput {
  success: boolean;
  compliance: {
    overall: number;
    categories: {
      fileStructure: CategoryResults;
      naming: CategoryResults;
      documentation: CategoryResults;
      code: CategoryResults;
      mcp: CategoryResults;
    };
  };
  recommendations: string[];
  error?: string;
}

export interface Gate {
  name: string;
  status: GateStatus;
  required: boolean;
  details: string;
  recommendation?: string;
}

export interface GateCategory {
  name: string;
  passed: number;
  failed: number;
  gates: Gate[];
}

export interface CheckQualityGatesOutput {
  success: boolean;
  gates: {
    preDevelopment?: GateCategory;
    development?: GateCategory;
    testing?: GateCategory;
    documentation?: GateCategory;
    preRollout?: GateCategory;
  };
  overall: {
    passed: number;
    failed: number;
    percentComplete: number;
    readyForRollout: boolean;
  };
  blockers: string[];
  warnings: string[];
  error?: string;
}

export interface GenerateCoverageReportOutput {
  success: boolean;
  format: ReportFormat;
  coverage?: CoverageReport;
  report?: string;
  savedTo?: string;
  error?: string;
}

export interface SmokeTestResult {
  toolName: string;
  available: boolean;
  schemaValid: boolean;
  basicInvocation: 'pass' | 'fail' | 'error';
  responseValid: boolean;
  errorHandling: 'pass' | 'fail';
  issues: string[];
}

export interface RunSmokeTestsOutput {
  success: boolean;
  results: SmokeTestResult[];
  summary: {
    total: number;
    passed: number;
    failed: number;
  };
  error?: string;
}

export interface ToolParameter {
  name: string;
  required: boolean;
  type: string;
  valid: boolean;
}

export interface ToolSchemaIssue {
  type: 'error' | 'warning';
  message: string;
  field?: string;
}

export interface ToolSchemaValidation {
  name: string;
  schemaValid: boolean;
  issues: ToolSchemaIssue[];
  parameters: ToolParameter[];
}

export interface ValidateToolSchemaOutput {
  success: boolean;
  tools: ToolSchemaValidation[];
  error?: string;
}
