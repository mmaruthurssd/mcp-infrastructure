#!/bin/bash

# Comprehensive MCP Server Verification Script
# Based on TROUBLESHOOTING.md checklist
# Tests all issues systematically for each MCP server

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Counter for issues
TOTAL_CHECKS=0
PASSED_CHECKS=0
FAILED_CHECKS=0

WORKSPACE_ROOT="/Users/mmaruthurnew/Desktop/operations-workspace"
VSCODE_USER_CONFIG="$HOME/Library/Application Support/Code/User/mcp.json"

echo "========================================="
echo "Comprehensive MCP Server Verification"
echo "========================================="
echo ""

# Function to check and report
check() {
    local description="$1"
    local result="$2"
    TOTAL_CHECKS=$((TOTAL_CHECKS + 1))

    if [ "$result" = "0" ]; then
        echo -e "${GREEN}✅ PASS${NC}: $description"
        PASSED_CHECKS=$((PASSED_CHECKS + 1))
    else
        echo -e "${RED}❌ FAIL${NC}: $description"
        FAILED_CHECKS=$((FAILED_CHECKS + 1))
    fi
}

warning() {
    echo -e "${YELLOW}⚠️  WARN${NC}: $1"
}

info() {
    echo -e "${BLUE}ℹ️  INFO${NC}: $1"
}

section() {
    echo ""
    echo -e "${BLUE}=========================================${NC}"
    echo -e "${BLUE}$1${NC}"
    echo -e "${BLUE}=========================================${NC}"
}

# ============================================
# SECTION 1: Configuration File Checks
# ============================================
section "1. Configuration File Verification"

# Check if VS Code User config exists
if [ -f "$VSCODE_USER_CONFIG" ]; then
    check "VS Code User mcp.json exists" 0

    # Check if it's valid JSON
    if jq . "$VSCODE_USER_CONFIG" > /dev/null 2>&1; then
        check "VS Code User mcp.json is valid JSON" 0
    else
        check "VS Code User mcp.json is valid JSON" 1
    fi

    # Check if it has mcpServers key
    if jq -e '.mcpServers' "$VSCODE_USER_CONFIG" > /dev/null 2>&1; then
        check "VS Code User mcp.json has mcpServers key" 0
    else
        check "VS Code User mcp.json has mcpServers key" 1
        warning "File has wrong structure. Should be {\"mcpServers\": {...}}"
    fi

    # Check if it's not empty
    SERVER_COUNT=$(jq '.mcpServers | length' "$VSCODE_USER_CONFIG" 2>/dev/null || echo 0)
    if [ "$SERVER_COUNT" -gt 0 ]; then
        check "VS Code User mcp.json has servers configured ($SERVER_COUNT)" 0
    else
        check "VS Code User mcp.json has servers configured" 1
    fi
else
    check "VS Code User mcp.json exists" 1
    warning "Create file at: $VSCODE_USER_CONFIG"
fi

# ============================================
# SECTION 2: Server-by-Server Verification
# ============================================

SERVERS=("git-assistant" "file-organizer" "smart-file-organizer" "miro" "spec-driven")

for SERVER in "${SERVERS[@]}"; do
    section "2. Verifying Server: $SERVER"

    SERVER_DIR="$WORKSPACE_ROOT/local-instances/mcp-servers/${SERVER}-mcp-server"

    # Check if server directory exists
    if [ -d "$SERVER_DIR" ]; then
        check "Server directory exists: $SERVER_DIR" 0
    else
        check "Server directory exists: $SERVER_DIR" 1
        continue
    fi

    cd "$SERVER_DIR"

    # Check package.json exists
    if [ -f "package.json" ]; then
        check "[$SERVER] package.json exists" 0

        # Check for MCP SDK dependency
        if grep -q "@modelcontextprotocol/sdk" package.json; then
            check "[$SERVER] Has MCP SDK dependency" 0
        else
            check "[$SERVER] Has MCP SDK dependency" 1
        fi
    else
        check "[$SERVER] package.json exists" 1
    fi

    # Check node_modules exists
    if [ -d "node_modules" ]; then
        check "[$SERVER] node_modules directory exists" 0

        # Check if MCP SDK is actually installed
        if [ -d "node_modules/@modelcontextprotocol/sdk" ]; then
            check "[$SERVER] MCP SDK is installed" 0
        else
            check "[$SERVER] MCP SDK is installed" 1
            warning "Run: cd $SERVER_DIR && npm install"
        fi
    else
        check "[$SERVER] node_modules directory exists" 1
        warning "Run: cd $SERVER_DIR && npm install"
    fi

    # Check build output exists (dist or build)
    BUILD_FILE=""
    if [ -f "dist/server.js" ]; then
        BUILD_FILE="dist/server.js"
        check "[$SERVER] Build output exists (dist/server.js)" 0
    elif [ -f "build/index.js" ]; then
        BUILD_FILE="build/index.js"
        check "[$SERVER] Build output exists (build/index.js)" 0
    else
        check "[$SERVER] Build output exists" 1
        warning "Run: cd $SERVER_DIR && npm run build"
        continue
    fi

    # Check if build file is executable
    if [ -x "$BUILD_FILE" ]; then
        check "[$SERVER] Build file is executable" 0
    else
        warning "[$SERVER] Build file not executable (usually OK for node scripts)"
    fi

    # Check if server is in VS Code config
    if [ -f "$VSCODE_USER_CONFIG" ]; then
        if jq -e ".mcpServers.\"$SERVER\"" "$VSCODE_USER_CONFIG" > /dev/null 2>&1; then
            check "[$SERVER] Configured in VS Code User mcp.json" 0

            # Verify path in config matches actual location
            CONFIG_PATH=$(jq -r ".mcpServers.\"$SERVER\".args[0]" "$VSCODE_USER_CONFIG" 2>/dev/null)
            if [ -f "$CONFIG_PATH" ]; then
                check "[$SERVER] Config path points to existing file" 0
            else
                check "[$SERVER] Config path points to existing file" 1
                warning "Config says: $CONFIG_PATH"
                warning "But file doesn't exist"
            fi

            # Check if path is absolute
            if [[ "$CONFIG_PATH" = /* ]]; then
                check "[$SERVER] Config uses absolute path" 0
            else
                check "[$SERVER] Config uses absolute path" 1
                warning "Path should start with /"
            fi
        else
            check "[$SERVER] Configured in VS Code User mcp.json" 1
            warning "Add $SERVER to $VSCODE_USER_CONFIG"
        fi
    fi

    # Test server can start (briefly)
    info "Testing if $SERVER can start..."
    if timeout 2 node "$BUILD_FILE" 2>&1 | grep -qi "server\|mcp\|running" || [ $? -eq 124 ]; then
        check "[$SERVER] Server starts without immediate errors" 0
    else
        check "[$SERVER] Server starts without immediate errors" 1
        warning "Server may have runtime issues"
    fi

    # Check for common code issues

    # Check for console.log usage (should use console.error)
    if grep -r "console\.log" src/ 2>/dev/null | grep -v "console\.error" > /dev/null; then
        check "[$SERVER] No console.log in source (uses console.error)" 1
        warning "console.log breaks MCP protocol - use console.error instead"
    else
        check "[$SERVER] No console.log in source (uses console.error)" 0
    fi

    # Check if TypeScript source exists
    if [ -d "src" ]; then
        check "[$SERVER] Source directory exists" 0
    else
        warning "[$SERVER] No src/ directory found"
    fi

    # Check for tsconfig.json
    if [ -f "tsconfig.json" ]; then
        check "[$SERVER] TypeScript config exists" 0
    else
        warning "[$SERVER] No tsconfig.json (may be JavaScript only)"
    fi
done

# ============================================
# SECTION 3: Environment Variable Checks
# ============================================
section "3. Environment Variable Verification"

# Check Miro token
if [ -f "$VSCODE_USER_CONFIG" ]; then
    MIRO_TOKEN=$(jq -r '.mcpServers.miro.env.MIRO_OAUTH_TOKEN' "$VSCODE_USER_CONFIG" 2>/dev/null)
    if [ "$MIRO_TOKEN" != "null" ] && [ -n "$MIRO_TOKEN" ] && [ "$MIRO_TOKEN" != '${MIRO_OAUTH_TOKEN}' ]; then
        check "Miro OAuth token is set in config" 0
        info "Token: ${MIRO_TOKEN:0:20}..."
    else
        check "Miro OAuth token is set in config" 1
        warning "Miro server won't work without token"
    fi
fi

# ============================================
# SECTION 4: Agent File Checks
# ============================================
section "4. Claude Agent File Verification"

CLAUDE_AGENTS_DIR="$WORKSPACE_ROOT/.claude/agents"

if [ -d "$CLAUDE_AGENTS_DIR" ]; then
    check "Claude agents directory exists" 0

    for SERVER in "${SERVERS[@]}"; do
        if [ -f "$CLAUDE_AGENTS_DIR/${SERVER}.md" ]; then
            check "Agent file exists: ${SERVER}.md" 0

            # Check for frontmatter
            if head -1 "$CLAUDE_AGENTS_DIR/${SERVER}.md" | grep -q "^---$"; then
                check "Agent file has frontmatter: ${SERVER}.md" 0
            else
                check "Agent file has frontmatter: ${SERVER}.md" 1
                warning "Should start with --- for metadata"
            fi
        else
            warning "No agent file for: ${SERVER}.md"
        fi
    done
else
    warning "No .claude/agents directory"
    info "Create at: mkdir -p $CLAUDE_AGENTS_DIR"
fi

# ============================================
# SECTION 5: Learned Patterns Files
# ============================================
section "5. Learning Engine Verification"

for SERVER in "file-organizer" "smart-file-organizer" "git-assistant"; do
    SERVER_DIR="$WORKSPACE_ROOT/local-instances/mcp-servers/${SERVER}-mcp-server"
    PATTERNS_FILE="$SERVER_DIR/.mcp-learned-patterns.json"

    if [ -f "$PATTERNS_FILE" ]; then
        check "[$SERVER] Learned patterns file exists" 0

        # Check if it's valid JSON
        if jq . "$PATTERNS_FILE" > /dev/null 2>&1; then
            check "[$SERVER] Learned patterns file is valid JSON" 0

            PATTERN_COUNT=$(jq '.patterns | length' "$PATTERNS_FILE" 2>/dev/null || echo 0)
            info "[$SERVER] Has $PATTERN_COUNT learned patterns"
        else
            check "[$SERVER] Learned patterns file is valid JSON" 1
        fi

        # Check file permissions
        if [ -r "$PATTERNS_FILE" ] && [ -w "$PATTERNS_FILE" ]; then
            check "[$SERVER] Learned patterns file has correct permissions" 0
        else
            check "[$SERVER] Learned patterns file has correct permissions" 1
            warning "Run: chmod 644 $PATTERNS_FILE"
        fi
    else
        info "[$SERVER] No learned patterns file yet (will be created on first use)"
    fi
done

# ============================================
# SUMMARY
# ============================================
section "Verification Summary"

echo ""
echo "Total Checks: $TOTAL_CHECKS"
echo -e "${GREEN}Passed: $PASSED_CHECKS${NC}"
echo -e "${RED}Failed: $FAILED_CHECKS${NC}"
echo ""

if [ $FAILED_CHECKS -eq 0 ]; then
    echo -e "${GREEN}=========================================${NC}"
    echo -e "${GREEN}✅ ALL CHECKS PASSED!${NC}"
    echo -e "${GREEN}=========================================${NC}"
    echo ""
    echo "All MCP servers are properly configured."
    echo "Restart VS Code to load the servers."
    exit 0
else
    echo -e "${YELLOW}=========================================${NC}"
    echo -e "${YELLOW}⚠️  SOME CHECKS FAILED${NC}"
    echo -e "${YELLOW}=========================================${NC}"
    echo ""
    echo "Review the failures above and fix them."
    echo "Then run this script again to verify."
    echo ""
    echo "Common fixes:"
    echo "1. Run 'npm install' in each server directory"
    echo "2. Run 'npm run build' in each server directory"
    echo "3. Update VS Code User mcp.json at:"
    echo "   $VSCODE_USER_CONFIG"
    echo "4. Restart VS Code completely (Cmd+Q)"
    exit 1
fi
