# Changelog - Test Generator MCP

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [1.0.1] - 2025-11-07

### Added
- **SECURITY.md** - Comprehensive security policy for test generation operations
  - Test data generation security requirements (NO PHI/PII in tests)
  - Source code analysis security considerations
  - Integration test generation security measures
  - Coverage report security guidelines
  - HIPAA compliance for medical practice test data
  - Test file creation security best practices
  - Framework-specific security considerations

### Documentation
- Enhanced security documentation emphasizing synthetic test data only
- Added test data sanitization guidelines
- Documented secure test patterns and anti-patterns
- Added HIPAA-compliant test examples

### Security
- Emphasized critical requirement: **NEVER use real PHI in test data**
- Added test file header templates with "TEST DATA ONLY" markers
- Documented secure vs. insecure test data examples

## [1.0.0] - 2025-11-07

### Initial Release
- Unit test generation via AST parsing
- Integration test generation for REST APIs
- Coverage gap analysis with priority recommendations
- Test scenario suggestions with edge case detection
- Multiple framework support

### Supported Frameworks
- Jest (unit and integration tests)
- Mocha (unit tests)
- Vitest (unit tests)
- Supertest (API integration tests)

### Coverage Levels
- Basic: Happy path tests only
- Comprehensive: Happy path + error handling
- Edge-cases: All scenarios including boundary conditions

### Tools (4)
1. `generate_unit_tests` - Generate unit tests from source code
2. `generate_integration_tests` - Generate API integration tests
3. `analyze_coverage_gaps` - Identify untested code with priorities
4. `suggest_test_scenarios` - AI-powered test scenario suggestions
