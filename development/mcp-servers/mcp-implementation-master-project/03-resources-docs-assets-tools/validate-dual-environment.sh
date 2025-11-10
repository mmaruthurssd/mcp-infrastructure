#!/bin/bash
# validate-dual-environment.sh - Validate MCP follows dual-environment pattern
#
# Usage: ./validate-dual-environment.sh <mcp-name>
#
# Purpose: Ensure MCP has proper staging project before production deployment
# Part of: Dual-Environment Retrofit Plan (Phase 1)
# Created: 2025-10-29

set -e  # Exit on error

# Color codes for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Check arguments
if [ $# -eq 0 ]; then
  echo -e "${RED}❌ ERROR: MCP name required${NC}"
  echo ""
  echo "Usage: $0 <mcp-name>"
  echo ""
  echo "Examples:"
  echo "  $0 security-compliance-mcp"
  echo "  $0 testing-validation-mcp"
  echo "  $0 project-management-mcp-server"
  exit 1
fi

MCP_NAME=$1
WORKSPACE_ROOT="/Users/mmaruthurnew/Desktop/operations-workspace"
STAGING_PROJECT="${WORKSPACE_ROOT}/mcp-server-development/${MCP_NAME}-project"
DEV_INSTANCE="${STAGING_PROJECT}/04-product-under-development/dev-instance"
PRODUCTION_PATH="${WORKSPACE_ROOT}/local-instances/mcp-servers/${MCP_NAME}"

echo ""
echo "========================================================================"
echo "  DUAL-ENVIRONMENT VALIDATION"
echo "========================================================================"
echo ""
echo "MCP Name: ${MCP_NAME}"
echo "Workspace: ${WORKSPACE_ROOT}"
echo ""

# Track validation status
ALL_CHECKS_PASSED=true

# Check 1: Staging project exists
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "CHECK 1: Staging Project Exists"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
if [ ! -d "$STAGING_PROJECT" ]; then
  echo -e "${RED}❌ FAILED: No staging project for ${MCP_NAME}${NC}"
  echo ""
  echo "   Required: ${STAGING_PROJECT}"
  echo ""
  echo "   Action needed:"
  echo "   1. Create staging project using _mcp-project-template"
  echo "   2. Copy production code to dev-instance/"
  echo "   3. Build and test in staging before production deployment"
  echo ""
  ALL_CHECKS_PASSED=false
else
  echo -e "${GREEN}✅ PASSED: Staging project exists${NC}"
  echo "   Location: ${STAGING_PROJECT}"
  echo ""
fi

# Check 2: dev-instance exists
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "CHECK 2: dev-instance Folder Exists"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
if [ ! -d "$DEV_INSTANCE" ]; then
  echo -e "${RED}❌ FAILED: No dev-instance for ${MCP_NAME}${NC}"
  echo ""
  echo "   Required: ${DEV_INSTANCE}"
  echo ""
  echo "   Action needed:"
  echo "   1. Create 04-product-under-development/dev-instance/ folder"
  echo "   2. Copy MCP code to dev-instance/"
  echo "   3. Build in staging, NOT production"
  echo ""
  ALL_CHECKS_PASSED=false
else
  echo -e "${GREEN}✅ PASSED: dev-instance exists${NC}"
  echo "   Location: ${DEV_INSTANCE}"
  echo ""
fi

# Check 3: dev-instance has built code
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "CHECK 3: Code Built in dev-instance"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
if [ -d "$DEV_INSTANCE" ]; then
  if [ ! -d "$DEV_INSTANCE/dist" ] && [ ! -d "$DEV_INSTANCE/build" ]; then
    echo -e "${YELLOW}⚠️  WARNING: dev-instance not built for ${MCP_NAME}${NC}"
    echo ""
    echo "   Expected: ${DEV_INSTANCE}/dist/ or ${DEV_INSTANCE}/build/"
    echo ""
    echo "   Action needed:"
    echo "   cd ${DEV_INSTANCE}"
    echo "   npm install"
    echo "   npm run build"
    echo ""
    ALL_CHECKS_PASSED=false
  else
    echo -e "${GREEN}✅ PASSED: Built code exists${NC}"
    if [ -d "$DEV_INSTANCE/dist" ]; then
      echo "   Build folder: dist/"
    else
      echo "   Build folder: build/"
    fi
    echo ""
  fi
else
  echo -e "${YELLOW}⚠️  SKIPPED: dev-instance doesn't exist${NC}"
  echo ""
fi

# Check 4: package.json exists
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "CHECK 4: package.json Exists"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
if [ -d "$DEV_INSTANCE" ]; then
  if [ ! -f "$DEV_INSTANCE/package.json" ]; then
    echo -e "${RED}❌ FAILED: No package.json in dev-instance${NC}"
    echo ""
    echo "   Required: ${DEV_INSTANCE}/package.json"
    echo ""
    ALL_CHECKS_PASSED=false
  else
    echo -e "${GREEN}✅ PASSED: package.json exists${NC}"
    echo ""
  fi
else
  echo -e "${YELLOW}⚠️  SKIPPED: dev-instance doesn't exist${NC}"
  echo ""
fi

# Check 5: Production path exists (optional, informational)
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "CHECK 5: Production Path (Informational)"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
if [ -d "$PRODUCTION_PATH" ]; then
  echo -e "${GREEN}ℹ️  INFO: Production deployment exists${NC}"
  echo "   Location: ${PRODUCTION_PATH}"
  echo ""
else
  echo -e "${YELLOW}ℹ️  INFO: No production deployment yet${NC}"
  echo "   Will deploy to: ${PRODUCTION_PATH}"
  echo ""
fi

# Check 6: Standard project files exist
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "CHECK 6: Standard Project Files"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
if [ -d "$STAGING_PROJECT" ]; then
  # Check for README.md
  if [ -f "$STAGING_PROJECT/README.md" ]; then
    echo -e "${GREEN}✅ README.md exists${NC}"
  else
    echo -e "${YELLOW}⚠️  WARNING: Missing README.md${NC}"
  fi

  # Check for EVENT-LOG.md
  if [ -f "$STAGING_PROJECT/EVENT-LOG.md" ]; then
    echo -e "${GREEN}✅ EVENT-LOG.md exists${NC}"
  else
    echo -e "${YELLOW}⚠️  WARNING: Missing EVENT-LOG.md${NC}"
  fi

  # Check for NEXT-STEPS.md
  if [ -f "$STAGING_PROJECT/NEXT-STEPS.md" ]; then
    echo -e "${GREEN}✅ NEXT-STEPS.md exists${NC}"
  else
    echo -e "${YELLOW}⚠️  WARNING: Missing NEXT-STEPS.md${NC}"
  fi

  # Check for 8-folder structure
  echo ""
  echo "8-Folder Structure:"
  for folder in "01-planning" "02-goals-and-roadmap" "03-resources-docs-assets-tools" "04-product-under-development" "05-brainstorming" "06-testing" "07-temp" "08-archive"; do
    if [ -d "$STAGING_PROJECT/$folder" ]; then
      echo -e "  ${GREEN}✅ $folder/${NC}"
    else
      echo -e "  ${YELLOW}⚠️  Missing: $folder/${NC}"
    fi
  done
  echo ""
else
  echo -e "${YELLOW}⚠️  SKIPPED: Staging project doesn't exist${NC}"
  echo ""
fi

# Final summary
echo "========================================================================"
echo "  VALIDATION SUMMARY"
echo "========================================================================"
echo ""
if [ "$ALL_CHECKS_PASSED" = true ]; then
  echo -e "${GREEN}✅ VALIDATION PASSED${NC}"
  echo ""
  echo "Staging project complies with dual-environment pattern."
  echo "Ready for production deployment."
  echo ""
  echo "Next steps:"
  echo "  1. Run integration tests in staging"
  echo "  2. Complete ROLLOUT-CHECKLIST.md"
  echo "  3. Deploy to production: ${PRODUCTION_PATH}"
  echo ""
  exit 0
else
  echo -e "${RED}❌ VALIDATION FAILED${NC}"
  echo ""
  echo "Staging project does NOT comply with dual-environment pattern."
  echo "Fix the issues above before deploying to production."
  echo ""
  echo "DO NOT:"
  echo "  - Build directly in production"
  echo "  - Skip staging environment"
  echo "  - Deploy without validation"
  echo ""
  exit 1
fi
