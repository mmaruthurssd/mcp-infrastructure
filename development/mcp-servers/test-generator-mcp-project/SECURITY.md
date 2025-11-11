# Security Policy - Test Generator MCP

**Version:** 1.0.0
**Last Updated:** 2025-11-07
**Severity:** MEDIUM

---

## Overview

The Test Generator MCP automatically generates unit tests, integration tests, and analyzes test coverage. It analyzes source code and generates test files, which requires careful handling to avoid exposing sensitive information in test data.

---

## Reporting Security Vulnerabilities

### How to Report

**DO NOT** create public GitHub issues for security vulnerabilities.

**DO** report security issues to:
- Repository owner/maintainer
- Via private email or secure channel

### Information to Include

1. **Description** of the vulnerability
2. **Steps to reproduce** the issue
3. **Potential impact** and attack scenarios
4. **Affected versions** of the MCP
5. **Suggested fix** (if known)

### Response Timeline

- **Acknowledgment:** Within 48 hours
- **Initial assessment:** Within 5 business days
- **Fix development:** Based on severity
- **Deployment:** Coordinated with reporter

---

## Supported Versions

| Version | Supported          | Status      |
|---------|--------------------|-------------|
| 1.0.x   | :white_check_mark: | Production  |
| < 1.0   | :x:                | Development |

---

## Security Considerations

### 1. Source Code Analysis

**Risk:** The MCP reads source code via AST parsing, which may expose sensitive logic or data.

**Mitigation:**
- Analysis performed locally only
- No source code transmitted externally
- AST parsing in isolated process
- No code storage or caching

**Best Practices:**
- Remove sensitive data from source before analysis
- Use sanitized codebases for test generation
- Review source code for credentials before analysis

### 2. Test Data Generation

**Risk:** Generated tests may include sensitive data from source code examples.

**CRITICAL SECURITY CONCERN:**
- **Never use real PHI** in test data
- **Never use real credentials** in test fixtures
- **Never use production data** in tests

**Security Measures:**
- Generated tests use placeholder values
- Test data clearly marked as synthetic
- No automatic extraction of real data

**Best Practices:**
- Review all generated tests before committing
- Replace any real data with synthetic equivalents
- Use test data generators for realistic but fake data
- Mark test files with clear "TEST DATA ONLY" comments

### 3. Integration Test Generation

**Risk:** Generated integration tests may include real API endpoints or credentials.

**Security Measures:**
- Generated tests use environment variables for credentials
- API endpoints parameterized
- No hardcoded secrets in generated tests

**Best Practices:**
- Review generated integration tests carefully
- Verify all credentials use environment variables
- Test against staging environments only
- Never include production endpoints in tests

### 4. Coverage Analysis

**Risk:** Coverage reports may expose file structure or sensitive code paths.

**Security Measures:**
- Coverage analysis runs locally
- Reports stored in gitignored directories
- User controls report distribution

**Best Practices:**
- Store coverage reports securely
- Review reports before sharing
- Exclude sensitive files from coverage
- Use appropriate access controls

### 5. Test File Creation

**Risk:** The MCP writes test files to the file system.

**Security Measures:**
- Files written only to specified test directories
- User controls file locations
- No modification of non-test files
- All file operations logged

**Best Practices:**
- Verify test file locations before generation
- Review generated files immediately
- Use version control for test files
- Monitor file creation logs

---

## Vulnerability Severity Ratings

### High (P1)
- Sensitive data in generated tests
- Real credentials in test fixtures
- PHI exposure in test data
- Unauthorized file access

**Response Time:** 14 days

### Medium (P2)
- Information disclosure in tests
- Insecure test patterns
- Logic vulnerabilities

**Response Time:** 30 days

### Low (P3)
- Minor information leaks
- Documentation issues
- Test quality concerns

**Response Time:** 90 days

---

## Security Best Practices for Users

### Installation

1. **Verify source integrity:**
   ```bash
   git log --show-signature
   ```

2. **Review dependencies:**
   ```bash
   npm audit
   npm audit fix
   ```

### Pre-Generation Checklist

**Before generating tests:**

1. ✅ Source code contains no sensitive data
2. ✅ No hardcoded credentials in source
3. ✅ Test data will be synthetic only
4. ✅ Target directory is appropriate
5. ✅ File permissions are correct

### Test Generation Best Practices

1. **Generate tests safely:**
   ```bash
   # Specify test directory explicitly
   # Review source code first
   # Use appropriate coverage level
   ```

2. **Review generated tests:**
   - Check for sensitive data
   - Verify credentials use env vars
   - Validate test data is synthetic
   - Ensure no production endpoints

3. **Test data guidelines:**
   - Use faker libraries for realistic data
   - Mark all test data clearly
   - Document test data sources
   - Never copy production data

### Secure Test Data Examples

**BAD (Contains sensitive data):**
```javascript
describe('Patient API', () => {
  it('should fetch patient', async () => {
    const patient = await api.getPatient('John Doe', 'SSN-123-45-6789');
    expect(patient.mrn).toBe('MRN123456');
  });
});
```

**GOOD (Synthetic data only):**
```javascript
describe('Patient API', () => {
  it('should fetch patient', async () => {
    // TEST DATA ONLY - Not real patient information
    const testPatient = {
      name: 'Test Patient',
      mrn: 'TEST-MRN-001'
    };
    const result = await api.getPatient(testPatient.name, testPatient.mrn);
    expect(result).toBeDefined();
  });
});
```

---

## Test Data Sanitization

### Prohibited in Test Files

**Never include:**
- ❌ Real patient names, MRNs, SSNs
- ❌ Real API keys or tokens
- ❌ Production database credentials
- ❌ Real email addresses or phone numbers
- ❌ Actual medical records or diagnoses
- ❌ Production service endpoints
- ❌ Real authentication tokens

### Required in Test Files

**Always use:**
- ✅ Synthetic/fake data generators
- ✅ Clearly marked test data
- ✅ Environment variables for credentials
- ✅ Mock services and endpoints
- ✅ Test-specific identifiers
- ✅ Placeholder values
- ✅ "TEST DATA ONLY" comments

### Example Test File Header

```javascript
/**
 * TEST DATA ONLY
 *
 * This file contains SYNTHETIC data for testing purposes.
 * No real patient information, credentials, or production data is used.
 *
 * Generated by: test-generator-mcp
 * Date: 2025-11-07
 */
```

---

## Integration Test Security

### REST API Tests

**Security measures for generated API tests:**

1. **Environment-based configuration:**
   ```javascript
   const API_BASE_URL = process.env.TEST_API_URL || 'http://localhost:3000';
   const API_KEY = process.env.TEST_API_KEY;
   ```

2. **Mock external services:**
   ```javascript
   // Never call production APIs in tests
   jest.mock('external-service');
   ```

3. **Use test databases:**
   ```javascript
   // Always use separate test database
   const dbUrl = process.env.TEST_DATABASE_URL;
   ```

### Authentication Tests

**Generated auth tests should:**

1. Use test-specific credentials
2. Never include real passwords
3. Mock authentication services
4. Test against staging environments
5. Clear sessions after tests

---

## Framework-Specific Security

### Jest

- Use `jest.mock()` for external dependencies
- Clear mocks between tests
- Isolate test data in fixtures
- Use `beforeEach`/`afterEach` for cleanup

### Mocha

- Use `sinon` for safe mocking
- Implement proper test teardown
- Isolate test environments
- Use test-specific configuration

### Vitest

- Leverage fast isolated test runs
- Use `vi.mock()` for dependencies
- Implement proper cleanup
- Test in isolated environments

### Supertest

- Never test against production
- Use ephemeral test servers
- Mock external API calls
- Clean up test resources

---

## Compliance Considerations

### HIPAA (Healthcare Projects)

When generating tests for medical applications:

**Requirements:**
- **No PHI** in test data ever
- **Synthetic data only** for all tests
- **Clear labeling** of test data
- **Separate test environments** from production
- **No production database** access in tests

**Example Compliant Test:**
```javascript
/**
 * HIPAA COMPLIANT TEST
 * Uses only synthetic patient data
 */
describe('Appointment Scheduling', () => {
  const TEST_PATIENT = {
    id: 'TEST-001',
    name: 'Test Patient A',
    mrn: 'FAKE-MRN-12345'
  };

  it('should schedule appointment', () => {
    const result = scheduleAppointment(TEST_PATIENT);
    expect(result.status).toBe('scheduled');
  });
});
```

---

## Coverage Report Security

### Generated Coverage Reports

**Security considerations:**

1. **File paths** may expose project structure
2. **Function names** may reveal business logic
3. **Coverage metrics** may indicate security-critical code

**Best Practices:**
- Store reports in `.gitignore`d directories
- Review reports before sharing externally
- Exclude sensitive files from coverage
- Use access controls on report directories

### Coverage Configuration

```javascript
// jest.config.js
module.exports = {
  coveragePathIgnorePatterns: [
    '/node_modules/',
    '/secrets/',
    '/config/production/',
    '/.env'
  ]
};
```

---

## Regular Security Tasks

### After Each Test Generation
- Review generated tests for sensitive data
- Verify test data is synthetic
- Check credentials use env vars
- Commit tests to version control

### Weekly
- Run test suite with fresh data
- Review test coverage reports
- Update test data generators

### Monthly
- Audit test data for realism without sensitivity
- Review test environment security
- Update testing dependencies

### Quarterly
- Security policy review
- Test framework updates
- Test data audit

---

## Security Audit Log

| Date       | Action                  | Severity | Status   |
|------------|-------------------------|----------|----------|
| 2025-11-07 | Initial SECURITY.md     | Info     | Complete |

---

## Additional Resources

- [SECURITY_BEST_PRACTICES.md](/SECURITY_BEST_PRACTICES.md) - Workspace security guidelines
- [SECURITY.md](/SECURITY.md) - Root workspace security policy
- [MCP Documentation](./05-documentation/) - User guides
- [OWASP Testing Guide](https://owasp.org/www-project-web-security-testing-guide/)

---

## Contact Information

**Security Issues:** Contact repository owner
**General Questions:** See README.md

---

**Last Reviewed:** 2025-11-07
**Next Review:** 2026-02-07 (Quarterly)
**Reviewed By:** Agent 3 - MCP Standardization Team
