# Security & Compliance MCP - User Guide

## Overview

The Security & Compliance MCP Server provides automated security infrastructure for medical practice workspaces, ensuring HIPAA compliance and protecting sensitive data.

## Features

- **Credential Detection**: Scan files for exposed API keys, tokens, and passwords
- **PHI Protection**: Detect and prevent exposure of Protected Health Information
- **Pre-Commit Hooks**: Automatic security scanning before git commits
- **Secrets Management**: Encrypted storage with rotation tracking
- **Audit Logging**: HIPAA-compliant 6-year audit trail with tamper detection

## Installation

### Prerequisites

- Node.js 18+ or compatible runtime
- Git (for pre-commit hook features)
- macOS, Windows, or Linux

### Install via MCP

Add to your MCP configuration file (`~/.claude/mcp_config.json` or workspace `.mcp.json`):

```json
{
  "mcpServers": {
    "security-compliance-mcp": {
      "command": "node",
      "args": ["/path/to/security-compliance-mcp/build/server.js"]
    }
  }
}
```

### Build from Source

```bash
cd security-compliance-mcp
npm install
npm run build
```

## Available Tools

### 1. scan_for_credentials

Scan files for exposed credentials (API keys, tokens, passwords).

**Parameters:**
- `target` (string): File path, directory path, or commit hash
- `mode` (string): Scanning mode
  - `file`: Scan single file
  - `directory`: Scan directory recursively
  - `staged`: Scan git staged files
  - `commit`: Scan specific git commit
- `commitHash` (string, optional): Git commit hash (required for commit mode)
- `minConfidence` (number, optional): Minimum confidence threshold (0.0-1.0, default: 0.5)
- `exclude` (array, optional): Directories to exclude

**Example:**
```typescript
// Scan a single file
{
  "target": "./src/config.ts",
  "mode": "file"
}

// Scan staged files before commit
{
  "target": "",
  "mode": "staged"
}

// Scan directory with exclusions
{
  "target": "./src",
  "mode": "directory",
  "exclude": ["node_modules", "dist"]
}
```

**Response:**
- Detailed violations with severity levels (critical, high, medium, low)
- File locations and line numbers
- Remediation suggestions
- Scan summary and statistics

### 2. scan_for_phi

Scan files for Protected Health Information (PHI) to ensure HIPAA compliance.

**Parameters:**
- `target` (string): File path, directory path, or commit hash
- `mode` (string): Scanning mode (file, directory, staged, commit)
- `commitHash` (string, optional): Git commit hash
- `minConfidence` (number, optional): Minimum confidence threshold (0.0-1.0)
- `sensitivity` (string, optional): Scanning sensitivity
  - `low`: Fewer false positives
  - `medium`: Balanced (default)
  - `high`: Fewer false negatives
- `categories` (array, optional): PHI categories to scan
  - `identifier`: SSN, MRN, patient IDs
  - `demographic`: Names, DOB, addresses
  - `medical`: Diagnoses, prescriptions, lab results
  - `financial`: Insurance, billing information
- `exclude` (array, optional): Directories to exclude

**Example:**
```typescript
// Scan file for all PHI types
{
  "target": "./data/patients.ts",
  "mode": "file",
  "sensitivity": "high"
}

// Scan only for identifiers
{
  "target": "./src",
  "mode": "directory",
  "categories": ["identifier"]
}
```

**Response:**
- PHI instances found with categories
- Risk level assessment (critical, high, medium, low)
- HIPAA compliance impact analysis
- Anonymization suggestions

### 3. manage_secrets

Securely encrypt, decrypt, and manage API keys and credentials with rotation tracking.

**Parameters:**
- `action` (string): Operation to perform
  - `encrypt`: Encrypt and store a secret
  - `decrypt`: Decrypt and retrieve a secret
  - `rotate`: Rotate an existing secret
  - `status`: Check all secrets and rotation status
- `key` (string): Secret identifier (e.g., "api_key", "database_password")
- `value` (string): Secret value (required for encrypt and rotate)
- `rotationDays` (number, optional): Days until rotation required (default: 90)

**Example:**
```typescript
// Encrypt a secret
{
  "action": "encrypt",
  "key": "github_token",
  "value": "ghp_1234567890abcdefghijklmnopqrstuv",
  "rotationDays": 30
}

// Decrypt a secret
{
  "action": "decrypt",
  "key": "github_token"
}

// Check rotation status
{
  "action": "status"
}

// Rotate a secret
{
  "action": "rotate",
  "key": "github_token",
  "value": "ghp_newtoken0987654321zyxwvutsrqpon"
}
```

**Storage:**
- macOS: System Keychain
- Windows: Credential Manager
- Linux: Secret Service
- Fallback: AES-256-GCM encrypted file

**Rotation Tracking:**
- `current`: More than 7 days until expiration
- `expiring`: 7 days or less until expiration
- `expired`: Past rotation date

### 4. manage_hooks

Install, uninstall, or check status of git pre-commit hooks for automated security scanning.

**Parameters:**
- `action` (string): Hook management action
  - `install`: Install pre-commit hook
  - `uninstall`: Remove pre-commit hook
  - `status`: Check hook installation status
- `gitDir` (string, optional): Git repository directory (defaults to current directory)

**Example:**
```typescript
// Install hook in current repository
{
  "action": "install"
}

// Check hook status
{
  "action": "status"
}

// Uninstall hook
{
  "action": "uninstall"
}
```

**Pre-Commit Hook Behavior:**
- Scans all staged files for credentials
- Scans all staged files for PHI
- Blocks commit if violations found
- Logs all activity to audit trail
- Bypass with: `SKIP_SECURITY_HOOKS=true git commit`

### 5. manage_allowlist

Manage security allow-list to filter out known false positives.

**Parameters:**
- `action` (string): Allow-list action
  - `add`: Add entry to allow-list
  - `remove`: Remove entry by index
  - `list`: List all entries
- `entry` (object, optional): Entry to add (required for add action)
  - `filePath` (string): File path pattern (supports wildcards)
  - `lineNumber` (number): Specific line number
  - `patternName` (string): Pattern name to allow-list
  - `matchedText` (string): Exact matched text
  - `reason` (string, required): Reason for allow-listing
  - `addedBy` (string): Person adding this entry
- `index` (number, optional): Index of entry to remove (required for remove action)

**Example:**
```typescript
// Add entry to allow-list
{
  "action": "add",
  "entry": {
    "filePath": "tests/fixtures/sample.ts",
    "patternName": "Generic Secret",
    "reason": "Test fixture with fake credentials",
    "addedBy": "security-team"
  }
}

// List all entries
{
  "action": "list"
}

// Remove entry by index
{
  "action": "remove",
  "index": 0
}
```

## Security Best Practices

### Credential Management

1. **Never commit credentials** - Use environment variables or secrets management
2. **Rotate secrets regularly** - Set appropriate rotation schedules (30-90 days)
3. **Use allow-list judiciously** - Only for legitimate false positives
4. **Review scan results** - Address all critical and high severity findings

### PHI Protection

1. **De-identify before sharing** - Use anonymization suggestions
2. **Never commit PHI** - Keep patient data in secure databases only
3. **Use test data** - Create realistic but fake data for development
4. **Regular scans** - Run PHI scans before commits and deploys

### Audit Compliance

1. **6-year retention** - Audit logs are automatically retained
2. **Chain verification** - Periodically verify audit log integrity
3. **Review access** - Monitor PHI access events
4. **Export for compliance** - Generate reports for audits

## Troubleshooting

### False Positives

If the scanner flags legitimate code:

1. Review the finding to confirm it's a false positive
2. Add to allow-list with clear reason
3. Document why it's safe (e.g., "test fixture", "example code")

### Hook Not Running

If pre-commit hook doesn't execute:

```bash
# Check hook status
manage_hooks with action="status"

# Verify hook file is executable
chmod +x .git/hooks/pre-commit

# Check for hook conflicts
cat .git/hooks/pre-commit
```

### Secrets Not Decrypting

If secrets fail to decrypt:

1. Verify key name is correct (case-sensitive)
2. Check keystore availability (system keychain/credential manager)
3. Ensure you're on the same machine where secret was encrypted
4. Review audit log for encryption event

### Audit Log Issues

If audit log verification fails:

```bash
# Check chain integrity
# This will be logged as 'audit_log_tampered' event
```

Causes:
- Manual modification of audit log file
- File corruption
- Clock skew during logging

Resolution:
- Review the specific error messages
- Check recent audit events for suspicious activity
- Contact security team if tampering suspected

## Configuration

### Security Config File

Create `security-config.json` in your project root:

```json
{
  "version": "1.0.0",
  "preCommitHooks": {
    "enabled": true,
    "blockOnViolations": true,
    "scanCredentials": true,
    "scanPHI": true,
    "phiSensitivity": "medium"
  },
  "auditLogging": {
    "enabled": true,
    "storePath": "~/.security-compliance-mcp/audit-logs",
    "retentionDays": 2190
  },
  "secretsManagement": {
    "enabled": true,
    "keystoreType": "macos-keychain",
    "rotationDays": 90
  },
  "allowList": []
}
```

### Environment Variables

- `SKIP_SECURITY_HOOKS`: Skip pre-commit hooks (use with caution)
- `SECURITY_CONFIG_PATH`: Custom config file location

## Audit Log Queries

The audit logger tracks all security operations with HIPAA-required elements:

- Who performed the action (user/system)
- What action was performed (scan, encrypt, decrypt, etc.)
- When it occurred (ISO 8601 timestamp)
- What was the outcome (success, failure, blocked)
- Was PHI accessed (boolean flag)

Query examples will be available via future CLI or reporting tools.

## Support

For issues or questions:

1. Check this user guide
2. Review error messages and audit logs
3. Consult the developer documentation
4. Contact your security team

## HIPAA Compliance Notes

This tool helps maintain HIPAA compliance by:

- Detecting 18 HIPAA-defined PHI identifiers
- Maintaining 6-year audit trails
- Tracking PHI access with tamper-evident logs
- Preventing PHI from entering version control
- Providing de-identification guidance

**Important**: This tool is a security aid, not a complete HIPAA compliance solution. Always follow your organization's full HIPAA policies and procedures.
