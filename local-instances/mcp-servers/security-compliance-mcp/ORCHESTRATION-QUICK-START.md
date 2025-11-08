# Security Orchestration - Quick Start

## TL;DR - Enable Automatic Security

**3 steps to automatic security scanning integrated with your workflow:**

### Step 1: Enable Claude Proactivity (2 minutes)

Copy the guidance file so Claude automatically knows when to scan:

```bash
cd /path/to/your/project
mkdir -p .claude
cp examples/.claude-security-guidance.md .claude/security-guidance.md
```

**Result:** Claude will now automatically:
- Scan files after creation for credentials/PHI
- Suggest security checks before commits
- Offer to encrypt API keys
- Check secret rotation status

### Step 2: Install Pre-Commit Hooks (30 seconds)

```bash
cd /path/to/your/project
# Ask Claude: "Install the security pre-commit hook"
# Or manually: manage_hooks action="install"
```

**Result:** Every commit will automatically:
- Scan staged files for credentials
- Check for PHI exposure
- Block commits with violations
- Log everything to audit trail

### Step 3: Configure Automation (optional, 5 minutes)

```bash
mkdir -p .security
cp examples/security-automation.json .security/automation.json
```

**Result:** Automatic security on:
- File save (TypeScript, JavaScript, config files)
- Git operations (commits, PRs)
- Weekly full codebase scans
- Daily secret rotation checks

---

## How It Works

### Without Orchestration (Manual)
```
You: "I created an API integration file"
Claude: "Ok"
You: "Can you scan it for credentials?"
Claude: [scans]
```

### With Orchestration (Automatic)
```
You: "Create an API integration file"
Claude: "I'll create the file..."
         [creates file]
         "Let me scan it for security issues..."
         [automatically scans]
         "Would you like me to encrypt your API key?"
```

---

## Integration Options

Choose your level of integration:

### Level 1: Claude Proactivity (Easiest)
- **What:** Claude automatically suggests security scans
- **Setup:** Copy `.claude/security-guidance.md`
- **Best for:** Individual developers, small projects

### Level 2: Pre-Commit Hooks
- **What:** Automatic scanning before every commit
- **Setup:** Run `manage_hooks action="install"`
- **Best for:** All projects (recommended baseline)

### Level 3: Full Workflow Integration
- **What:** Security checkpoints in every workflow phase
- **Setup:** Configure workflow orchestrator with security steps
- **Best for:** Team projects, HIPAA compliance

### Level 4: Project Management Integration
- **What:** Security embedded in goals and tasks
- **Setup:** Configure Project Management MCP with security templates
- **Best for:** Long-term projects with structured planning

---

## Quick Setup by Project Type

### Medical Practice / HIPAA Project

```bash
# High security, PHI protection, audit compliance

# 1. Install hooks
manage_hooks action="install"

# 2. Configure high-sensitivity PHI scanning
cat > .security/automation.json << 'EOF'
{
  "triggers": [
    {
      "name": "phi_protection",
      "event": "file_modified",
      "filePattern": "**/*",
      "actions": [{
        "tool": "scan_for_phi",
        "params": { "sensitivity": "high" },
        "on_violation": "block"
      }]
    }
  ]
}
EOF

# 3. Enable Claude proactivity
cp examples/.claude-security-guidance.md .claude/
```

### API-Heavy Project

```bash
# Focus on credential protection and secrets management

# 1. Install hooks
manage_hooks action="install"

# 2. Configure credential scanning
cat > .security/automation.json << 'EOF'
{
  "triggers": [
    {
      "name": "credential_protection",
      "event": "file_modified",
      "filePattern": "**/*.{ts,js,json,env}",
      "actions": [{
        "tool": "scan_for_credentials",
        "params": { "minConfidence": 0.8 },
        "on_violation": "block"
      }]
    }
  ]
}
EOF

# 3. Set up secrets manager
manage_secrets action="status"

# 4. Enable Claude proactivity
cp examples/.claude-security-guidance.md .claude/
```

### General Web Application

```bash
# Balanced security for standard web apps

# 1. Install hooks
manage_hooks action="install"

# 2. Use default automation config
mkdir -p .security
cp examples/security-automation.json .security/

# 3. Enable Claude proactivity
cp examples/.claude-security-guidance.md .claude/
```

---

## Workflow Orchestrator Integration

If you use a workflow orchestrator:

### Quick Integration

```yaml
# Add to your workflow definition
phases:
  - name: implementation
    steps:
      - name: create_files
        # your file creation step

      - name: security_scan
        mcp_server: security-compliance-mcp
        tool: scan_for_credentials
        required: true
        on_violation: block
```

### Use Pre-Built Template

```bash
# Copy complete secure workflow template
cp examples/secure-workflow-template.yaml ~/.workflows/secure-development.yaml

# Use in your projects
workflow: secure-development
```

---

## Project Management MCP Integration

If you use the Project Management MCP server:

### Quick Integration

```bash
# Copy security integration config
cp examples/project-management-integration.json ~/.mcp/security-integration.json
```

### Use Goal Templates

When creating a goal:
```
Goal: "Build Stripe payment integration"
Template: "api_integration"  # Automatically adds security checkpoints
```

Available templates:
- `api_integration` - For API/external service integrations
- `patient_data_feature` - For features handling PHI
- `authentication_feature` - For auth/authorization features
- `database_integration` - For database connections

---

## Daily Developer Workflow

### Morning Routine

Claude automatically checks (if configured):
```
[Claude]: "Good morning! Checking security status...
           ⚠️ Your GitHub token expires in 3 days.
           Would you like to rotate it?"
```

### During Development

**File creation:**
```
You: "Create src/services/stripe-client.ts"
Claude: [creates file]
        "Scanning for security issues..."
        [scans automatically]
        "✅ No violations found"
```

**Working with credentials:**
```
You: "I need to add my API key"
Claude: "I'll help you store it securely.
         Let me encrypt it using the secrets manager..."
         [calls manage_secrets]
```

### Before Committing

Pre-commit hook runs automatically:
```bash
git commit -m "Add payment integration"

[Security Check]
Scanning staged files for credentials... ✅
Scanning staged files for PHI... ✅
No violations found. Commit allowed.

[main abc1234] Add payment integration
```

If violations found:
```bash
git commit -m "Add config"

[Security Check]
⚠️ BLOCKED: Security violations detected

File: src/config.ts:12
Issue: AWS Access Key detected
Severity: Critical

Please fix before committing or bypass with:
SKIP_SECURITY_HOOKS=true git commit
```

### Before Deployment

```
You: "Ready to deploy"
Claude: "Let me run pre-deployment security checks...

         Checking for exposed credentials... ✅
         Checking for PHI in code... ✅
         Checking secret rotation status... ✅

         All checks passed. Safe to deploy!"
```

---

## Verification

### Test That It's Working

**Test 1: Claude Proactivity**
```
You: "Create a file with an API key constant"
Claude: Should automatically scan after creation
```

**Test 2: Pre-Commit Hook**
```bash
echo 'const key = "AKIAIOSFODNN7EXAMPLE";' > test.ts
git add test.ts
git commit -m "test"
# Should be blocked
```

**Test 3: Automatic File Scanning**
```
You: "Create src/patient-service.ts with patient data types"
Claude: Should automatically scan for PHI
```

### Check Configuration

```bash
# Verify hook is installed
ls -la .git/hooks/pre-commit

# Verify Claude guidance exists
ls -la .claude/security-guidance.md

# Verify automation config exists
ls -la .security/automation.json

# Check audit log (confirms tools are running)
ls -la ~/.security-compliance-mcp/audit-logs/
```

---

## Common Scenarios

### Scenario 1: Adding Third-Party API

**Without orchestration:**
```
1. You create integration file
2. You commit (oops, hardcoded API key!)
3. Security breach
```

**With orchestration:**
```
1. You: "Add Stripe integration"
2. Claude creates file
3. Claude automatically scans → finds API key pattern
4. Claude: "Would you like me to encrypt this?"
5. You approve
6. Claude stores in secrets manager
7. Safe commit
```

### Scenario 2: Working with Patient Data

**Without orchestration:**
```
1. Create patient form
2. Add sample data with real SSN for testing (mistake!)
3. Commit
4. HIPAA violation
```

**With orchestration:**
```
1. You: "Create patient registration form"
2. Claude creates file
3. Claude automatically scans for PHI
4. Claude: "⚠️ Found SSN in code. This is PHI."
5. Claude suggests de-identification
6. Pre-commit hook blocks if PHI still present
7. HIPAA compliance maintained
```

### Scenario 3: Team Onboarding

**New team member:**
```
1. Clone repository
2. install hooks are already configured (from .git/hooks)
3. Start working
4. Automatic security from day 1
```

---

## Troubleshooting

### "Claude isn't being proactive"

```bash
# Check if guidance file exists
ls .claude/security-guidance.md

# If missing, copy it
mkdir -p .claude
cp examples/.claude-security-guidance.md .claude/
```

### "Pre-commit hook not running"

```bash
# Reinstall hook
manage_hooks action="uninstall"
manage_hooks action="install"

# Verify it's executable
chmod +x .git/hooks/pre-commit
```

### "Getting too many false positives"

```bash
# Add to allow-list
manage_allowlist action="add" entry='{
  "filePath": "tests/fixtures/sample.ts",
  "patternName": "Generic Secret",
  "reason": "Test fixture with fake data"
}'

# Or adjust confidence threshold
scan_for_credentials minConfidence="0.8"
```

---

## Next Steps

1. **Read Full Documentation:**
   - `docs/ORCHESTRATION-GUIDE.md` - Complete orchestration patterns
   - `docs/USER-GUIDE.md` - All tool details
   - `examples/README.md` - More configuration examples

2. **Customize Configuration:**
   - Edit `.security/automation.json` for your needs
   - Adjust sensitivity levels
   - Add project-specific triggers

3. **Monitor Audit Log:**
   - Review: `~/.security-compliance-mcp/audit-logs/`
   - Check compliance: Generate monthly reports
   - Verify chain integrity regularly

4. **Team Setup:**
   - Share configurations in repository
   - Document security workflow
   - Train team on bypass procedures (emergencies)

---

## Support

Questions? Check:
- `docs/ORCHESTRATION-GUIDE.md` - Detailed integration guide
- `docs/USER-GUIDE.md` - Tool usage reference
- `examples/README.md` - Configuration examples
- `INSTALLATION.md` - Basic setup

**Security Notice:** These tools help prevent accidents but don't replace security awareness. Always follow security best practices.
