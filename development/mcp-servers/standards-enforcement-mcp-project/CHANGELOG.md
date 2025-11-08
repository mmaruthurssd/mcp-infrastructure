# Changelog

All notable changes to the Standards Enforcement MCP will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [0.2.0] - 2025-11-07

### Fixed
- **Template path validation**: Updated validator to check correct template path
  - Changed from `/templates/drop-in-templates/` to `/templates-and-patterns/mcp-server-templates/`
  - Maintains backward compatibility by checking old path as fallback
  - Updated error messages to reference correct path
  - Updated all documentation examples to show correct path

### Changed
- Updated version from 0.1.0 to 0.2.0
- Modified files:
  - `src/validators/template-existence.ts` - Added new path with fallback logic
  - `src/tools/validate-template-exists.ts` - Updated context path and documentation
  - `src/rules/registry-init.ts` - Updated documentation examples
  - `src/index.ts` - Updated server version

## [0.1.0] - 2025-11-06

### Added
- Initial release of Standards Enforcement MCP
- Three validation tools:
  - `validate_mcp_compliance` - Comprehensive MCP validation
  - `validate_project_structure` - Project folder structure validation
  - `validate_template_exists` - Template existence and quality validation
- Support for multiple standard categories:
  - Dual-environment validation
  - Template-first development validation
  - Project structure validation
  - Configuration validation
  - Documentation validation
  - Security and HIPAA compliance validation
- Detailed violation reporting with suggestions
- Auto-fix capability detection
- Compliance scoring system
