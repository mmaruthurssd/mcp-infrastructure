#!/bin/bash
# batch-retrofit-staging.sh - Batch retrofit remaining MCPs to staging pattern
#
# Purpose: Automate retrofit of stable MCPs (no workflow-orchestrator dependency)
# Created: 2025-10-29

set -e  # Exit on error

WORKSPACE_ROOT="/Users/mmaruthurnew/Desktop/operations-workspace"
TEMPLATE_DIR="${WORKSPACE_ROOT}/mcp-server-development/_mcp-project-template"
STAGING_BASE="${WORKSPACE_ROOT}/mcp-server-development"
PRODUCTION_BASE="${WORKSPACE_ROOT}/local-instances/mcp-servers"

# MCPs to retrofit (no workflow-orchestrator dependency)
MCPS=(
  "git-assistant-mcp-server"
  "smart-file-organizer-mcp-server"
  "mcp-config-manager"
  "communications-mcp-server"
  "learning-optimizer-mcp-server"
  "arc-decision-mcp-server"
  "project-index-generator-mcp-server"
)

echo ""
echo "========================================================================"
echo "  BATCH RETROFIT TO STAGING PATTERN"
echo "========================================================================"
echo ""
echo "MCPs to retrofit: ${#MCPS[@]}"
echo ""

SUCCESS_COUNT=0
FAIL_COUNT=0
FAILED_MCPS=()

for MCP in "${MCPS[@]}"; do
  echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
  echo "Retrofitting: $MCP"
  echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"

  STAGING_PROJECT="${STAGING_BASE}/${MCP}-project"
  PRODUCTION_MCP="${PRODUCTION_BASE}/${MCP}"
  DEV_INSTANCE="${STAGING_PROJECT}/04-product-under-development/dev-instance"

  # Check if production MCP exists
  if [ ! -d "$PRODUCTION_MCP" ]; then
    echo "⚠️  WARNING: Production MCP not found: $PRODUCTION_MCP"
    echo "   Skipping $MCP"
    echo ""
    ((FAIL_COUNT++))
    FAILED_MCPS+=("$MCP (production not found)")
    continue
  fi

  # Check if staging project already exists
  if [ -d "$STAGING_PROJECT" ]; then
    echo "ℹ️  INFO: Staging project already exists: $STAGING_PROJECT"
    echo "   Skipping creation, will verify build"
  else
    echo "1. Creating staging project from template..."
    cp -r "$TEMPLATE_DIR" "$STAGING_PROJECT"
    echo "   ✅ Project created"
  fi

  echo "2. Copying production code to dev-instance..."
  cp -r "$PRODUCTION_MCP"/* "$DEV_INSTANCE/"
  echo "   ✅ Code copied"

  echo "3. Building in staging..."
  cd "$DEV_INSTANCE"

  # Clean install
  rm -rf node_modules package-lock.json 2>/dev/null || true

  if npm install > /tmp/retrofit-${MCP}-install.log 2>&1; then
    echo "   ✅ Dependencies installed"
  else
    echo "   ❌ npm install failed (see /tmp/retrofit-${MCP}-install.log)"
    ((FAIL_COUNT++))
    FAILED_MCPS+=("$MCP (npm install failed)")
    echo ""
    continue
  fi

  if npm run build > /tmp/retrofit-${MCP}-build.log 2>&1; then
    echo "   ✅ Build successful"
  else
    echo "   ❌ Build failed (see /tmp/retrofit-${MCP}-build.log)"
    ((FAIL_COUNT++))
    FAILED_MCPS+=("$MCP (build failed)")
    echo ""
    continue
  fi

  echo "4. Creating basic documentation..."

  # Create README
  cat > "$STAGING_PROJECT/README.md" << EOF
---
type: readme
tags: [${MCP}, staging-project]
---

# ${MCP} Project

**MCP Name:** ${MCP}
**Status:** Production
**Purpose:** [Auto-generated during batch retrofit]

**Production:** /local-instances/mcp-servers/${MCP}/
**Staging:** 04-product-under-development/dev-instance/

**Retrofitted:** 2025-10-29 (batch retrofit)
EOF

  # Create EVENT-LOG
  cat > "$STAGING_PROJECT/EVENT-LOG.md" << EOF
---
type: reference
tags: [event-log]
---

# ${MCP} - Event Log

## 2025-10-29: Batch Retrofit to Dual-Environment Pattern

**Event:** Created staging project via batch-retrofit-staging.sh

**Details:**
- Copied production code to dev-instance
- Verified build succeeds
- Created basic documentation

**Status:** Staging operational, production unchanged
EOF

  # Create NEXT-STEPS
  cat > "$STAGING_PROJECT/NEXT-STEPS.md" << EOF
---
type: plan
tags: [next-steps]
---

# ${MCP} - Next Steps

**Last Updated:** 2025-10-29
**Current Phase:** Production (with staging project)

## Immediate

- [x] Create staging project
- [x] Copy production code
- [x] Verify build succeeds
- [ ] Validate with validate-dual-environment.sh

## Future

- [ ] Establish issue logging workflow
- [ ] Test production feedback loop
EOF

  echo "   ✅ Documentation created"
  echo ""
  echo "✅ SUCCESS: $MCP retrofitted successfully"
  echo ""
  ((SUCCESS_COUNT++))
done

echo "========================================================================"
echo "  BATCH RETROFIT SUMMARY"
echo "========================================================================"
echo ""
echo "Total MCPs: ${#MCPS[@]}"
echo "Successful: $SUCCESS_COUNT"
echo "Failed: $FAIL_COUNT"
echo ""

if [ $FAIL_COUNT -gt 0 ]; then
  echo "Failed MCPs:"
  for FAILED in "${FAILED_MCPS[@]}"; do
    echo "  - $FAILED"
  done
  echo ""
fi

if [ $SUCCESS_COUNT -eq ${#MCPS[@]} ]; then
  echo "🎉 All MCPs retrofitted successfully!"
  echo ""
  echo "Next steps:"
  echo "  1. Run validation: ./validate-dual-environment.sh [mcp-name]"
  echo "  2. Test builds in staging"
  echo "  3. Verify production unchanged"
  echo ""
  exit 0
else
  echo "⚠️  Some MCPs failed to retrofit"
  echo "   Check logs in /tmp/retrofit-*.log for details"
  echo ""
  exit 1
fi
