---
type: guide
tags: [security, git, pre-commit, integration, credentials, PHI]
---

# Security & Git Integration Guide

**Version:** 1.0
**Status:** ✅ Active (Deployed October 31, 2025)
**Integration:** security-compliance-mcp + git-assistant-mcp

## Overview

Automated pre-commit security scanning prevents credentials and PHI from being committed to version control. The pre-commit hook runs on every `git commit` operation, scanning staged files and blocking commits that contain security violations.

**Key Features:**
- ⚡ Fast scanning (<5 seconds for typical commits)
- 🔒 Credential detection (API keys, tokens, passwords)
- 🏥 PHI detection (SSN, MRN, DOB patterns)
- 📊 Automatic scan reports (.security-scans/)
- 📝 Issue logging for learning-optimizer
- 🛡️ Mass deletion protection (>100 files)

---

## Architecture

```
┌─────────────────────────────────────────────────────────────┐
│ Developer commits code                                       │
│ $ git commit -m "Add feature"                                │
└─────────────────────┬───────────────────────────────────────┘
                      │
                      ▼
┌─────────────────────────────────────────────────────────────┐
│ .git/hooks/pre-commit (BASH)                                 │
│ ┌─────────────────────────────────────────────────────────┐ │
│ │ 1. Mass Deletion Check (>100 files)                     │ │
│ │    → BLOCK if accidental mass deletion detected         │ │
│ └─────────────────────────────────────────────────────────┘ │
│ ┌─────────────────────────────────────────────────────────┐ │
│ │ 2. Credential Scan (Pattern Matching)                   │ │
│ │    • AWS keys (AKIA...)                                 │ │
│ │    • OpenAI keys (sk-...)                               │ │
│ │    • Google API keys (AIza...)                          │ │
│ │    • GitHub tokens (ghp_...)                            │ │
│ │    • Bearer tokens                                      │ │
│ │    • Passwords in config files                          │ │
│ └─────────────────────────────────────────────────────────┘ │
│ ┌─────────────────────────────────────────────────────────┐ │
│ │ 3. PHI Scan (Pattern Matching)                          │ │
│ │    • Social Security Numbers (XXX-XX-XXXX)              │ │
│ │    • Medical Record Numbers (MRN: XXXXXX)               │ │
│ │    • Dates of Birth (DOB: MM/DD/YYYY)                   │ │
│ └─────────────────────────────────────────────────────────┘ │
│ ┌─────────────────────────────────────────────────────────┐ │
│ │ 4. Generate Security Report (JSON)                      │ │
│ │    .security-scans/scan-TIMESTAMP.json                  │ │
│ └─────────────────────────────────────────────────────────┘ │
│ ┌─────────────────────────────────────────────────────────┐ │
│ │ 5. Log Issues (Learning Optimizer)                      │ │
│ │    .security-issues-log/credential-violations-*.json    │ │
│ │    .security-issues-log/phi-violations-*.json           │ │
│ └─────────────────────────────────────────────────────────┘ │
└─────────────────────┬───────────────────────────────────────┘
                      │
        ┌─────────────┴─────────────┐
        │                           │
        ▼                           ▼
┌───────────────┐           ┌───────────────┐
│ ✅ ALLOW      │           │ ❌ BLOCK      │
│ Commit        │           │ Commit        │
│ proceeds      │           │ with details  │
└───────────────┘           └───────────────┘
```

---

## Installation Status

**Current Status:** ✅ INSTALLED (Active since October 31, 2025)

**Location:** `/Users/mmaruthurnew/Desktop/medical-practice-workspace/.git/hooks/pre-commit`

**Implementation:** Bash script with pattern-based scanning

**Verification:**
```bash
ls -la .git/hooks/pre-commit
# Output: -rwxr-xr-x  1 user  staff  9156 Oct 31 12:53 pre-commit
```

---

## How It Works

### 1. Automatic Trigger

The pre-commit hook runs **automatically** before every commit:

```bash
git add file.js
git commit -m "Update feature"
# ↑ Hook runs here automatically
```

### 2. File Scanning

The hook scans only **staged files** (excluding deletions):

```bash
# Get staged files
git diff --cached --name-only --diff-filter=ACM
```

### 3. Pattern Detection

**Credential Patterns:**
- AWS Access Keys: `AKIA[0-9A-Z]{16}`
- OpenAI API Keys: `sk-[a-zA-Z0-9]{48}`
- Google API Keys: `AIza[0-9A-Za-z-_]{35}`
- GitHub PATs: `ghp_[0-9a-zA-Z]{36}`
- Bearer Tokens: `Bearer [a-zA-Z0-9_-]+`
- Config Passwords: `password\s*=\s*['\"][^'\"]+['\"]`

**PHI Patterns:**
- SSN: `[0-9]{3}-[0-9]{2}-[0-9]{4}`
- MRN: `MRN[:\s]*[0-9]+`
- DOB: `DOB[:\s]*[0-9]{1,2}/[0-9]{1,2}/[0-9]{4}`

### 4. Violation Handling

If violations detected:
1. **Block commit** immediately
2. **Display violations** with file paths
3. **Generate scan report** (.security-scans/)
4. **Log issues** (.security-issues-log/)
5. **Provide remediation steps**

### 5. Allow-List Support

Files can be allow-listed via `configuration/security-config.json`:

```json
{
  "allowList": [
    {
      "filePath": "docs/examples/sample-data.md",
      "reason": "Contains synthetic test data only"
    }
  ]
}
```

---

## Usage Examples

### Example 1: Clean Commit (No Violations)

```bash
$ echo "const greeting = 'Hello World';" > greeting.js
$ git add greeting.js
$ git commit -m "Add greeting"

🔒 Running pre-commit security checks...

📄 Scanning 1 staged file(s)...

🔍 Scanning for credentials...
  ✅ No credentials detected

🏥 Scanning for PHI...
  ✅ No PHI detected

📊 Scan report saved: .security-scans/scan-2025-11-01-120000.json

✅ All security checks passed!

[main abc1234] Add greeting
 1 file changed, 1 insertion(+)
```

### Example 2: Credential Violation (Blocked)

```bash
$ echo "const apiKey = 'AKIAIOSFODNN7EXAMPLE';" > config.js
$ git add config.js
$ git commit -m "Add config"

🔒 Running pre-commit security checks...

📄 Scanning 1 staged file(s)...

🔍 Scanning for credentials...
  ❌ Found 1 potential credential(s)
  ⚠️  Found potential credential in: config.js

🏥 Scanning for PHI...
  ✅ No PHI detected

📊 Scan report saved: .security-scans/scan-2025-11-01-120100.json

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
❌ COMMIT BLOCKED - SECURITY VIOLATIONS FOUND
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

Found 1 high-severity security issue(s):
  • Credential violations: 1
  • PHI violations: 0

⚠️  DO NOT COMMIT CREDENTIALS OR PHI TO VERSION CONTROL

Next steps:
  1. Remove sensitive data from staged files
  2. Use environment variables for credentials
  3. Use secure configuration management (configuration-manager-mcp)
  4. Review scan report: .security-scans/scan-2025-11-01-120100.json

To override this check (NOT RECOMMENDED):
  git commit --no-verify

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
```

### Example 3: PHI Violation (Blocked)

```bash
$ echo "Patient SSN: 123-45-6789" > patient.txt
$ git add patient.txt
$ git commit -m "Add patient data"

🔒 Running pre-commit security checks...

📄 Scanning 1 staged file(s)...

🔍 Scanning for credentials...
  ✅ No credentials detected

🏥 Scanning for PHI...
  ⚠️  Found 1 potential PHI instance(s)
  ⚠️  Found potential PHI in: patient.txt

📊 Scan report saved: .security-scans/scan-2025-11-01-120200.json

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
❌ COMMIT BLOCKED - SECURITY VIOLATIONS FOUND
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

Found 1 high-severity security issue(s):
  • Credential violations: 0
  • PHI violations: 1

⚠️  DO NOT COMMIT CREDENTIALS OR PHI TO VERSION CONTROL
```

---

## Scan Reports

### Report Location

All scan reports saved to `.security-scans/` (gitignored):

```
.security-scans/
├── scan-2025-11-01-120000.json  ✅ Clean
├── scan-2025-11-01-120100.json  ❌ Credential violation
└── scan-2025-11-01-120200.json  ❌ PHI violation
```

### Report Format

```json
{
  "timestamp": "2025-11-01T12:01:00Z",
  "scanType": "pre-commit",
  "filesScanned": 1,
  "results": {
    "credentialViolations": 1,
    "phiViolations": 0,
    "highSeverityCount": 1
  },
  "stagedFiles": [
    "config.js"
  ]
}
```

---

## Issue Logging

### Automatic Logging

Violations automatically logged to `.security-issues-log/`:

```
.security-issues-log/
├── credential-violations-20251101-120100.json
└── phi-violations-20251101-120200.json
```

### Learning Optimizer Integration

Issues logged to learning-optimizer-mcp for continuous improvement:

```json
{
  "domain": "security-compliance",
  "title": "Credential detected in config.js",
  "symptom": "AWS access key pattern matched in staged file",
  "solution": "Remove hardcoded credential, use environment variable",
  "prevention": "Always use configuration-manager-mcp for secrets"
}
```

---

## Override Options

### Temporary Bypass (NOT RECOMMENDED)

```bash
# Skip all git hooks (use with EXTREME caution)
git commit --no-verify -m "Emergency fix"
```

**⚠️ WARNING:** Only use `--no-verify` for urgent production fixes. All bypassed commits should be reviewed and cleaned up immediately.

### Permanent Bypass (STRONGLY DISCOURAGED)

```bash
# Disable hook temporarily
mv .git/hooks/pre-commit .git/hooks/pre-commit.disabled

# Re-enable hook
mv .git/hooks/pre-commit.disabled .git/hooks/pre-commit
```

---

## Performance Benchmarks

**Typical Performance:**
- 1 file: <1 second
- 10 files: 1-2 seconds
- 50 files: 3-5 seconds
- 100 files: 5-8 seconds

**Optimization:**
- Binary files automatically skipped
- Lock files excluded (package-lock.json, yarn.lock)
- Pattern matching highly optimized
- Minimal overhead vs manual review

---

## Troubleshooting

### Issue: Hook Not Running

**Symptom:** Commits succeed without security scan

**Solution:**
```bash
# Check if hook exists and is executable
ls -la .git/hooks/pre-commit

# Make executable if needed
chmod +x .git/hooks/pre-commit
```

### Issue: False Positives

**Symptom:** Legitimate code blocked as credential

**Solution:**
1. Review pattern in scan report
2. Add to allow-list if appropriate
3. Use environment variables for actual credentials

### Issue: Hook Too Slow

**Symptom:** Commits take >10 seconds

**Solution:**
1. Check number of staged files
2. Reduce staged files per commit
3. Consider .gitignore optimization

---

## Migration from Manual Review

**Before Integration:**
```bash
# Manual review required
git diff --cached | grep -i "api.*key"  # Check for credentials
git diff --cached | grep -i "ssn"       # Check for PHI
git commit -m "Update"
```

**After Integration:**
```bash
# Automatic security checks
git commit -m "Update"
# ↑ Hook runs automatically, blocks if violations found
```

**Benefits:**
- ✅ Zero manual effort
- ✅ 100% consistent enforcement
- ✅ Impossible to forget
- ✅ Detailed violation reports
- ✅ Learning from past issues

---

## Future Enhancements

### Phase 2: Full MCP Integration (Planned)

Replace pattern matching with security-compliance-mcp direct calls:

```typescript
// Current: Pattern matching
grep -iE "AKIA[0-9A-Z]{16}" file.js

// Future: MCP integration
mcp__security-compliance-mcp__scan_for_credentials({
  target: "file.js",
  mode: "file",
  minConfidence: 0.8
})
```

**Benefits:**
- More accurate detection (~90% confidence vs ~60%)
- Contextual analysis (not just patterns)
- Machine learning improvements
- Allowlist management via MCP tools

### Phase 3: Real-Time Scanning

IDE integration for instant feedback:

```
VS Code → security-compliance-mcp → Real-time squiggles
```

---

## Related Documentation

- **SECURITY_BEST_PRACTICES.md** - Workspace security standards
- **security-compliance-mcp README** - Full MCP documentation
- **configuration-manager-mcp README** - Secrets management
- **MCP-SYSTEM-ARCHITECTURE.md** - Self-improving feedback loop

---

## Support

**Questions:**
- Check scan reports: `.security-scans/`
- Review SECURITY_BEST_PRACTICES.md
- Consult security-compliance-mcp documentation

**False Positives:**
- Add to allow-list in configuration/security-config.json
- Document reason for allow-listing
- Review quarterly for cleanup

**Integration Issues:**
- Verify hook is executable: `chmod +x .git/hooks/pre-commit`
- Check .gitignore includes `.security-scans/` and `.security-issues-log/`
- Ensure workspace is git repository

---

**Last Updated:** 2025-11-01
**Maintained By:** Workspace Team
**Status:** Production (Active)
