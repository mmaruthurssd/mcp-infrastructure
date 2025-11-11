#!/bin/bash
# Enhanced Git Staging Monitor - Advanced detection of mass staging triggers
# Created: 2025-10-28 - Enhanced version with detailed forensics

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
LOG_DIR="$(cd "$SCRIPT_DIR/../logs" && pwd)"
LOG_FILE="$LOG_DIR/staging-monitor-enhanced-$(date +%Y%m%d).log"
TRIGGER_LOG="$LOG_DIR/trigger-analysis-$(date +%Y%m%d).log"

# Create log directory
mkdir -p "$LOG_DIR"

echo "========================================" >> "$LOG_FILE"
echo "Enhanced Git Staging Monitor Started: $(date)" >> "$LOG_FILE"
echo "========================================" >> "$LOG_FILE"

# Track previous git index modification time
PREV_INDEX_TIME=$(stat -f %m .git/index 2>/dev/null || echo "0")

# Function to capture detailed forensics
capture_detailed_state() {
    local timestamp=$(date "+%Y-%m-%d %H:%M:%S")
    local deleted_count=$1
    local detection_num=$2

    echo "" >> "$LOG_FILE"
    echo "!!! MASS STAGING DETECTED - INCIDENT #$detection_num !!!" >> "$LOG_FILE"
    echo "Timestamp: $timestamp" >> "$LOG_FILE"
    echo "Deleted files staged: $deleted_count" >> "$LOG_FILE"
    echo "========================================" >> "$LOG_FILE"

    # FORENSIC SECTION 1: Git State Analysis
    echo "" >> "$LOG_FILE"
    echo "=== GIT STATE ANALYSIS ===" >> "$LOG_FILE"
    echo "--- Git Status (first 30 files) ---" >> "$LOG_FILE"
    git status --short | head -30 >> "$LOG_FILE"
    echo "" >> "$LOG_FILE"

    echo "--- Git Index Stats ---" >> "$LOG_FILE"
    ls -l .git/index >> "$LOG_FILE"
    stat .git/index >> "$LOG_FILE"
    echo "" >> "$LOG_FILE"

    echo "--- Recently Modified in .git ---" >> "$LOG_FILE"
    find .git -type f -mmin -1 2>/dev/null >> "$LOG_FILE"
    echo "" >> "$LOG_FILE"

    echo "--- Git Reflog (last 10) ---" >> "$LOG_FILE"
    git reflog -10 >> "$LOG_FILE"
    echo "" >> "$LOG_FILE"

    # FORENSIC SECTION 2: Process Analysis
    echo "" >> "$LOG_FILE"
    echo "=== PROCESS ANALYSIS ===" >> "$LOG_FILE"

    echo "--- All VS Code Processes (detailed) ---" >> "$LOG_FILE"
    ps auxww | grep -E "Visual Studio Code|Code Helper|Electron|vscode" | grep -v grep >> "$LOG_FILE"
    echo "" >> "$LOG_FILE"

    echo "--- VS Code Process Tree ---" >> "$LOG_FILE"
    pgrep -fl "Visual Studio Code|Electron" | while read pid name; do
        echo "PID $pid: $name" >> "$LOG_FILE"
        lsof -p $pid 2>/dev/null | grep -E "\.git|vscode" | head -20 >> "$LOG_FILE"
    done
    echo "" >> "$LOG_FILE"

    echo "--- All Git Processes ---" >> "$LOG_FILE"
    ps auxww | grep git | grep -v grep | grep -v monitor >> "$LOG_FILE"
    echo "" >> "$LOG_FILE"

    echo "--- MCP Server Processes ---" >> "$LOG_FILE"
    ps auxww | grep "mcp.*server\|git-assistant" | grep -v grep >> "$LOG_FILE"
    echo "" >> "$LOG_FILE"

    # FORENSIC SECTION 3: File Access Analysis
    echo "" >> "$LOG_FILE"
    echo "=== FILE ACCESS ANALYSIS ===" >> "$LOG_FILE"

    echo "--- Processes accessing .git/index ---" >> "$LOG_FILE"
    lsof .git/index 2>/dev/null >> "$LOG_FILE"
    echo "" >> "$LOG_FILE"

    echo "--- Processes accessing .git directory ---" >> "$LOG_FILE"
    lsof +D .git 2>/dev/null | head -50 >> "$LOG_FILE"
    echo "" >> "$LOG_FILE"

    echo "--- Recent file system events (fsevents) ---" >> "$LOG_FILE"
    log show --predicate 'eventMessage contains "git"' --last 2m --style compact 2>/dev/null | head -20 >> "$LOG_FILE"
    echo "" >> "$LOG_FILE"

    # FORENSIC SECTION 4: VS Code Extension Analysis
    echo "" >> "$LOG_FILE"
    echo "=== VS CODE EXTENSION ANALYSIS ===" >> "$LOG_FILE"

    echo "--- Installed Extensions (git-related) ---" >> "$LOG_FILE"
    code --list-extensions 2>/dev/null | grep -i git >> "$LOG_FILE"
    echo "" >> "$LOG_FILE"

    echo "--- All Installed Extensions ---" >> "$LOG_FILE"
    code --list-extensions 2>/dev/null >> "$LOG_FILE"
    echo "" >> "$LOG_FILE"

    # FORENSIC SECTION 5: Network Activity
    echo "" >> "$LOG_FILE"
    echo "=== NETWORK ACTIVITY ===" >> "$LOG_FILE"

    echo "--- VS Code Network Connections ---" >> "$LOG_FILE"
    lsof -i -n | grep -E "Code|Electron" >> "$LOG_FILE"
    echo "" >> "$LOG_FILE"

    # FORENSIC SECTION 6: Shell History Analysis
    echo "" >> "$LOG_FILE"
    echo "=== SHELL HISTORY ANALYSIS ===" >> "$LOG_FILE"

    echo "--- Recent commands (current shell) ---" >> "$LOG_FILE"
    fc -l -30 2>/dev/null >> "$LOG_FILE"
    echo "" >> "$LOG_FILE"

    echo "--- Recent git commands (bash history) ---" >> "$LOG_FILE"
    tail -50 ~/.bash_history 2>/dev/null | grep git >> "$LOG_FILE"
    echo "" >> "$LOG_FILE"

    # FORENSIC SECTION 7: System State
    echo "" >> "$LOG_FILE"
    echo "=== SYSTEM STATE ===" >> "$LOG_FILE"

    echo "--- System Load ---" >> "$LOG_FILE"
    uptime >> "$LOG_FILE"
    echo "" >> "$LOG_FILE"

    echo "--- Memory Pressure ---" >> "$LOG_FILE"
    vm_stat | head -10 >> "$LOG_FILE"
    echo "" >> "$LOG_FILE"

    echo "--- Open File Descriptors (VS Code) ---" >> "$LOG_FILE"
    pgrep -fl "Visual Studio Code" | head -1 | awk '{print $1}' | xargs -I {} lsof -p {} 2>/dev/null | wc -l >> "$LOG_FILE"
    echo "" >> "$LOG_FILE"

    # FORENSIC SECTION 8: Configuration Analysis
    echo "" >> "$LOG_FILE"
    echo "=== CONFIGURATION ANALYSIS ===" >> "$LOG_FILE"

    echo "--- Workspace Git Settings ---" >> "$LOG_FILE"
    cat .vscode/settings.json 2>/dev/null | grep -i git >> "$LOG_FILE"
    echo "" >> "$LOG_FILE"

    echo "--- Git Config (relevant settings) ---" >> "$LOG_FILE"
    git config --list | grep -E "auto|stage|commit" >> "$LOG_FILE"
    echo "" >> "$LOG_FILE"

    echo "========================================" >> "$LOG_FILE"

    # Create trigger analysis summary
    echo "" >> "$TRIGGER_LOG"
    echo "INCIDENT #$detection_num - $timestamp" >> "$TRIGGER_LOG"
    echo "Files staged: $deleted_count" >> "$TRIGGER_LOG"
    echo "VS Code PIDs: $(pgrep -fl 'Visual Studio Code' | head -1 | awk '{print $1}')" >> "$TRIGGER_LOG"
    echo "Git index modified: $(stat -f %m .git/index)" >> "$TRIGGER_LOG"
    echo "Processes accessing .git/index:" >> "$TRIGGER_LOG"
    lsof .git/index 2>/dev/null | tail -n +2 | awk '{print $1, $2}' >> "$TRIGGER_LOG"
    echo "---" >> "$TRIGGER_LOG"

    # Desktop notification with sound
    osascript -e "display notification \"INCIDENT #$detection_num: $deleted_count files staged! Full forensics captured.\" with title \"Git Safety Alert\" sound name \"Basso\"" 2>/dev/null

    # Auto-unstage the files
    echo "" >> "$LOG_FILE"
    echo "=== AUTO-RECOVERY ===" >> "$LOG_FILE"
    echo "Auto-unstaging files at $timestamp..." >> "$LOG_FILE"
    git restore --staged . 2>&1 >> "$LOG_FILE"
    echo "Files unstaged automatically." >> "$LOG_FILE"
    echo "" >> "$LOG_FILE"

    # Success notification
    osascript -e "display notification \"Files auto-unstaged. Check detailed logs at $LOG_FILE\" with title \"Git Safety - Recovered\" sound name \"Hero\"" 2>/dev/null
}

# Baseline capture on startup
echo "" >> "$LOG_FILE"
echo "=== BASELINE CAPTURE (at startup) ===" >> "$LOG_FILE"
echo "Date: $(date)" >> "$LOG_FILE"
echo "VS Code running: $(pgrep -fl 'Visual Studio Code' | wc -l) processes" >> "$LOG_FILE"
echo "Git index mtime: $(stat -f %m .git/index)" >> "$LOG_FILE"
echo "Currently staged files: $(git diff --cached --name-status | wc -l)" >> "$LOG_FILE"
echo "Extensions: $(code --list-extensions 2>/dev/null | wc -l)" >> "$LOG_FILE"
echo "" >> "$LOG_FILE"

# Monitor loop
echo "Enhanced monitoring started. Checking every 2 seconds..."
echo "Press Ctrl+C to stop."
echo "Logs: $LOG_FILE"
echo "Trigger analysis: $TRIGGER_LOG"

COUNTER=0
DETECTION_NUM=0

while true; do
    # Count staged deletions
    DELETED_COUNT=$(git diff --cached --name-status 2>/dev/null | grep "^D" | wc -l | tr -d ' ')

    # Check git index modification time
    CURRENT_INDEX_TIME=$(stat -f %m .git/index 2>/dev/null || echo "0")

    if [ "$DELETED_COUNT" -gt 100 ]; then
        DETECTION_NUM=$((DETECTION_NUM + 1))
        echo "⚠️  ALERT #$DETECTION_NUM: $DELETED_COUNT files staged for deletion at $(date)"
        capture_detailed_state "$DELETED_COUNT" "$DETECTION_NUM"

        # Reset tracking
        PREV_INDEX_TIME=$(stat -f %m .git/index 2>/dev/null || echo "0")

        # Wait longer after detection to avoid spam
        sleep 15
    fi

    # Track index changes even without mass staging
    if [ "$CURRENT_INDEX_TIME" != "$PREV_INDEX_TIME" ]; then
        echo "[$(date +%H:%M:%S)] Git index modified (mtime changed from $PREV_INDEX_TIME to $CURRENT_INDEX_TIME)" >> "$LOG_FILE"
        echo "  Staged files: $(git diff --cached --name-status | wc -l)" >> "$LOG_FILE"
        echo "  Process accessing: $(lsof .git/index 2>/dev/null | tail -n +2 | awk '{print $1, $2}' | head -1)" >> "$LOG_FILE"
        PREV_INDEX_TIME=$CURRENT_INDEX_TIME
    fi

    # Every 30 checks (1 minute), log that we're still monitoring
    COUNTER=$((COUNTER + 1))
    if [ $((COUNTER % 30)) -eq 0 ]; then
        echo "[$(date +%H:%M:%S)] Still monitoring... (no mass staging detected)" >> "$LOG_FILE"
    fi

    sleep 2
done
