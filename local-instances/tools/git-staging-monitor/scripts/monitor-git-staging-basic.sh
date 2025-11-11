#!/bin/bash
# Git Staging Monitor - Catch mass file staging in real-time
# Created: 2025-10-26 to identify what's triggering mass deletions

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
LOG_DIR="$(cd "$SCRIPT_DIR/../logs" && pwd)"
LOG_FILE="$LOG_DIR/staging-monitor-$(date +%Y%m%d).log"

# Create log directory
mkdir -p "$LOG_DIR"

echo "========================================" >> "$LOG_FILE"
echo "Git Staging Monitor Started: $(date)" >> "$LOG_FILE"
echo "========================================" >> "$LOG_FILE"

# Function to capture system state
capture_state() {
    local timestamp=$(date "+%Y-%m-%d %H:%M:%S")
    local deleted_count=$1

    echo "" >> "$LOG_FILE"
    echo "!!! MASS STAGING DETECTED !!!" >> "$LOG_FILE"
    echo "Timestamp: $timestamp" >> "$LOG_FILE"
    echo "Deleted files staged: $deleted_count" >> "$LOG_FILE"
    echo "----------------------------------------" >> "$LOG_FILE"

    # Capture git state
    echo "=== GIT STATUS ===" >> "$LOG_FILE"
    git status --short | head -20 >> "$LOG_FILE"
    echo "" >> "$LOG_FILE"

    # Capture recent git operations
    echo "=== GIT REFLOG (last 10) ===" >> "$LOG_FILE"
    git reflog -10 >> "$LOG_FILE"
    echo "" >> "$LOG_FILE"

    # Capture all running processes (full snapshot)
    echo "=== ALL RUNNING PROCESSES ===" >> "$LOG_FILE"
    ps aux >> "$LOG_FILE"
    echo "" >> "$LOG_FILE"

    # Capture VS Code processes specifically
    echo "=== VS CODE PROCESSES ===" >> "$LOG_FILE"
    ps aux | grep -i "vscode\|code\|electron" | grep -v grep >> "$LOG_FILE"
    echo "" >> "$LOG_FILE"

    # Capture MCP server processes
    echo "=== MCP SERVER PROCESSES ===" >> "$LOG_FILE"
    ps aux | grep -i "mcp-server\|node.*server" | grep -v grep >> "$LOG_FILE"
    echo "" >> "$LOG_FILE"

    # Capture open files by git
    echo "=== GIT OPEN FILES ===" >> "$LOG_FILE"
    lsof -c git 2>/dev/null >> "$LOG_FILE"
    echo "" >> "$LOG_FILE"

    # Capture recent terminal commands (if available)
    echo "=== RECENT SHELL HISTORY ===" >> "$LOG_FILE"
    fc -l -20 2>/dev/null >> "$LOG_FILE"
    echo "" >> "$LOG_FILE"

    # Capture git index modification time
    echo "=== GIT INDEX FILE INFO ===" >> "$LOG_FILE"
    ls -l .git/index >> "$LOG_FILE"
    echo "" >> "$LOG_FILE"

    # Capture system load
    echo "=== SYSTEM LOAD ===" >> "$LOG_FILE"
    uptime >> "$LOG_FILE"
    echo "" >> "$LOG_FILE"

    echo "========================================" >> "$LOG_FILE"

    # Also create a desktop notification
    osascript -e "display notification \"Mass git staging detected! Check $LOG_FILE\" with title \"Git Safety Alert\" sound name \"Basso\"" 2>/dev/null

    # Auto-unstage the files
    echo "Auto-unstaging files at $timestamp..." >> "$LOG_FILE"
    git restore --staged . 2>&1 >> "$LOG_FILE"
    echo "Files unstaged automatically." >> "$LOG_FILE"

    # Another notification
    osascript -e "display notification \"Files auto-unstaged. Check log for details.\" with title \"Git Safety - Files Recovered\" sound name \"Hero\"" 2>/dev/null
}

# Monitor loop
echo "Monitoring started. Checking every 3 seconds..."
echo "Press Ctrl+C to stop."
echo "Logs: $LOG_FILE"

COUNTER=0

while true; do
    # Count staged deletions
    DELETED_COUNT=$(git diff --cached --name-status 2>/dev/null | grep "^D" | wc -l | tr -d ' ')

    if [ "$DELETED_COUNT" -gt 100 ]; then
        echo "⚠️  ALERT: $DELETED_COUNT files staged for deletion at $(date)"
        capture_state "$DELETED_COUNT"

        # Wait a bit longer after detection to avoid spam
        sleep 10
    fi

    # Every 20 checks (1 minute), log that we're still monitoring
    COUNTER=$((COUNTER + 1))
    if [ $((COUNTER % 20)) -eq 0 ]; then
        echo "[$(date +%H:%M:%S)] Still monitoring... (no mass staging detected)" >> "$LOG_FILE"
    fi

    sleep 3
done
