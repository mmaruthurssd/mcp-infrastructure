---
type: reference
tags: [troubleshooting, quick-reference, ai-assistant, feedback-loop]
created: 2025-10-29
status: active
---

# Troubleshooting Quick Reference Card

**Purpose:** Instant reference for AI assistants to trigger the feedback loop automatically

**Print this mentally at start of every troubleshooting session**

---

## 🚨 AUTOMATIC TRIGGERS (If ANY detected → MUST LOG)

You are troubleshooting if you observe yourself doing:

1. ⏱️ **5+ minutes** on one problem
2. 🔍 **3+ diagnostic commands** (ls, grep, cat, test, jq)
3. 💾 **Used backup** to recover
4. 📖 **Read docs** to solve problem
5. ⚠️ **Broke something** while fixing
6. ⚙️ **Modified config** due to errors
7. 🔨 **Ran build commands** to fix
8. 🧪 **Fixed test failures**
9. 🔄 **3+ solution attempts**
10. 📝 **Applied workaround**

---

## ⚡ IMMEDIATE POST-RESOLUTION ACTIONS

**After resolving ANY issue:**

```
1. [ ] Duration >5 min? → MUST LOG
2. [ ] Classify: config/build/test/deploy/integration/docs
3. [ ] Try: mcp__learning-optimizer__track_issue(...)
4. [ ] If fails: Manual log to troubleshooting/[domain]-issues.md
5. [ ] Check triggers (freq >=3, total >=5)
6. [ ] If triggered: Run optimization
7. [ ] If promoted: Update checklist
8. [ ] Verify: Issue logged ✅
```

---

## 📋 DOMAIN CLASSIFICATION

| Domain | File | Checklist |
|--------|------|-----------|
| **Configuration** | configuration-issues.md | MCP-CONFIGURATION-CHECKLIST.md |
| **Build** | build-issues.md | MCP-BUILD-INTEGRATION-GUIDE.md |
| **Testing** | testing-issues.md | ROLLOUT-CHECKLIST.md |
| **Deployment** | deployment-issues.md | ROLLOUT-CHECKLIST.md |
| **Integration** | integration-issues.md | ROLLOUT-CHECKLIST.md |
| **Documentation** | documentation-issues.md | ROLLOUT-CHECKLIST.md |

---

## 🔧 TRACK ISSUE TEMPLATE

```javascript
mcp__learning-optimizer__track_issue({
  domain: "mcp-configuration",
  title: "Brief (< 60 chars)",
  symptom: "Exact error or behavior",
  solution: "Steps taken with commands",
  root_cause: "WHY it happened",
  prevention: "How to avoid",
  context: {
    mcp: "server-name",
    phase: "deployment",
    environment: "macOS, Node v22",
    step: "Registration"
  }
})
```

---

## ⚠️ CRITICAL RULES

1. **NEVER skip logging** - Every issue is learning
2. **If learning-optimizer fails** → Immediately manual log
3. **Don't wait for user reminder** → Automatic on pattern detection
4. **Complete Post-Resolution Checklist** → Every time, no exceptions
5. **Frequency >= 3** → Automatically promote to checklist

---

## 📍 FULL DOCUMENTATION

**Complete Checklist:** `troubleshooting/README.md` (Section: Post-Resolution Checklist)
**Pattern Detection:** `WORKSPACE_GUIDE.md` (Section: Issue Logging & Continuous Learning)
**Domain Files:** `troubleshooting/[domain]-issues.md`
**Checklists:** `../MCP-CONFIGURATION-CHECKLIST.md`, `../03-resources-docs-assets-tools/ROLLOUT-CHECKLIST.md`

---

## 🎯 SUCCESS CRITERIA

✅ **You're doing it right if:**
- Log issues without user reminder
- Detect patterns automatically
- Use fallback when MCP unavailable
- Update statistics after logging
- Check triggers after each log
- Promote issues at frequency >= 3

❌ **You're missing it if:**
- User has to ask "Did you log this?"
- Skip logging because MCP unavailable
- Forget to check optimization triggers
- Don't update checklists when promoting

---

**Created:** 2025-10-29
**Version:** 1.0.0
**Location:** mcp-server-development/mcp-implementation-master-project/troubleshooting/
**Status:** Active - Copy to every session
