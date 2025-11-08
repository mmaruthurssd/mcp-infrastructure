---
type: reference
tags: [git-monitoring, troubleshooting, forensics]
---

# Git Staging Monitor - Quick Reference

## Status

**Enhanced Monitor:** ✅ ACTIVE (PID: 6223)
- Started: 2025-10-28 00:23:17
- Script: `monitor-git-staging-enhanced.sh`
- Checks every 2 seconds
- Auto-unstages mass deletions (>100 files)

## Log Files

### Main Log (Detailed Forensics)
```
.git-monitor-logs/staging-monitor-enhanced-YYYYMMDD.log
```
Contains full forensic capture when mass staging detected.

### Trigger Analysis (Quick Summary)
```
.git-monitor-logs/trigger-analysis-YYYYMMDD.log
```
Condensed incident reports with key data points.

### Historical Log (Old Monitor)
```
.git-monitor-logs/staging-monitor-20251026.log
```
Previous incidents (17 detections since Oct 26).

## What Gets Captured

When mass staging is detected (>100 files), the monitor captures:

### 1. Git State Analysis
- Git status (first 30 files)
- Git index file stats and modification time
- Recently modified files in .git/
- Git reflog (last 10 operations)

### 2. Process Analysis
- All VS Code processes (detailed)
- VS Code process tree with file handles
- All git processes
- All MCP server processes

### 3. File Access Analysis
- Processes currently accessing .git/index
- Processes accessing .git directory
- Recent file system events

### 4. VS Code Extension Analysis
- All installed extensions
- Git-related extensions specifically

### 5. Network Activity
- VS Code network connections
- Active network sockets

### 6. Shell History Analysis
- Recent commands (last 30)
- Recent git commands from bash history

### 7. System State
- System load
- Memory pressure
- Open file descriptors count

### 8. Configuration Analysis
- Workspace git settings
- Git config (auto/stage/commit settings)

## Notifications

When incident detected:
1. **Sound Alert** (Basso) - "INCIDENT #X: N files staged!"
2. **Auto-unstage** - Files restored automatically
3. **Success Alert** (Hero) - "Files auto-unstaged"

## How to Check Logs

### View latest incidents
```bash
tail -100 .git-monitor-logs/trigger-analysis-$(date +%Y%m%d).log
```

### View detailed forensics for last incident
```bash
tail -500 .git-monitor-logs/staging-monitor-enhanced-$(date +%Y%m%d).log
```

### Count incidents today
```bash
grep "MASS STAGING DETECTED" .git-monitor-logs/staging-monitor-enhanced-$(date +%Y%m%d).log | wc -l
```

### See git index changes (real-time)
```bash
grep "Git index modified" .git-monitor-logs/staging-monitor-enhanced-$(date +%Y%m%d).log | tail -10
```

## What to Look For in Logs

When an incident occurs, check for:

1. **"Process accessing"** - Which app/process was using .git/index
2. **"VS Code Process Tree"** - What VS Code was doing
3. **"Installed Extensions"** - Any git-related extensions
4. **"Recent commands"** - Any git commands in shell history
5. **"Git index mtime"** - When the index file was last modified

## Pattern Analysis

From historical data (Oct 26-28):
- **17 incidents** over 2 days
- **8038-8231 files** staged each time
- Incidents occur **sporadically** (not time-based)
- **VS Code was running** during all incidents

## Monitoring Process

### Check if monitor is running
```bash
ps aux | grep monitor-git-staging-enhanced | grep -v grep
```

### Stop monitor
```bash
pkill -f monitor-git-staging-enhanced
```

### Start monitor
```bash
./monitor-git-staging-enhanced.sh &
```

### View live monitoring
```bash
tail -f .git-monitor-logs/staging-monitor-enhanced-$(date +%Y%m%d).log
```

## Safety Mechanisms

✅ **Pre-commit hook** - Blocks commits with >100 deletions
✅ **Auto-unstaging** - Monitor automatically unstages mass deletions
✅ **Dual notifications** - Sound alerts for detection + recovery
✅ **Full forensics** - Captures complete system state for analysis

## Next Steps

When the next incident occurs:

1. **Check notifications** - Desktop alerts will fire
2. **Review trigger-analysis log** - Quick summary
3. **Analyze detailed forensics** - Full log for root cause
4. **Look for patterns** - Compare with previous incidents
5. **Identify the trigger** - Process, extension, or command

## Historical Incidents

Total detected since Oct 26: **17 incidents**

Last incident: 2025-10-28 00:17:43 (8231 files)

---

**Monitor Status:** Active and enhanced
**Next Review:** After next incident detection
**Created:** 2025-10-28
