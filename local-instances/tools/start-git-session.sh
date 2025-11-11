#!/bin/bash
# Start Git Session (Terminal 1)
# Run: source ./start-git-session.sh

echo "════════════════════════════════════════"
echo "🟢 GIT SESSION - Main Workspace"
echo "════════════════════════════════════════"
echo ""
echo "This terminal handles ALL git operations:"
echo "  ✅ git status, commit, push, pull"
echo "  ✅ Creating/deleting tracked files"
echo "  ✅ File organization"
echo ""
echo "Other sessions (2-4) = CODING ONLY"
echo "════════════════════════════════════════"
echo ""

# Set terminal title
echo -e "\033]0;🟢 GIT SESSION - Main Workspace\007"

# Set colorful prompt
export PS1="\[\033[1;32m\]🟢 GIT\[\033[0m\] \[\033[1;34m\]\w\[\033[0m\] $ "

# Reminder function
alias remind='echo "💡 TIP: This is your GIT session. Use others for coding only."'

echo "Type 'remind' anytime for a reminder of this session's purpose."
echo ""
