#!/bin/bash
# Git Staging Monitor - Installation Script
# Version: 2.0.0

set -e

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
TOOL_DIR="$(dirname "$SCRIPT_DIR")"
PROJECT_ROOT="$(cd "$TOOL_DIR/../../.." && pwd)"

echo "========================================="
echo "Git Staging Monitor - Installation"
echo "========================================="
echo ""
echo "Tool directory: $TOOL_DIR"
echo "Project root: $PROJECT_ROOT"
echo ""

# Step 1: Make scripts executable
echo "Step 1: Making scripts executable..."
chmod +x "$SCRIPT_DIR"/*.sh
echo "✓ Scripts are executable"
echo ""

# Step 2: Create symlink to logs in project root
echo "Step 2: Creating log directory symlink..."
if [ -L "$PROJECT_ROOT/.git-monitor-logs" ]; then
    echo "✓ Symlink already exists"
elif [ -d "$PROJECT_ROOT/.git-monitor-logs" ]; then
    echo "⚠️  .git-monitor-logs directory exists (not a symlink)"
    echo "   Moving existing logs to tool directory..."
    mv "$PROJECT_ROOT/.git-monitor-logs"/* "$TOOL_DIR/logs/" 2>/dev/null || true
    rmdir "$PROJECT_ROOT/.git-monitor-logs"
    ln -s "$TOOL_DIR/logs" "$PROJECT_ROOT/.git-monitor-logs"
    echo "✓ Existing logs moved and symlink created"
else
    ln -s "$TOOL_DIR/logs" "$PROJECT_ROOT/.git-monitor-logs"
    echo "✓ Symlink created"
fi
echo ""

# Step 3: Update log paths in scripts
echo "Step 3: Checking script configuration..."
ENHANCED_SCRIPT="$SCRIPT_DIR/monitor-git-staging-enhanced.sh"
BASIC_SCRIPT="$SCRIPT_DIR/monitor-git-staging-basic.sh"

if grep -q "LOG_DIR=\"/Users" "$ENHANCED_SCRIPT" 2>/dev/null; then
    echo "⚠️  Scripts have absolute paths - updating to relative paths..."
    sed -i '' 's|LOG_DIR=.*|LOG_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/../logs" \&\& pwd)"|' "$ENHANCED_SCRIPT" 2>/dev/null || echo "Enhanced script not found"
    sed -i '' 's|LOG_DIR=.*|LOG_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/../logs" \&\& pwd)"|' "$BASIC_SCRIPT" 2>/dev/null || echo "Basic script not found"
    echo "✓ Scripts updated with relative paths"
else
    echo "✓ Scripts already configured correctly"
fi
echo ""

# Step 4: Check if monitor is already running
echo "Step 4: Checking for running monitor..."
if pgrep -f "monitor-git-staging" > /dev/null; then
    echo "⚠️  Monitor is already running"
    echo "   PIDs: $(pgrep -f monitor-git-staging)"
    read -p "   Stop and restart with new installation? (y/N) " -n 1 -r
    echo ""
    if [[ $REPLY =~ ^[Yy]$ ]]; then
        pkill -f "monitor-git-staging" || true
        sleep 1
        echo "✓ Old monitor stopped"
    else
        echo "✓ Keeping existing monitor running"
    fi
else
    echo "✓ No monitor currently running"
fi
echo ""

# Step 5: Configure git hook (optional)
echo "Step 5: Git hook configuration (optional)"
if [ ! -f "$PROJECT_ROOT/.git/hooks/pre-commit" ]; then
    read -p "   Install pre-commit hook to block mass deletions? (Y/n) " -n 1 -r
    echo ""
    if [[ ! $REPLY =~ ^[Nn]$ ]]; then
        cat > "$PROJECT_ROOT/.git/hooks/pre-commit" << 'EOF'
#!/bin/bash
# Git Safety Hook - Prevent mass deletions
DELETED_COUNT=$(git diff --cached --name-status | grep "^D" | wc -l)
if [ "$DELETED_COUNT" -gt 100 ]; then
    echo ""
    echo "❌ COMMIT BLOCKED - SAFETY CHECK FAILED"
    echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
    echo "Attempting to delete $DELETED_COUNT files!"
    echo "This appears to be unintentional mass deletion."
    echo ""
    echo "To unstage all deletions: git restore --staged ."
    echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
    exit 1
fi
exit 0
EOF
        chmod +x "$PROJECT_ROOT/.git/hooks/pre-commit"
        echo "✓ Pre-commit hook installed"
    else
        echo "✓ Skipped hook installation"
    fi
else
    echo "✓ Pre-commit hook already exists"
fi
echo ""

# Step 6: Start the monitor
echo "Step 6: Starting the monitor..."
read -p "   Start the enhanced monitor now? (Y/n) " -n 1 -r
echo ""
if [[ ! $REPLY =~ ^[Nn]$ ]]; then
    cd "$PROJECT_ROOT"
    nohup "$ENHANCED_SCRIPT" > /dev/null 2>&1 &
    MONITOR_PID=$!
    sleep 2

    if ps -p $MONITOR_PID > /dev/null; then
        echo "✓ Monitor started (PID: $MONITOR_PID)"
        echo ""
        echo "Monitor logs: $TOOL_DIR/logs/"
        echo "View logs: tail -f $TOOL_DIR/logs/staging-monitor-enhanced-$(date +%Y%m%d).log"
    else
        echo "✗ Monitor failed to start"
        echo "Try running manually: $ENHANCED_SCRIPT"
    fi
else
    echo "✓ Skipped monitor startup"
    echo ""
    echo "To start manually:"
    echo "  cd $PROJECT_ROOT"
    echo "  $ENHANCED_SCRIPT &"
fi
echo ""

# Installation summary
echo "========================================="
echo "Installation Complete!"
echo "========================================="
echo ""
echo "Tool location: $TOOL_DIR"
echo "Logs: $TOOL_DIR/logs/"
echo "Scripts: $TOOL_DIR/scripts/"
echo ""
echo "Commands:"
echo "  Start monitor:  $ENHANCED_SCRIPT &"
echo "  Stop monitor:   pkill -f monitor-git-staging-enhanced"
echo "  Check status:   ps aux | grep monitor-git-staging-enhanced | grep -v grep"
echo "  View logs:      tail -f $TOOL_DIR/logs/staging-monitor-enhanced-\$(date +%Y%m%d).log"
echo ""
echo "Documentation: $TOOL_DIR/README.md"
echo ""
