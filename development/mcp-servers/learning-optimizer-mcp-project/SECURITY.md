# Security Policy - Learning Optimizer MCP

**Version:** 1.0.0
**Last Updated:** 2025-11-07
**Severity:** MEDIUM

---

## Overview

The Learning Optimizer MCP tracks issues, detects duplicates, and optimizes knowledge bases across domains. While it doesn't directly handle PHI or credentials, it may process issue descriptions that could contain sensitive information.

---

## Reporting Security Vulnerabilities

### How to Report

**DO NOT** create public GitHub issues for security vulnerabilities.

**DO** report security issues to:
- Repository owner/maintainer
- Via private email or secure channel

### Information to Include

When reporting a security vulnerability, please provide:

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

### 1. Issue Data Storage

**Risk:** Issue descriptions and solutions stored in JSON files may contain sensitive information.

**Mitigation:**
- All issue data stored locally only
- No external transmission of issue data
- Files stored in project directories (gitignored)
- User responsible for sanitizing sensitive data before tracking

**Best Practices:**
- **Never include PHI** in issue descriptions
- **Never include credentials** in issue solutions
- **Redact sensitive information** before logging
- Use generic terms (e.g., "API endpoint" instead of actual URLs)

### 2. Domain Configuration Files

**Risk:** Domain configurations may contain sensitive keywords or patterns.

**Security Measures:**
- Configuration files stored locally
- No network access to configs
- User-managed access control

**Best Practices:**
- Review domain configs regularly
- Remove outdated or sensitive patterns
- Use generic category names

### 3. Duplicate Detection

**Risk:** Similarity scoring may expose patterns in sensitive issue descriptions.

**Security Measures:**
- Similarity detection runs locally only
- No external API calls
- Results stored in memory during processing

**Best Practices:**
- Review duplicate suggestions before merging
- Verify no sensitive data exposed in merge process

### 4. Promotion to Preventive Checks

**Risk:** Promoted issues may contain sensitive troubleshooting steps.

**Security Measures:**
- Human review workflow required for promotions
- Promotion candidates reviewed before approval
- Rejected promotions logged with reasons

**Best Practices:**
- Always review promotion candidates for sensitive data
- Sanitize preventive checks before approval
- Document review decisions

### 5. File System Access

**Risk:** The MCP reads and writes issue files in configured directories.

**Security Measures:**
- Access limited to configured domain directories
- No modification of files outside domains
- All file operations logged

**Best Practices:**
- Configure domain paths carefully
- Use restricted permissions on domain directories
- Monitor file access logs

---

## Vulnerability Severity Ratings

### High (P1)
- Sensitive data exposure
- Unauthorized file access
- Configuration manipulation

**Response Time:** 14 days

### Medium (P2)
- Information disclosure
- Logic vulnerabilities
- Insecure defaults

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

### Configuration

1. **Domain setup:**
   ```json
   {
     "name": "domain-name",
     "knowledgeBasePath": "./knowledge-base/domain-name"
   }
   ```

2. **Secure domain directories:**
   ```bash
   chmod 700 knowledge-base/
   ```

### Operation

1. **Sanitize issue data:**
   - Remove PHI before tracking
   - Remove credentials before tracking
   - Use generic descriptions
   - Redact sensitive URLs or paths

2. **Review promotions:**
   - Check all promotion candidates
   - Sanitize preventive checks
   - Document review decisions

3. **Monitor storage:**
   - Review issue files periodically
   - Remove obsolete issues
   - Check for sensitive data leaks

### Data Sanitization Guidelines

**Before tracking issues, remove:**
- ❌ Patient names, MRNs, SSNs
- ❌ API keys, tokens, passwords
- ❌ Real email addresses or phone numbers
- ❌ Specific IP addresses or internal URLs
- ❌ Database connection strings
- ❌ File paths with sensitive names

**Use instead:**
- ✅ Generic placeholders (e.g., "PATIENT_ID", "API_KEY")
- ✅ Anonymized values (e.g., "user@example.com")
- ✅ Relative paths (e.g., "/config/file.json")
- ✅ Generic descriptions (e.g., "production database")

---

## Incident Response Plan

### Phase 1: Detection
- Security issue reported
- Sensitive data found in logs
- Unauthorized access detected

### Phase 2: Containment
- Assess severity and scope
- Identify affected issue files
- Prevent further exposure

### Phase 3: Remediation
- Remove sensitive data from issue files
- Update affected domains
- Patch vulnerabilities

### Phase 4: Prevention
- Update documentation
- Improve data sanitization guidelines
- Train users on secure practices

### Phase 5: Documentation
- Log incident in learning-optimizer itself
- Update security policy
- Share lessons learned

---

## Compliance Considerations

### HIPAA (Healthcare Projects)

If using this MCP for medical practice projects:

- **Never log PHI** in issue descriptions
- **Never log medical data** in solutions
- **Use generic terms** for patient-related issues
- **Review all issues** before promotion

### Example - Compliant Issue Tracking

**BAD (Contains PHI):**
```
Issue: Patient John Doe's appointment sync failing
Solution: Updated sync code for MRN 123456
```

**GOOD (No PHI):**
```
Issue: Appointment sync failing for specific patient type
Solution: Updated sync logic to handle edge case with identifier format
```

---

## Regular Security Tasks

### Weekly
- Review new issues for sensitive data
- Check promotion candidates

### Monthly
- Audit domain configurations
- Review knowledge base files
- Remove obsolete issues

### Quarterly
- Security policy review
- Access control review
- Domain configuration audit

---

## Security Audit Log

| Date       | Action                  | Severity | Status   |
|------------|-------------------------|----------|----------|
| 2025-11-07 | Initial SECURITY.md     | Info     | Complete |

---

## Additional Resources

- [SECURITY_BEST_PRACTICES.md](/SECURITY_BEST_PRACTICES.md) - Workspace-wide security guidelines
- [SECURITY.md](/SECURITY.md) - Root workspace security policy
- [MCP Documentation](./05-documentation/) - User guides and API documentation

---

## Contact Information

**Security Issues:** Contact repository owner
**General Questions:** See README.md for support channels

---

**Last Reviewed:** 2025-11-07
**Next Review:** 2026-02-07 (Quarterly)
**Reviewed By:** Agent 3 - MCP Standardization Team
