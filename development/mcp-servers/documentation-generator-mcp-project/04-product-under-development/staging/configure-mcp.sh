#!/bin/bash
set -e
MCP_SERVER_NAME="documentation-generator-mcp"
INSTANCE_PATH="${1:-$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)}"
SERVER_JS="$INSTANCE_PATH/dist/server.js"
[ ! -f "$SERVER_JS" ] && echo "Not found: $SERVER_JS" && exit 1
MCP_CONFIG="$HOME/.claude.json"
[ -f "$MCP_CONFIG" ] && cp "$MCP_CONFIG" "${MCP_CONFIG}.backup.$(date +%Y%m%d_%H%M%S)"
EXISTING=$([ -f "$MCP_CONFIG" ] && cat "$MCP_CONFIG" || echo "{}")
UPDATED=$(node -e "const e=JSON.parse(process.argv[1]);const n={command:'node',args:['$SERVER_JS']};if(!e.mcpServers)e.mcpServers={};e.mcpServers['$MCP_SERVER_NAME']=n;console.log(JSON.stringify(e,null,2));" "$EXISTING")
echo "$UPDATED" > "$MCP_CONFIG"
echo "✓ MCP configured. Restart Claude Code."
