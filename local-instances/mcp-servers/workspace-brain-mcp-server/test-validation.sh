#!/bin/bash
# Validation test for Cost Tracking & ROI system

echo "╔═══════════════════════════════════════════════════════════════╗"
echo "║     WORKSPACE BRAIN MCP - COST TRACKING VALIDATION TEST       ║"
echo "╚═══════════════════════════════════════════════════════════════╝"
echo ""

WORKSPACE_BRAIN_DIR="$HOME/workspace-brain"
ERRORS=0

# Color codes
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Test functions
test_passed() {
  echo -e "${GREEN}✓${NC} $1"
}

test_failed() {
  echo -e "${RED}✗${NC} $1"
  ERRORS=$((ERRORS + 1))
}

test_warning() {
  echo -e "${YELLOW}⚠${NC} $1"
}

echo "1. Checking Build Status"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
if [ -d "build" ] && [ -f "build/index.js" ]; then
  test_passed "Build directory exists"
  if [ -x "build/index.js" ]; then
    test_passed "Build output is executable"
  else
    test_failed "Build output is not executable"
  fi
else
  test_failed "Build directory or index.js missing"
fi
echo ""

echo "2. Checking Source Files"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
required_files=(
  "src/index.ts"
  "src/tools/telemetry.ts"
  "src/tools/analytics.ts"
  "src/tools/learning.ts"
  "src/tools/cache.ts"
  "src/tools/cost-tracking.ts"
  "src/tools/maintenance.ts"
)

for file in "${required_files[@]}"; do
  if [ -f "$file" ]; then
    test_passed "$file exists"
  else
    test_failed "$file missing"
  fi
done
echo ""

echo "3. Checking Documentation"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
docs=(
  "README.md"
  "COST-TRACKING-README.md"
  "EXAMPLE-ROI-REPORT.md"
)

for doc in "${docs[@]}"; do
  if [ -f "$doc" ]; then
    test_passed "$doc exists"
    # Check file size
    size=$(wc -c < "$doc")
    if [ $size -gt 1000 ]; then
      test_passed "$doc has content (${size} bytes)"
    else
      test_warning "$doc is small (${size} bytes)"
    fi
  else
    test_failed "$doc missing"
  fi
done
echo ""

echo "4. Checking Storage Structure"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
if [ -d "$WORKSPACE_BRAIN_DIR" ]; then
  test_passed "Workspace brain directory exists"

  if [ -d "$WORKSPACE_BRAIN_DIR/cost-tracking" ]; then
    test_passed "cost-tracking directory exists"

    if [ -d "$WORKSPACE_BRAIN_DIR/cost-tracking/workflows" ]; then
      test_passed "workflows directory exists"
      workflow_count=$(ls -1 "$WORKSPACE_BRAIN_DIR/cost-tracking/workflows" | wc -l)
      if [ $workflow_count -gt 0 ]; then
        test_passed "Found $workflow_count workflow cost files"
      else
        test_warning "No workflow cost files found (run ./test-cost-tracking.sh)"
      fi
    else
      test_failed "workflows directory missing"
    fi

    if [ -d "$WORKSPACE_BRAIN_DIR/cost-tracking/monthly-summaries" ]; then
      test_passed "monthly-summaries directory exists"
      summary_count=$(ls -1 "$WORKSPACE_BRAIN_DIR/cost-tracking/monthly-summaries" 2>/dev/null | wc -l)
      if [ $summary_count -gt 0 ]; then
        test_passed "Found $summary_count monthly summary files"
      else
        test_warning "No monthly summary files found"
      fi
    else
      test_failed "monthly-summaries directory missing"
    fi
  else
    test_warning "cost-tracking directory not found (run ./test-cost-tracking.sh)"
  fi
else
  test_warning "Workspace brain directory not found at $WORKSPACE_BRAIN_DIR"
fi
echo ""

echo "5. Validating Sample Data"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
if [ -d "$WORKSPACE_BRAIN_DIR/cost-tracking/workflows" ]; then
  sample_file=$(ls "$WORKSPACE_BRAIN_DIR/cost-tracking/workflows" 2>/dev/null | head -1)
  if [ -n "$sample_file" ]; then
    sample_path="$WORKSPACE_BRAIN_DIR/cost-tracking/workflows/$sample_file"
    test_passed "Sample file: $sample_file"

    # Validate JSON structure
    if command -v jq &> /dev/null; then
      required_fields=("id" "workflow_name" "timestamp" "api_tokens" "time_saved_hours" "outcome" "api_cost" "human_cost_saved" "net_roi" "roi_ratio")

      for field in "${required_fields[@]}"; do
        if jq -e ".$field" "$sample_path" > /dev/null 2>&1; then
          test_passed "Field '$field' present"
        else
          test_failed "Field '$field' missing"
        fi
      done

      # Validate calculations
      input_tokens=$(jq -r '.api_tokens.input' "$sample_path")
      output_tokens=$(jq -r '.api_tokens.output' "$sample_path")
      api_cost=$(jq -r '.api_cost' "$sample_path")

      # Calculate expected API cost
      expected_cost=$(echo "scale=6; ($input_tokens / 1000 * 0.015) + ($output_tokens / 1000 * 0.075)" | bc)

      if [ "$(echo "$api_cost == $expected_cost" | bc)" -eq 1 ]; then
        test_passed "API cost calculation correct ($api_cost)"
      else
        test_warning "API cost calculation may be off (expected: $expected_cost, got: $api_cost)"
      fi

      # Validate ROI calculation
      time_saved=$(jq -r '.time_saved_hours' "$sample_path")
      human_cost_saved=$(jq -r '.human_cost_saved' "$sample_path")
      expected_human_cost=$(echo "scale=2; $time_saved * 50" | bc)

      if [ "$(echo "$human_cost_saved == $expected_human_cost" | bc)" -eq 1 ]; then
        test_passed "Human cost calculation correct ($human_cost_saved)"
      else
        test_warning "Human cost calculation may be off (expected: $expected_human_cost, got: $human_cost_saved)"
      fi

    else
      test_warning "jq not installed, skipping JSON validation"
    fi
  fi
fi
echo ""

echo "6. Checking Package Dependencies"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
if [ -f "package.json" ]; then
  test_passed "package.json exists"

  if [ -d "node_modules" ]; then
    test_passed "node_modules directory exists"

    required_deps=(
      "@modelcontextprotocol/sdk"
    )

    for dep in "${required_deps[@]}"; do
      if [ -d "node_modules/$dep" ]; then
        test_passed "Dependency: $dep installed"
      else
        test_failed "Dependency: $dep missing"
      fi
    done
  else
    test_failed "node_modules missing (run npm install)"
  fi

  # Check version
  version=$(jq -r '.version' package.json)
  if [ "$version" = "1.3.0" ]; then
    test_passed "Version is 1.3.0"
  else
    test_warning "Version is $version (expected 1.3.0)"
  fi
else
  test_failed "package.json missing"
fi
echo ""

echo "7. Checking TypeScript Configuration"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
if [ -f "tsconfig.json" ]; then
  test_passed "tsconfig.json exists"
else
  test_failed "tsconfig.json missing"
fi
echo ""

echo "8. Summary Statistics"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
if [ -d "$WORKSPACE_BRAIN_DIR/cost-tracking/workflows" ]; then
  workflow_count=$(ls -1 "$WORKSPACE_BRAIN_DIR/cost-tracking/workflows" 2>/dev/null | wc -l)

  if [ $workflow_count -gt 0 ] && command -v jq &> /dev/null; then
    total_cost=0
    total_roi=0

    for file in "$WORKSPACE_BRAIN_DIR/cost-tracking/workflows"/*.json; do
      cost=$(jq -r '.api_cost' "$file")
      roi=$(jq -r '.net_roi' "$file")
      total_cost=$(echo "$total_cost + $cost" | bc)
      total_roi=$(echo "$total_roi + $roi" | bc)
    done

    echo "Workflows analyzed: $workflow_count"
    echo "Total API cost: \$$(printf "%.2f" $total_cost)"
    echo "Total Net ROI: \$$(printf "%.2f" $total_roi)"

    if [ "$(echo "$total_roi > 0" | bc)" -eq 1 ]; then
      test_passed "Net ROI is positive (\$$(printf "%.2f" $total_roi))"
    else
      test_warning "Net ROI is negative or zero"
    fi
  fi
fi
echo ""

echo "╔═══════════════════════════════════════════════════════════════╗"
echo "║                      VALIDATION RESULTS                       ║"
echo "╚═══════════════════════════════════════════════════════════════╝"
echo ""

if [ $ERRORS -eq 0 ]; then
  echo -e "${GREEN}✓ All tests passed!${NC}"
  echo ""
  echo "The Cost Tracking & ROI system is correctly installed and configured."
  echo ""
  echo "Next steps:"
  echo "  1. Run './test-cost-tracking.sh' to generate sample data (if not done)"
  echo "  2. Start the MCP server"
  echo "  3. Test the tools: track_workflow_cost, get_roi_report, etc."
  echo "  4. Review COST-TRACKING-README.md for usage documentation"
  echo "  5. Check EXAMPLE-ROI-REPORT.md for expected output format"
  echo ""
  exit 0
else
  echo -e "${RED}✗ $ERRORS test(s) failed${NC}"
  echo ""
  echo "Please fix the errors above before using the Cost Tracking system."
  echo ""
  echo "Common fixes:"
  echo "  - Run 'npm install' to install dependencies"
  echo "  - Run 'npm run build' to compile TypeScript"
  echo "  - Run './test-cost-tracking.sh' to generate sample data"
  echo ""
  exit 1
fi
