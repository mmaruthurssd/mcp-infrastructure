---
type: reference
phase: stable
project: spec-driven-mcp-server
tags: [MCP, automation, mcp-server, spec-driven]
category: mcp-servers
status: completed
priority: medium
---

# {{PROJECT_NAME}} Constitution

> **Purpose**: This constitution defines the foundational principles that govern all development decisions for this project.

**Version**: 1.0.0 | **Ratified**: {{RATIFICATION_DATE}}

---

## Core Development Principles

### Article I: {{TESTING_PRINCIPLE_NAME}}
{{TESTING_REQUIREMENTS}}

**Requirements:**
- {{TEST_LEVEL_1}}
- {{TEST_LEVEL_2}}
- {{TEST_LEVEL_3}}

### Article II: {{CODE_QUALITY_PRINCIPLE}}
{{CODE_QUALITY_DESCRIPTION}}

**Standards:**
- {{QUALITY_STANDARD_1}}
- {{QUALITY_STANDARD_2}}

### Article III: {{SIMPLICITY_PRINCIPLE}}
{{SIMPLICITY_DESCRIPTION}}

**Rules:**
- Start with the simplest implementation that solves the problem
- Add complexity only when proven necessary through testing or requirements
- Document justification for any complex architectural decisions

{{#if PHI_HANDLING}}
### Article IV: PHI Protection (NON-NEGOTIABLE)

**This project handles Protected Health Information (PHI) and MUST comply with HIPAA.**

**Requirements:**
- All PHI must be encrypted at rest and in transit
- Access to PHI must be logged with audit trails
- PHI must never appear in logs, error messages, or debug output
- Data retention policies must be enforced per HIPAA requirements
- All third-party integrations must have Business Associate Agreements (BAAs)

**Testing with PHI:**
- NO real patient data in development or testing environments
- Synthetic data generators must be used for all testing
- Compliance validation tests are mandatory before deployment
{{/if}}

{{#if HIPAA_COMPLIANCE}}
### Article V: HIPAA Compliance

**Compliance Requirements:**
- Minimum necessary standard: Access only required PHI
- User authentication and authorization required
- Automatic session timeout after {{SESSION_TIMEOUT}} minutes
- Data backup and disaster recovery procedures documented
- Breach notification procedures documented
{{/if}}

---

## Technical Standards

### Technology Stack
{{TECH_STACK_DESCRIPTION}}

**Approved Technologies:**
{{#each APPROVED_TECHNOLOGIES}}
- {{this}}
{{/each}}

### Architecture Constraints
{{ARCHITECTURE_DESCRIPTION}}

{{#if INTEGRATION_REQUIREMENTS}}
### Integration Standards
{{INTEGRATION_REQUIREMENTS}}
{{/if}}

---

## Development Workflow

### Code Review Requirements
- All code must be reviewed before merging
- Tests must pass before review
- {{CODE_REVIEW_ADDITIONAL}}

### Testing Gates
{{TESTING_GATES}}

### Deployment Standards
{{DEPLOYMENT_STANDARDS}}

---

## Governance

### Constitutional Authority
This constitution supersedes all other development practices and guidelines. When conflicts arise between this constitution and other documentation, the constitution prevails.

### Amendment Process
Modifications to this constitution require:
1. Explicit documentation of the rationale for change
2. Review and approval by project stakeholders
3. Impact assessment on existing features
4. Migration plan if breaking changes are introduced

### Compliance Verification
All pull requests and code reviews must verify compliance with this constitution. Any deviation must be explicitly justified and documented.

---

**Ratified**: {{RATIFICATION_DATE}}
**Last Amended**: {{LAST_AMENDED_DATE}}
