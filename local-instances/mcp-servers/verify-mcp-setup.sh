#!/bin/bash

# MCP Server Post-Installation Verification Script
# Run this after installing any new MCP server to verify setup

echo "========================================="
echo "MCP Server Installation Verification"
echo "========================================="
echo ""

# Auto-detect workspace root by looking for .mcp.json
# Start from current directory and traverse up
SCRIPT_DIR="$( cd "$( dirname "${BASH_SOURCE[0]}" )" && pwd )"
CURRENT_DIR="$SCRIPT_DIR"
WORKSPACE_ROOT=""

# Search up to 5 levels up for .mcp.json or .git
for i in {1..5}; do
    if [ -f "$CURRENT_DIR/.mcp.json" ] || [ -d "$CURRENT_DIR/.git" ]; then
        WORKSPACE_ROOT="$CURRENT_DIR"
        break
    fi
    CURRENT_DIR="$(dirname "$CURRENT_DIR")"
done

# If still not found, assume parent of this script's directory
if [ -z "$WORKSPACE_ROOT" ]; then
    WORKSPACE_ROOT="$(dirname "$SCRIPT_DIR")"
fi

echo "Detected workspace root: $WORKSPACE_ROOT"
echo ""

ERRORS=0

# Color codes for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Function to print check results
print_check() {
    if [ $1 -eq 0 ]; then
        echo -e "${GREEN}✅ $2${NC}"
    else
        echo -e "${RED}❌ $2${NC}"
        ((ERRORS++))
    fi
}

print_warning() {
    echo -e "${YELLOW}⚠️  $1${NC}"
}

echo "1. Checking if .mcp.json exists in project root..."
if [ -f "$WORKSPACE_ROOT/.mcp.json" ]; then
    print_check 0 "Config file exists at $WORKSPACE_ROOT/.mcp.json"
else
    print_check 1 "Config file NOT found at $WORKSPACE_ROOT/.mcp.json"
    print_warning "Solution: Create .mcp.json in project root (NOT ~/.config/claude-code/)"
fi
echo ""

echo "2. Checking for old/conflicting config files..."
if [ -f "$WORKSPACE_ROOT/mcp-servers.json" ]; then
    print_check 1 "Old mcp-servers.json file found (should be .mcp.json)"
    print_warning "Solution: Rename to .mcp.json"
else
    print_check 0 "No conflicting config files"
fi
echo ""

echo "3. Verifying .mcp.json structure..."
if [ -f "$WORKSPACE_ROOT/.mcp.json" ]; then
    if grep -q '"mcpServers"' "$WORKSPACE_ROOT/.mcp.json"; then
        print_check 0 "Config has required 'mcpServers' wrapper key"
    else
        print_check 1 "Config missing 'mcpServers' wrapper key"
        print_warning "Solution: Wrap server configs in { \"mcpServers\": { ... } }"
    fi
fi
echo ""

echo "4. Checking for relative vs absolute paths..."
if [ -f "$WORKSPACE_ROOT/.mcp.json" ]; then
    if grep -q '"\./local-instances' "$WORKSPACE_ROOT/.mcp.json" || grep -q '"\./mcp-servers' "$WORKSPACE_ROOT/.mcp.json"; then
        print_check 1 "Config contains RELATIVE paths (./...)"
        print_warning "Solution: Change to absolute paths (full path starting with /)"
    elif grep -q '"local-instances' "$WORKSPACE_ROOT/.mcp.json" || grep -q '"mcp-servers' "$WORKSPACE_ROOT/.mcp.json"; then
        # Check if it's not part of an absolute path
        if ! grep -q '"/.*local-instances' "$WORKSPACE_ROOT/.mcp.json" && ! grep -q '"/.*mcp-servers' "$WORKSPACE_ROOT/.mcp.json"; then
            print_check 1 "Config contains RELATIVE paths (no leading /)"
            print_warning "Solution: Change to absolute paths (full path starting with /)"
        else
            print_check 0 "All paths appear to be absolute"
        fi
    else
        print_check 0 "All paths appear to be absolute"
    fi
fi
echo ""

echo "5. Verifying installed servers exist and are built..."
if [ -f "$WORKSPACE_ROOT/.mcp.json" ]; then
    # Extract server paths from config and check if they exist
    FOUND_SERVERS=0
    while IFS= read -r line; do
        if [[ $line =~ \"([^\"]+\.(js))\" ]]; then
            SERVER_PATH="${BASH_REMATCH[1]}"
            FOUND_SERVERS=1
            if [ -f "$SERVER_PATH" ]; then
                print_check 0 "Server file exists: $SERVER_PATH"
            else
                print_check 1 "Server file NOT found: $SERVER_PATH"
                print_warning "Solution: Run 'npm run build' in the server directory"
            fi
        fi
    done < <(grep -o '"[^"]*\.js"' "$WORKSPACE_ROOT/.mcp.json")

    if [ $FOUND_SERVERS -eq 0 ]; then
        print_warning "No server paths found in config"
    fi
fi
echo ""

echo "6. Testing server startups..."
echo "   (Attempting to start each server briefly to check for runtime errors)"
if [ -f "$WORKSPACE_ROOT/.mcp.json" ]; then
    # Extract unique server paths
    PATHS=$(grep -o '"/[^"]*\.js"' "$WORKSPACE_ROOT/.mcp.json" | tr -d '"' | sort -u)

    if [ -z "$PATHS" ]; then
        print_warning "No absolute paths found to test"
    else
        for SERVER_PATH in $PATHS; do
            if [ -f "$SERVER_PATH" ]; then
                SERVER_NAME=$(basename $(dirname "$SERVER_PATH"))
                echo "   Testing: $SERVER_NAME"

                # Start server in background, wait 1 second, then kill
                node "$SERVER_PATH" &> /tmp/mcp_test_$$.log &
                SERVER_PID=$!
                sleep 1
                kill $SERVER_PID 2>/dev/null
                wait $SERVER_PID 2>/dev/null

                # Check if there were any startup errors
                if grep -qi "error\|exception\|failed" /tmp/mcp_test_$$.log; then
                    print_check 1 "$SERVER_NAME has runtime errors"
                    print_warning "Check logs: cat /tmp/mcp_test_$$.log"
                else
                    print_check 0 "$SERVER_NAME starts without errors"
                fi
                rm -f /tmp/mcp_test_$$.log
            fi
        done
    fi
fi
echo ""

echo "========================================="
if [ $ERRORS -eq 0 ]; then
    echo -e "${GREEN}✅ All checks passed! Ready to restart VS Code.${NC}"
else
    echo -e "${RED}❌ Found $ERRORS issue(s). Please fix before restarting VS Code.${NC}"
    echo ""
    echo "Refer to TROUBLESHOOTING.md in the mcp-servers directory"
fi
echo "========================================="
