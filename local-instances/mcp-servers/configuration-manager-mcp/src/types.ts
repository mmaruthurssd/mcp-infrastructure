/**
 * Configuration Manager MCP - Type Definitions
 * Version: 1.0.0
 */

// ============================================================================
// Tool 1: manage_secrets
// ============================================================================

export type SecretAction = "store" | "retrieve" | "rotate" | "delete" | "list";

export interface SecretMetadata {
  description: string;
  createdBy: string;
  createdAt: string;
  lastRotated?: string;
  rotationDue?: string;
  rotationDays: number;
  accessCount: number;
  lastAccessed?: string;
}

export interface ManageSecretsParams {
  action: SecretAction;
  key?: string;
  value?: string;
  rotationDays?: number;
  metadata?: Partial<SecretMetadata>;
}

export interface SecretListItem {
  key: string;
  metadata: SecretMetadata;
}

export interface ManageSecretsResult {
  success: boolean;
  action: string;
  key?: string;
  value?: string;
  secrets?: SecretListItem[];
  message: string;
}

// ============================================================================
// Tool 2: validate_config
// ============================================================================

export type SchemaType = "mcp-config" | "project-config" | "environment-config" | "custom";
export type ReportFormat = "text" | "json";
export type ErrorSeverity = "error" | "warning";

export interface ConfigValidationError {
  path: string;
  message: string;
  severity: ErrorSeverity;
}

export interface ValidationWarning {
  path: string;
  message: string;
}

export interface ValidateConfigParams {
  configPath: string;
  schemaPath?: string;
  schemaType?: SchemaType;
  strict?: boolean;
  reportFormat?: ReportFormat;
}

export interface ValidateConfigResult {
  success: boolean;
  valid: boolean;
  configPath: string;
  schemaUsed: string;
  errors?: ConfigValidationError[];
  warnings?: ValidationWarning[];
  suggestions?: string[];
  report?: string;
}

// ============================================================================
// Tool 3: get_environment_vars
// ============================================================================

export type Environment = "development" | "staging" | "production" | "test";
export type EnvironmentFormat = "json" | "dotenv" | "shell";

export interface GetEnvironmentVarsParams {
  environment: Environment;
  projectPath?: string;
  variables?: string[];
  includeDefaults?: boolean;
  format?: EnvironmentFormat;
}

export interface GetEnvironmentVarsResult {
  success: boolean;
  environment: string;
  variables: Record<string, string>;
  defaults?: Record<string, string>;
  missing?: string[];
  source: string;
  warnings?: string[];
}

// ============================================================================
// Tool 4: template_config
// ============================================================================

export type TemplateType = "mcp-server" | "project" | "environment" | "github-action" | "docker";

export interface TemplateOptions {
  projectName?: string;
  includeExamples?: boolean;
  includeComments?: boolean;
  environments?: string[];
  overwrite?: boolean;
}

export interface TemplateConfigParams {
  templateType: TemplateType;
  outputPath: string;
  options?: TemplateOptions;
  customFields?: Record<string, any>;
}

export interface TemplateConfigResult {
  success: boolean;
  templateType: string;
  outputPath: string;
  filesCreated: string[];
  content?: string;
  instructions?: string[];
}

// ============================================================================
// Tool 5: check_config_drift
// ============================================================================

export type ConfigType = "environment" | "mcp-config" | "all";
export type DriftSeverity = "critical" | "warning" | "info";

export interface DriftItem {
  key: string;
  values: Record<string, string>;
  severity: DriftSeverity;
  recommendation?: string;
}

export interface DriftSummary {
  totalKeys: number;
  driftingKeys: number;
  criticalDrifts: number;
  warningDrifts: number;
  environmentsParity: number; // 0-100%
}

export interface CheckConfigDriftParams {
  projectPath: string;
  environments: string[];
  configType: ConfigType;
  ignoreKeys?: string[];
  reportFormat?: ReportFormat;
}

export interface CheckConfigDriftResult {
  success: boolean;
  hasDrift: boolean;
  environments: string[];
  drifts: DriftItem[];
  summary: DriftSummary;
  report?: string;
}

// ============================================================================
// Data Models
// ============================================================================

export interface ConfigSchema {
  $schema: string;
  type: "object";
  required: string[];
  properties: Record<string, SchemaProperty>;
  additionalProperties?: boolean;
}

export interface SchemaProperty {
  type: string | string[];
  description?: string;
  default?: any;
  enum?: any[];
  format?: string;
  pattern?: string;
  minimum?: number;
  maximum?: number;
  minLength?: number;
  maxLength?: number;
  items?: SchemaProperty;
  properties?: Record<string, SchemaProperty>;
  required?: string[];
}

export interface EnvironmentConfig {
  environment: string;
  variables: Record<string, string>;
  source: string;
  loadedAt: string;
  validated: boolean;
}

export interface DriftReport {
  generatedAt: string;
  environments: string[];
  drifts: DriftItem[];
  summary: DriftSummary;
}

// ============================================================================
// Error Types
// ============================================================================

export interface ConfigError {
  code: string;
  message: string;
  details?: any;
  suggestions?: string[];
}

export class ConfigurationError extends Error {
  code: string;
  details?: any;
  suggestions?: string[];

  constructor(code: string, message: string, details?: any, suggestions?: string[]) {
    super(message);
    this.name = "ConfigurationError";
    this.code = code;
    this.details = details;
    this.suggestions = suggestions;
  }
}

export class SecretError extends Error {
  code: string;
  details?: any;

  constructor(code: string, message: string, details?: any) {
    super(message);
    this.name = "SecretError";
    this.code = code;
    this.details = details;
  }
}

export class ValidationError extends Error {
  code: string;
  errors: ValidationError[];

  constructor(code: string, message: string, errors: ValidationError[]) {
    super(message);
    this.name = "ValidationError";
    this.code = code;
    this.errors = errors;
  }
}

// ============================================================================
// Utility Types
// ============================================================================

export interface KeychainCredential {
  account: string;
  password: string;
}

export interface EnvironmentFile {
  path: string;
  environment: string;
  variables: Record<string, string>;
  exists: boolean;
}

export interface Template {
  type: TemplateType;
  name: string;
  description: string;
  files: TemplateFile[];
  requiredFields: string[];
  optionalFields: string[];
}

export interface TemplateFile {
  filename: string;
  content: string;
  placeholders: string[];
}

export interface SecretsStorage {
  serviceName: string;
  accountPrefix: string;
  metadataKey: string;
}

// ============================================================================
// Configuration Types
// ============================================================================

export interface ConfigManagerConfig {
  secrets: {
    serviceName: string;
    rotationDays: number;
    enableAudit: boolean;
  };
  validation: {
    strict: boolean;
    schemasPath: string;
  };
  environment: {
    defaultEnvironment: Environment;
    hierarchyEnabled: boolean;
  };
  templates: {
    templatesPath: string;
  };
}

// ============================================================================
// Audit Log Types
// ============================================================================

export interface AuditLogEntry {
  timestamp: string;
  action: string;
  key: string; // Redacted
  success: boolean;
  user: string;
  source: string;
  error?: string;
}

// ============================================================================
// MCP Server Types
// ============================================================================

export interface ToolResponse {
  content: Array<{
    type: "text";
    text: string;
  }>;
  isError?: boolean;
}

export interface ToolRequest {
  params: {
    name: string;
    arguments: any;
  };
}
