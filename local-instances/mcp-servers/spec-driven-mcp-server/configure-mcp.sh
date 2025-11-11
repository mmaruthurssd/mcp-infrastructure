#!/bin/bash

###############################################################################
# MCP Configuration Script
# Version: 1.0.0
#
# Automatically configures Claude Code to use the spec-driven MCP server
#
# Usage:
#   ./configure-mcp.sh [instance-path]
#
# Arguments:
#   instance-path   Absolute path to the MCP server instance (optional)
#
###############################################################################

set -e  # Exit on any error

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

###############################################################################
# Functions
###############################################################################

print_success() {
    echo -e "${GREEN}✓${NC} $1"
}

print_error() {
    echo -e "${RED}✗${NC} $1"
}

print_warning() {
    echo -e "${YELLOW}⚠${NC} $1"
}

print_info() {
    echo -e "${BLUE}ℹ${NC} $1"
}

###############################################################################
# Configuration
###############################################################################

MCP_SERVER_NAME="spec-driven"
INSTANCE_PATH="${1:-}"

# If instance path not provided, try to detect it
if [ -z "$INSTANCE_PATH" ]; then
    SCRIPT_DIR="$( cd "$( dirname "${BASH_SOURCE[0]}" )" && pwd )"
    INSTANCE_PATH="$SCRIPT_DIR"
fi

# Ensure instance path is absolute
INSTANCE_PATH="$(cd "$INSTANCE_PATH" && pwd)"

# Verify server exists
SERVER_JS="$INSTANCE_PATH/dist/server.js"
if [ ! -f "$SERVER_JS" ]; then
    print_error "Server not found at: $SERVER_JS"
    print_info "Please build the server first: npm run build"
    exit 1
fi

print_info "Configuring MCP server at: $SERVER_JS"

###############################################################################
# Detect OS and Config Location
###############################################################################

if [[ "$OSTYPE" == "darwin"* ]]; then
    # macOS
    MCP_CONFIG="$HOME/Library/Application Support/Claude/claude_desktop_config.json"
elif [[ "$OSTYPE" == "msys" || "$OSTYPE" == "win32" ]]; then
    # Windows (Git Bash or similar)
    MCP_CONFIG="$APPDATA/Claude/claude_desktop_config.json"
else
    # Linux or other
    print_warning "Unsupported OS: $OSTYPE"
    print_info "Please manually configure MCP at your Claude config location"
    exit 1
fi

print_info "MCP config location: $MCP_CONFIG"

###############################################################################
# Backup Existing Config
###############################################################################

if [ -f "$MCP_CONFIG" ]; then
    BACKUP_FILE="${MCP_CONFIG}.backup.$(date +%Y%m%d_%H%M%S)"
    print_info "Creating backup: $BACKUP_FILE"
    cp "$MCP_CONFIG" "$BACKUP_FILE"
    print_success "Backup created"
else
    print_warning "No existing config found, will create new one"
    # Create parent directory if needed
    mkdir -p "$(dirname "$MCP_CONFIG")"
fi

###############################################################################
# Update Configuration
###############################################################################

print_info "Updating MCP configuration..."

# Read existing config or create empty object
if [ -f "$MCP_CONFIG" ]; then
    EXISTING_CONFIG=$(cat "$MCP_CONFIG")
else
    EXISTING_CONFIG="{}"
fi

# Create the new server configuration
NEW_SERVER_CONFIG=$(cat <<EOF
{
  "command": "node",
  "args": [
    "$SERVER_JS"
  ]
}
EOF
)

# Use Node.js to merge JSON (safer than text manipulation)
NODE_SCRIPT=$(cat <<'ENDNODE'
const fs = require('fs');
const existingConfig = JSON.parse(process.argv[1]);
const newServerConfig = JSON.parse(process.argv[2]);
const serverName = process.argv[3];

// Ensure mcpServers object exists
if (!existingConfig.mcpServers) {
  existingConfig.mcpServers = {};
}

// Add or update the server configuration
existingConfig.mcpServers[serverName] = newServerConfig;

// Write back to stdout
console.log(JSON.stringify(existingConfig, null, 2));
ENDNODE
)

# Check if Node.js is available
if ! command -v node &> /dev/null; then
    print_error "Node.js not found"
    print_info "Please install Node.js or configure manually"
    exit 1
fi

# Merge configurations
UPDATED_CONFIG=$(node -e "$NODE_SCRIPT" "$EXISTING_CONFIG" "$NEW_SERVER_CONFIG" "$MCP_SERVER_NAME")

# Write updated config
echo "$UPDATED_CONFIG" > "$MCP_CONFIG"

print_success "MCP configuration updated"

###############################################################################
# Verification
###############################################################################

print_info "Verifying configuration..."

# Verify JSON is valid
if node -e "JSON.parse(fs.readFileSync('$MCP_CONFIG', 'utf8'))" 2>/dev/null; then
    print_success "Configuration is valid JSON"
else
    print_error "Configuration is invalid JSON"
    print_warning "Restoring from backup: $BACKUP_FILE"
    cp "$BACKUP_FILE" "$MCP_CONFIG"
    exit 1
fi

# Check if server entry exists
if grep -q "\"$MCP_SERVER_NAME\"" "$MCP_CONFIG"; then
    print_success "Server '$MCP_SERVER_NAME' found in config"
else
    print_error "Server '$MCP_SERVER_NAME' not found in config"
    exit 1
fi

###############################################################################
# Complete
###############################################################################

echo ""
print_success "MCP Configuration Complete!"
echo ""

print_info "Configuration file: $MCP_CONFIG"
print_info "Backup saved to: $BACKUP_FILE"
echo ""

print_warning "IMPORTANT: You must restart Claude Code for changes to take effect"
echo ""

print_info "After restarting, verify with:"
echo "  'Do you have access to the sdd_guide tool?'"
echo ""

print_success "Configuration completed successfully!"
