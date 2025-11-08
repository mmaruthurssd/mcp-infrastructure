#!/usr/bin/env bash

# Git Assistant MCP Server - Automated Instance Setup
# This script creates a new instance of the git-assistant MCP server in your project

set -e

echo "========================================="
echo "Git Assistant MCP Server Setup"
echo "========================================="
echo ""

# Get the directory where this script is located (the template directory)
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
TEMPLATE_DIR="$SCRIPT_DIR"

# Determine target project directory
if [ -z "$1" ]; then
    # If no argument provided, use current directory
    TARGET_PROJECT="$(pwd)"
    echo "No target directory specified. Using current directory:"
    echo "  $TARGET_PROJECT"
    echo ""
    read -p "Is this correct? (y/n) " -n 1 -r
    echo ""
    if [[ ! $REPLY =~ ^[Yy]$ ]]; then
        echo "Setup cancelled."
        exit 1
    fi
else
    TARGET_PROJECT="$(cd "$1" && pwd)"
fi

# Create target directory for the MCP server instance
TARGET_DIR="$TARGET_PROJECT/mcp-servers/git-assistant"
echo "Installing to: $TARGET_DIR"
echo ""

# Check if target already exists
if [ -d "$TARGET_DIR" ]; then
    echo "❌ Error: Target directory already exists: $TARGET_DIR"
    echo "Please remove it first or choose a different location."
    exit 1
fi

# Check if target is a git repository
if [ ! -d "$TARGET_PROJECT/.git" ]; then
    echo "⚠️  Warning: Target directory is not a git repository."
    echo "   Git Assistant works best in git repositories."
    echo ""
    read -p "Continue anyway? (y/n) " -n 1 -r
    echo ""
    if [[ ! $REPLY =~ ^[Yy]$ ]]; then
        echo "Setup cancelled."
        exit 1
    fi
fi

# Create target directory
echo "📁 Creating directory structure..."
mkdir -p "$TARGET_DIR"

# Copy template files (excluding node_modules, dist, and template-specific files)
echo "📋 Copying template files..."
rsync -av \
    --exclude='node_modules' \
    --exclude='dist' \
    --exclude='.DS_Store' \
    --exclude='setup-instance.sh' \
    --exclude='agent' \
    --exclude='INSTALLATION_LOG.md' \
    --exclude='PLAN.md' \
    "$TEMPLATE_DIR/" "$TARGET_DIR/"

# Install dependencies
echo ""
echo "📦 Installing dependencies..."
cd "$TARGET_DIR"
npm install

# Build the project
echo ""
echo "🔨 Building project..."
npm run build

# Get absolute path for MCP configuration
ABS_TARGET_DIR="$(cd "$TARGET_DIR" && pwd)"
SERVER_JS_PATH="$ABS_TARGET_DIR/dist/server.js"

echo ""
echo "========================================="
echo "✅ Installation Complete!"
echo "========================================="
echo ""
echo "MCP Server installed to:"
echo "  $TARGET_DIR"
echo ""
echo "Next steps:"
echo ""
echo "1. Add this server to your Claude Code MCP configuration:"
echo "   ~/.config/claude-code/mcp.json"
echo ""
echo "2. Add the following configuration:"
echo ""
cat <<EOF
{
  "mcpServers": {
    "git-assistant": {
      "command": "node",
      "args": [
        "$SERVER_JS_PATH"
      ],
      "env": {
        "GIT_ASSISTANT_REPO_PATH": "$TARGET_PROJECT",
        "GIT_ASSISTANT_DEBUG": "false"
      }
    }
  }
}
EOF
echo ""
echo "3. Restart Claude Code to load the new MCP server"
echo ""
echo "4. The server will create a .git-assistant-patterns.json file"
echo "   in your project root to store learned patterns"
echo ""

# Offer to automatically update MCP configuration
echo "========================================="
read -p "Would you like to automatically update your MCP configuration? (y/n) " -n 1 -r
echo ""
if [[ $REPLY =~ ^[Yy]$ ]]; then
    MCP_CONFIG="$HOME/.config/claude-code/mcp.json"

    # Check if mcp.json exists
    if [ ! -f "$MCP_CONFIG" ]; then
        echo "Creating new MCP configuration file..."
        mkdir -p "$HOME/.config/claude-code"
        cat > "$MCP_CONFIG" <<EOF
{
  "mcpServers": {
    "git-assistant": {
      "command": "node",
      "args": [
        "$SERVER_JS_PATH"
      ],
      "env": {
        "GIT_ASSISTANT_REPO_PATH": "$TARGET_PROJECT",
        "GIT_ASSISTANT_DEBUG": "false"
      }
    }
  }
}
EOF
        echo "✅ MCP configuration created!"
    else
        echo "⚠️  MCP configuration already exists. Please manually merge the configuration above."
        echo "   Existing config: $MCP_CONFIG"
    fi
fi

echo ""
echo "🎉 Setup complete! Restart Claude Code to use the Git Assistant MCP server."
echo ""
echo "Git Assistant Features:"
echo "  - Check commit readiness"
echo "  - Suggest commit messages based on actual changes"
echo "  - Analyze commit history and patterns"
echo "  - Learn from your preferences over time"
echo ""
