---
type: specification
tags: [configuration-manager, mcp-tools, secrets-management, config-validation]
version: 1.0.0
---

# Configuration Manager MCP - Technical Specification

**Version:** 1.0.0
**Status:** Development
**Last Updated:** 2025-10-30

---

## Overview

The Configuration Manager MCP provides secure configuration and secrets management with OS-native keychain integration, JSON schema validation, environment-specific configuration, and drift detection.

---

## Architecture

### System Design

```
┌─────────────────────────────────────────────────────────┐
│           Configuration Manager MCP Server              │
├─────────────────────────────────────────────────────────┤
│                                                         │
│  ┌─────────────────┐      ┌────────────────────┐      │
│  │ Secrets Manager │      │ Config Validator   │      │
│  │ (OS Keychain)   │      │ (JSON Schema)      │      │
│  └─────────────────┘      └────────────────────┘      │
│                                                         │
│  ┌─────────────────┐      ┌────────────────────┐      │
│  │ Environment Mgr │      │ Template Generator │      │
│  │ (.env handling) │      │ (Config Templates) │      │
│  └─────────────────┘      └────────────────────┘      │
│                                                         │
│  ┌─────────────────────────────────────────────┐      │
│  │        Drift Detector                       │      │
│  │  (Cross-environment comparison)             │      │
│  └─────────────────────────────────────────────┘      │
│                                                         │
└─────────────────────────────────────────────────────────┘
           │                    │                  │
           ▼                    ▼                  ▼
    OS Keychain          Config Files         .env Files
  (macOS/Windows)      (JSON/YAML)         (environment)
```

### Storage Strategy

**Secrets Storage:**
- Location: OS-native keychain (macOS Keychain, Windows Credential Manager)
- Format: Encrypted key-value pairs
- Service Name: `workspace-config-manager`
- Backup: Optional encrypted export to external brain

**Configuration Storage:**
- Workspace configs: `.config/` folder in project root
- Environment configs: `.env`, `.env.staging`, `.env.production`
- Templates: `templates-and-patterns/configuration-templates/`
- Schemas: `schemas/` folder for JSON schema definitions

---

## Tool Specifications

### Tool 1: manage_secrets

**Purpose:** Store, retrieve, rotate, and delete secrets using OS keychain

**Parameters:**
```typescript
{
  action: "store" | "retrieve" | "rotate" | "delete" | "list";
  key?: string;              // Secret key/name (required for store/retrieve/rotate/delete)
  value?: string;            // Secret value (required for store/rotate)
  rotationDays?: number;     // Days until rotation required (default: 90)
  metadata?: {
    description?: string;
    createdBy?: string;
    lastRotated?: string;
    expiresAt?: string;
  };
}
```

**Returns:**
```typescript
{
  success: boolean;
  action: string;
  key?: string;
  value?: string;            // Only for retrieve action
  secrets?: Array<{          // Only for list action
    key: string;
    metadata: {
      description: string;
      createdBy: string;
      createdAt: string;
      lastRotated?: string;
      rotationDue?: string;
    };
  }>;
  message: string;
}
```

**Implementation:**
- macOS: Use `keychain` npm package or `security` CLI
- Windows: Use `node-keytar` for Credential Manager
- Linux: Use `libsecret` via `keytar`
- Fallback: Encrypted file storage if OS keychain unavailable

**Security:**
- Never log secret values
- Audit all access attempts
- Integration with security-compliance-mcp for audit trail

---

### Tool 2: validate_config

**Purpose:** Validate configuration files against JSON schemas

**Parameters:**
```typescript
{
  configPath: string;        // Path to config file
  schemaPath?: string;       // Optional custom schema path
  schemaType?: "mcp-config" | "project-config" | "environment-config" | "custom";
  strict?: boolean;          // Strict validation (default: true)
  reportFormat?: "text" | "json";
}
```

**Returns:**
```typescript
{
  success: boolean;
  valid: boolean;
  configPath: string;
  schemaUsed: string;
  errors?: Array<{
    path: string;
    message: string;
    severity: "error" | "warning";
  }>;
  warnings?: Array<{
    path: string;
    message: string;
  }>;
  suggestions?: string[];
  report?: string;           // If reportFormat specified
}
```

**Built-in Schemas:**
- `mcp-config.schema.json` - For .mcp.json files
- `project-config.schema.json` - For project configuration
- `environment-config.schema.json` - For .env structure
- `package-json.schema.json` - For package.json validation

**Validation Rules:**
- Required fields present
- Type checking
- Value constraints (min/max, enums)
- Format validation (URLs, emails, paths)
- Cross-field validation

---

### Tool 3: get_environment_vars

**Purpose:** Retrieve environment-specific configuration

**Parameters:**
```typescript
{
  environment: "development" | "staging" | "production" | "test";
  projectPath?: string;      // Default: current working directory
  variables?: string[];      // Specific variables to retrieve (default: all)
  includeDefaults?: boolean; // Include default values (default: true)
  format?: "json" | "dotenv" | "shell";
}
```

**Returns:**
```typescript
{
  success: boolean;
  environment: string;
  variables: Record<string, string>;
  defaults?: Record<string, string>;
  missing?: string[];        // Required vars not found
  source: string;            // Path to env file
  warnings?: string[];
}
```

**Environment Hierarchy:**
1. Environment-specific file (`.env.production`)
2. Local overrides (`.env.local`)
3. Base file (`.env`)
4. System environment variables
5. Default values from schema

---

### Tool 4: template_config

**Purpose:** Generate configuration file templates

**Parameters:**
```typescript
{
  templateType: "mcp-server" | "project" | "environment" | "github-action" | "docker";
  outputPath: string;
  options?: {
    projectName?: string;
    includeExamples?: boolean;
    includeComments?: boolean;
    environments?: string[];  // For environment configs
    overwrite?: boolean;      // Default: false
  };
  customFields?: Record<string, any>;
}
```

**Returns:**
```typescript
{
  success: boolean;
  templateType: string;
  outputPath: string;
  filesCreated: string[];
  content?: string;          // Preview if not writing
  instructions?: string[];   // Next steps
}
```

**Available Templates:**
- **mcp-server**: Standard MCP server configuration
- **project**: 8-folder project configuration
- **environment**: .env file with common variables
- **github-action**: CI/CD configuration
- **docker**: Docker and docker-compose config

**Template Features:**
- Placeholder replacement
- Commented examples
- Validation-ready (passes schema checks)
- Best practices included

---

### Tool 5: check_config_drift

**Purpose:** Detect configuration differences across environments

**Parameters:**
```typescript
{
  projectPath: string;
  environments: string[];    // e.g., ["development", "staging", "production"]
  configType: "environment" | "mcp-config" | "all";
  ignoreKeys?: string[];     // Keys to skip (e.g., secrets)
  reportFormat?: "text" | "json" | "html";
}
```

**Returns:**
```typescript
{
  success: boolean;
  hasDrift: boolean;
  environments: string[];
  drifts: Array<{
    key: string;
    values: Record<string, string>;  // environment -> value
    severity: "critical" | "warning" | "info";
    recommendation?: string;
  }>;
  summary: {
    totalKeys: number;
    driftingKeys: number;
    criticalDrifts: number;
    warningDrifts: number;
  };
  report?: string;
}
```

**Drift Detection Logic:**
- **Critical**: Required config missing in production
- **Warning**: Different values across environments (may be intentional)
- **Info**: Keys present in some environments but not others

**Smart Comparison:**
- Ignore expected differences (e.g., database URLs)
- Flag suspicious drift (e.g., API versions mismatch)
- Suggest synchronization for identical keys

---

## Data Models

### Secret Metadata
```typescript
interface SecretMetadata {
  key: string;
  description: string;
  createdBy: string;
  createdAt: string;
  lastRotated?: string;
  rotationDue?: string;
  rotationDays: number;
  accessCount: number;
  lastAccessed?: string;
}
```

### Configuration Schema
```typescript
interface ConfigSchema {
  $schema: string;
  type: "object";
  required: string[];
  properties: Record<string, SchemaProperty>;
  additionalProperties?: boolean;
}

interface SchemaProperty {
  type: string;
  description?: string;
  default?: any;
  enum?: any[];
  format?: string;
  pattern?: string;
  minimum?: number;
  maximum?: number;
}
```

### Environment Config
```typescript
interface EnvironmentConfig {
  environment: string;
  variables: Record<string, string>;
  source: string;
  loadedAt: string;
  validated: boolean;
}
```

### Drift Report
```typescript
interface DriftReport {
  generatedAt: string;
  environments: string[];
  drifts: DriftItem[];
  summary: DriftSummary;
}

interface DriftItem {
  key: string;
  values: Record<string, string>;
  severity: "critical" | "warning" | "info";
  recommendation: string;
}

interface DriftSummary {
  totalKeys: number;
  driftingKeys: number;
  criticalDrifts: number;
  warningDrifts: number;
  environmentsParity: number; // 0-100%
}
```

---

## Integration Points

### Security & Compliance MCP
- **Outbound**: Audit log for all secret access
- **Outbound**: Validate secrets don't contain PHI
- **Inbound**: Pre-commit hooks for config validation

### Deployment & Release MCP (Future)
- **Outbound**: Pre-deploy configuration validation
- **Outbound**: Environment-specific config injection
- **Inbound**: Post-deploy configuration verification

### Project Management MCP
- **Outbound**: Project configuration templates
- **Inbound**: Configuration requirements from project setup

### Testing & Validation MCP
- **Outbound**: Configuration test fixtures
- **Inbound**: Automated config validation in test pipeline

---

## Error Handling

### Error Categories

1. **Keychain Errors**
   - Keychain unavailable
   - Access denied
   - Secret not found

2. **Validation Errors**
   - Schema validation failed
   - Missing required fields
   - Invalid field values

3. **Environment Errors**
   - Environment file not found
   - Invalid environment format
   - Missing required variables

4. **Template Errors**
   - Template not found
   - Output path invalid
   - File already exists (overwrite=false)

5. **Drift Detection Errors**
   - Cannot access environment configs
   - Incomplete comparison

### Error Response Format
```typescript
{
  success: false;
  error: {
    code: string;
    message: string;
    details?: any;
    suggestions?: string[];
  };
}
```

---

## Testing Strategy

### Unit Tests (>70% coverage target)
- ✅ Secrets management (mock keychain)
- ✅ Config validation (various schemas)
- ✅ Environment variable loading
- ✅ Template generation
- ✅ Drift detection algorithms

### Integration Tests
- ✅ security-compliance-mcp integration
- ✅ End-to-end secret rotation
- ✅ Multi-environment drift detection
- ✅ Template generation + validation

### Security Tests
- ✅ No secrets in logs
- ✅ No secrets in error messages
- ✅ Audit trail completeness
- ✅ Keychain encryption verification

---

## Performance Requirements

- **Secret retrieval**: < 100ms
- **Config validation**: < 500ms for typical config (< 1MB)
- **Environment loading**: < 200ms
- **Template generation**: < 300ms
- **Drift detection**: < 1s for 3 environments

---

## Security Requirements

1. **Secrets never in plain text** - OS keychain only
2. **No secrets in logs** - Redacted in all output
3. **Audit trail** - All secret access logged
4. **Encryption at rest** - OS keychain handles encryption
5. **Access control** - Per-user keychain isolation

---

## Future Enhancements (v2.0+)

- Remote configuration management (Vault, AWS Secrets Manager)
- Configuration versioning and history
- Real-time configuration updates
- Configuration as Code (Terraform, Pulumi) integration
- Advanced RBAC for configuration access
- Configuration change tracking and rollback
- Multi-project configuration inheritance

---

**Status:** Ready for Implementation
**Next Step:** Design Decisions documentation
