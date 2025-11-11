#!/bin/bash

###############################################################################
# Communications MCP Server - Automated Installation Script
# Version: 1.0.0
#
# This script automates the installation of the communications MCP server template
# into a workspace with proper folder structure.
#
# Usage:
#   ./install.sh [--skip-mcp-config]
#
# Options:
#   --skip-mcp-config   Skip automatic MCP configuration (manual setup)
#
###############################################################################

set -e  # Exit on any error

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Configuration
SKIP_MCP_CONFIG=false
TEMPLATE_NAME="communications-mcp-server-template"
INSTANCE_NAME="communications-mcp-server"
MCP_SERVER_NAME="communications"

# Parse arguments
while [[ "$#" -gt 0 ]]; do
    case $1 in
        --skip-mcp-config) SKIP_MCP_CONFIG=true ;;
        *) echo "Unknown parameter: $1"; exit 1 ;;
    esac
    shift
done

###############################################################################
# Functions
###############################################################################

print_header() {
    echo -e "\n${BLUE}========================================${NC}"
    echo -e "${BLUE}$1${NC}"
    echo -e "${BLUE}========================================${NC}\n"
}

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
# Step 1: Detect Workspace Root
###############################################################################

print_header "Step 1: Detecting Workspace Root"

# Get the directory where this script is located
SCRIPT_DIR="$( cd "$( dirname "${BASH_SOURCE[0]}" )" && pwd )"
print_info "Script location: $SCRIPT_DIR"

# Find workspace root (look for .git or go up to reasonable parent)
WORKSPACE_ROOT="$SCRIPT_DIR"
for i in {1..5}; do
    if [ -d "$WORKSPACE_ROOT/.git" ]; then
        print_success "Found git repository root: $WORKSPACE_ROOT"
        break
    fi
    WORKSPACE_ROOT="$(dirname "$WORKSPACE_ROOT")"
done

# If no git root found, use 2 levels up from script
if [ ! -d "$WORKSPACE_ROOT/.git" ]; then
    WORKSPACE_ROOT="$(dirname "$(dirname "$SCRIPT_DIR")")"
    print_warning "No git root found, using: $WORKSPACE_ROOT"
fi

print_success "Workspace root: $WORKSPACE_ROOT"

###############################################################################
# Step 2: Create Template Storage Directory
###############################################################################

print_header "Step 2: Creating Template Storage Directory"

TEMPLATES_DIR="$WORKSPACE_ROOT/templates-and-patterns/mcp-server-templates/templates"

if [ -d "$TEMPLATES_DIR" ]; then
    print_success "Templates directory already exists: $TEMPLATES_DIR"
else
    print_info "Creating templates directory..."
    mkdir -p "$TEMPLATES_DIR"
    print_success "Created: $TEMPLATES_DIR"
fi

###############################################################################
# Step 3: Copy Template to Storage (if not already there)
###############################################################################

print_header "Step 3: Storing Template"

TEMPLATE_STORAGE="$TEMPLATES_DIR/$TEMPLATE_NAME"

# Check if we're already in the templates folder
if [ "$SCRIPT_DIR" = "$TEMPLATE_STORAGE" ]; then
    print_success "Template already in correct location"
else
    if [ -d "$TEMPLATE_STORAGE" ]; then
        print_warning "Template already exists at: $TEMPLATE_STORAGE"
        read -p "Overwrite existing template? (y/n): " -n 1 -r
        echo
        if [[ ! $REPLY =~ ^[Yy]$ ]]; then
            print_info "Skipping template copy"
        else
            print_info "Updating template..."
            rm -rf "$TEMPLATE_STORAGE"
            cp -r "$SCRIPT_DIR" "$TEMPLATE_STORAGE"
            print_success "Template updated at: $TEMPLATE_STORAGE"
        fi
    else
        print_info "Copying template to storage..."
        cp -r "$SCRIPT_DIR" "$TEMPLATE_STORAGE"
        print_success "Template stored at: $TEMPLATE_STORAGE"
    fi
fi

###############################################################################
# Step 4: Create Local Instances Directory
###############################################################################

print_header "Step 4: Creating Local Instances Directory"

LOCAL_INSTANCES_DIR="$WORKSPACE_ROOT/local-instances/mcp-servers"

if [ -d "$LOCAL_INSTANCES_DIR" ]; then
    print_success "Local instances directory exists: $LOCAL_INSTANCES_DIR"
else
    print_info "Creating local instances directory..."
    mkdir -p "$LOCAL_INSTANCES_DIR"
    print_success "Created: $LOCAL_INSTANCES_DIR"
fi

###############################################################################
# Step 5: Copy Template to Working Instance
###############################################################################

print_header "Step 5: Creating Working Instance"

INSTANCE_DIR="$LOCAL_INSTANCES_DIR/$INSTANCE_NAME"

if [ -d "$INSTANCE_DIR" ]; then
    print_warning "Instance already exists at: $INSTANCE_DIR"
    read -p "Reinstall (will delete existing instance)? (y/n): " -n 1 -r
    echo
    if [[ ! $REPLY =~ ^[Yy]$ ]]; then
        print_error "Installation cancelled"
        exit 1
    fi
    print_info "Removing existing instance..."
    rm -rf "$INSTANCE_DIR"
fi

print_info "Copying template to local instance..."
cp -r "$TEMPLATE_STORAGE" "$INSTANCE_DIR"

# Remove AI-specific files from instance
rm -f "$INSTANCE_DIR/INSTALL-INSTRUCTIONS.md"
rm -f "$INSTANCE_DIR/TEMPLATE-INFO.json"

# Remove build artifacts if they exist
rm -rf "$INSTANCE_DIR/node_modules"
rm -rf "$INSTANCE_DIR/dist"
rm -f "$INSTANCE_DIR/staging-db.json"

print_success "Working instance created at: $INSTANCE_DIR"

###############################################################################
# Step 6: Install Dependencies
###############################################################################

print_header "Step 6: Installing Dependencies"

cd "$INSTANCE_DIR"

print_info "Running npm install..."
if npm install; then
    print_success "Dependencies installed successfully"
else
    print_error "npm install failed"
    exit 1
fi

###############################################################################
# Step 7: Build TypeScript
###############################################################################

print_header "Step 7: Building TypeScript"

print_info "Running npm run build..."
if npm run build; then
    print_success "TypeScript compiled successfully"
else
    print_error "Build failed"
    exit 1
fi

# Verify build output
if [ -f "$INSTANCE_DIR/dist/server.js" ]; then
    print_success "MCP server built: dist/server.js"
else
    print_error "Build output not found: dist/server.js"
    exit 1
fi

if [ -f "$INSTANCE_DIR/dist/review-server.js" ]; then
    print_success "Review server built: dist/review-server.js"
else
    print_warning "Review server not found: dist/review-server.js"
fi

###############################################################################
# Step 8: Configure MCP (Optional)
###############################################################################

if [ "$SKIP_MCP_CONFIG" = false ]; then
    print_header "Step 8: Configuring MCP"

    if [ -f "$INSTANCE_DIR/configure-mcp.sh" ]; then
        print_info "Running MCP configuration script..."
        bash "$INSTANCE_DIR/configure-mcp.sh" "$INSTANCE_DIR"
    else
        print_warning "configure-mcp.sh not found, skipping automatic MCP configuration"
        print_info "You can manually add this to your .mcp.json:"
        echo ""
        echo "{"
        echo "  \"mcpServers\": {"
        echo "    \"$MCP_SERVER_NAME\": {"
        echo "      \"command\": \"node\","
        echo "      \"args\": ["
        echo "        \"\${workspaceFolder}/local-instances/mcp-servers/$INSTANCE_NAME/dist/server.js\""
        echo "      ]"
        echo "    }"
        echo "  }"
        echo "}"
        echo ""
    fi
else
    print_warning "Skipping MCP configuration (--skip-mcp-config)"
fi

###############################################################################
# Installation Complete
###############################################################################

print_header "Installation Complete!"

echo -e "${GREEN}✓ Template stored at:${NC}"
echo -e "  $TEMPLATE_STORAGE"
echo ""
echo -e "${GREEN}✓ Working instance at:${NC}"
echo -e "  $INSTANCE_DIR"
echo ""
echo -e "${GREEN}✓ MCP server ready at:${NC}"
echo -e "  $INSTANCE_DIR/dist/server.js"
echo ""
echo -e "${GREEN}✓ Review server ready at:${NC}"
echo -e "  $INSTANCE_DIR/dist/review-server.js"
echo ""

print_header "Next Steps"

echo "1. Restart Claude Code to load the new MCP server"
echo ""
echo "2. Choose your communication method:"
echo "   • Google Chat Webhook (easiest - no setup)"
echo "   • SMTP Email (see SETUP.md for credentials)"
echo "   • Gmail/Chat API (see SETUP.md for OAuth)"
echo ""
echo "3. Optional: Start review server for staging workflow"
echo "   cd $INSTANCE_DIR"
echo "   npm run review-server"
echo "   Open: http://localhost:3001/review"
echo ""
echo "4. Test the server:"
echo "   Ask Claude: 'Send \"Hello\" to Google Chat webhook [URL]'"
echo ""
echo "5. Read documentation:"
echo "   • README: $INSTANCE_DIR/README.md"
echo "   • Setup: $INSTANCE_DIR/SETUP.md"
echo "   • Staging: $INSTANCE_DIR/STAGING_WORKFLOW.md"
echo ""

print_success "Installation completed successfully!"
