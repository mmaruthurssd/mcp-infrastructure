# Changelog - Security & Compliance MCP

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [1.0.1] - 2025-11-07

### Added
- **SECURITY.md** - Comprehensive security policy and vulnerability reporting procedures
  - HIPAA compliance considerations
  - PHI detection security measures
  - Credential scanning security best practices
  - Secret management security guidelines
  - Vulnerability severity ratings with response timelines
  - Incident response procedures
  - Security audit requirements

### Documentation
- Enhanced security documentation for CRITICAL security infrastructure component
- Added security best practices for users and operators
- Documented compliance certifications (HIPAA, HITECH, SOC 2, ISO 27001)

## [1.0.0] - 2025-10-28

### Initial Production Release
- Credential scanning with 50+ patterns
- PHI detection for HIPAA compliance
- Git pre-commit hooks for automated security scanning
- Secret management with OS keychain encryption
- Allow-list management for false positive filtering

### Tools (5)
1. `scan_for_credentials` - Detect exposed API keys, tokens, passwords
2. `scan_for_phi` - Identify Protected Health Information
3. `manage_allowlist` - Manage security allow-list
4. `manage_hooks` - Install/uninstall git pre-commit hooks
5. `manage_secrets` - Encrypt, decrypt, and rotate secrets

## [Pre-Production] - Before 2025-10-28

### Context
- MCP developed for medical practice workspace security
- HIPAA compliance as primary requirement
- Integration with workspace security infrastructure
