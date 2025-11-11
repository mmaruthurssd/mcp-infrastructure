---
type: readme
tags: [mcp-server, standards-enforcement, infrastructure, workspace-quality]
---

# Standards Enforcement MCP

**Status:** 🟡 Development Complete - Testing Phase (88%)
**Version:** 0.1.0
**Created:** 2025-11-06
**Updated:** 2025-11-06
**Priority:** Critical - Infrastructure

## Overview

MCP server that validates and enforces workspace development standards to prevent technical debt and maintain consistent quality across all projects.

### Purpose

Validates compliance with workspace standards:
- ✅ **Dual-Environment Pattern** - Development ↔ Production mapping
- ✅ **Template-First Development** - Every MCP has a drop-in template
- ✅ **8-Folder Structure** - Consistent project organization
- ✅ **Configuration Standards** - No workspace .mcp.json files
- ✅ **Documentation Requirements** - YAML frontmatter, complete docs
- ✅ **Security Standards** - No credentials, pre-commit hooks active

### Problem Solved

**Before:** No automated enforcement, standards followed inconsistently, technical debt accumulates

**After:** Automated validation, pre-deployment enforcement, violations caught early

## Architecture

### Core Tools (8)

1. `validate_mcp_compliance` - Check MCP follows all standards
2. `validate_project_structure` - Verify 8-folder structure
3. `validate_template_exists` - Ensure production MCP has template
4. `enforce_pre_deployment` - Block non-compliant deployments
5. `generate_compliance_report` - Workspace compliance dashboard
6. `suggest_fixes` - Auto-fix common violations
7. `track_violations` - Log violations for trend analysis
8. `generate_standards_docs` - Auto-generate STANDARDS.md

### Integration Points

- **mcp-config-manager** - Configuration validation
- **workspace-index** - Documentation validation
- **security-compliance-mcp** - Security scanning
- **deployment-release-mcp** - Pre-deployment hooks
- **workspace-brain-mcp** - Telemetry and trends

## Quick Start

**Build & Test:**
```bash
cd 04-product-under-development
npm install
npm run build
npm test
```

**Deploy:**
```bash
# Register in ~/.claude.json
mcp-config-manager register_mcp_server --serverName=standards-enforcement
```

## Development Status

### Phase 1: Core Validation ✅ COMPLETE
- ✅ Rules engine (3 files: rules-engine, rules-registry, compliance-calculator)
- ✅ 6 validator implementations (dual-env, template, structure, config, docs, security)
- ✅ Tools 1-3 (validate_mcp_compliance, validate_project_structure, validate_template_exists)
- ✅ MCP server entry point with stdio transport
- ✅ Built and registered in ~/.claude.json
- ⏳ Unit tests (85%+ coverage) - Optional

### Phase 2: Integration & Automation ✅ COMPLETE
- ✅ Integration strategy documented
- ✅ Deployment-Release MCP integration example
- ✅ Weekly compliance audit script
- ✅ **Actual integration with deployment-release-mcp** - **DONE 2025-11-06!**
- ✅ **Integration with MCP Config Manager** - **DONE 2025-11-06!**
- ✅ **Integration with Git Assistant** - **DONE 2025-11-06!**
- ✅ **Integration with Task Executor** - **DONE 2025-11-07!**
- ✅ **Integration with Spec-Driven** - **DONE 2025-11-07!**

### Phase 3: Auto-Fix & Reporting 🔴 PLANNED
- ⏳ Tool 4: enforce_pre_deployment
- ⏳ Tool 5: generate_compliance_report
- ⏳ Tool 6: suggest_fixes
- ⏳ Tool 7: track_violations
- ⏳ Tool 8: generate_standards_docs
- ⏳ Auto-fixers for common violations

### Current Progress: 17/17 Tasks (100%) + 5 Integrations Complete! 🎉

**Integrations Completed:**
- ✅ Deployment-Release MCP (blocks non-compliant production deployments)
- ✅ MCP Config Manager (validates before registration)
- ✅ Git Assistant (validates before commit recommendations)
- ✅ Task Executor (validates before workflow archival)
- ✅ Spec-Driven (validates template-first pattern at spec completion)

## Automated Integration

### 🔄 How It Works Automatically

The Standards Enforcement MCP integrates with 5 other MCPs (+ 1 planned) for automated validation:

1. **Git Assistant** - Pre-commit security checks (hardcoded secrets, PHI) ✅
2. **Spec-Driven** - Validates template-first pattern at spec completion ✅
3. **Task Executor** - Validates on workflow completion ✅
4. **MCP Config Manager** - Validates before registering new MCPs ✅
5. **Deployment-Release MCP** - Blocks production deployments if compliance < 80 ✅
6. **Workspace-Index** - Weekly compliance audits ⏳

### 📋 Quick Integration Example

**Deployment Gate (deployment-release-mcp):**
```typescript
// Before deploying to production
const validation = await validate_mcp_compliance({
  mcpName: "my-mcp",
  failFast: true
});

if (!validation.compliant) {
  throw new Error(`🛑 Deployment blocked: ${validation.summary.criticalViolations} critical violations`);
}
```

### 🤖 Weekly Automated Audit

Run the included audit script:
```bash
./01-planning/automation-scripts/weekly-compliance-audit.sh
```

Generates report showing:
- Compliance rate across all MCPs
- Critical violations requiring attention
- Recommendations for improvement

## Documentation

- **[SPECIFICATION.md](01-planning/SPECIFICATION.md)** - Complete technical spec
- **[INTEGRATION_STRATEGY.md](01-planning/INTEGRATION_STRATEGY.md)** - Full integration guide (6 MCPs)
- **[DEPLOYMENT_INTEGRATION_EXAMPLE.md](01-planning/DEPLOYMENT_INTEGRATION_EXAMPLE.md)** - Working code example
- **[INTEGRATION_COMPLETE_DEPLOYMENT_RELEASE.md](01-planning/INTEGRATION_COMPLETE_DEPLOYMENT_RELEASE.md)** - ✅ Completed integration #1
- **[INTEGRATION_COMPLETE_MCP_CONFIG_MANAGER.md](01-planning/INTEGRATION_COMPLETE_MCP_CONFIG_MANAGER.md)** - ✅ **NEW!** Completed integration #2
- **[weekly-compliance-audit.sh](01-planning/automation-scripts/weekly-compliance-audit.sh)** - Automated audit script

## Performance Targets

- Single MCP validation: <500ms
- Full workspace audit (50 MCPs): <10 seconds
- Pre-deployment check: <2 seconds
- Memory usage: <100MB

## Success Metrics

**3-Month Goals:**
- 100% production MCPs pass critical checks
- 0 new deployments without templates
- 0 configuration violations
- 90%+ overall compliance score

---

**Last Updated:** 2025-11-06
**Development Time:** ~6-7 hours (Tasks 1-17)
**Status:** Ready for testing and integration
**Next Steps:** Integrate with Deployment-Release, MCP Config Manager, and Git Assistant MCPs
