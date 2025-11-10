# Installation & Setup Guide

## Quick Install

### 1. Build the Server

```bash
cd /Users/mmaruthurnew/Desktop/medical-practice-workspace/local-instances/mcp-servers/security-compliance-mcp
npm install
npm run build
npm test
```

### 2. Register with Claude Desktop

Edit your Claude Desktop MCP configuration file:

**Location:** `~/.claude/mcp_config.json`

Add this entry:

```json
{
  "mcpServers": {
    "security-compliance-mcp": {
      "command": "node",
      "args": [
        "/Users/mmaruthurnew/Desktop/medical-practice-workspace/local-instances/mcp-servers/security-compliance-mcp/build/server.js"
      ]
    }
  }
}
```

### 3. Restart Claude Desktop

Quit and restart Claude Desktop completely for the changes to take effect.

### 4. Verify Installation

Open a new conversation in Claude Desktop and ask:

> "What MCP tools do you have available?"

You should see these 5 tools:
- scan_for_credentials
- scan_for_phi
- manage_secrets
- manage_hooks
- manage_allowlist

## Testing the Server

### Test 1: Scan for Credentials

Create a test file with fake credentials:

```bash
echo 'const AWS_KEY = "AKIAIOSFODNN7EXAMPLE";' > /tmp/test-scan.ts
```

Then ask Claude:

> "Scan /tmp/test-scan.ts for credentials"

### Test 2: Check Secrets Status

> "Check the status of my stored secrets"

### Test 3: Scan for PHI

Create a test file with fake PHI:

```bash
echo 'const patient = { ssn: "123-45-6789", name: "John Doe" };' > /tmp/test-phi.ts
```

Then ask Claude:

> "Scan /tmp/test-phi.ts for PHI"

## Using in Your Workspace

### Install Pre-Commit Hook

Navigate to your git repository and ask Claude:

> "Install the security pre-commit hook in my current directory"

This will automatically scan staged files before each commit.

### Manage Secrets

Store API keys securely:

> "Encrypt and store my GitHub token: ghp_your_token_here with key 'github_token'"

Retrieve later:

> "Decrypt my github_token secret"

### Scan Your Codebase

> "Scan my entire src/ directory for credentials"

> "Scan my data/ folder for PHI with high sensitivity"

### Check Allow-List

> "Show me the current security allow-list"

## Configuration

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

## Audit Logs

Audit logs are automatically stored in:
`~/.security-compliance-mcp/audit-logs/`

Files:
- `audit-events.json` - All audit events with checksum chain
- `audit-metadata.json` - Metadata (event count, retention date, chain status)

## Troubleshooting

### Server Not Appearing

1. Check the path in mcp_config.json is correct and absolute
2. Ensure you ran `npm run build`
3. Restart Claude Desktop completely (Cmd+Q, then reopen)
4. Check Claude Desktop logs: Help → View Logs

### "Module not found" errors

```bash
cd security-compliance-mcp
rm -rf node_modules build
npm install
npm run build
```

### Tests failing

```bash
npm test
```

If tests fail, check error messages and ensure all dependencies are installed.

## Workflow Examples

### Daily Development Workflow

1. **Morning**: Check secret rotation status
   > "Check my secrets rotation status"

2. **Before commit**: Pre-commit hook runs automatically
   - Scans staged files
   - Blocks if violations found
   - Logs everything to audit trail

3. **When adding dependencies**: Scan for credentials
   > "Scan my package.json and .env files"

### Security Audit Workflow

1. **Weekly**: Scan entire codebase
   > "Scan my entire project for credentials and PHI"

2. **Monthly**: Review audit logs
   > "Export my audit logs for the last 30 days"

3. **Quarterly**: Review and rotate secrets
   > "Show me all secrets that need rotation"

### Code Review Workflow

1. **Before reviewing PR**: 
   > "Scan commit abc123 for security issues"

2. **Found false positive**: Add to allow-list
   > "Add tests/fixtures/sample.ts to the allow-list because it contains fake test data"

## Support

- **User Guide**: `docs/USER-GUIDE.md`
- **Developer Guide**: `docs/DEVELOPER-GUIDE.md`
- **README**: `README.md`
