---
type: tool
tags: [git, monitoring, safety, forensics, automation]
---

# Git Staging Monitor

**Status:** Stable
**Version:** v2.0.0 (Enhanced)
**Created:** 2025-10-26
**Last Updated:** 2025-10-28

---

## Version History

| Version | Date | What Changed | Breaking Changes |
|---------|------|--------------|------------------|
| v2.0.0 | 2025-10-28 | Enhanced forensics, 8 analysis categories, real-time index tracking | Script moved to organized structure |
| v1.0.0 | 2025-10-26 | Initial release with basic monitoring and auto-unstaging | N/A |

---

## File Structure

```
git-staging-monitor/
├── README.md                           # This file
├── USAGE-GUIDE.md                      # Detailed usage guide
├── scripts/
│   ├── monitor-git-staging-enhanced.sh # Enhanced monitor (v2.0)
│   ├── monitor-git-staging-basic.sh    # Basic monitor (v1.0)
│   └── install.sh                      # Installation script
├── logs/
│   ├── README.md                       # Log reference guide
│   ├── staging-monitor-enhanced-*.log  # Daily detailed forensics
│   └── trigger-analysis-*.log          # Daily incident summaries
└── examples/
    └── incident-analysis-example.md    # How to analyze captured data
```

---

## Quick Start

```bash
# Navigate to tool directory
cd local-instances/tools/git-staging-monitor

# Run the enhanced monitor
./scripts/monitor-git-staging-enhanced.sh &

# Check it's running
ps aux | grep monitor-git-staging-enhanced | grep -v grep

# View logs in real-time
tail -f logs/staging-monitor-enhanced-$(date +%Y%m%d).log
```

---

## What It Does

**Git Staging Monitor** automatically detects and prevents unintentional mass file staging in git repositories. When more than 100 files are staged for deletion, it captures comprehensive forensics (processes, file access, VS Code state, extensions, network activity) to identify the root cause, then auto-unstages the files and alerts you.

**Problem it solves:** Prevents accidental mass deletions from being committed by catching them at staging time with full forensic capture to identify the trigger.

---

## Prerequisites

- Bash shell (macOS/Linux)
- Git repository
- `lsof` command (standard on macOS/Linux)
- macOS for desktop notifications (optional)
- VS Code (if analyzing VS Code-related triggers)

---

## Installation

### Automatic Installation

```bash
cd local-instances/tools/git-staging-monitor
./scripts/install.sh
```

This will:
1. Make scripts executable
2. Set up log directory symlink in project root
3. Optionally configure git hook
4. Start the monitor

### Manual Installation

```bash
# 1. Make scripts executable
chmod +x scripts/*.sh

# 2. Create symlink to logs in project root (optional)
ln -s local-instances/tools/git-staging-monitor/logs .git-monitor-logs

# 3. Start the monitor
./scripts/monitor-git-staging-enhanced.sh &
```

---

## Configuration

### Monitor Settings (Edit script header)

```bash
# In monitor-git-staging-enhanced.sh

LOG_DIR="./logs"                        # Log directory
TRIGGER_THRESHOLD=100                   # Number of deletions to trigger alert
CHECK_INTERVAL=2                        # Seconds between checks
```

### Git Hook Integration (Optional)

The tool includes a pre-commit hook that blocks commits with mass deletions:

```bash
# Install the hook
cp .git/hooks/pre-commit .git/hooks/pre-commit.backup  # Backup existing
cat > .git/hooks/pre-commit << 'EOF'
#!/bin/bash
DELETED_COUNT=$(git diff --cached --name-status | grep "^D" | wc -l)
if [ "$DELETED_COUNT" -gt 100 ]; then
    echo "❌ COMMIT BLOCKED - SAFETY CHECK FAILED"
    echo "Attempting to delete $DELETED_COUNT files!"
    exit 1
fi
exit 0
EOF
chmod +x .git/hooks/pre-commit
```

---

## Usage

### Basic Usage - Start Monitoring

```bash
# Start in background
./scripts/monitor-git-staging-enhanced.sh &

# Get PID
echo $!
```

### Check Monitor Status

```bash
# Check if running
ps aux | grep monitor-git-staging-enhanced | grep -v grep

# View current activity
tail -20 logs/staging-monitor-enhanced-$(date +%Y%m%d).log
```

### Stop Monitoring

```bash
# Find and kill the process
pkill -f monitor-git-staging-enhanced

# Or if you have the PID
kill <PID>
```

### View Incident Reports

```bash
# Quick summary of all incidents today
cat logs/trigger-analysis-$(date +%Y%m%d).log

# Count incidents
grep "MASS STAGING DETECTED" logs/staging-monitor-enhanced-$(date +%Y%m%d).log | wc -l

# View detailed forensics for last incident
tail -500 logs/staging-monitor-enhanced-$(date +%Y%m%d).log
```

---

## Advanced Usage

### Real-Time Monitoring Dashboard

```bash
# Watch for incidents in real-time
tail -f logs/staging-monitor-enhanced-$(date +%Y%m%d).log | grep --line-buffered "MASS STAGING\|Process accessing\|Git index modified"
```

### Track Git Index Changes

```bash
# See all git index modifications (not just mass staging)
grep "Git index modified" logs/staging-monitor-enhanced-$(date +%Y%m%d).log
```

### Analyze Historical Patterns

```bash
# Count incidents per day
for file in logs/staging-monitor-*.log; do
    count=$(grep -c "MASS STAGING DETECTED" "$file" 2>/dev/null)
    echo "$(basename $file): $count incidents"
done
```

---

## Examples

### Example 1: Detecting and Analyzing an Incident

**Scenario:** Mass staging occurs while working in VS Code

```bash
# Monitor detects incident and shows alert
# ⚠️  ALERT #1: 8231 files staged for deletion at Tue Oct 28 00:17:43

# Check quick summary
cat logs/trigger-analysis-$(date +%Y%m%d).log
# Output shows:
# INCIDENT #1 - 2025-10-28 00:17:43
# Files staged: 8231
# VS Code PIDs: 99769
# Processes accessing .git/index: Code 99776

# View detailed forensics
tail -500 logs/staging-monitor-enhanced-$(date +%Y%m%d).log | grep -A 20 "VS CODE EXTENSION ANALYSIS"
# Shows all installed extensions, identifies git-related ones
```

### Example 2: Investigating the Trigger

```bash
# After incident, analyze what process touched git index
grep -A 5 "INCIDENT #1" logs/trigger-analysis-$(date +%Y%m%d).log

# Check VS Code process tree at time of incident
tail -500 logs/staging-monitor-enhanced-$(date +%Y%m%d).log | grep -A 30 "VS CODE PROCESS TREE"

# Review recent shell commands
tail -500 logs/staging-monitor-enhanced-$(date +%Y%m%d).log | grep -A 15 "SHELL HISTORY"
```

---

## Forensic Data Captured

When mass staging is detected (>100 files), the monitor captures:

### 1. Git State Analysis
- Git status (first 30 files)
- Git index file stats and modification time
- Recently modified files in .git/ directory
- Git reflog (last 10 operations)

### 2. Process Analysis
- All VS Code processes with full command lines
- VS Code process tree with open file handles
- All git processes
- All MCP server processes

### 3. File Access Analysis
- **Processes currently accessing .git/index** (KEY for finding trigger)
- Processes accessing .git directory
- Recent file system events

### 4. VS Code Extension Analysis
- **All installed extensions**
- **Git-related extensions specifically**

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

---

## Output

### Log Files

**Detailed Forensics Log**
- Location: `logs/staging-monitor-enhanced-YYYYMMDD.log`
- Format: Timestamped sections with ~500 lines per incident
- Rotation: Daily (new file per day)
- Retention: Manual cleanup (review and delete old logs)

**Trigger Analysis Summary**
- Location: `logs/trigger-analysis-YYYYMMDD.log`
- Format: Condensed incident reports (~10 lines per incident)
- Contains: Timestamp, file count, PIDs, process names
- Purpose: Quick pattern analysis

**Reference Guide**
- Location: `logs/README.md`
- Contains: Commands, patterns, how to analyze

### Notifications

- **Alert notification** (Basso sound): "INCIDENT #X: N files staged!"
- **Recovery notification** (Hero sound): "Files auto-unstaged"

### Actions Taken

1. **Captures forensics** - Full 8-category analysis
2. **Auto-unstages files** - Runs `git restore --staged .`
3. **Creates notifications** - Desktop alerts on macOS
4. **Logs incident** - Both detailed and summary logs

---

## Troubleshooting

### Monitor not detecting incidents

**Problem:** Files are staged but monitor doesn't alert
**Solution:**
```bash
# Check if monitor is running
ps aux | grep monitor-git-staging-enhanced | grep -v grep

# Check threshold setting
grep "DELETED_COUNT" scripts/monitor-git-staging-enhanced.sh

# Manually test detection
git diff --cached --name-status | grep "^D" | wc -l
```

### Desktop notifications not appearing

**Problem:** No sound alerts when incident detected
**Solution:**
- macOS only feature (requires `osascript`)
- Check System Preferences → Notifications
- Run manually: `osascript -e 'display notification "Test" with title "Test"'`

### Logs growing too large

**Problem:** Log files consuming disk space
**Solution:**
```bash
# Check log sizes
du -sh logs/*.log

# Archive old logs
mkdir logs/archive
mv logs/staging-monitor-enhanced-202510*.log logs/archive/

# Or compress
gzip logs/staging-monitor-enhanced-202510*.log
```

### False positives from legitimate deletions

**Problem:** Legitimate mass file deletion triggers alert
**Solution:**
- Adjust threshold in script (change `DELETED_COUNT -gt 100` to higher value)
- Or temporarily disable: `pkill -f monitor-git-staging-enhanced`
- Complete operation, then restart monitor

---

## Related Tools

- [git-assistant-mcp-server](../../mcp-servers/git-assistant-mcp-server/) - Git workflow guidance and commit messages
- [smart-file-organizer-mcp-server](../../mcp-servers/smart-file-organizer-mcp-server/) - Intelligent file organization
- Git pre-commit hooks - Blocks commits with mass deletions

---

## Use Cases

- **Development Safety:** Prevent accidental mass file deletions from being committed
- **Forensic Analysis:** Identify which tool/process is auto-staging files
- **VS Code Extension Debugging:** Discover git-related extensions causing issues
- **Multi-developer Teams:** Track staging patterns across team members
- **Legacy Codebase Work:** Prevent accidental deletions in large repos
- **Automated CI/CD:** Monitor git operations in automated environments

---

## Historical Data

**Current deployment statistics:**
- Monitoring since: 2025-10-26
- Total incidents detected: 17
- Average files per incident: ~8,100
- Detection pattern: Sporadic, not time-based
- Primary correlation: VS Code running during all incidents

---

## Roadmap

### ✅ Completed
- v1.0: Basic monitoring and auto-unstaging
- v2.0: Enhanced forensics with 8 analysis categories
- Git hook integration
- Incident numbering and summary logs
- Real-time git index tracking

### 🚧 In Progress
- Installation script
- Incident analysis examples
- Pattern detection AI

### 📋 Planned
- v2.1: Web dashboard for log viewing (Q1 2026)
- v2.2: Email/Slack notifications (Q2 2026)
- v3.0: ML-based trigger prediction (Q3 2026)

---

## Changelog

### v2.0.0 (2025-10-28)
- Enhanced forensics with 8 analysis categories
- VS Code extension analysis
- File access tracking with lsof
- Git index modification monitoring
- Process tree analysis
- Network activity capture
- Configuration analysis
- Incident numbering system
- Dual log files (detailed + summary)
- Organized into proper tool structure

### v1.0.0 (2025-10-26)
- Initial release
- Basic process monitoring
- Auto-unstaging functionality
- Desktop notifications
- Git status capture
- Process snapshot capability
