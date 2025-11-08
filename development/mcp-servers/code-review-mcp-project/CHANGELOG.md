# Changelog - Code Review MCP

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [1.0.1] - 2025-11-07

### Added
- **SECURITY.md** - Comprehensive security policy for code analysis operations
  - Source code analysis security considerations
  - Technical debt tracking security measures
  - Code smell detection security guidelines
  - Report generation security best practices
  - Apps Script specific security checks
  - HIPAA compliance guidelines for healthcare code
  - Integration security with other MCPs

### Documentation
- Enhanced security documentation for static analysis operations
- Added guidelines for sanitizing code before analysis
- Documented security-related code smell detection patterns

## [1.0.0] - 2025-11-07

### Initial Release
- Static analysis with ESLint, Pylint, Checkstyle
- Complexity metrics (cyclomatic, cognitive, nesting depth)
- Code smell detection for multiple languages
- Technical debt tracking with persistent storage
- AI-powered improvement suggestions
- Comprehensive review report generation

### Supported Languages
- TypeScript
- JavaScript
- Python
- Java
- Google Apps Script

### Tools (6)
1. `analyze_code_quality` - Linting and static analysis
2. `detect_complexity` - Complexity analysis and hotspot detection
3. `find_code_smells` - Anti-pattern and code smell detection
4. `track_technical_debt` - Debt item management and tracking
5. `suggest_improvements` - AI-powered code improvement suggestions
6. `generate_review_report` - Comprehensive code review reports
