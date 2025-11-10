#!/bin/bash

# MCP Server Configuration Validator
# Checks all MCP servers for proper configuration

WORKSPACE_ROOT="/Users/mmaruthurnew/Desktop/medical-practice-workspace"
MCP_JSON="$WORKSPACE_ROOT/.mcp.json"
SERVERS_DIR="$WORKSPACE_ROOT/local-instances/mcp-servers"
CONFIG_DIR="$WORKSPACE_ROOT/configuration"

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Counters
TOTAL=0
PASSED=0
WARNINGS=0
FAILED=0

echo "=================================="
echo "  MCP Server Configuration Check"
echo "=================================="
echo ""

check_server() {
  local server=$1
  local needs_config=$2
  local env_vars=$3
  local server_dir="$SERVERS_DIR/${server}-mcp-server"
  local has_issues=0
  local has_warnings=0

  TOTAL=$((TOTAL + 1))

  echo -e "${BLUE}Checking: ${server}${NC}"

  # Check 1: Server directory exists
  if [ ! -d "$server_dir" ]; then
    echo -e "  ${RED}❌ Server directory not found${NC}"
    has_issues=1
  else
    echo "  ✅ Server directory exists"
  fi

  # Check 2: Built (dist/server.js exists)
  if [ ! -f "$server_dir/dist/server.js" ]; then
    echo -e "  ${RED}❌ Server not built (missing dist/server.js)${NC}"
    has_issues=1
  else
    echo "  ✅ Server is built"
  fi

  # Check 3: In .mcp.json
  if ! grep -q "\"${server}\"" "$MCP_JSON" 2>/dev/null; then
    echo -e "  ${RED}❌ Not configured in .mcp.json${NC}"
    has_issues=1
  else
    echo "  ✅ Configured in .mcp.json"

    # Check 3a: Uses portable paths
    server_section=$(grep -A 10 "\"${server}\"" "$MCP_JSON" 2>/dev/null)
    if echo "$server_section" | grep -q "/Users/mmaruthurnew" ; then
      echo -e "  ${YELLOW}⚠️  Uses hardcoded path (should use \${workspaceFolder})${NC}"
      has_warnings=1
    fi

    # Check 3b: Has required env vars
    if [ -n "$env_vars" ]; then
      IFS=',' read -ra VARS <<< "$env_vars"
      for var in "${VARS[@]}"; do
        if ! echo "$server_section" | grep -q "\"$var\"" 2>/dev/null; then
          echo -e "  ${YELLOW}⚠️  Missing environment variable: $var${NC}"
          has_warnings=1
        fi
      done
    fi
  fi

  # Check 4: Configuration directory exists (if needed)
  if [ -n "$needs_config" ]; then
    local config_subdir="$CONFIG_DIR/$needs_config"
    if [ ! -d "$config_subdir" ]; then
      echo -e "  ${YELLOW}⚠️  Configuration directory not found: $needs_config${NC}"
      has_warnings=1
    else
      echo "  ✅ Configuration directory exists"
    fi
  fi

  # Check 5: package.json exists
  if [ ! -f "$server_dir/package.json" ]; then
    echo -e "  ${YELLOW}⚠️  Missing package.json${NC}"
    has_warnings=1
  fi

  # Update counters
  if [ $has_issues -eq 1 ]; then
    FAILED=$((FAILED + 1))
    echo -e "${RED}Status: FAILED${NC}"
  elif [ $has_warnings -eq 1 ]; then
    WARNINGS=$((WARNINGS + 1))
    echo -e "${YELLOW}Status: WARNINGS${NC}"
  else
    PASSED=$((PASSED + 1))
    echo -e "${GREEN}Status: PASS${NC}"
  fi

  echo ""
}

# Check each server
# Format: check_server "name" "config-dir-name" "ENV_VAR1,ENV_VAR2"

check_server "ai-planning" "" ""
check_server "arc-decision" "arc-decision" "ARC_DECISION_PROJECT_ROOT,ARC_DECISION_CONFIG_DIR"
check_server "communications" "communications" ""
check_server "git-assistant" "git-assistant" "GIT_ASSISTANT_REPO_PATH,GIT_ASSISTANT_CONFIG_DIR"
check_server "learning-optimizer" "learning-optimizer" "LEARNING_OPTIMIZER_PROJECT_ROOT,LEARNING_OPTIMIZER_CONFIG_DIR"
check_server "project-index-generator" "project-index-generator" "PROJECT_INDEX_GENERATOR_PROJECT_ROOT,PROJECT_INDEX_GENERATOR_CONFIG_DIR"
check_server "smart-file-organizer" "smart-file-organizer" "SMART_FILE_ORGANIZER_PROJECT_ROOT,SMART_FILE_ORGANIZER_CONFIG_DIR"
check_server "spec-driven" "spec-driven" "SPEC_DRIVEN_CONFIG_DIR"
check_server "task-executor" "" ""

# Summary
echo "=================================="
echo "           SUMMARY"
echo "=================================="
echo "Total servers: $TOTAL"
echo -e "${GREEN}Passed: $PASSED${NC}"
echo -e "${YELLOW}Warnings: $WARNINGS${NC}"
echo -e "${RED}Failed: $FAILED${NC}"
echo ""

# Overall status
if [ $FAILED -gt 0 ]; then
  echo -e "${RED}❌ Configuration has critical issues${NC}"
  exit 1
elif [ $WARNINGS -gt 0 ]; then
  echo -e "${YELLOW}⚠️  Configuration has warnings (but usable)${NC}"
  exit 0
else
  echo -e "${GREEN}✅ All servers properly configured${NC}"
  exit 0
fi
