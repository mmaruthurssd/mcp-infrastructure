#!/bin/bash

##############################################################################
# Weekly Compliance Audit Script
#
# Automatically validates all MCPs in the workspace and generates a report
# Can be run manually or scheduled via cron/GitHub Actions
#
# Usage: ./weekly-compliance-audit.sh
##############################################################################

set -e

WORKSPACE_ROOT="$HOME/Desktop/medical-practice-workspace"
MCP_DIR="$WORKSPACE_ROOT/local-instances/mcp-servers"
REPORT_DIR="$WORKSPACE_ROOT/compliance-reports"
REPORT_FILE="$REPORT_DIR/compliance-$(date +%Y-%m-%d).md"

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

echo "🔍 Starting Weekly Compliance Audit..."
echo "Date: $(date)"
echo ""

# Create report directory
mkdir -p "$REPORT_DIR"

# Initialize report
cat > "$REPORT_FILE" << EOF
# Workspace Compliance Report
**Generated**: $(date)

## Summary

EOF

# Track totals
TOTAL_MCPS=0
COMPLIANT_MCPS=0
NON_COMPLIANT_MCPS=0
TOTAL_VIOLATIONS=0

# Array to store MCP results
declare -a MCP_RESULTS

echo "📊 Scanning MCPs..."
echo ""

# Find all MCPs (directories with dist/ folder)
for MCP_PATH in "$MCP_DIR"/*; do
  if [ -d "$MCP_PATH/dist" ]; then
    MCP_NAME=$(basename "$MCP_PATH")

    # Skip template directories
    if [[ "$MCP_NAME" == *"-template" ]]; then
      continue
    fi

    TOTAL_MCPS=$((TOTAL_MCPS + 1))

    echo "  Validating: $MCP_NAME"

    # Call standards-enforcement-mcp
    # Note: This assumes you have a CLI wrapper or use Claude Code's mcp call
    RESULT=$(node "$WORKSPACE_ROOT/development/mcp-servers/standards-enforcement-mcp-project/04-product-under-development/dist/index.js" validate_mcp_compliance "{\"mcpName\":\"$MCP_NAME\"}" 2>/dev/null || echo '{"compliant":false,"summary":{"complianceScore":0,"criticalViolations":999}}')

    # Parse result (requires jq)
    COMPLIANT=$(echo "$RESULT" | jq -r '.compliant')
    SCORE=$(echo "$RESULT" | jq -r '.summary.complianceScore')
    CRITICAL=$(echo "$RESULT" | jq -r '.summary.criticalViolations')
    WARNINGS=$(echo "$RESULT" | jq -r '.summary.warningViolations')

    # Update counters
    if [ "$COMPLIANT" = "true" ]; then
      COMPLIANT_MCPS=$((COMPLIANT_MCPS + 1))
      echo -e "    ${GREEN}✅ Compliant${NC} (Score: $SCORE/100)"
    else
      NON_COMPLIANT_MCPS=$((NON_COMPLIANT_MCPS + 1))
      echo -e "    ${RED}❌ Non-Compliant${NC} (Score: $SCORE/100, Critical: $CRITICAL)"
    fi

    TOTAL_VIOLATIONS=$((TOTAL_VIOLATIONS + CRITICAL + WARNINGS))

    # Store result
    MCP_RESULTS+=("$MCP_NAME|$COMPLIANT|$SCORE|$CRITICAL|$WARNINGS")
  fi
done

echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "📈 Compliance Summary"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""
echo "Total MCPs:          $TOTAL_MCPS"
echo -e "${GREEN}Compliant:           $COMPLIANT_MCPS${NC}"
echo -e "${RED}Non-Compliant:       $NON_COMPLIANT_MCPS${NC}"
echo -e "${YELLOW}Total Violations:    $TOTAL_VIOLATIONS${NC}"
echo ""

# Calculate percentage
if [ $TOTAL_MCPS -gt 0 ]; then
  COMPLIANCE_PERCENT=$((COMPLIANT_MCPS * 100 / TOTAL_MCPS))
  echo "Compliance Rate:     $COMPLIANCE_PERCENT%"
  echo ""
fi

# Write summary to report
cat >> "$REPORT_FILE" << EOF
| Metric | Value |
|--------|-------|
| Total MCPs | $TOTAL_MCPS |
| Compliant MCPs | $COMPLIANT_MCPS |
| Non-Compliant MCPs | $NON_COMPLIANT_MCPS |
| Compliance Rate | $COMPLIANCE_PERCENT% |
| Total Violations | $TOTAL_VIOLATIONS |

## Detailed Results

| MCP Name | Status | Score | Critical | Warnings |
|----------|--------|-------|----------|----------|
EOF

# Write detailed results
for RESULT in "${MCP_RESULTS[@]}"; do
  IFS='|' read -r NAME COMPLIANT SCORE CRITICAL WARNINGS <<< "$RESULT"

  if [ "$COMPLIANT" = "true" ]; then
    STATUS="✅ Compliant"
  else
    STATUS="❌ Non-Compliant"
  fi

  echo "| $NAME | $STATUS | $SCORE/100 | $CRITICAL | $WARNINGS |" >> "$REPORT_FILE"
done

# Add recommendations
cat >> "$REPORT_FILE" << EOF

## Recommendations

EOF

# Add specific recommendations based on results
if [ $NON_COMPLIANT_MCPS -gt 0 ]; then
  cat >> "$REPORT_FILE" << EOF
### Priority Actions

1. **Fix Critical Violations**: Focus on MCPs with critical violations first
2. **Review Non-Compliant MCPs**: Run detailed validation:
   \`\`\`bash
   validate_mcp_compliance({mcpName: "mcp-name"})
   \`\`\`
3. **Update Templates**: Ensure all MCPs have corresponding templates
4. **Security Scan**: Check for hardcoded secrets in non-compliant MCPs

EOF
fi

if [ $COMPLIANCE_PERCENT -ge 90 ]; then
  cat >> "$REPORT_FILE" << EOF
### Excellent Compliance! 🎉

Your workspace maintains a compliance rate of $COMPLIANCE_PERCENT%. Keep up the great work!

Next steps:
- Maintain template-first development
- Continue security best practices
- Regular audits (weekly)

EOF
elif [ $COMPLIANCE_PERCENT -ge 70 ]; then
  cat >> "$REPORT_FILE" << EOF
### Good Progress

Compliance rate: $COMPLIANCE_PERCENT%. Focus on addressing critical violations.

EOF
else
  cat >> "$REPORT_FILE" << EOF
### Action Required ⚠️

Compliance rate is below 70%. Immediate action needed:

1. Schedule compliance review meeting
2. Create action plan for non-compliant MCPs
3. Set standards enforcement in deployment pipeline

EOF
fi

echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "📄 Report saved to:"
echo "   $REPORT_FILE"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""

# Optional: Send report via communications-mcp
# Uncomment if you want email/Slack notifications
# node "$WORKSPACE_ROOT/local-instances/mcp-servers/communications-mcp-server/dist/server.js" send_notification "{
#   \"channel\": \"#dev-team\",
#   \"message\": \"Weekly compliance audit complete. Rate: $COMPLIANCE_PERCENT%. Report: $REPORT_FILE\"
# }"

# Exit code based on compliance
if [ $NON_COMPLIANT_MCPS -eq 0 ]; then
  echo "✅ All MCPs are compliant!"
  exit 0
else
  echo "⚠️  $NON_COMPLIANT_MCPS MCP(s) need attention"
  exit 1
fi
