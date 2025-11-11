#!/bin/bash

###############################################################################
# Arc Decision MCP Server - Automated Installation Script
# Version: 1.0.0
#
# This script automates the installation of the arc-decision MCP
# server template into a workspace with proper folder structure.
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
TEMPLATE_NAME="arc-decision-mcp-server-template"
INSTANCE_NAME="arc-decision-mcp-server"
MCP_SERVER_NAME="arc-decision"

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

# If no git root found, use 3 levels up from script (we're in templates/.../template/)
if [ ! -d "$WORKSPACE_ROOT/.git" ]; then
    WORKSPACE_ROOT="$(dirname "$(dirname "$(dirname "$SCRIPT_DIR")")")"
    print_warning "No git root found, using: $WORKSPACE_ROOT"
fi

print_success "Workspace root: $WORKSPACE_ROOT"

###############################################################################
# Step 2: Verify Template Location
###############################################################################

print_header "Step 2: Verifying Template Location"

TEMPLATES_DIR="$WORKSPACE_ROOT/templates-and-patterns/mcp-server-templates/templates"

if [ -d "$TEMPLATES_DIR" ]; then
    print_success "Templates directory exists: $TEMPLATES_DIR"
else
    print_warning "Templates directory doesn't exist, creating it..."
    mkdir -p "$TEMPLATES_DIR"
    print_success "Created: $TEMPLATES_DIR"
fi

TEMPLATE_STORAGE="$TEMPLATES_DIR/$TEMPLATE_NAME"

# Check if we're already in the templates folder
if [ "$SCRIPT_DIR" = "$TEMPLATE_STORAGE" ]; then
    print_success "Template already in correct location"
else
    print_warning "Template not in expected location"
    print_info "Expected: $TEMPLATE_STORAGE"
    print_info "Actual: $SCRIPT_DIR"

    if [ -d "$TEMPLATE_STORAGE" ]; then
        print_info "Template already exists at target location, using it"
    else
        print_info "Copying current template to correct location..."
        cp -r "$SCRIPT_DIR" "$TEMPLATE_STORAGE"
        print_success "Template stored at: $TEMPLATE_STORAGE"
    fi
fi

###############################################################################
# Step 3: Create Local Instances Directory
###############################################################################

print_header "Step 3: Creating Local Instances Directory"

LOCAL_INSTANCES_DIR="$WORKSPACE_ROOT/local-instances/mcp-servers"

if [ -d "$LOCAL_INSTANCES_DIR" ]; then
    print_success "Local instances directory exists: $LOCAL_INSTANCES_DIR"
else
    print_info "Creating local instances directory..."
    mkdir -p "$LOCAL_INSTANCES_DIR"
    print_success "Created: $LOCAL_INSTANCES_DIR"
fi

###############################################################################
# Step 4: Copy Template to Working Instance
###############################################################################

print_header "Step 4: Creating Working Instance"

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
# Use template from correct location
if [ -d "$TEMPLATE_STORAGE" ]; then
    cp -r "$TEMPLATE_STORAGE" "$INSTANCE_DIR"
else
    cp -r "$SCRIPT_DIR" "$INSTANCE_DIR"
fi

# Remove AI-specific files from instance
rm -f "$INSTANCE_DIR/INSTALL-INSTRUCTIONS.md"
rm -f "$INSTANCE_DIR/TEMPLATE-INFO.json"
rm -f "$INSTANCE_DIR/install.sh"
rm -f "$INSTANCE_DIR/configure-mcp.sh"

# Remove build artifacts if they exist
rm -rf "$INSTANCE_DIR/node_modules"
rm -rf "$INSTANCE_DIR/dist"

print_success "Working instance created at: $INSTANCE_DIR"

###############################################################################
# Step 5: Install Dependencies
###############################################################################

print_header "Step 5: Installing Dependencies"

cd "$INSTANCE_DIR"

print_info "Running npm install..."
if npm install; then
    print_success "Dependencies installed successfully"
else
    print_error "npm install failed"
    exit 1
fi

###############################################################################
# Step 6: Build TypeScript
###############################################################################

print_header "Step 6: Building TypeScript"

print_info "Running npm run build..."
if npm run build; then
    print_success "TypeScript compiled successfully"
else
    print_error "Build failed"
    exit 1
fi

# Verify build output
if [ -f "$INSTANCE_DIR/dist/server.js" ]; then
    print_success "Server built: dist/server.js"
else
    print_error "Build output not found: dist/server.js"
    exit 1
fi

###############################################################################
# Step 6.5: Create Configuration Directory
###############################################################################

print_header "Step 6.5: Creating Configuration Directory"

CONFIG_DIR="$WORKSPACE_ROOT/configuration/arc-decision"

if [ -d "$CONFIG_DIR" ]; then
    print_success "Configuration directory exists: $CONFIG_DIR"
else
    print_info "Creating configuration directory..."
    mkdir -p "$CONFIG_DIR"
    print_success "Created: $CONFIG_DIR"
fi

print_info "Configuration files (if needed) should be stored in: $CONFIG_DIR"

###############################################################################
# Step 6.6: Post-Build Setup (Agent Installation)
###############################################################################

print_header "Step 6.6: Installing Agent"

print_info "Running npm run setup..."
if npm run setup; then
    print_success "Agent installed successfully"
else
    print_warning "Agent setup had warnings (this is usually OK)"
fi

###############################################################################
# Step 7: Configure MCP (Optional)
###############################################################################

if [ "$SKIP_MCP_CONFIG" = false ]; then
    print_header "Step 7: Configuring MCP"

    # Use configure-mcp.sh from template storage
    CONFIGURE_SCRIPT="$TEMPLATE_STORAGE/configure-mcp.sh"

    if [ -f "$CONFIGURE_SCRIPT" ]; then
        print_info "Running MCP configuration script..."
        bash "$CONFIGURE_SCRIPT" "$INSTANCE_DIR" "$WORKSPACE_ROOT"
    else
        print_warning "configure-mcp.sh not found, skipping MCP configuration"
        print_info "You can manually add this to your .mcp.json:"
        echo ""
        echo "{"
        echo "  \"mcpServers\": {"
        echo "    \"$MCP_SERVER_NAME\": {"
        echo "      \"command\": \"node\","
        echo "      \"args\": ["
        echo "        \"$INSTANCE_DIR/dist/server.js\""
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
echo -e "${GREEN}✓ Server ready at:${NC}"
echo -e "  $INSTANCE_DIR/dist/server.js"
echo ""

print_header "Next Steps"

echo "1. Restart Claude Code to load the new MCP server"
echo ""
echo "2. Verify MCP server is loaded:"
echo "   Ask Claude: 'Do you have access to the analyze_requirements tool?'"
echo ""
echo "3. Use the Arc Decision Assistant:"
echo "   Type 'arc decision' to start the interactive decision helper"
echo ""
echo "4. Read documentation:"
echo "   $TEMPLATE_STORAGE/README.md"
echo "   $TEMPLATE_STORAGE/USER_GUIDE.md"
echo ""

print_success "Installation completed successfully!"
