#!/bin/bash
# Enable Git Command Tracing
# This will log EVERY git command that runs to help identify the trigger

TRACE_LOG="/Users/mmaruthurnew/Desktop/operations-workspace/.git-monitor-logs/git-trace-$(date +%Y%m%d-%H%M%S).log"

mkdir -p "/Users/mmaruthurnew/Desktop/operations-workspace/.git-monitor-logs"

echo "========================================" > "$TRACE_LOG"
echo "Git Tracing Enabled: $(date)" >> "$TRACE_LOG"
echo "========================================" >> "$TRACE_LOG"

# Export git trace variables to current shell AND for VS Code
export GIT_TRACE="$TRACE_LOG"
export GIT_TRACE_SETUP="$TRACE_LOG"
export GIT_TRACE_PACK_ACCESS="$TRACE_LOG"

echo "✅ Git tracing enabled!"
echo "All git commands will be logged to:"
echo "  $TRACE_LOG"
echo ""
echo "To apply this to VS Code, add to your shell profile:"
echo "  export GIT_TRACE=\"$TRACE_LOG\""
echo ""
echo "To disable tracing later, run:"
echo "  unset GIT_TRACE GIT_TRACE_SETUP GIT_TRACE_PACK_ACCESS"
