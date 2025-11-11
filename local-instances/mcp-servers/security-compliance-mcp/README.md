# Security & Compliance MCP Server

> Automated security infrastructure for medical practice workspaces with HIPAA compliance

[![Tests](https://img.shields.io/badge/tests-64%20passing-brightgreen)](https://github.com/your-org/security-compliance-mcp)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.0-blue)](https://www.typescriptlang.org/)
[![License](https://img.shields.io/badge/license-MIT-blue.svg)](LICENSE)

## Overview

The Security & Compliance MCP Server provides comprehensive security automation for medical practice workspaces, ensuring HIPAA compliance and protecting sensitive data through automated scanning, encrypted secrets management, and tamper-evident audit logging.

## Features

### 🔒 Credential Detection
- Scan files for exposed API keys, tokens, and passwords
- 15+ pattern types (AWS, GitHub, Slack, OpenAI, etc.)
- Severity-based classification (critical, high, medium, low)
- Confidence scoring to minimize false positives
- Git integration (scan commits, staged files)

### 🏥 PHI Protection (HIPAA Compliance)
- Detect all 18 HIPAA-defined PHI identifiers
- Medical context-aware scanning
- Risk level assessment (critical → low)
- Anonymization suggestions
- Category-based filtering (identifier, demographic, medical, financial)

### 🔐 Secrets Management
- OS-native keystores (macOS Keychain, Windows Credential Manager)
- AES-256-GCM encrypted fallback
- Automatic rotation tracking
- Expiration warnings
- Secure storage with metadata

### 📊 Audit Logging
- HIPAA-compliant 6-year retention
- Tamper-evident checksum chain (SHA-256)
- Comprehensive event tracking
- PHI access flagging
- Query and export capabilities (JSON, CSV)

### 🪝 Pre-Commit Hooks
- Automatic scanning before commits
- Blocks commits with violations
- Configurable sensitivity
- Bypassable for emergencies
- Full audit trail

## Quick Start

### Installation

```bash
# Install dependencies
npm install

# Build
npm run build

# Run tests
npm test
```

### MCP Configuration

Add to your MCP config file (`~/.claude/mcp_config.json`):

```json
{
  "mcpServers": {
    "security-compliance-mcp": {
      "command": "node",
      "args": ["/absolute/path/to/security-compliance-mcp/build/server.js"]
    }
  }
}
```

### Basic Usage

**Scan for credentials:**
```typescript
{
  "tool": "scan_for_credentials",
  "arguments": {
    "target": "./src",
    "mode": "directory"
  }
}
```

**Scan for PHI:**
```typescript
{
  "tool": "scan_for_phi",
  "arguments": {
    "target": "./data",
    "mode": "directory",
    "sensitivity": "high"
  }
}
```

**Manage secrets:**
```typescript
// Encrypt
{
  "tool": "manage_secrets",
  "arguments": {
    "action": "encrypt",
    "key": "api_key",
    "value": "secret-value",
    "rotationDays": 30
  }
}

// Decrypt
{
  "tool": "manage_secrets",
  "arguments": {
    "action": "decrypt",
    "key": "api_key"
  }
}
```

**Install pre-commit hook:**
```typescript
{
  "tool": "manage_hooks",
  "arguments": {
    "action": "install"
  }
}
```

## Automatic Integration & Orchestration

### 🤖 Proactive Security (Recommended)

Instead of manually calling security tools, enable **automatic security scanning** integrated with your development workflow:

**Quick Setup (3 steps, 2 minutes):**

```bash
# 1. Copy Claude guidance for automatic security awareness
mkdir -p .claude
cp examples/.claude-security-guidance.md .claude/

# 2. Install pre-commit hooks
# Ask Claude: "Install the security pre-commit hook"

# 3. Optional: Enable file-based triggers
mkdir -p .security
cp examples/security-automation.json .security/
```

**What You Get:**
- ✅ Claude automatically scans files after creation
- ✅ Pre-commit hooks block violations before commits
- ✅ Automatic secret rotation checks
- ✅ Weekly codebase audits
- ✅ Proactive PHI protection

**See:** [ORCHESTRATION-QUICK-START.md](ORCHESTRATION-QUICK-START.md) for 2-minute setup guide

### Integration with Other MCP Servers

This security server integrates seamlessly with:

- **Workflow Orchestrator**: Add security checkpoints to workflow phases
- **Project Management MCP**: Automatic security checks based on goals/tasks
- **Spec-Driven MCP**: Security validation during specification phase
- **Task Executor MCP**: Security audit after task completion

**Example Integrations:**
- `examples/secure-workflow-template.yaml` - Complete workflow with security
- `examples/project-management-integration.json` - Goal-based security templates
- `examples/security-automation.json` - Event-based trigger configuration

**Documentation:**
- **[Orchestration Quick Start](ORCHESTRATION-QUICK-START.md)** - 2-minute setup guide
- **[Orchestration Guide](docs/ORCHESTRATION-GUIDE.md)** - Complete integration patterns
- **[Examples README](examples/README.md)** - Configuration examples and use cases

## Architecture

```
security-compliance-mcp/
├── src/
│   ├── server.ts              # MCP server entry point
│   ├── patterns/              # Detection patterns
│   ├── scanners/              # Scanning engines
│   ├── tools/                 # MCP tools (public API)
│   ├── secrets/               # Secrets management
│   ├── keystore/              # OS-native keystores
│   ├── audit/                 # Audit logging
│   ├── hooks/                 # Git hooks
│   └── config/                # Configuration
├── tests/
│   ├── unit/                  # Unit tests
│   ├── integration/           # Integration tests
│   └── fixtures/              # Test data
└── docs/
    ├── USER-GUIDE.md          # User documentation
    └── DEVELOPER-GUIDE.md     # Developer documentation
```

## Test Coverage

- **64 tests passing**
- Unit tests for all components
- Integration tests for workflows
- Fixtures for realistic test data
- Coverage for edge cases

## Security Features

### Credential Detection Patterns

- AWS Access Keys & Secret Keys
- GitHub Personal Access Tokens
- Slack API Tokens
- OpenAI API Keys
- Generic API Keys
- Private Keys (RSA, SSH)
- Database URLs
- JWT Tokens
- Bearer Tokens
- Basic Auth
- ...and more

### PHI Detection Categories

**Identifiers:**
- Social Security Numbers (SSN)
- Medical Record Numbers (MRN)
- Patient IDs
- Account Numbers

**Demographic:**
- Names
- Dates of Birth
- Addresses
- Phone Numbers
- Email Addresses

**Medical:**
- ICD Diagnosis Codes
- CPT Procedure Codes
- Prescriptions
- Lab Results
- Medical Device Identifiers

**Financial:**
- Insurance Policy Numbers
- Claims

### Audit Event Types

- Credential scanning (start, complete, violations)
- PHI detection (start, complete, violations)
- Secrets management (encrypt, decrypt, rotate, warnings)
- Hook management (install, uninstall, trigger, block)
- Allow-list modifications
- System events (log tampering, exports, pruning)

## HIPAA Compliance

This tool helps maintain HIPAA compliance by:

✅ Detecting all 18 HIPAA PHI identifiers
✅ Maintaining 6-year audit trails
✅ Tracking PHI access with tamper-evident logs
✅ Preventing PHI from entering version control
✅ Providing de-identification guidance

**Important:** This is a security aid, not a complete HIPAA solution. Always follow your organization's full HIPAA policies.

## Performance

- Fast regex-based pattern matching
- Efficient file scanning (handles large codebases)
- Minimal memory footprint
- Optimized audit log queries
- Batch processing support

## Configuration

Create `security-config.json` in your project:

```json
{
  "preCommitHooks": {
    "enabled": true,
    "blockOnViolations": true,
    "scanCredentials": true,
    "scanPHI": true,
    "phiSensitivity": "medium"
  },
  "auditLogging": {
    "enabled": true,
    "retentionDays": 2190
  },
  "secretsManagement": {
    "enabled": true,
    "rotationDays": 90
  },
  "allowList": []
}
```

## Documentation

- **[User Guide](docs/USER-GUIDE.md)** - Complete tool reference and usage examples
- **[Developer Guide](docs/DEVELOPER-GUIDE.md)** - Architecture, patterns, and contributing

## Development

```bash
# Install dependencies
npm install

# Build
npm run build

# Watch mode
npm run dev

# Run tests
npm test

# Run tests in watch mode
npm test -- --watch

# Lint
npm run lint
```

## Contributing

Contributions welcome! Please:

1. Fork the repository
2. Create a feature branch
3. Add tests for new features
4. Ensure all tests pass
5. Update documentation
6. Submit a pull request

See [DEVELOPER-GUIDE.md](docs/DEVELOPER-GUIDE.md) for details.

## License

MIT License - see [LICENSE](LICENSE) file for details.

## Support

For questions or issues:

1. Check the [User Guide](docs/USER-GUIDE.md)
2. Review [Developer Guide](docs/DEVELOPER-GUIDE.md)
3. Search existing issues
4. Create a new issue with details

## Changelog

### v1.0.0 (2025-01-28)

Initial release with:
- Credential detection (15+ patterns)
- PHI protection (18 HIPAA identifiers)
- Secrets management (OS-native + encrypted fallback)
- Audit logging (tamper-evident, 6-year retention)
- Pre-commit hooks
- Allow-list management
- 64 passing tests
- Complete documentation

## Acknowledgments

Built for medical practice workspaces requiring HIPAA compliance and automated security.

---

**Security Notice:** Never commit actual credentials or PHI. This tool helps prevent accidents, but developers must follow security best practices.
