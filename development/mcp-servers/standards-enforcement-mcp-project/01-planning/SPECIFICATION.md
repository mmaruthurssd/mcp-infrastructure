---
type: specification
tags: [mcp-server, standards-enforcement, workspace-standards, technical-spec]
---

# Standards Enforcement MCP - Technical Specification

**Version:** 1.0.0
**Status:** Draft
**Created:** 2025-11-06
**Owner:** Infrastructure Team
**Project Type:** MCP Server - Infrastructure

---

## 1. Executive Summary

### 1.1 Purpose
Build an MCP server that validates and enforces workspace development standards to prevent technical debt, ensure consistency, and maintain workspace quality across all projects, MCP servers, and documentation.

### 1.2 Problem Statement

**Current State:**
- No automated enforcement of workspace standards
- Manual verification of dual-environment pattern compliance
- Template-first development followed inconsistently
- 8-folder structure enforced manually
- Documentation standards (YAML frontmatter) often skipped
- Security standards (pre-commit hooks) can be bypassed
- Configuration standards scattered across multiple MCPs

**Impact:**
- Technical debt accumulates silently
- New MCPs skip critical standards (e.g., missing templates)
- Inconsistent project structures make navigation difficult
- Documentation quality varies widely
- Security vulnerabilities can slip through
- No single source of truth for "what makes a compliant MCP"

**Gap Analysis:**
Existing MCPs provide partial coverage but no holistic enforcement:
- `mcp-config-manager` - Config validation only
- `workspace-index` - Documentation validation only
- `security-compliance-mcp` - Security scanning only
- `testing-validation-mcp` - Code quality only
- `smart-file-organizer` - Suggests but doesn't enforce

### 1.3 Success Metrics

**Target State (3 months):**
- 100% of production MCPs pass all standards checks
- 0 new MCPs deployed without templates
- 0 configuration violations (no workspace `.mcp.json` files)
- 100% compliance with dual-environment pattern
- 90%+ documentation quality score
- Pre-deployment standard validation blocks non-compliant deployments

**ROI:**
- Prevention > Remediation: Catch violations before they become technical debt
- Consistency: All projects follow same standards
- Onboarding: New developers understand standards immediately
- Quality: Automated enforcement maintains workspace quality

---

## 2. Constitution

### 2.1 Core Principles

**P1: Prevention Over Remediation**
Catch violations early in the development lifecycle, not during deployment or post-production.

**P2: Clear, Actionable Feedback**
Never just say "violation detected" - always explain what's wrong and how to fix it.

**P3: Auto-Fix When Safe**
Offer automatic remediation for common violations (e.g., create missing template scaffolding).

**P4: Integration-Native**
Deep integration with existing MCPs (mcp-config-manager, workspace-index, security-compliance, deployment-release).

**P5: Non-Blocking for Experiments**
Development work in `development/` can be messy. Only enforce standards when promoting to `local-instances/` or deploying.

### 2.2 Non-Negotiable Constraints

**C1: No False Positives**
Better to miss a violation than to block valid work. Precision > Recall.

**C2: Fast Performance**
- Full workspace audit: <10 seconds
- Single MCP validation: <500ms
- Pre-deployment check: <2 seconds

**C3: No Breaking Changes**
Existing compliant MCPs must pass validation without modification.

**C4: Extensible Rules**
Rules defined in configuration files, not hardcoded. Easy to add new standards.

**C5: User Scope Only**
Deployed to `~/.claude.json` (user scope). No project-specific config.

### 2.3 Design Guidelines

**DG1: Layered Validation**
- Layer 1: File system structure (fast, cheap)
- Layer 2: File content parsing (moderate)
- Layer 3: Cross-reference validation (expensive)

**DG2: Progressive Disclosure**
Summary → Details → Fixes. Don't overwhelm with all violations at once.

**DG3: Learning from Violations**
Log all violations to workspace-brain for trend analysis and prevention.

**DG4: Documentation-Driven**
Every standard must be documented with rationale, examples, and exceptions.

---

## 3. Requirements

### 3.1 Functional Requirements

#### FR1: MCP Compliance Validation
**Priority:** P0 (Critical)
**Description:** Validate MCPs follow all workspace standards

**Standards to Validate:**
1. **Dual-Environment Pattern**
   - Production MCP exists in `local-instances/mcp-servers/[name]/`
   - Development MCP exists in `development/mcp-servers/[name]-project/`
   - Names match (production: `foo-mcp`, development: `foo-mcp-project`)

2. **Template-First Development**
   - Every production MCP has a template in `templates-and-patterns/mcp-server-templates/templates/[name]-template/`
   - Template contains `TEMPLATE-INFO.json` with correct metadata
   - Template is drop-in ready (includes package.json, src/, README.md)

3. **8-Folder Structure**
   - Development projects use 8-folder template:
     - `01-planning/`
     - `02-research/`
     - `03-resources-docs-assets-tools/`
     - `04-product-under-development/`
     - `05-testing-validation/`
     - `06-deployment/`
     - `07-monitoring-logging/`
     - `08-archive/`

4. **Configuration Compliance**
   - No workspace `.mcp.json` files (violates portability)
   - All MCPs registered in `~/.claude.json` (user scope)
   - Environment variables use `MCP_` prefix
   - Paths are absolute and portable

5. **Documentation Requirements**
   - README.md exists with YAML frontmatter
   - package.json has correct metadata (name, version, description)
   - API documentation for all tools
   - ROLLOUT-CHECKLIST.md completed before deployment

6. **Security Standards**
   - Pre-commit hooks active (credential/PHI scanning)
   - No credentials in source code
   - No hardcoded API keys or secrets
   - .gitignore properly configured

**Acceptance Criteria:**
- Validates all 6 standard categories
- Returns detailed violation report with line numbers
- Suggests fixes for each violation
- Completes validation in <500ms per MCP

#### FR2: Project Structure Validation
**Priority:** P0 (Critical)
**Description:** Ensure projects follow workspace organization patterns

**Requirements:**
- FR2.1: Validate 8-folder structure for development projects
- FR2.2: Check for required files (README.md, EVENT-LOG.md, NEXT-STEPS.md)
- FR2.3: Verify file metadata (YAML frontmatter in .md files)
- FR2.4: Validate naming conventions (kebab-case directories)
- FR2.5: Check lifecycle stage correctness (development vs local-instances vs archive)

**Acceptance Criteria:**
- Detects missing required folders
- Identifies files in wrong locations
- Suggests reorganization with smart-file-organizer integration

#### FR3: Template Existence Validation
**Priority:** P0 (Critical)
**Description:** Ensure every production MCP has a corresponding template

**Requirements:**
- FR3.1: Scan `local-instances/mcp-servers/` for all production MCPs
- FR3.2: Check if template exists in `templates-and-patterns/mcp-server-templates/templates/`
- FR3.3: Validate TEMPLATE-INFO.json completeness
- FR3.4: Verify template is installable (package.json, build scripts work)
- FR3.5: Generate missing template scaffolding automatically

**Acceptance Criteria:**
- Identifies all MCPs without templates
- Auto-generates template scaffolding on request
- Validates template quality (not just presence)

#### FR4: Pre-Deployment Enforcement
**Priority:** P1 (High)
**Description:** Block deployments that violate critical standards

**Requirements:**
- FR4.1: Hook into deployment-release-mcp pre-deployment checks
- FR4.2: Validate ROLLOUT-CHECKLIST completion
- FR4.3: Check all critical standards (dual-environment, template, config)
- FR4.4: Block deployment if violations found
- FR4.5: Allow emergency override (logged to workspace-brain)

**Acceptance Criteria:**
- Successfully blocks non-compliant deployments
- Clear error messages explaining violations
- Override mechanism with audit trail

#### FR5: Compliance Reporting
**Priority:** P1 (High)
**Description:** Generate comprehensive compliance reports

**Requirements:**
- FR5.1: Workspace-wide compliance dashboard
- FR5.2: Per-MCP compliance scorecard
- FR5.3: Trend analysis (compliance improving/degrading)
- FR5.4: Export to markdown, HTML, JSON
- FR5.5: Integration with workspace-brain telemetry

**Acceptance Criteria:**
- Report generation <10 seconds for full workspace
- Visualizations (bar charts, trend lines)
- Actionable recommendations prioritized by impact

#### FR6: Auto-Fix Suggestions
**Priority:** P2 (Medium)
**Description:** Automatically fix common violations

**Requirements:**
- FR6.1: Create missing YAML frontmatter in .md files
- FR6.2: Generate missing template scaffolding
- FR6.3: Fix naming convention violations (rename files/directories)
- FR6.4: Add missing required files (README.md, etc.)
- FR6.5: Dry-run mode to preview changes

**Acceptance Criteria:**
- Fixes 80%+ of common violations automatically
- All fixes use dry-run first, then confirm
- Git-trackable changes only (no binary modifications)

#### FR7: Violation Tracking & Learning
**Priority:** P2 (Medium)
**Description:** Track violations over time for trend analysis

**Requirements:**
- FR7.1: Log all violations to workspace-brain
- FR7.2: Track violation types, frequency, remediation time
- FR7.3: Identify repeat offenders (same violation multiple times)
- FR7.4: Suggest process improvements to learning-optimizer
- FR7.5: Generate weekly compliance summary

**Acceptance Criteria:**
- Historical violation data queryable
- Trend analysis shows compliance improvement
- Integration with learning-optimizer for prevention

#### FR8: Standards Documentation
**Priority:** P2 (Medium)
**Description:** Maintain living documentation of all standards

**Requirements:**
- FR8.1: Generate STANDARDS.md from rule definitions
- FR8.2: Include rationale, examples, exceptions for each standard
- FR8.3: Link to workspace guides (WORKSPACE_GUIDE.md, MCP-DEVELOPMENT-STANDARD.md)
- FR8.4: Auto-update when rules change
- FR8.5: Searchable standards reference

**Acceptance Criteria:**
- STANDARDS.md always up-to-date
- Each standard includes clear examples
- New developers can understand standards from docs alone

### 3.2 Non-Functional Requirements

#### NFR1: Performance
- **NFR1.1:** Full workspace audit <10 seconds (50+ MCPs)
- **NFR1.2:** Single MCP validation <500ms
- **NFR1.3:** Pre-deployment check <2 seconds
- **NFR1.4:** Memory usage <100MB for typical workload

#### NFR2: Reliability
- **NFR2.1:** Graceful degradation on file access errors
- **NFR2.2:** No crashes on malformed files
- **NFR2.3:** Atomic validation (all-or-nothing per MCP)
- **NFR2.4:** Retry mechanism for flaky file I/O

#### NFR3: Usability
- **NFR3.1:** Clear error messages with file:line references
- **NFR3.2:** Color-coded severity (critical, warning, info)
- **NFR3.3:** Actionable fix suggestions for every violation
- **NFR3.4:** Progress indicators for long operations

#### NFR4: Maintainability
- **NFR4.1:** Rules defined in JSON/YAML (not hardcoded)
- **NFR4.2:** Easy to add new validation rules
- **NFR4.3:** 85%+ test coverage
- **NFR4.4:** Comprehensive API documentation

#### NFR5: Security
- **NFR5.1:** No code execution from validated files
- **NFR5.2:** Path traversal protection
- **NFR5.3:** Audit trail of all enforcement actions
- **NFR5.4:** Emergency override requires justification

---

## 4. Architecture

### 4.1 System Components

```
┌─────────────────────────────────────────────────────────┐
│          Standards Enforcement MCP Server               │
├─────────────────────────────────────────────────────────┤
│                                                         │
│  ┌─────────────┐  ┌──────────────┐  ┌──────────────┐  │
│  │   Rules     │  │  Validators  │  │  Fixers      │  │
│  │   Engine    │  │  Registry    │  │  Registry    │  │
│  └──────┬──────┘  └──────┬───────┘  └──────┬───────┘  │
│         │                │                  │           │
│  ┌──────▼────────────────▼──────────────────▼───────┐  │
│  │       Standards Enforcement Service              │  │
│  └──────┬───────────────────────────────────────────┘  │
│         │                                               │
│  ┌──────▼───────────────────────────────────────────┐  │
│  │              MCP Tool Handlers (8)               │  │
│  │  • validate_mcp_compliance                       │  │
│  │  • validate_project_structure                    │  │
│  │  • validate_template_exists                      │  │
│  │  • enforce_pre_deployment                        │  │
│  │  • generate_compliance_report                    │  │
│  │  • suggest_fixes                                 │  │
│  │  • track_violations                              │  │
│  │  • generate_standards_docs                       │  │
│  └──────────────────────────────────────────────────┘  │
│                                                         │
└─────────────────────────────────────────────────────────┘
                          │
        ┌─────────────────┼─────────────────┬───────────┐
        │                 │                 │           │
        ▼                 ▼                 ▼           ▼
┌───────────────┐  ┌─────────────┐  ┌──────────┐  ┌──────────┐
│ mcp-config    │  │ workspace   │  │ security │  │deployment│
│ -manager      │  │ -index      │  │-compliance│ │-release  │
│ (config val)  │  │ (doc val)   │  │(security)│  │(enforce) │
└───────────────┘  └─────────────┘  └──────────┘  └──────────┘
```

### 4.2 Data Model

#### Standard Rule Schema
```typescript
interface StandardRule {
  id: string;                      // Unique rule identifier
  name: string;                    // Human-readable name
  category: RuleCategory;          // Type of standard
  severity: 'critical' | 'warning' | 'info';
  description: string;             // What this rule checks
  rationale: string;               // Why this standard exists
  validator: ValidatorFunction;    // Function to run
  autoFix?: AutoFixFunction;       // Optional auto-fix
  documentation: RuleDocumentation;
  enabled: boolean;                // Can be disabled
  exceptions?: string[];           // Paths to exclude
}

type RuleCategory =
  | 'dual-environment'
  | 'template-first'
  | 'project-structure'
  | 'configuration'
  | 'documentation'
  | 'security';

interface RuleDocumentation {
  rationale: string;               // Why this matters
  examples: {
    good: string[];                // Compliant examples
    bad: string[];                 // Non-compliant examples
  };
  fixes: string[];                 // How to fix violations
  references: string[];            // Links to guides
}
```

#### Validation Result Schema
```typescript
interface ValidationResult {
  success: boolean;
  compliant: boolean;
  violations: Violation[];
  summary: ValidationSummary;
  timestamp: string;
}

interface Violation {
  ruleId: string;
  ruleName: string;
  category: RuleCategory;
  severity: 'critical' | 'warning' | 'info';
  message: string;                 // What's wrong
  location: FileLocation;
  suggestion: string;              // How to fix
  autoFixAvailable: boolean;
}

interface FileLocation {
  path: string;                    // Absolute path
  line?: number;                   // Line number if applicable
  column?: number;
}

interface ValidationSummary {
  totalRules: number;
  passedRules: number;
  failedRules: number;
  criticalViolations: number;
  warningViolations: number;
  infoViolations: number;
  complianceScore: number;         // 0-100
}
```

### 4.3 Tool Specifications

#### Tool 1: validate_mcp_compliance
```typescript
interface ValidateMcpComplianceParams {
  mcpName: string;                 // MCP to validate (e.g., "git-assistant")
  categories?: RuleCategory[];     // Specific categories to check (default: all)
  failFast?: boolean;              // Stop on first critical violation (default: false)
  includeWarnings?: boolean;       // Include warning-level violations (default: true)
}

interface ValidateMcpComplianceResult {
  success: boolean;
  compliant: boolean;              // True if no critical violations
  violations: Violation[];
  summary: ValidationSummary;
  fixes: AutoFixSuggestion[];
  report: string;                  // Formatted report
}

interface AutoFixSuggestion {
  violationId: string;
  description: string;
  preview: string;                 // What will change
  safe: boolean;                   // Safe to auto-apply?
}
```

**Validation Logic:**
1. Check dual-environment: `development/mcp-servers/[name]-project/` ↔ `local-instances/mcp-servers/[name]/`
2. Check template: `templates-and-patterns/mcp-server-templates/templates/[name]-template/`
3. Check configuration: No `.mcp.json` in workspace, registered in `~/.claude.json`
4. Check documentation: README.md with frontmatter, package.json complete
5. Check security: No credentials, pre-commit hooks active
6. Return comprehensive report

#### Tool 2: validate_project_structure
```typescript
interface ValidateProjectStructureParams {
  projectPath: string;             // Absolute path to project
  expectedStructure: '8-folder' | '4-folder' | 'custom';
  strictMode?: boolean;            // Require exact folder names (default: false)
}

interface ValidateProjectStructureResult {
  success: boolean;
  compliant: boolean;
  violations: Violation[];
  missingFolders: string[];
  unexpectedFiles: string[];
  suggestions: string[];
}
```

**8-Folder Structure Check:**
- Required: 01-planning, 03-resources-docs-assets-tools, 04-product-under-development
- Optional: 02-research, 05-testing-validation, 06-deployment, 07-monitoring-logging, 08-archive
- Required files: README.md, EVENT-LOG.md, NEXT-STEPS.md

#### Tool 3: validate_template_exists
```typescript
interface ValidateTemplateExistsParams {
  mcpName: string;                 // Production MCP name
  checkInstallable?: boolean;      // Verify template builds (default: false)
  checkMetadata?: boolean;         // Validate TEMPLATE-INFO.json (default: true)
}

interface ValidateTemplateExistsResult {
  success: boolean;
  templateExists: boolean;
  templatePath?: string;
  metadataValid: boolean;
  installable?: boolean;
  violations: Violation[];
  scaffoldingAvailable: boolean;   // Can auto-generate template
}
```

**Validation Steps:**
1. Check `templates-and-patterns/mcp-server-templates/templates/[name]-template/` exists
2. Validate TEMPLATE-INFO.json (version, installCommand, mcpType)
3. Optionally: Run `npm install && npm run build` to verify template works

#### Tool 4: enforce_pre_deployment
```typescript
interface EnforcePreDeploymentParams {
  mcpName: string;
  targetEnvironment: 'local-instances' | 'production';
  allowOverride?: boolean;         // Emergency override option (default: false)
  overrideReason?: string;         // Required if override=true
}

interface EnforcePreDeploymentResult {
  success: boolean;
  allowed: boolean;                // True if deployment can proceed
  blockingViolations: Violation[];
  warnings: Violation[];
  requiresAttention: string[];
  overrideLogged: boolean;
}
```

**Enforcement Logic:**
1. Run full MCP compliance validation
2. Check ROLLOUT-CHECKLIST completion (via checklist-manager if available)
3. Verify all critical violations resolved
4. If violations found: Block deployment, return detailed report
5. If override requested: Log to workspace-brain, allow with warning

#### Tool 5: generate_compliance_report
```typescript
interface GenerateComplianceReportParams {
  scope: 'workspace' | 'mcp-servers' | 'projects' | 'single-mcp';
  target?: string;                 // Specific MCP or project if scope=single
  format: 'markdown' | 'html' | 'json';
  includeCompliant?: boolean;      // Show passing items (default: false)
  groupBy?: 'category' | 'severity' | 'mcp';
}

interface GenerateComplianceReportResult {
  success: boolean;
  report: string;                  // Formatted report
  summary: WorkspaceSummary;
  violations: Violation[];
  trends?: ComplianceTrend[];      // If historical data available
}

interface WorkspaceSummary {
  totalMcps: number;
  compliantMcps: number;
  nonCompliantMcps: number;
  overallScore: number;            // 0-100
  criticalViolations: number;
  warningViolations: number;
}

interface ComplianceTrend {
  date: string;
  complianceScore: number;
  violationCount: number;
}
```

#### Tool 6: suggest_fixes
```typescript
interface SuggestFixesParams {
  violations: Violation[];         // From validation result
  applyFixes?: boolean;            // Auto-apply safe fixes (default: false)
  dryRun?: boolean;                // Preview changes (default: true)
}

interface SuggestFixesResult {
  success: boolean;
  fixes: Fix[];
  applied: number;
  preview: ChangePreview[];
}

interface Fix {
  violationId: string;
  description: string;
  action: FixAction;
  safe: boolean;                   // Safe to auto-apply
  applied: boolean;
}

type FixAction =
  | { type: 'create-file'; path: string; content: string }
  | { type: 'edit-file'; path: string; changes: Edit[] }
  | { type: 'rename'; from: string; to: string }
  | { type: 'move'; from: string; to: string }
  | { type: 'delete'; path: string };

interface Edit {
  line: number;
  oldText: string;
  newText: string;
}
```

**Auto-Fixable Violations:**
1. Missing YAML frontmatter → Add template frontmatter
2. Missing template → Generate scaffolding
3. Wrong file location → Move to correct folder
4. Incorrect naming → Rename to kebab-case
5. Missing required file → Create from template

#### Tool 7: track_violations
```typescript
interface TrackViolationsParams {
  violations: Violation[];
  mcpName?: string;
  context?: string;                // e.g., "pre-deployment", "manual-audit"
}

interface TrackViolationsResult {
  success: boolean;
  logged: number;
  trends: ViolationTrends;
}

interface ViolationTrends {
  topViolations: Array<{ ruleId: string; count: number }>;
  repeatOffenders: string[];       // MCPs with multiple violations
  improvementScore: number;        // Trend direction
}
```

**Integration with workspace-brain:**
```typescript
workspace_brain.log_event('standards-violation', {
  rule_id: violation.ruleId,
  category: violation.category,
  severity: violation.severity,
  mcp_name: mcpName,
  fixed: false,
  context: context
});
```

#### Tool 8: generate_standards_docs
```typescript
interface GenerateStandardsDocsParams {
  outputPath?: string;             // Default: workspace/STANDARDS.md
  includeExamples?: boolean;       // Include code examples (default: true)
  includeRationale?: boolean;      // Include "why" for each standard (default: true)
  format?: 'markdown' | 'html';
}

interface GenerateStandardsDocsResult {
  success: boolean;
  outputPath: string;
  rulesDocumented: number;
  categories: RuleCategory[];
}
```

**Generated Documentation Structure:**
```markdown
# Workspace Development Standards

## Table of Contents
- Dual-Environment Pattern
- Template-First Development
- Project Structure
- Configuration Standards
- Documentation Requirements
- Security Standards

## Dual-Environment Pattern

### Rationale
Every production MCP must have a development counterpart...

### Standard
- Development: `development/mcp-servers/[name]-project/`
- Production: `local-instances/mcp-servers/[name]/`

### Examples
✅ Good: `git-assistant-mcp-project` → `git-assistant-mcp-server`
❌ Bad: Development only, no production instance

### How to Fix
1. Create production directory
2. Copy built files from `04-product-under-development/dist/`
3. Register in `~/.claude.json`
```

### 4.4 Integration Points

#### Integration 1: mcp-config-manager
**Purpose:** Validate MCP configuration files

**How it Works:**
```typescript
// Standards Enforcement calls mcp-config-manager
const configValidation = await mcp_config_manager.validate_mcp_configuration(mcpName);

if (!configValidation.valid) {
  violations.push({
    ruleId: 'config-compliance',
    category: 'configuration',
    severity: 'critical',
    message: 'MCP configuration invalid',
    location: { path: configValidation.configPath },
    suggestion: 'Run mcp-config-manager sync_mcp_configs'
  });
}
```

#### Integration 2: workspace-index
**Purpose:** Validate documentation consistency

**How it Works:**
```typescript
// Check workspace documentation accuracy
const docValidation = await workspace_index.validate_workspace_documentation({
  checks: ['mcp_counts', 'template_inventory'],
  reportFormat: 'summary'
});

if (docValidation.failed > 0) {
  violations.push({
    ruleId: 'documentation-accuracy',
    category: 'documentation',
    severity: 'warning',
    message: 'Workspace documentation out of sync',
    suggestion: 'Run workspace-index update_workspace_docs_for_reality'
  });
}
```

#### Integration 3: security-compliance-mcp
**Purpose:** Security standards validation

**How it Works:**
```typescript
// Scan for credentials and PHI
const securityScan = await security_compliance.scan_for_credentials({
  target: mcpPath,
  mode: 'directory',
  minConfidence: 0.7
});

if (securityScan.findings.length > 0) {
  securityScan.findings.forEach(finding => {
    violations.push({
      ruleId: 'no-credentials',
      category: 'security',
      severity: 'critical',
      message: `Potential credential found: ${finding.pattern}`,
      location: { path: finding.file, line: finding.line },
      suggestion: 'Remove credential, use environment variables'
    });
  });
}
```

#### Integration 4: deployment-release-mcp
**Purpose:** Pre-deployment enforcement hook

**How it Works:**
```typescript
// deployment-release-mcp calls standards-enforcement before deploy
deployment_release.on('pre-deploy', async (deployment) => {
  const enforcement = await standards_enforcement.enforce_pre_deployment({
    mcpName: deployment.mcpName,
    targetEnvironment: deployment.environment,
    allowOverride: deployment.emergencyOverride
  });

  if (!enforcement.allowed) {
    throw new Error(`Deployment blocked: ${enforcement.blockingViolations.length} critical violations`);
  }
});
```

#### Integration 5: workspace-brain-mcp
**Purpose:** Telemetry and trend analysis

**Events Logged:**
```typescript
// Violation detected
workspace_brain.log_event('standards-violation', {
  rule_id: 'dual-environment',
  category: 'dual-environment',
  severity: 'critical',
  mcp_name: 'new-mcp',
  fixed: false
});

// Auto-fix applied
workspace_brain.log_event('standards-fix-applied', {
  rule_id: 'missing-frontmatter',
  category: 'documentation',
  mcp_name: 'example-mcp',
  auto_fix: true
});

// Deployment blocked
workspace_brain.log_event('deployment-blocked', {
  mcp_name: 'non-compliant-mcp',
  violations_count: 3,
  critical_count: 1,
  override: false
});
```

### 4.5 File Structure

```
04-product-under-development/
├── package.json
├── tsconfig.json
├── src/
│   ├── index.ts                   # MCP server entry point
│   ├── rules/
│   │   ├── rules-engine.ts        # Rule execution engine
│   │   ├── rule-definitions.ts    # Standard rule definitions
│   │   ├── dual-environment-rules.ts
│   │   ├── template-first-rules.ts
│   │   ├── project-structure-rules.ts
│   │   ├── configuration-rules.ts
│   │   ├── documentation-rules.ts
│   │   └── security-rules.ts
│   ├── validators/
│   │   ├── validator-registry.ts  # Register all validators
│   │   ├── mcp-validator.ts       # MCP compliance validator
│   │   ├── project-validator.ts   # Project structure validator
│   │   ├── template-validator.ts  # Template existence validator
│   │   ├── config-validator.ts    # Configuration validator
│   │   └── doc-validator.ts       # Documentation validator
│   ├── fixers/
│   │   ├── fixer-registry.ts      # Register all fixers
│   │   ├── frontmatter-fixer.ts   # Add missing YAML frontmatter
│   │   ├── template-fixer.ts      # Generate template scaffolding
│   │   ├── naming-fixer.ts        # Fix naming conventions
│   │   └── structure-fixer.ts     # Fix folder structure
│   ├── tools/
│   │   ├── validate-mcp-compliance.ts
│   │   ├── validate-project-structure.ts
│   │   ├── validate-template-exists.ts
│   │   ├── enforce-pre-deployment.ts
│   │   ├── generate-compliance-report.ts
│   │   ├── suggest-fixes.ts
│   │   ├── track-violations.ts
│   │   └── generate-standards-docs.ts
│   ├── integrations/
│   │   ├── mcp-config-manager.ts  # Config validation integration
│   │   ├── workspace-index.ts     # Doc validation integration
│   │   ├── security-compliance.ts # Security scanning integration
│   │   ├── deployment-release.ts  # Deployment hook integration
│   │   └── workspace-brain.ts     # Telemetry client
│   ├── reporting/
│   │   ├── report-generator.ts    # Generate formatted reports
│   │   ├── markdown-formatter.ts  # Markdown report format
│   │   ├── html-formatter.ts      # HTML report format
│   │   └── trend-analyzer.ts      # Compliance trend analysis
│   ├── utils/
│   │   ├── file-utils.ts          # Safe file operations
│   │   ├── path-utils.ts          # Path resolution
│   │   ├── git-utils.ts           # Git operations
│   │   └── template-utils.ts      # Template generation
│   └── types/
│       ├── rules.ts               # Rule type definitions
│       ├── violations.ts          # Violation types
│       ├── validation.ts          # Validation result types
│       └── tool-params.ts         # Tool parameter types
├── tests/
│   ├── unit/
│   │   ├── rules-engine.test.ts
│   │   ├── validators.test.ts
│   │   ├── fixers.test.ts
│   │   └── report-generator.test.ts
│   ├── integration/
│   │   ├── mcp-validation.test.ts
│   │   ├── pre-deployment.test.ts
│   │   └── auto-fix.test.ts
│   ├── fixtures/
│   │   ├── compliant-mcp/
│   │   ├── non-compliant-mcp/
│   │   └── sample-projects/
│   └── helpers/
│       ├── test-utils.ts
│       └── mock-integrations.ts
└── config/
    ├── rules.json                 # Rule definitions
    └── exceptions.json            # Paths excluded from validation
```

---

## 5. Implementation Plan

### Phase 1: Core Validation (3-4 hours)
**Priority:** Critical
**Timeline:** Day 1

**Tasks:**
1. Set up TypeScript project (package.json, tsconfig.json)
2. Implement rule definitions for 6 categories
3. Build rules engine (execute validators, collect violations)
4. Implement Tool 1: validate_mcp_compliance
5. Implement Tool 2: validate_project_structure
6. Implement Tool 3: validate_template_exists
7. Unit tests for validators (80%+ coverage)

**Deliverables:**
- Working validation for all 6 standard categories
- Can validate any MCP in <500ms
- Clear violation reports with suggestions

### Phase 2: Enforcement & Reporting (2-3 hours)
**Priority:** High
**Timeline:** Day 2

**Tasks:**
1. Implement Tool 4: enforce_pre_deployment
2. Implement Tool 5: generate_compliance_report
3. Build report formatters (markdown, HTML)
4. Integration with deployment-release-mcp
5. Integration with workspace-brain (telemetry)
6. Integration tests

**Deliverables:**
- Pre-deployment enforcement working
- Comprehensive compliance reports
- Telemetry logging violations

### Phase 3: Auto-Fix & Documentation (2-3 hours)
**Priority:** Medium
**Timeline:** Day 3

**Tasks:**
1. Implement Tool 6: suggest_fixes
2. Build auto-fixers for common violations
3. Implement Tool 7: track_violations
4. Implement Tool 8: generate_standards_docs
5. Generate STANDARDS.md from rules
6. Create templates for fixes

**Deliverables:**
- Auto-fix capability for 80%+ of violations
- STANDARDS.md generated automatically
- Violation tracking with trends

### Phase 4: Deployment (1 hour)
**Priority:** Critical
**Timeline:** Day 4

**Tasks:**
1. Complete ROLLOUT-CHECKLIST
2. Build production bundle
3. Register in ~/.claude.json
4. Smoke tests with real MCPs
5. Generate initial compliance report
6. Documentation complete

**Deliverables:**
- Standards Enforcement MCP deployed
- Workspace compliance report generated
- All violations documented

**Total Effort:** 8-11 hours (2 work days)

---

## 6. Testing Strategy

### 6.1 Unit Tests (85%+ Coverage)

**Rules Engine:**
- Execute single rule
- Execute rule category
- Execute all rules
- Handle rule exceptions
- Collect violations correctly

**Validators:**
- Dual-environment detection (match/mismatch)
- Template existence (exists/missing)
- Project structure (8-folder compliance)
- Configuration validation (no .mcp.json)
- Documentation validation (YAML frontmatter)
- Security validation (no credentials)

**Fixers:**
- Add YAML frontmatter
- Generate template scaffolding
- Rename files (kebab-case)
- Move files to correct folders
- Create missing required files

### 6.2 Integration Tests

**End-to-End Validation:**
1. Validate compliant MCP → All checks pass
2. Validate non-compliant MCP → Violations detected
3. Auto-fix violations → Compliance achieved
4. Pre-deployment enforcement → Block non-compliant
5. Generate compliance report → Accurate summary

**MCP Integration:**
- Call mcp-config-manager for config validation
- Call workspace-index for doc validation
- Call security-compliance for security scan
- Hook into deployment-release pre-deployment
- Log to workspace-brain telemetry

### 6.3 Performance Benchmarks

**Targets:**
- Single MCP validation: <500ms
- Full workspace audit (50 MCPs): <10 seconds
- Pre-deployment check: <2 seconds
- Report generation: <5 seconds

**Test Cases:**
- 1 MCP validation
- 10 MCPs validation
- 50 MCPs validation (full workspace)
- Report with 100+ violations

### 6.4 Manual Testing

**Smoke Tests:**
1. Validate git-assistant (should pass all checks)
2. Validate newly created MCP (should fail template check)
3. Auto-fix missing frontmatter
4. Generate workspace compliance report
5. Block deployment of non-compliant MCP

**Real-World Tests:**
- Validate all 20 production MCPs
- Identify common violation patterns
- Test auto-fix on real violations
- Verify report accuracy

---

## 7. Success Criteria

### 7.1 v1.0.0 Launch Criteria

**Must Have:**
- [ ] 8 tools implemented and tested
- [ ] 85%+ test coverage
- [ ] Performance benchmarks met
- [ ] Integration with 4 MCPs working
- [ ] ROLLOUT-CHECKLIST 100% complete
- [ ] Deployed to user scope
- [ ] Documentation complete (STANDARDS.md auto-generated)

**Should Have:**
- [ ] Auto-fix for 80%+ common violations
- [ ] Compliance report for entire workspace
- [ ] Pre-deployment enforcement active
- [ ] Telemetry logging to workspace-brain

**Nice to Have:**
- [ ] HTML report format
- [ ] Trend analysis (requires historical data)
- [ ] Integration with learning-optimizer

### 7.2 3-Month Success Metrics

**Quantitative:**
- 100% of production MCPs pass critical checks
- 0 new deployments without templates
- 0 configuration violations
- 90%+ overall compliance score
- <5 seconds full workspace validation

**Qualitative:**
- Developers understand standards before violating
- Technical debt prevented, not remediated
- Consistent quality across all MCPs
- Standards documentation always current

---

## 8. Appendix

### 8.1 Rule Definitions

**Example Rule: Dual-Environment Pattern**
```json
{
  "id": "dual-environment-exists",
  "name": "Dual-Environment Pattern",
  "category": "dual-environment",
  "severity": "critical",
  "description": "Every production MCP must have a development counterpart",
  "rationale": "Enables safe development without breaking production",
  "validator": "validateDualEnvironment",
  "autoFix": "createDevelopmentProject",
  "documentation": {
    "rationale": "Development work should happen in development/, not local-instances/",
    "examples": {
      "good": [
        "development/mcp-servers/git-assistant-project/ → local-instances/mcp-servers/git-assistant-mcp-server/"
      ],
      "bad": [
        "Only local-instances/mcp-servers/new-mcp/ exists (no development counterpart)"
      ]
    },
    "fixes": [
      "Create development/mcp-servers/[name]-project/ directory",
      "Copy 8-folder structure template",
      "Move source to 04-product-under-development/"
    ],
    "references": [
      "WORKSPACE_GUIDE.md#dual-environment-pattern",
      "MCP-DEVELOPMENT-STANDARD.md"
    ]
  },
  "enabled": true,
  "exceptions": ["workflow-orchestrator-mcp-server"]
}
```

### 8.2 Glossary

**Standard:** A required practice or pattern for workspace development.

**Rule:** A specific check that validates compliance with a standard.

**Violation:** An instance where code does not meet a standard.

**Critical Violation:** Blocks deployment, must be fixed.

**Warning Violation:** Should be fixed, doesn't block deployment.

**Auto-Fix:** Automated remediation of a violation.

**Compliance Score:** Percentage of passing rules (0-100).

**Dual-Environment Pattern:** Development in development/, production in local-instances/.

**Template-First Development:** Every production MCP has a reusable template.

---

**Document Control:**
- Version: 1.0.0
- Status: Draft
- Last Updated: 2025-11-06
- Next Review: After Phase 1 complete
- Owner: Infrastructure Team
- Approvers: User
