# Security Orchestration Guide

## Overview

This guide explains how to integrate the Security & Compliance MCP server with other MCP servers and workflow orchestrators to enable automatic, proactive security scanning.

## Architecture

### MCP Server Coordination

MCP servers don't directly communicate with each other. Instead, the LLM client (Claude) orchestrates tool calls across multiple MCP servers based on:

1. **Explicit user requests** - User asks for security scan
2. **Proactive LLM reasoning** - Claude recognizes a security need
3. **Workflow triggers** - Other MCP servers suggest security actions
4. **Configuration-based rules** - Predefined automation patterns

## Integration Patterns

### Pattern 1: Workflow Orchestrator Triggers

Your workspace workflow orchestrator can suggest security scans by including them in workflow steps.

**Example: Project Management MCP → Security MCP**

```typescript
// In project management MCP server
{
  "workflow": "create_new_feature",
  "steps": [
    {
      "step": "create_files",
      "mcp_server": "project-management",
      "tool": "create_feature_files"
    },
    {
      "step": "security_scan",
      "mcp_server": "security-compliance-mcp",
      "tool": "scan_for_credentials",
      "trigger": "after_file_creation",
      "params": {
        "target": "${created_files}",
        "mode": "file"
      }
    }
  ]
}
```

### Pattern 2: Git Hook Integration

Pre-commit hooks can call security tools automatically before commits.

**Setup:**
```bash
# Install pre-commit hook
manage_hooks with action="install"
```

**Behavior:**
- Automatically scans staged files
- Blocks commits with violations
- Logs all activity to audit trail
- Bypass with: `SKIP_SECURITY_HOOKS=true git commit`

### Pattern 3: Event-Based Triggers

Define security rules that trigger based on file events.

**Configuration: `security-automation.json`**
```json
{
  "version": "1.0.0",
  "triggers": [
    {
      "name": "scan_new_typescript_files",
      "event": "file_created",
      "filePattern": "**/*.ts",
      "exclude": ["node_modules/**", "build/**", "tests/fixtures/**"],
      "actions": [
        {
          "tool": "scan_for_credentials",
          "params": {
            "mode": "file",
            "minConfidence": 0.7
          }
        }
      ]
    },
    {
      "name": "scan_patient_data_files",
      "event": "file_modified",
      "filePattern": "**/patient*/**/*.{ts,js,json}",
      "actions": [
        {
          "tool": "scan_for_phi",
          "params": {
            "mode": "file",
            "sensitivity": "high"
          }
        }
      ]
    },
    {
      "name": "pre_commit_security_check",
      "event": "pre_commit",
      "actions": [
        {
          "tool": "scan_for_credentials",
          "params": {
            "mode": "staged"
          }
        },
        {
          "tool": "scan_for_phi",
          "params": {
            "mode": "staged",
            "sensitivity": "medium"
          }
        }
      ]
    },
    {
      "name": "pre_pr_full_scan",
      "event": "pr_created",
      "actions": [
        {
          "tool": "scan_for_credentials",
          "params": {
            "mode": "directory",
            "target": "./src"
          }
        }
      ]
    },
    {
      "name": "weekly_codebase_audit",
      "event": "scheduled",
      "schedule": "0 0 * * 1",
      "actions": [
        {
          "tool": "scan_for_credentials",
          "params": {
            "mode": "directory",
            "target": "."
          }
        },
        {
          "tool": "manage_secrets",
          "params": {
            "action": "status"
          }
        }
      ]
    }
  ],
  "notifications": {
    "onViolation": {
      "enabled": true,
      "channels": ["log", "audit"]
    },
    "onSecretRotation": {
      "enabled": true,
      "channels": ["log"]
    }
  }
}
```

### Pattern 4: Proactive LLM Guidance

The LLM can be configured to proactively suggest security scans based on context.

**Create: `.claude/security-guidance.md`**
```markdown
# Security Guidance for Claude

## When to Use Security Tools

### Automatic Triggers

1. **After creating or modifying files containing:**
   - API keys, tokens, credentials
   - Database connection strings
   - Patient data, medical records
   - PHI identifiers (SSN, MRN, etc.)

2. **Before git operations:**
   - Before committing (scan staged files)
   - Before pushing (full directory scan)
   - Before creating pull requests (comprehensive scan)

3. **During development workflows:**
   - After installing new dependencies
   - After modifying environment configuration
   - After working with sensitive data

### Tool Selection

**Use `scan_for_credentials` when:**
- Creating/modifying config files
- Working with API integrations
- Setting up authentication
- Adding third-party services

**Use `scan_for_phi` when:**
- Creating/modifying patient data structures
- Working with medical records
- Building HIPAA-regulated features
- Testing with patient data

**Use `manage_secrets` when:**
- Storing API keys
- Rotating credentials
- Checking secret expiration status

**Use `manage_hooks` when:**
- Setting up new repositories
- Configuring CI/CD pipelines
- Enabling automated security

## Example Workflows

### Workflow: Creating New API Integration

1. User: "Add Stripe payment integration"
2. Claude creates files with API configuration
3. Claude automatically suggests: "I'll scan for credentials to ensure security"
4. Claude calls: `scan_for_credentials` on new files
5. Claude reports results and suggests: `manage_secrets` to encrypt the API key

### Workflow: Working with Patient Data

1. User: "Create patient registration form"
2. Claude creates TypeScript types for patient data
3. Claude automatically: "Scanning for PHI to ensure HIPAA compliance"
4. Claude calls: `scan_for_phi` with high sensitivity
5. Claude provides anonymization suggestions if PHI detected

### Workflow: Pre-Commit Security Check

1. User: "Ready to commit my changes"
2. Claude: "Let me run security checks on staged files"
3. Claude calls: `scan_for_credentials` with mode="staged"
4. Claude calls: `scan_for_phi` with mode="staged"
5. If violations found: Claude blocks commit and provides remediation
6. If clean: Claude confirms safe to commit
```

## Integration with Project Management MCP

### Goal-Based Security Integration

When project management MCP creates or promotes goals, integrate security checks.

**Example: In Project Management MCP**

```typescript
// When creating a new goal related to patient data
{
  "goal": "Build patient portal",
  "security_requirements": [
    {
      "checkpoint": "before_implementation",
      "tool": "security-compliance-mcp.scan_for_phi",
      "scope": "project_directory"
    },
    {
      "checkpoint": "before_deployment",
      "tool": "security-compliance-mcp.scan_for_credentials",
      "scope": "project_directory"
    }
  ]
}
```

### Task-Based Security Checks

```typescript
// When completing tasks, trigger security validation
{
  "task": "Implement user authentication",
  "completion_checks": [
    {
      "type": "security",
      "tool": "security-compliance-mcp.scan_for_credentials",
      "target": "auth_module_files",
      "required": true
    }
  ]
}
```

## Integration with Workflow Orchestrator

### Workflow Definition

```yaml
name: secure_feature_development
description: Standard workflow with integrated security checks

phases:
  - name: planning
    steps:
      - create_specification
      - review_security_requirements

  - name: implementation
    steps:
      - create_files
      - security_scan:
          mcp_server: security-compliance-mcp
          tool: scan_for_credentials
          on_violation: block

  - name: testing
    steps:
      - run_tests
      - security_audit:
          mcp_server: security-compliance-mcp
          tools:
            - scan_for_credentials
            - scan_for_phi
          scope: full_project

  - name: deployment
    steps:
      - pre_deploy_security_check:
          mcp_server: security-compliance-mcp
          tools:
            - scan_for_credentials
            - manage_secrets:
                action: status
          on_violation: block
      - deploy
```

## Automated Security Workflows

### 1. Daily Security Checks

```json
{
  "schedule": "daily",
  "workflows": [
    {
      "name": "check_secret_rotation",
      "tool": "manage_secrets",
      "params": { "action": "status" },
      "alert_on": ["expiring", "expired"]
    }
  ]
}
```

### 2. Weekly Codebase Audit

```json
{
  "schedule": "weekly",
  "workflows": [
    {
      "name": "full_credential_scan",
      "tool": "scan_for_credentials",
      "params": {
        "mode": "directory",
        "target": "./src",
        "minConfidence": 0.5
      }
    },
    {
      "name": "phi_compliance_check",
      "tool": "scan_for_phi",
      "params": {
        "mode": "directory",
        "target": "./src",
        "sensitivity": "high"
      }
    }
  ]
}
```

### 3. Monthly Compliance Report

```json
{
  "schedule": "monthly",
  "workflows": [
    {
      "name": "generate_compliance_report",
      "steps": [
        {
          "query_audit_log": {
            "date_range": "last_30_days",
            "include": ["phi_access", "violations", "secret_rotation"]
          }
        },
        {
          "export_audit_log": {
            "format": "csv",
            "output": "compliance_reports/audit_${date}.csv"
          }
        }
      ]
    }
  ]
}
```

## Configuration for Automatic Integration

### Project-Level Configuration

**Create: `.security/config.json`**
```json
{
  "version": "1.0.0",
  "automation": {
    "enabled": true,
    "mode": "proactive"
  },
  "integrations": {
    "project_management_mcp": {
      "enabled": true,
      "trigger_on": [
        "goal_created",
        "task_completed",
        "before_deployment"
      ]
    },
    "workflow_orchestrator": {
      "enabled": true,
      "trigger_on": [
        "file_created",
        "pre_commit",
        "pr_created"
      ]
    }
  },
  "rules": [
    {
      "name": "scan_on_file_save",
      "enabled": true,
      "pattern": "**/*.{ts,js}",
      "action": "scan_for_credentials"
    },
    {
      "name": "scan_patient_files",
      "enabled": true,
      "pattern": "**/patient*/**/*",
      "action": "scan_for_phi"
    }
  ],
  "notifications": {
    "critical_violations": {
      "enabled": true,
      "method": "audit_log"
    }
  }
}
```

## Implementation Steps

### Step 1: Enable Pre-Commit Hooks

```bash
# In your repository
cd /path/to/project

# Install hook
manage_hooks with action="install"

# Verify installation
manage_hooks with action="status"
```

### Step 2: Create Security Configuration

```bash
# Create security automation config
cat > .security/config.json << 'EOF'
{
  "automation": {
    "enabled": true,
    "mode": "proactive"
  }
}
EOF
```

### Step 3: Configure Project Management Integration

In your project management MCP server configuration, add security checkpoints:

```json
{
  "security_integration": {
    "mcp_server": "security-compliance-mcp",
    "checkpoints": [
      {
        "phase": "implementation",
        "required": true,
        "tools": ["scan_for_credentials"]
      },
      {
        "phase": "testing",
        "required": true,
        "tools": ["scan_for_credentials", "scan_for_phi"]
      }
    ]
  }
}
```

### Step 4: Configure Workflow Orchestrator

Add security steps to your workflow definitions:

```yaml
steps:
  - name: security_validation
    mcp_server: security-compliance-mcp
    required: true
    on_failure: block
```

## Best Practices

### 1. Layered Security Checks

- **Local**: Pre-commit hooks (immediate feedback)
- **Project**: Workflow integration (during development)
- **CI/CD**: Automated scans (before deployment)
- **Scheduled**: Regular audits (compliance)

### 2. Progressive Automation

Start with manual scans, then gradually enable:
1. Pre-commit hooks
2. Workflow integration
3. Scheduled audits
4. Full automation

### 3. Balance Security and Productivity

- Use allow-list for false positives
- Set appropriate confidence thresholds
- Provide bypass mechanisms for emergencies
- Log all security decisions

### 4. Regular Review

- Weekly: Review violations
- Monthly: Check secret rotation
- Quarterly: Audit compliance
- Annually: Review security configuration

## Troubleshooting

### Security Scans Not Triggering

1. Check MCP server is registered
2. Verify configuration files exist
3. Review audit log for errors
4. Ensure hooks are installed

### Too Many False Positives

1. Adjust confidence thresholds
2. Use allow-list appropriately
3. Refine file patterns
4. Review detection rules

### Integration Not Working

1. Verify MCP server communication
2. Check workflow configuration
3. Review LLM guidance files
4. Test manual tool calls first

## Support

For integration questions:
- Review this orchestration guide
- Check MCP server logs
- Consult audit trail
- Review workflow definitions
