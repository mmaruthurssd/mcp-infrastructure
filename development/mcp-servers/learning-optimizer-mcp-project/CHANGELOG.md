# Changelog - Learning Optimizer MCP

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [1.0.1] - 2025-11-07

### Added
- **SECURITY.md** - Comprehensive security policy for issue tracking operations
  - Issue data storage security considerations
  - Domain configuration security measures
  - Duplicate detection security guidelines
  - Promotion workflow security best practices
  - Data sanitization requirements (NO PHI/credentials in issues)
  - HIPAA compliance for medical practice issues
  - Integration security with other MCPs

### Documentation
- Enhanced security documentation for issue tracking
- Added data sanitization guidelines for issue descriptions
- Documented secure vs. insecure issue tracking examples
- Added HIPAA-compliant issue tracking patterns

## [1.0.0] - 2025-11-07

### Added (Standardization)
- Created 8-folder project structure
- Moved source from local-instances to development/staging
- Added project metadata files (README.md, CHANGELOG.md, EVENT_LOG.md)
- Created drop-in template in templates-and-patterns/
- Added TEMPLATE-INFO.json with AI installation metadata
- Created INSTALL-INSTRUCTIONS.md and install.sh
- Verified ~/.claude.json registration with absolute paths
- Achieved standards compliance

### Existing Features (Pre-Standardization)
- Issue tracking with auto-duplicate detection
- Knowledge base optimization
- Domain-specific configuration
- Promotion workflow with human review
- Prevention metrics tracking
- 11 tools for comprehensive issue management

## [Pre-Standardization] - Before 2025-11-07

### Context
- MCP existed in local-instances/mcp-servers/learning-optimizer-mcp-server/
- Functional and registered in ~/.claude.json
- No 8-folder structure
- No drop-in template
- Manual installation process
