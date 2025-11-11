---
type: readme
tags: [security, compliance, credential-scanning, phi-detection, hipaa]
---

# Security & Compliance MCP Project

**MCP Name:** security-compliance-mcp
**Status:** Production (v1.0.0)
**Purpose:** Credential scanning, PHI detection, HIPAA compliance validation

---

## Overview

This MCP provides security and compliance tools for medical practice workspace:
- **Credential Scanning:** Detect exposed API keys, tokens, passwords
- **PHI Detection:** Identify Protected Health Information in files
- **HIPAA Compliance:** Validate against HIPAA standards
- **Git Integration:** Pre-commit hooks for automated scanning

---

## Production Location

**Path:** `/local-instances/mcp-servers/security-compliance-mcp/`
**Registered:** ~/.claude.json (Claude Code CLI)

---

## Staging Location

**Path:** `04-product-under-development/dev-instance/`

**Workflow:**
1. Issues discovered in production → logged to `08-archive/issues/`
2. Fixes developed in `dev-instance/`
3. Tested and validated in staging
4. Deployed to production

---

## Dual-Environment Workflow

### Production Issue → Staging Fix → Deploy

1. **Log Issue**
   ```bash
   cd 08-archive/issues/
   # Create issue-YYYY-MM-DD-description.md
   ```

2. **Fix in Staging**
   ```bash
   cd 04-product-under-development/dev-instance/
   # Make code changes
   npm run build
   npm test
   ```

3. **Validate**
   ```bash
   cd ../../../mcp-implementation-master-project/03-resources-docs-assets-tools/
   ./validate-dual-environment.sh security-compliance-mcp
   ```

4. **Deploy to Production**
   ```bash
   # If validation passes
   cp -r dev-instance/dist/ /local-instances/mcp-servers/security-compliance-mcp/
   # Restart Claude Code
   ```

---

## Tools Provided

### scan_for_credentials
Scan files for exposed credentials (API keys, tokens, passwords)

### scan_for_phi
Detect Protected Health Information for HIPAA compliance

### manage_allowlist
Manage security allow-list to filter false positives

### manage_hooks
Install/uninstall git pre-commit hooks

### manage_secrets
Securely encrypt, decrypt, and rotate API keys

---

## Version History

### v1.0.0 (2025-10-28)
- Initial production release
- Credential scanning with 50+ patterns
- PHI detection for HIPAA compliance
- Git pre-commit hooks
- Secret management with encryption

---

## Retrofit Event

**Date:** 2025-10-29
**Action:** Retrofitted to dual-environment pattern
**Reason:** Enable production feedback loop and architectural compliance
**Status:** Staging project created, production code copied to dev-instance

---

**Created:** 2025-10-28
**Retrofitted:** 2025-10-29
**Last Updated:** 2025-10-29
