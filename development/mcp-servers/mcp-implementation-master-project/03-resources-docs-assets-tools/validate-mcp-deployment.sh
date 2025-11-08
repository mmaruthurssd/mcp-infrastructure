#!/bin/bash

###############################################################################
# MCP Deployment Validation Script
#
# Purpose: Automated validation of MCP-CONFIGURATION-CHECKLIST.md before deployment
# Version: 1.0.0
# Usage: ./validate-mcp-deployment.sh <server-name>
###############################################################################

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

SERVER_NAME="${1:-}"
FAILURES=0
WARNINGS=0

echo -e "${BLUE}═══════════════════════════════════════════════════════${NC}"
echo -e "${BLUE}  MCP Deployment Validation (Checklist v1.2.0)${NC}"
echo -e "${BLUE}═══════════════════════════════════════════════════════${NC}"
echo ""

if [ -z "$SERVER_NAME" ]; then
  echo -e "${RED}❌ ERROR: Server name required${NC}"
  echo "Usage: $0 <server-name>"
  exit 1
fi

echo -e "${BLUE}Server:${NC} $SERVER_NAME"
echo ""

# Helper functions
pass() {
  echo -e "${GREEN}✓${NC} $1"
}

fail() {
  echo -e "${RED}✗${NC} $1"
  FAILURES=$((FAILURES + 1))
}

warn() {
  echo -e "${YELLOW}⚠${NC} $1"
  WARNINGS=$((WARNINGS + 1))
}

section() {
  echo ""
  echo -e "${BLUE}━━━ $1 ━━━${NC}"
}

###############################################################################
# Section 1: Pre-flight Checks
###############################################################################
section "Section 1: Pre-flight Checks"

# Check Node.js
if command -v node &> /dev/null; then
  NODE_VERSION=$(node --version)
  pass "Node.js installed: $NODE_VERSION"
else
  fail "Node.js not found"
fi

# Check npm
if command -v npm &> /dev/null; then
  NPM_VERSION=$(npm --version)
  pass "npm installed: $NPM_VERSION"
else
  fail "npm not found"
fi

# Check git
if command -v git &> /dev/null; then
  GIT_VERSION=$(git --version)
  pass "git installed: $GIT_VERSION"
else
  fail "git not found"
fi

# Check disk space (require at least 1GB free)
DISK_AVAIL=$(df -h . | awk 'NR==2 {print $4}')
pass "Disk space available: $DISK_AVAIL"

###############################################################################
# Section 2: Configuration Location (CRITICAL)
###############################################################################
section "Section 2: Configuration Location (CRITICAL)"

# Check if Claude Code CLI
CLAUDE_CONFIG="$HOME/.claude.json"

if [ -f "$CLAUDE_CONFIG" ]; then
  pass "Claude Code CLI config exists: ~/.claude.json"
else
  fail "Claude Code CLI config not found: ~/.claude.json"
fi

# Check workspace .mcp.json should NOT exist for Claude Code CLI
WORKSPACE_MCP_JSON="$(pwd)/.mcp.json"
if [ -f "$WORKSPACE_MCP_JSON" ]; then
  fail "CRITICAL: Workspace .mcp.json exists (violates Claude Code CLI standards)"
  echo "   Action: Remove workspace .mcp.json (it should NOT exist for Claude Code CLI)"
else
  pass "Workspace .mcp.json does not exist (correct for Claude Code CLI)"
fi

###############################################################################
# Section 3: Server Location and Build
###############################################################################
section "Section 3: Server Location and Build"

SERVER_PATH="$(pwd)/local-instances/mcp-servers/$SERVER_NAME"

if [ -d "$SERVER_PATH" ]; then
  pass "Server directory exists: $SERVER_PATH"
else
  fail "Server directory not found: $SERVER_PATH"
  exit 1
fi

# Check if built
SERVER_JS="$SERVER_PATH/dist/server.js"
if [ -f "$SERVER_JS" ]; then
  pass "Server built: dist/server.js exists"
else
  fail "Server not built: dist/server.js not found"
  echo "   Action: Run 'cd $SERVER_PATH && npm run build'"
fi

# Check package.json
PACKAGE_JSON="$SERVER_PATH/package.json"
if [ -f "$PACKAGE_JSON" ]; then
  pass "package.json exists"

  # Extract package name
  PACKAGE_NAME=$(jq -r '.name' "$PACKAGE_JSON" 2>/dev/null || echo "unknown")
  echo "   Package name: $PACKAGE_NAME"
else
  fail "package.json not found"
fi

###############################################################################
# Section 4: Duplicate Detection
###############################################################################
section "Section 4: Duplicate Detection"

# Check for duplicate registrations
DUPLICATES_FOUND=false

if [ -f "$CLAUDE_CONFIG" ]; then
  if jq -e ".mcpServers[\"$SERVER_NAME\"]" "$CLAUDE_CONFIG" &>/dev/null; then
    echo "   Found in ~/.claude.json"
    DUPLICATES_FOUND=true
  fi
fi

if [ -f "$WORKSPACE_MCP_JSON" ]; then
  if jq -e ".mcpServers[\"$SERVER_NAME\"]" "$WORKSPACE_MCP_JSON" &>/dev/null; then
    echo "   Found in workspace .mcp.json"
    DUPLICATES_FOUND=true
  fi
fi

if [ "$DUPLICATES_FOUND" = true ]; then
  warn "Server already registered (may be updating existing installation)"
else
  pass "No duplicate registrations found"
fi

###############################################################################
# Section 5: Path Validation
###############################################################################
section "Section 5: Path Validation"

# Check if server.js path is absolute
if [[ "$SERVER_JS" = /* ]]; then
  pass "Server path is absolute: $SERVER_JS"
else
  fail "Server path is not absolute: $SERVER_JS"
fi

# Check for workspace variables in config
if [ -f "$CLAUDE_CONFIG" ]; then
  if jq -r '.mcpServers | to_entries[] | .value.args[]' "$CLAUDE_CONFIG" 2>/dev/null | grep -q '\${workspaceFolder}'; then
    fail "Found \${workspaceFolder} variable in ~/.claude.json (not allowed for Claude Code CLI)"
  else
    pass "No \${workspaceFolder} variables in ~/.claude.json"
  fi
fi

###############################################################################
# Section 6: MCP Server Standards
###############################################################################
section "Section 6: MCP Server Standards"

# Check for README.md
if [ -f "$SERVER_PATH/README.md" ]; then
  pass "README.md exists"
else
  warn "README.md not found"
fi

# Check for tests
if [ -d "$SERVER_PATH/tests" ]; then
  pass "Tests directory exists"
else
  warn "Tests directory not found"
fi

# Check TypeScript config
if [ -f "$SERVER_PATH/tsconfig.json" ]; then
  pass "tsconfig.json exists"
else
  warn "tsconfig.json not found"
fi

###############################################################################
# Section 7: Security Validation
###############################################################################
section "Section 7: Security Validation"

# Check for credentials in code
if grep -r -i "api[_-]key\|password\|secret\|token" "$SERVER_PATH/src" 2>/dev/null | grep -v "description\|comment\|TODO" &>/dev/null; then
  warn "Potential credentials found in source code (review manually)"
else
  pass "No obvious credentials in source code"
fi

# Check for .env files
if [ -f "$SERVER_PATH/.env" ]; then
  warn ".env file found (ensure not committed to git)"
else
  pass "No .env file in server directory"
fi

###############################################################################
# Section 8: Configuration Validation
###############################################################################
section "Section 8: Configuration Validation"

# Validate JSON syntax
if [ -f "$CLAUDE_CONFIG" ]; then
  if jq empty "$CLAUDE_CONFIG" 2>/dev/null; then
    pass "~/.claude.json has valid JSON syntax"
  else
    fail "~/.claude.json has invalid JSON syntax"
  fi
fi

if [ -f "$WORKSPACE_MCP_JSON" ]; then
  if jq empty "$WORKSPACE_MCP_JSON" 2>/dev/null; then
    warn "workspace .mcp.json has valid JSON (but should not exist for Claude Code CLI)"
  else
    fail "workspace .mcp.json has invalid JSON syntax"
  fi
fi

# Check backup exists
BACKUP_COUNT=$(ls -1 "$HOME/.claude.json.backup"* 2>/dev/null | wc -l)
if [ "$BACKUP_COUNT" -gt 0 ]; then
  pass "Configuration backups exist (${BACKUP_COUNT} found)"
else
  warn "No configuration backups found"
fi

###############################################################################
# Summary
###############################################################################
echo ""
echo -e "${BLUE}═══════════════════════════════════════════════════════${NC}"
echo -e "${BLUE}  Validation Summary${NC}"
echo -e "${BLUE}═══════════════════════════════════════════════════════${NC}"
echo ""

if [ $FAILURES -eq 0 ] && [ $WARNINGS -eq 0 ]; then
  echo -e "${GREEN}✓ ALL CHECKS PASSED${NC}"
  echo ""
  echo "Ready for deployment!"
  echo ""
  echo "Next steps:"
  echo "1. Review MCP-CONFIGURATION-CHECKLIST.md sections 1-8"
  echo "2. Manually register in ~/.claude.json (see checklist for format)"
  echo "3. Restart Claude Code"
  echo "4. Verify with smoke tests"
  exit 0
elif [ $FAILURES -eq 0 ]; then
  echo -e "${YELLOW}⚠ PASSED WITH WARNINGS${NC}"
  echo ""
  echo "Failures: $FAILURES"
  echo "Warnings: $WARNINGS"
  echo ""
  echo "Review warnings above before deploying."
  echo "Follow MCP-CONFIGURATION-CHECKLIST.md for manual registration."
  exit 0
else
  echo -e "${RED}✗ VALIDATION FAILED${NC}"
  echo ""
  echo "Failures: $FAILURES"
  echo "Warnings: $WARNINGS"
  echo ""
  echo "Fix all failures before deploying."
  echo "See errors above for specific issues."
  exit 1
fi
