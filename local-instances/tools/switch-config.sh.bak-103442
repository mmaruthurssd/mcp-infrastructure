#!/bin/bash

# switch-config.sh - Switch between MCP configurations
# Usage: ./switch-config.sh [practice|development|research|minimal|list|current]

WORKSPACE_ROOT="$HOME/Desktop/medical-practice-workspace"
CLAUDE_DIR="$WORKSPACE_ROOT/.claude"

# Colors for output
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Function to print colored output
print_success() {
    echo -e "${GREEN}✅ $1${NC}"
}

print_warning() {
    echo -e "${YELLOW}⚠️  $1${NC}"
}

print_error() {
    echo -e "${RED}❌ $1${NC}"
}

print_info() {
    echo -e "${BLUE}ℹ️  $1${NC}"
}

# Function to show usage
show_usage() {
    echo "Usage: ./switch-config.sh [practice|development|research|minimal|list|current]"
    echo ""
    echo "Available configurations:"
    echo "  practice     - Medical practice management (10 MCPs, ~10,500 tokens)"
    echo "  development  - MCP development (12 MCPs, ~12,600 tokens)"
    echo "  research     - Research/documentation (9 MCPs, ~9,000 tokens)"
    echo "  minimal      - Lightweight/quick tasks (4 MCPs, ~4,000 tokens)"
    echo ""
    echo "Special commands:"
    echo "  list         - List all available configurations"
    echo "  current      - Show currently active configuration"
    echo ""
    echo "Examples:"
    echo "  ./switch-config.sh practice     # Switch to practice config"
    echo "  ./switch-config.sh current      # Show current config"
    echo "  ./switch-config.sh list         # List all configs"
}

# Function to list available configs
list_configs() {
    echo ""
    print_info "Available configurations in $CLAUDE_DIR:"
    echo ""

    if [ ! -d "$CLAUDE_DIR" ]; then
        print_error "Claude directory not found: $CLAUDE_DIR"
        return 1
    fi

    for config_file in "$CLAUDE_DIR"/config-*.json; do
        if [ -f "$config_file" ]; then
            config_name=$(basename "$config_file" | sed 's/config-//' | sed 's/.json//')

            # Count MCPs using jq if available
            if command -v jq &> /dev/null; then
                mcp_count=$(jq '.mcpServers | keys | length' "$config_file" 2>/dev/null)
                if [ $? -eq 0 ]; then
                    echo "  📋 $config_name ($mcp_count MCPs)"
                else
                    echo "  📋 $config_name (invalid JSON)"
                fi
            else
                echo "  📋 $config_name"
            fi
        fi
    done
    echo ""
}

# Function to show current config
show_current() {
    echo ""
    print_info "Current configuration:"
    echo ""

    if [ ! -f "$CLAUDE_DIR/config.json" ]; then
        print_warning "No active config found at $CLAUDE_DIR/config.json"
        echo ""
        print_info "To set up configurations, run:"
        echo "  cd $WORKSPACE_ROOT"
        echo "  cp configuration/examples/config-practice-example.json .claude/config-practice.json"
        echo "  sed -i '' \"s|{{WORKSPACE_ROOT}}|$WORKSPACE_ROOT|g\" .claude/config-practice.json"
        echo "  cp .claude/config-practice.json .claude/config.json"
        return 1
    fi

    # Count MCPs using jq if available
    if command -v jq &> /dev/null; then
        mcp_count=$(jq '.mcpServers | keys | length' "$CLAUDE_DIR/config.json" 2>/dev/null)
        if [ $? -eq 0 ]; then
            print_success "Active config has $mcp_count MCPs loaded"
            echo ""
            echo "Loaded MCPs:"
            jq -r '.mcpServers | keys[]' "$CLAUDE_DIR/config.json" | while read -r mcp; do
                echo "  • $mcp"
            done
        else
            print_error "Active config has invalid JSON"
        fi
    else
        print_warning "Install 'jq' to see detailed config information"
        echo "  brew install jq"
    fi
    echo ""
}

# Main script logic
if [ $# -eq 0 ]; then
    show_usage
    exit 1
fi

COMMAND=$1

# Handle special commands
case $COMMAND in
    list)
        list_configs
        exit 0
        ;;
    current)
        show_current
        exit 0
        ;;
    help|-h|--help)
        show_usage
        exit 0
        ;;
esac

# Check if Claude directory exists
if [ ! -d "$CLAUDE_DIR" ]; then
    print_error "Claude directory not found: $CLAUDE_DIR"
    echo ""
    print_info "Creating Claude directory..."
    mkdir -p "$CLAUDE_DIR"
    print_success "Created $CLAUDE_DIR"
    echo ""
    print_info "Next steps:"
    echo "1. Copy example configs from configuration/examples/"
    echo "2. Replace {{WORKSPACE_ROOT}} with actual path"
    echo "3. Run this script again"
    exit 1
fi

CONFIG_NAME=$1
CONFIG_FILE="$CLAUDE_DIR/config-$CONFIG_NAME.json"
ACTIVE_CONFIG="$CLAUDE_DIR/config.json"

# Check if config file exists
if [ ! -f "$CONFIG_FILE" ]; then
    print_error "Configuration 'config-$CONFIG_NAME.json' not found"
    echo ""
    print_info "Available configs:"
    list_configs
    echo ""
    print_info "To create this config:"
    echo "  cp configuration/examples/config-$CONFIG_NAME-example.json .claude/config-$CONFIG_NAME.json"
    echo "  sed -i '' \"s|{{WORKSPACE_ROOT}}|$WORKSPACE_ROOT|g\" .claude/config-$CONFIG_NAME.json"
    exit 1
fi

# Validate JSON if jq is available
if command -v jq &> /dev/null; then
    if ! jq empty "$CONFIG_FILE" 2>/dev/null; then
        print_error "Configuration file has invalid JSON: $CONFIG_FILE"
        exit 1
    fi
fi

# Backup current config
if [ -f "$ACTIVE_CONFIG" ]; then
    cp "$ACTIVE_CONFIG" "$ACTIVE_CONFIG.backup"
    print_success "Backed up current config to config.json.backup"
fi

# Copy new config
cp "$CONFIG_FILE" "$ACTIVE_CONFIG"

# Show summary
echo ""
print_success "Switched to '$CONFIG_NAME' configuration"
echo ""
print_info "Next steps:"
echo "1. Open VSCode: cd $WORKSPACE_ROOT && code ."
echo "2. Reload window: Cmd+Shift+P > 'Reload Window'"
echo ""

# Show MCP count if jq is available
if command -v jq &> /dev/null; then
    MCP_COUNT=$(jq '.mcpServers | keys | length' "$ACTIVE_CONFIG" 2>/dev/null)
    if [ $? -eq 0 ]; then
        print_info "Loaded MCPs: $MCP_COUNT"
        echo ""
        echo "MCPs in this configuration:"
        jq -r '.mcpServers | keys[]' "$ACTIVE_CONFIG" | while read -r mcp; do
            echo "  • $mcp"
        done
        echo ""
    fi
fi

print_info "To verify: Ask Claude 'What MCPs are currently loaded?'"
echo ""
