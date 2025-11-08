# Security Policy - Code Review MCP

**Version:** 1.0.0
**Last Updated:** 2025-11-07
**Severity:** MEDIUM

---

## Overview

The Code Review MCP provides static analysis, complexity detection, code smell identification, and technical debt tracking. It analyzes source code and may encounter sensitive information in code comments or string literals.

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

**Risk:** The MCP reads and analyzes source code, which may contain sensitive information.

**Mitigation:**
- Analysis performed locally only
- No code transmitted externally
- No code stored or cached
- Results contain file paths and metrics only

**Best Practices:**
- **Remove sensitive data** from code before analysis
- **Never commit credentials** in source code
- Use code scanning on sanitized codebases
- Review analysis reports for sensitive data exposure

### 2. Technical Debt Tracking

**Risk:** Technical debt descriptions may contain sensitive information about vulnerabilities or system architecture.

**Security Measures:**
- Debt data stored locally in project directories
- No external transmission of debt data
- User-managed access control

**Best Practices:**
- **Sanitize debt descriptions** before tracking
- **Never include credentials** or API keys in debt items
- Use generic descriptions for security-related debt
- Review debt reports before sharing

### 3. Code Smell Detection

**Risk:** Code smells may expose security vulnerabilities or sensitive business logic.

**Security Measures:**
- Detection runs locally only
- Results show patterns, not actual code
- No modification of source files

**Best Practices:**
- Address security-related smells immediately
- Don't ignore authentication/authorization smells
- Review detected patterns for sensitive data

### 4. Report Generation

**Risk:** Generated reports may contain sensitive code snippets or system information.

**Security Measures:**
- Reports stored locally only
- User controls report format and content
- No automatic report transmission

**Best Practices:**
- Review reports before sharing
- Redact sensitive information from reports
- Store reports in secure locations
- Use appropriate access controls

### 5. Static Analysis Tools

**Risk:** The MCP uses third-party tools (ESLint, Pylint, etc.) that may have vulnerabilities.

**Security Measures:**
- Regular dependency updates
- Security audits of dependencies
- Sandboxed execution where possible

**Best Practices:**
- Keep MCP and dependencies updated
- Review security advisories
- Run `npm audit` regularly

---

## Vulnerability Severity Ratings

### High (P1)
- Remote code execution via analysis
- Sensitive data exposure in reports
- Unauthorized file access

**Response Time:** 14 days

### Medium (P2)
- Information disclosure
- Logic vulnerabilities
- Insecure analysis patterns

**Response Time:** 30 days

### Low (P3)
- Minor information leaks
- Documentation issues
- UI/UX concerns

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

### Pre-Analysis Checklist

**Before running code analysis:**

1. ✅ Ensure no hardcoded credentials in source
2. ✅ Remove sensitive comments
3. ✅ Sanitize test data
4. ✅ Review string literals for secrets
5. ✅ Check configuration files

### Operation

1. **Analyze code safely:**
   ```bash
   # Review exclude patterns
   # Scan specific directories only
   # Limit analysis scope
   ```

2. **Review reports:**
   - Check for sensitive data exposure
   - Redact before sharing
   - Store securely

3. **Track technical debt:**
   - Sanitize descriptions
   - Use generic terms
   - Avoid specific vulnerability details

### Code Sanitization Guidelines

**Before analysis, remove:**
- ❌ API keys in code or comments
- ❌ Passwords or tokens
- ❌ PHI in test data or comments
- ❌ Real database credentials
- ❌ Internal URLs or IP addresses
- ❌ Secret keys or certificates

**Use instead:**
- ✅ Environment variables
- ✅ Configuration files (gitignored)
- ✅ Placeholder values
- ✅ Mock data generators

---

## Detected Security Issues

The MCP can detect these security-related code smells:

### Critical
- Hardcoded credentials
- SQL injection patterns
- XSS vulnerabilities
- Insecure cryptography
- Path traversal risks

### High
- Missing authentication checks
- Weak password validation
- Insecure random number generation
- Unsafe deserialization

### Medium
- Information disclosure in errors
- Insufficient input validation
- Weak encryption algorithms
- Missing security headers

**Action Required:**
- Address **Critical** issues immediately
- Fix **High** issues within 7 days
- Remediate **Medium** issues within 30 days

---

## Integration with Security MCPs

### Recommended Workflow

1. **Pre-commit scanning:**
   ```bash
   # Use security-compliance-mcp first
   # Then run code-review-mcp
   # Address all findings before commit
   ```

2. **Continuous monitoring:**
   - Regular code quality scans
   - Track security-related debt
   - Monitor complexity trends

3. **Security reviews:**
   - Use code-review reports in security audits
   - Track remediation of security smells
   - Document security improvements

---

## Apps Script Specific Security

The MCP supports Google Apps Script analysis with specific security checks:

### Detected Patterns
- Hardcoded credentials in `.gs` files
- Unsafe `eval()` usage
- Missing authorization checks
- Overly permissive OAuth scopes
- Sensitive data in logs

### Best Practices
- Use `PropertiesService` for credentials
- Validate all user inputs
- Implement proper authorization
- Use minimal OAuth scopes
- Avoid logging sensitive data

---

## Compliance Considerations

### HIPAA (Healthcare Projects)

When analyzing medical practice code:

- **Verify no PHI in code** comments or strings
- **Check test data** for synthetic-only usage
- **Review logging statements** for sensitive data
- **Validate authorization** in healthcare functions
- **Ensure encryption** of sensitive data at rest/transit

### SOC 2 Compliance

The MCP supports SOC 2 requirements:

- **Access Control:** Analysis performed locally
- **Availability:** No service dependencies
- **Processing Integrity:** Deterministic analysis
- **Confidentiality:** No data transmission
- **Privacy:** No PII in reports

---

## Regular Security Tasks

### Weekly
- Review detected security smells
- Address critical findings

### Monthly
- Run full codebase analysis
- Update security debt tracking
- Review analysis patterns

### Quarterly
- Security policy review
- Update analysis tools
- Review dependency security

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
- [OWASP Code Review Guide](https://owasp.org/www-project-code-review-guide/)

---

## Contact Information

**Security Issues:** Contact repository owner
**General Questions:** See README.md

---

**Last Reviewed:** 2025-11-07
**Next Review:** 2026-02-07 (Quarterly)
**Reviewed By:** Agent 3 - MCP Standardization Team
