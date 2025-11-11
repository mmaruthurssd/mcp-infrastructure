---
type: checklist
tags: [rollout, quality-gates, deployment]
---

# Rollout Checklist: Workspace Brain MCP

**Version:** 1.0.0
**Phase:** 1 (File-based storage)
**Date:** 2025-10-31

---

## Layer 1: Automated Validation

### Build Validation
- [x] TypeScript compiles without errors
- [x] Build artifacts generated in `build/` directory
- [x] index.js executable permissions set (chmod +x)
- [x] Zero TypeScript compilation errors
- [x] All 15 tools exported and registered

### Security Scan
- [x] npm audit shows 0 vulnerabilities
- [x] No credentials hardcoded in source
- [x] File permissions set to 0o600/0o700
- [x] No PHI data handling (metadata only)

### Dependency Check
- [x] @modelcontextprotocol/sdk version ^1.0.4
- [x] TypeScript version ^5.7.2
- [x] All dependencies installed successfully

---

## Layer 2: Tool Prevention

### MCP Config Manager Validation
- [x] Run `sync_mcp_configs` before deployment
- [x] No orphaned configurations detected
- [ ] Deployment command validated (pending)

**Command to run:**
```bash
mcp-config-manager.sync_mcp_configs()
```

---

## Layer 3: Manual Verification (MANDATORY)

### MCP Configuration Compliance

**Reviewer:** ________________
**Date:** ________________

#### Verification Steps

1. **Configuration Method**
   - [ ] Used `claude mcp add` command (NOT manual JSON editing)
   - [ ] Command format verified against MCP-CONFIGURATION.md

2. **Path Validation**
   - [ ] Absolute path used (not relative)
   - [ ] Path points to workspace-brain-mcp-project/04-product-under-development/build/index.js
   - [ ] File exists and is executable

3. **Scope Validation**
   - [ ] Registered as **user scope** (generic utility)
   - [ ] Not registered in workspace `.mcp.json`
   - [ ] Verified with `list_mcp_servers` (shows user scope)

4. **No Duplicates**
   - [ ] Checked that workspace-brain-mcp not already registered
   - [ ] No conflicts with existing MCPs
   - [ ] Single registration only (user config)

5. **Environment Variables**
   - [ ] WORKSPACE_BRAIN_PATH documented (default: ~/workspace-brain)
   - [ ] Optional env vars documented
   - [ ] No hardcoded paths in source code

6. **External Brain Setup**
   - [ ] ~/workspace-brain/ directory created
   - [ ] Subdirectories created (telemetry, analytics, learning, cache, backups)
   - [ ] Permissions set correctly (700 for dirs, 600 for files)

#### Attestation

I have verified that this MCP follows all configuration best practices from MCP-CONFIGURATION-CHECKLIST.md v1.2.0.

**Signature:** ________________
**Date:** ________________

---

## Phase 1: Functional Testing

### Tool Testing (All 15 Tools)

#### Telemetry Tools
- [ ] `log_event` - Log sample event successfully
- [ ] `query_events` - Query with filters returns results
- [ ] `get_event_stats` - Calculate statistics correctly

#### Analytics Tools
- [ ] `generate_weekly_summary` - Create markdown summary
- [ ] `get_automation_opportunities` - Find patterns (requires data)
- [ ] `get_tool_usage_stats` - Return tool statistics

#### Learning Tools
- [ ] `record_pattern` - Store pattern successfully
- [ ] `get_similar_patterns` - Find matching patterns
- [ ] `get_preventive_checks` - Return default checks

#### Cache Tools
- [ ] `cache_set` - Store value with TTL
- [ ] `cache_get` - Retrieve cached value
- [ ] `cache_invalidate` - Remove cache entries

#### Maintenance Tools
- [ ] `archive_old_data` - Archive old events
- [ ] `export_data` - Export to JSON format
- [ ] `get_storage_stats` - Return storage breakdown

### Performance Testing
- [ ] `log_event` completes in <5ms
- [ ] `query_events` completes in <200ms for 100 events
- [ ] `get_storage_stats` completes in <500ms

---

## Phase 2: Integration Testing

### External Brain Integration
- [ ] Events logged to ~/workspace-brain/telemetry/
- [ ] Analytics files created in ~/workspace-brain/analytics/
- [ ] Cache files stored in ~/workspace-brain/cache/
- [ ] No workspace pollution (data stays external)

### Data Integrity
- [ ] JSONL files formatted correctly
- [ ] Events have valid timestamps
- [ ] No data loss during writes
- [ ] Cache expiration works correctly

---

## Phase 3: Documentation Verification

- [x] README.md complete with usage examples
- [x] SPECIFICATION.md documents all 15 tools
- [x] MCP-CONFIGURATION.md has deployment command
- [x] ROLLOUT-CHECKLIST.md (this file) complete
- [ ] Integration patterns documented
- [ ] Error handling documented

---

## Phase 4: Pre-Deployment Checklist

- [ ] All Layer 1 automated checks passed
- [ ] Layer 2 tool prevention validated
- [ ] **Layer 3 manual verification completed with attestation**
- [ ] All functional tests passed
- [ ] Performance benchmarks met
- [ ] Documentation complete
- [ ] Backup of existing configuration (if updating)

---

## Deployment Steps

1. **Pre-Deployment**
   ```bash
   # Run sync check
   mcp-config-manager.sync_mcp_configs()

   # Verify build
   cd mcp-server-development/workspace-brain-mcp-project/04-product-under-development
   npm run build
   ```

2. **Deploy**
   ```bash
   # Use command from MCP-CONFIGURATION.md
   claude mcp add --transport stdio workspace-brain-mcp -- node /Users/mmaruthurnew/Desktop/operations-workspace/mcp-server-development/workspace-brain-mcp-project/04-product-under-development/build/index.js
   ```

3. **Post-Deployment**
   ```bash
   # Restart Claude Code
   # Verify MCP loaded
   # Run smoke tests
   ```

---

## Rollback Plan

If deployment fails:

1. **Unregister MCP:**
   ```bash
   mcp-config-manager.unregister_mcp_server("workspace-brain-mcp")
   ```

2. **Restore previous configuration** (if applicable)

3. **Investigate issue** in build logs

4. **Fix and redeploy** after resolving issues

---

## Success Criteria

✅ All 15 tools operational
✅ No errors during basic operations
✅ Performance targets met (<5ms log, <200ms query)
✅ External brain directory structure created
✅ Data integrity verified
✅ Documentation complete
✅ Layer 3 attestation signed

---

**Checklist Owner:** Workspace Team
**Last Updated:** 2025-10-31
**Next Review:** After deployment completion
