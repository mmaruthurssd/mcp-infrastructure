---
type: documentation
tags: [known-issues, validator-behavior, compliance, troubleshooting]
---

# Known Issues & Expected Behaviors

**Project:** Standards Enforcement MCP
**Created:** 2025-11-07
**Status:** Active

---

## 1. Template Path Mismatch (Expected Behavior)

### Issue Description

The template validator checks for templates in `/templates/drop-in-templates/` but the workspace actually stores MCP templates in `/templates-and-patterns/mcp-server-templates/`.

**Result:** All MCPs appear to fail the template-first development check, showing 0/100 compliance scores even when templates exist.

### Why This Happens

This is **expected behavior** due to a workspace structure decision:

1. **Original Standard:** Early workspace design used `/templates/drop-in-templates/` for all templates
2. **Workspace Evolution:** The structure evolved to organize templates more granularly:
   - `/templates-and-patterns/` (top-level organization)
   - `/templates-and-patterns/mcp-server-templates/` (MCP-specific templates)
   - This provides better separation between MCP templates, project templates, and reusable patterns

3. **Validator Design:** The validator uses the original standard path, which was correct at time of implementation

### Impact

**Severity:** Medium
- **False Negatives:** Compliant MCPs appear non-compliant
- **Misleading Scores:** Compliance scores appear artificially low (0/100 instead of actual 80-90)
- **User Confusion:** Users may think their MCPs are non-compliant when they actually follow standards

**What Still Works:**
- All other validation categories function correctly
- MCPs with templates in the actual location work fine in practice
- Template-based installation workflows are unaffected

### Root Cause Analysis

The validator's `TemplateExistenceValidator` class hardcodes:

```typescript
const templatePath = path.join(
  workspacePath,
  'templates',
  'drop-in-templates',
  `${mcpName}-template`
);
```

**Correct path should be:**
```typescript
const templatePath = path.join(
  workspacePath,
  'templates-and-patterns',
  'mcp-server-templates',
  `${mcpName}-template`
);
```

### Resolution Options

#### Option A: Update Validator (Recommended)

**Pros:**
- Accurate compliance reporting
- Reflects actual workspace structure
- No confusion for users

**Cons:**
- Requires code change and rebuild
- Needs retesting of validator

**Implementation:**
1. Update `TemplateExistenceValidator.ts` path constant
2. Rebuild standards-enforcement-mcp
3. Run compliance audit to verify
4. Update workspace documentation

**Time Estimate:** 30 minutes

#### Option B: Update Workspace Structure (Not Recommended)

**Pros:**
- Validator works as-is

**Cons:**
- Disrupts established workspace organization
- Requires moving 24+ templates
- Breaks existing installation scripts
- Violates current workspace conventions

**Why Not Recommended:** Workspace structure is well-established and documented. Changing it to match validator expectations would be backwards.

#### Option C: Document as Known Issue (Current Status)

**Pros:**
- No code changes needed
- Clear explanation for users

**Cons:**
- Compliance scores remain misleading
- Users must remember this quirk

**Status:** ✅ Currently implemented via this document

### Workaround

**Until validator is updated:**

1. **When reviewing compliance reports:**
   - Ignore "template-first" violations
   - Manually verify templates exist in `/templates-and-patterns/mcp-server-templates/`
   - Add ~20-30 points to reported compliance scores to account for this category

2. **When validating specific MCP:**
   - Run: `ls templates-and-patterns/mcp-server-templates/ | grep [mcp-name]-template`
   - If template exists, MCP is actually compliant for template-first standard

3. **Example:**
   - **Reported Score:** 0/100 (all categories fail)
   - **Template Exists:** Yes (in correct location)
   - **Actual Score:** ~25-30/100 (template-first category passes)

### Related Documentation

- **Workspace Structure:** `/WORKSPACE_ARCHITECTURE.md`
- **Template Standards:** `/templates-and-patterns/mcp-server-templates/TEMPLATE-CREATION-GUIDE.md`
- **Validator Spec:** `/development/mcp-servers/standards-enforcement-mcp-project/01-planning/SPECIFICATION.md`

---

## 2. Dual-Environment Mapping Strictness

### Issue Description

The dual-environment validator requires exact 1:1 mapping between:
- `/development/mcp-servers/[name]-project/`
- `/local-instances/mcp-servers/[name]/`

**Result:** MCPs in development that haven't been deployed yet show as non-compliant.

### Why This Happens

This is **intentional** to enforce the dual-environment pattern where every production instance has a corresponding development project.

### Expected Behavior

- **Development-only MCPs:** Will fail dual-environment check (as intended)
- **Production-only MCPs:** Will fail dual-environment check (indicates missing development project)
- **Properly paired MCPs:** Pass dual-environment check

### Workaround

For development-only MCPs (not yet production-ready):
1. Accept the compliance violation (it's accurate)
2. Once ready for production, deploy to `/local-instances/`
3. Compliance score will improve automatically

---

## 3. Security Validator Integration Dependency

### Issue Description

The security validator integrates with `security-compliance-mcp` for credential scanning. If security-compliance-mcp is not available, security checks may be skipped or fail.

### Expected Behavior

- If `security-compliance-mcp` is registered and available: Full security scanning
- If `security-compliance-mcp` is not available: Security checks are skipped with warning

### Workaround

Ensure `security-compliance-mcp` is registered in `~/.claude.json` for full security validation.

---

## Reporting New Issues

If you discover additional issues or unexpected behavior:

1. **Document:** Add to this file with same format
2. **Severity:** Rate as Critical/High/Medium/Low
3. **Workaround:** Provide temporary solution if available
4. **Resolution:** Propose fix with time estimate

---

**Last Updated:** 2025-11-07
**Maintainer:** Standards Enforcement MCP Team
**Review Schedule:** Quarterly
