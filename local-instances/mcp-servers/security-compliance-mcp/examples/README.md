# Security Orchestration Examples

This directory contains example configurations for integrating the Security & Compliance MCP server with other MCP servers and workflow orchestrators.

## Files Overview

### 1. `security-automation.json`
**Purpose:** Defines automated security scanning triggers and workflows

**Use Case:** Configure when security scans should run automatically based on file events, git operations, or schedules

**Setup:**
```bash
# Copy to your project root
cp security-automation.json /path/to/your/project/.security/automation.json

# Or reference it in your workflow orchestrator configuration
```

**Key Features:**
- File creation/modification triggers
- Pre-commit security checks
- Scheduled weekly/monthly audits
- Secret rotation monitoring
- Notification rules

### 2. `secure-workflow-template.yaml`
**Purpose:** Complete development workflow template with integrated security checkpoints

**Use Case:** Use this as a template for your workflow orchestrator to ensure security is checked at every phase

**Setup:**
```bash
# Copy to your workflow orchestrator's templates directory
cp secure-workflow-template.yaml ~/.workflow-orchestrator/templates/

# Or customize for your project
cp secure-workflow-template.yaml /path/to/project/.workflows/secure-development.yaml
```

**Key Features:**
- Multi-phase workflow (planning → implementation → testing → review → deployment)
- Security checkpoints at each phase
- Parallel security scanning for efficiency
- Deployment gates requiring security approval
- HIPAA compliance integration

### 3. `project-management-integration.json`
**Purpose:** Configuration for Project Management MCP server to trigger security scans based on goals and tasks

**Use Case:** Automatically run security checks when creating goals, completing tasks, or reaching milestones

**Setup:**
```bash
# Add to your Project Management MCP configuration
# Location: ~/.mcp/project-management-config.json or project/.ai-planning/security-integration.json

# Merge with existing config
cat project-management-integration.json >> ~/.mcp/project-management-config.json
```

**Key Features:**
- Goal templates with security checkpoints (API integration, patient data, authentication, database)
- Task completion security checks
- Workflow integration (spec-driven → security, task-executor → security)
- Deployment gates
- Scheduled security checks
- Notification rules

### 4. `.claude-security-guidance.md`
**Purpose:** Guidance for Claude (the LLM) on when to proactively use security tools

**Use Case:** Help Claude automatically recognize security needs and trigger appropriate scans without waiting for user requests

**Setup:**
```bash
# Copy to your project's .claude directory
mkdir -p /path/to/project/.claude
cp .claude-security-guidance.md /path/to/project/.claude/security-guidance.md

# Or place in your global Claude configuration
cp .claude-security-guidance.md ~/.claude/custom-instructions/security-guidance.md
```

**Key Features:**
- Automatic security triggers (file operations, git operations, user mentions)
- Proactive workflow examples
- Decision tree for when to scan
- Communication patterns for Claude
- Integration with other MCP servers
- Best practices for secret management

## Quick Start Guide

### Option 1: Full Automated Security Setup

1. **Install pre-commit hooks:**
```bash
cd /path/to/your/project
# Claude will call: manage_hooks action="install"
```

2. **Copy security automation config:**
```bash
mkdir -p .security
cp examples/security-automation.json .security/automation.json
```

3. **Copy Claude guidance:**
```bash
mkdir -p .claude
cp examples/.claude-security-guidance.md .claude/security-guidance.md
```

4. **Start developing with automatic security:**
- File changes will trigger scans automatically
- Pre-commit hooks will block violations
- Claude will proactively suggest security checks

### Option 2: Workflow Orchestrator Integration

1. **Copy workflow template:**
```bash
cp examples/secure-workflow-template.yaml ~/.workflow-orchestrator/templates/
```

2. **Use in your workflows:**
```yaml
workflow: secure_feature_development
phases:
  - implementation
  - testing
  - deployment
```

3. **Security checkpoints will run automatically at each phase**

### Option 3: Project Management MCP Integration

1. **Configure security integration:**
```bash
# Add to project management config
cp examples/project-management-integration.json ~/.mcp/security-integration.json
```

2. **Use goal templates:**
```bash
# When creating a goal
goal_template: "api_integration"  # Automatically adds security checkpoints
```

3. **Security checks run automatically:**
- Before implementation starts
- After files are created
- Before goal completion
- During deployment

## Integration Patterns

### Pattern 1: Proactive LLM Integration

**How it works:**
- Claude reads `.claude/security-guidance.md`
- Recognizes security-sensitive operations automatically
- Triggers appropriate security scans without being asked

**Example:**
```
User: "Add Stripe integration"

Claude: "I'll create the Stripe integration with security best practices.

First, let me check secrets management status..."
→ Calls: manage_secrets action="status"

"Creating integration files..."
→ Creates: src/services/stripe-client.ts

"Scanning for security issues..."
→ Calls: scan_for_credentials

"Would you like me to encrypt your Stripe API key using the secrets manager?"
```

### Pattern 2: Workflow Orchestrator Integration

**How it works:**
- Workflow orchestrator loads `secure-workflow-template.yaml`
- Executes security checkpoints at each phase
- Blocks progression if violations found

**Example:**
```yaml
phase: implementation
steps:
  - create_files
  - security_scan:  # Automatic
      tool: scan_for_credentials
      on_violation: block
```

### Pattern 3: Project Management Integration

**How it works:**
- Project Management MCP reads `project-management-integration.json`
- Applies security templates to goals automatically
- Triggers scans based on goal type

**Example:**
```json
{
  "goal": "Build patient portal",
  "template": "patient_data_feature",
  "security_checkpoints": "automatic"
}
```

### Pattern 4: Event-Based Triggers

**How it works:**
- `security-automation.json` defines triggers
- File watcher or git hooks detect events
- Security tools called automatically

**Example:**
```json
{
  "trigger": "file_created",
  "filePattern": "**/*.ts",
  "action": "scan_for_credentials"
}
```

## Configuration Reference

### Security Automation Config Structure

```json
{
  "triggers": [
    {
      "name": "trigger_name",
      "event": "file_created | file_modified | pre_commit | pr_created | scheduled",
      "filePattern": "glob pattern",
      "schedule": "cron expression (for scheduled events)",
      "actions": [
        {
          "mcp_server": "security-compliance-mcp",
          "tool": "scan_for_credentials | scan_for_phi | manage_secrets | manage_hooks",
          "params": {},
          "on_violation": "block | warn"
        }
      ]
    }
  ],
  "notifications": {},
  "compliance": {}
}
```

### Workflow Template Structure

```yaml
name: workflow_name
phases:
  - name: phase_name
    steps:
      - name: step_name
        mcp_server: server_name
        tool: tool_name
        params: {}
        required: true/false
        on_violation: block/warn
```

### Project Management Integration Structure

```json
{
  "goal_templates": {
    "template_name": {
      "security_checkpoints": [
        {
          "phase": "before_implementation | during_implementation | before_completion",
          "actions": []
        }
      ]
    }
  },
  "task_completion_checks": {},
  "deployment_gates": {}
}
```

## Common Use Cases

### Use Case 1: New Project Setup

```bash
# 1. Install security hooks
manage_hooks action="install"

# 2. Copy configurations
cp examples/security-automation.json .security/
cp examples/.claude-security-guidance.md .claude/

# 3. Start developing with automatic security
```

### Use Case 2: Existing Project Migration

```bash
# 1. Audit current state
scan_for_credentials mode="directory" target="."
scan_for_phi mode="directory" target="."

# 2. Fix violations
# 3. Install hooks and automation
# 4. Enable proactive scanning
```

### Use Case 3: HIPAA-Compliant Project

```bash
# 1. Use patient_data_feature template for goals
# 2. Enable high-sensitivity PHI scanning
# 3. Configure 6-year audit retention
# 4. Set up pre-commit PHI checks
```

### Use Case 4: API-Heavy Project

```bash
# 1. Use api_integration template for goals
# 2. Configure secrets manager
# 3. Set up credential scanning
# 4. Enable secret rotation tracking
```

## Testing Your Configuration

### Test Security Automation

```bash
# 1. Create a test file with fake credentials
echo 'const key = "AKIAIOSFODNN7EXAMPLE";' > test.ts

# 2. Verify trigger fires
# (Should automatically scan based on security-automation.json)

# 3. Check audit log
cat ~/.security-compliance-mcp/audit-logs/audit-events.json
```

### Test Pre-Commit Hook

```bash
# 1. Stage a file with credentials
echo 'const key = "AKIAIOSFODNN7EXAMPLE";' > config.ts
git add config.ts

# 2. Try to commit
git commit -m "test"

# 3. Should be blocked with violation report
```

### Test Claude Proactivity

```bash
# 1. Ensure .claude/security-guidance.md is in place
# 2. Ask Claude: "Create a Stripe integration"
# 3. Claude should automatically:
#    - Check secrets status
#    - Scan created files
#    - Offer to encrypt API key
```

## Troubleshooting

### Triggers Not Firing

1. **Check configuration file location**
```bash
# Should be in project root or .security/
ls -la .security/automation.json
```

2. **Verify MCP server is running**
```bash
# Check Claude Desktop logs
tail -f ~/Library/Logs/Claude/mcp*.log
```

3. **Test manual tool call**
```bash
# If manual works, it's a trigger issue
scan_for_credentials mode="file" target="test.ts"
```

### Claude Not Being Proactive

1. **Verify guidance file exists**
```bash
ls -la .claude/security-guidance.md
```

2. **Check if Claude has access to custom instructions**

3. **Test explicitly mentioning security terms**
```
User: "I need to add an API key"
# Claude should automatically suggest secrets manager
```

### Workflow Integration Issues

1. **Check workflow template syntax**
```bash
# Validate YAML
yamllint secure-workflow-template.yaml
```

2. **Verify MCP server names match**
```bash
# Check registered MCP servers
cat ~/.claude/mcp_config.json
```

3. **Test workflow steps individually**

## Support

For more information:
- **Orchestration Guide:** `docs/ORCHESTRATION-GUIDE.md`
- **User Guide:** `docs/USER-GUIDE.md`
- **Developer Guide:** `docs/DEVELOPER-GUIDE.md`
- **Installation:** `INSTALLATION.md`

## Contributing

Have a useful configuration pattern? Please contribute:
1. Test thoroughly
2. Document use case
3. Add example to this directory
4. Update this README
