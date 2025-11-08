#!/bin/bash
set -e
SKIP_MCP_CONFIG=false
TEMPLATE_NAME="documentation-generator-mcp-server-template"
INSTANCE_NAME="documentation-generator-mcp-server"
MCP_SERVER_NAME="documentation-generator-mcp"
while [[ "$#" -gt 0 ]]; do case $1 in --skip-mcp-config) SKIP_MCP_CONFIG=true ;; esac; shift; done
SCRIPT_DIR="$( cd "$( dirname "${BASH_SOURCE[0]}" )" && pwd )"
WORKSPACE_ROOT="$SCRIPT_DIR"
for i in {1..5}; do if [ -d "$WORKSPACE_ROOT/.git" ]; then break; fi; WORKSPACE_ROOT="$(dirname "$WORKSPACE_ROOT")"; done
TEMPLATES_DIR="$WORKSPACE_ROOT/templates-and-patterns/mcp-server-templates/templates"
mkdir -p "$TEMPLATES_DIR"
TEMPLATE_STORAGE="$TEMPLATES_DIR/$TEMPLATE_NAME"
[ "$SCRIPT_DIR" != "$TEMPLATE_STORAGE" ] && [ ! -d "$TEMPLATE_STORAGE" ] && cp -r "$SCRIPT_DIR" "$TEMPLATE_STORAGE"
INSTANCE_DIR="$WORKSPACE_ROOT/local-instances/mcp-servers/$INSTANCE_NAME"
mkdir -p "$(dirname "$INSTANCE_DIR")"
[ -d "$INSTANCE_DIR" ] && rm -rf "$INSTANCE_DIR"
cp -r "$TEMPLATE_STORAGE" "$INSTANCE_DIR"
rm -f "$INSTANCE_DIR"/{INSTALL-INSTRUCTIONS.md,TEMPLATE-INFO.json,install.sh,configure-mcp.sh}
rm -rf "$INSTANCE_DIR"/{node_modules,dist,build}
cd "$INSTANCE_DIR" && npm install && npm run build
[ "$SKIP_MCP_CONFIG" = false ] && [ -f "$TEMPLATE_STORAGE/configure-mcp.sh" ] && bash "$TEMPLATE_STORAGE/configure-mcp.sh" "$INSTANCE_DIR"
echo "✓ Installation complete: $INSTANCE_DIR"
