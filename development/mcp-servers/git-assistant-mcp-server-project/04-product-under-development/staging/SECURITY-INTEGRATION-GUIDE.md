---
type: guide
tags: [security, integration, git-assistant, security-compliance-mcp, documentation]
---

# Security Integration Guide

**Git Assistant + Security Compliance MCP Integration**

This guide explains how the git-assistant MCP integrates with security-compliance-mcp to provide automated credential and PHI scanning before commits.

## Overview

The integration provides three layers of security protection:

1. **In-Conversation Scanning**: Security checks run when using git-assistant tools
2. **Pre-Commit Hooks**: Automatic scanning before every commit
3. **Learning System**: Patterns learned from security issues to improve future detection

## Architecture

```
Developer Working
      ↓
Git Assistant MCP
      ↓
      ├─→ check_commit_readiness
      │   ├─→ Analyze changes
      │   ├─→ Run security scan ← Security Integration
      │   └─→ Block if issues found
      │
      └─→ suggest_commit_message
          ├─→ Quick security check
          └─→ Return warning if issues found

Pre-Commit Hook (Optional)
      ↓
Scans staged files for credentials & PHI
      ↓
Blocks commit if security issues detected
```

## Setup

### 1. Enable Security Integration

The integration is enabled by default. To configure:

```bash
# Create configuration file
cp .git-security-config.example.json .git-security-config.json

# Edit configuration as needed
vim .git-security-config.json
```

### 2. Install Pre-Commit Hook (Optional)

```bash
# From git-assistant-mcp-server directory
cd /path/to/your/repo
/path/to/git-assistant-mcp-server/hooks/install-hook.sh
```

This installs a git pre-commit hook that automatically scans staged files.

### 3. Build and Register MCP

```bash
# Build git-assistant with security integration
npm run build

# Restart Claude Code to reload MCPs
```

## Configuration

### Configuration File: `.git-security-config.json`

```json
{
  "enabled": true,
  "scanCredentials": true,
  "scanPHI": true,
  "failOnSecurity": true,
  "sensitivity": "medium",
  "minConfidence": 0.5,
  "excludeDirs": [
    "node_modules",
    ".git",
    "dist",
    "build"
  ],
  "cacheTimeout": 30
}
```

### Configuration Options

| Option | Type | Default | Description |
|--------|------|---------|-------------|
| `enabled` | boolean | `true` | Enable/disable security scanning |
| `scanCredentials` | boolean | `true` | Scan for credentials (API keys, tokens, passwords) |
| `scanPHI` | boolean | `true` | Scan for PHI (patient data, SSN, MRN) |
| `failOnSecurity` | boolean | `true` | Block commits when security issues found |
| `sensitivity` | string | `"medium"` | Scanning sensitivity: `"low"`, `"medium"`, `"high"` |
| `minConfidence` | number | `0.5` | Minimum confidence threshold (0.0-1.0) |
| `excludeDirs` | array | `[...]` | Directories to exclude from scanning |
| `cacheTimeout` | number | `30` | Cache timeout in seconds |

### Sensitivity Levels

- **Low** (`minConfidence: 0.8`): Fewer false positives, may miss some issues
- **Medium** (`minConfidence: 0.5`): Balanced detection (recommended)
- **High** (`minConfidence: 0.3`): Catch more potential issues, more false positives

## Usage

### Using Git Assistant Tools

#### Check Commit Readiness

```javascript
// Claude Code conversation
User: "Check if I'm ready to commit"

Git Assistant:
  ✅ Ready to commit

  🔒 Security Check:
  ✅ No security issues detected
  Scan time: 145ms

  Recommendation: Good time to commit
```

If security issues are found:

```javascript
Git Assistant:
  ❌ NOT ready to commit

  🔒 Security Issues Detected:
  - 2 credentials found in staged files

  📄 src/config.ts
    🔑 API Key (critical) - Line 15
       Remove hard-coded API Key from code. Use environment variables.

  📋 Recommendations:
  1. 🔒 Resolve security issues before committing
  2. 📖 Review SECURITY_BEST_PRACTICES.md for guidance
```

#### Suggest Commit Message

```javascript
User: "Suggest a commit message"

Git Assistant (if clean):
  ✅ Security scan passed

  Suggested commit message:
  feat: add user authentication endpoint

  Implemented JWT-based authentication...

Git Assistant (if issues found):
  ⚠️ Security issues detected

  Error: 1 credential(s) detected
  Recommendation: Resolve security issues before committing
```

### Using Pre-Commit Hook

Once installed, the hook runs automatically:

```bash
$ git commit -m "feat: add new feature"

🔒 Running security checks...
  → Scanning for credentials...
  → Scanning for PHI...
✅ Security checks passed

[main abc1234] feat: add new feature
```

If issues are found:

```bash
$ git commit -m "feat: add config"

🔒 Running security checks...
  → Scanning for credentials...
    ✗ Credentials detected in: src/config.ts

═══════════════════════════════════════════════════════════
❌ COMMIT BLOCKED - Security Issues Detected
═══════════════════════════════════════════════════════════

🔑 Credential Issues:
src/config.ts:15:const API_KEY = "sk-1234567890abcdef";

📖 Remediation Steps:
  1. Remove hard-coded credentials from staged files
  2. Use environment variables or secure configuration
  3. Review SECURITY_BEST_PRACTICES.md for guidance

To bypass this check (NOT RECOMMENDED):
  git commit --no-verify
```

## What Gets Detected

### Credentials

- **API Keys**: `api_key`, `apiKey`, `API_KEY` patterns
- **Passwords**: `password`, `passwd`, `pwd` patterns
- **Secrets**: `secret`, `SECRET` patterns
- **Tokens**: `token`, `TOKEN`, `bearer` patterns
- **Private Keys**: RSA/SSH key patterns

### PHI (Protected Health Information)

- **SSN**: Social Security Numbers (XXX-XX-XXXX)
- **MRN**: Medical Record Numbers
- **Patient Identifiers**: `patient_id`, `patient_name`, etc.
- **DOB**: Date of birth in patient context

## Performance

- **Full Scan**: Typically < 2 seconds for normal commits
- **Quick Scan**: < 500ms for commit message generation
- **Caching**: Results cached for 30 seconds (configurable)

## Bypassing Security Checks

### Temporary Bypass (Emergency Only)

```bash
# Skip pre-commit hook
git commit --no-verify -m "emergency fix"
```

**⚠️ Warning**: Only use this for urgent production fixes. Always resolve security issues as soon as possible.

### Disable Integration

```json
// .git-security-config.json
{
  "enabled": false
}
```

## Learning System

The integration learns from security patterns:

1. **First Detection**: Issue detected, logged, and blocked
2. **Pattern Learning**: Pattern added to learning engine
3. **Future Detections**: Faster recognition and improved suggestions

View learned patterns:

```javascript
// In Claude Code
User: "Show learned security patterns"

Git Assistant:
  Learned Security Patterns (5):

  1. API Key in config files
     - Detected 3 times
     - Last seen: 2025-10-28

  2. Patient SSN in data files
     - Detected 1 time
     - Last seen: 2025-10-27
```

## Troubleshooting

### Integration Not Working

1. **Check if enabled**:
   ```json
   // .git-security-config.json
   { "enabled": true }
   ```

2. **Rebuild MCP**:
   ```bash
   cd /path/to/git-assistant-mcp-server
   npm run build
   ```

3. **Restart Claude Code**: Reload window to restart MCPs

### False Positives

Add to allowlist or adjust sensitivity:

```json
{
  "sensitivity": "low",
  "minConfidence": 0.8
}
```

### Performance Issues

1. **Increase cache timeout**:
   ```json
   { "cacheTimeout": 60 }
   ```

2. **Exclude more directories**:
   ```json
   {
     "excludeDirs": ["node_modules", "dist", "coverage", "vendor"]
   }
   ```

3. **Disable PHI scanning if not needed**:
   ```json
   { "scanPHI": false }
   ```

## Best Practices

1. **Keep security enabled**: Only disable temporarily for testing
2. **Review all warnings**: Don't ignore security alerts
3. **Use environment variables**: Never hard-code credentials
4. **Test with synthetic data**: Don't commit real PHI
5. **Update exclude list**: Add vendor directories, build artifacts
6. **Regular reviews**: Periodically check learned patterns

## Integration with Security-Compliance-MCP

This integration currently uses **built-in pattern matching** (MVP). Future versions will integrate with the full security-compliance-mcp server for:

- Advanced credential detection algorithms
- Comprehensive PHI scanning
- Allowlist management
- Encrypted secrets storage
- Audit logging

To use the full security-compliance-mcp:

1. Ensure security-compliance-mcp is built and registered
2. Update security-integration.ts to call security-compliance-mcp tools via file-based communication
3. Configure coordination between both MCPs

## Support

- **Documentation**: See SECURITY_BEST_PRACTICES.md
- **Issues**: Check git-assistant TROUBLESHOOTING.md
- **Configuration**: Review .git-security-config.example.json

## Version History

- **v1.0.0** (2025-10-29): Initial integration with built-in pattern matching
- **Future**: Full security-compliance-mcp integration
