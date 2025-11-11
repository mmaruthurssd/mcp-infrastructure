#!/bin/bash
# Start Coding Session (Terminals 2-4)
# Run: source ./start-coding-session.sh A
#  or: source ./start-coding-session.sh B
#  or: source ./start-coding-session.sh C

SESSION_ID=${1:-A}

case $SESSION_ID in
    A)
        COLOR="\[\033[1;34m\]"  # Blue
        EMOJI="🔵"
        ;;
    B)
        COLOR="\[\033[1;33m\]"  # Yellow
        EMOJI="🟡"
        ;;
    C)
        COLOR="\[\033[1;35m\]"  # Purple
        EMOJI="🟣"
        ;;
    *)
        COLOR="\[\033[1;36m\]"  # Cyan
        EMOJI="⚪"
        SESSION_ID="X"
        ;;
esac

echo "════════════════════════════════════════"
echo "${EMOJI} CODING SESSION ${SESSION_ID}"
echo "════════════════════════════════════════"
echo ""
echo "This terminal is for CODING ONLY:"
echo "  ✅ Writing/editing code"
echo "  ✅ Reading files"
echo "  ✅ Running tests"
echo "  ✅ Debugging"
echo ""
echo "  ❌ NO git operations here!"
echo ""
echo "For git: Switch to Terminal 1 (🟢 GIT SESSION)"
echo "════════════════════════════════════════"
echo ""

# Set terminal title
echo -e "\033]0;${EMOJI} CODING ${SESSION_ID} - No Git\007"

# Set colorful prompt
export PS1="${COLOR}${EMOJI} CODE-${SESSION_ID}\[\033[0m\] \[\033[1;34m\]\w\[\033[0m\] $ "

# Safety reminder function
alias git='echo "⚠️  WAIT! This is a CODING session. Use Terminal 1 (🟢 GIT) for git operations." && echo "To override this warning: command git"'
alias remind='echo "💡 This is CODING session '${SESSION_ID}'. NO git here. Use Terminal 1 for git."'

echo "Type 'remind' for a reminder. Type 'git' to see safety warning."
echo ""
