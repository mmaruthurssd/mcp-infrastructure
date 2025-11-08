#!/bin/bash
# Integration Tests for Security + Git Assistant MCP Integration
# Tests credential detection, PHI detection, and commit blocking

set -e

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

echo -e "${BLUE}═══════════════════════════════════════════════════════════${NC}"
echo -e "${BLUE}Security-Git Integration Tests${NC}"
echo -e "${BLUE}═══════════════════════════════════════════════════════════${NC}"
echo ""

# Test counters
TESTS_RUN=0
TESTS_PASSED=0
TESTS_FAILED=0

# Test function
run_test() {
  local test_name="$1"
  local test_command="$2"
  local expected_result="$3"  # "pass" or "fail"

  TESTS_RUN=$((TESTS_RUN + 1))
  echo -e "${BLUE}Test $TESTS_RUN: $test_name${NC}"

  if eval "$test_command" > /dev/null 2>&1; then
    if [ "$expected_result" = "pass" ]; then
      echo -e "${GREEN}  ✓ PASSED${NC}"
      TESTS_PASSED=$((TESTS_PASSED + 1))
    else
      echo -e "${RED}  ✗ FAILED (expected to fail but passed)${NC}"
      TESTS_FAILED=$((TESTS_FAILED + 1))
    fi
  else
    if [ "$expected_result" = "fail" ]; then
      echo -e "${GREEN}  ✓ PASSED (correctly blocked)${NC}"
      TESTS_PASSED=$((TESTS_PASSED + 1))
    else
      echo -e "${RED}  ✗ FAILED${NC}"
      TESTS_FAILED=$((TESTS_FAILED + 1))
    fi
  fi
  echo ""
}

# Create temporary test directory
TEST_DIR=$(mktemp -d)
cd "$TEST_DIR"
git init -q

echo -e "${YELLOW}Test directory: $TEST_DIR${NC}"
echo ""

# Install pre-commit hook
HOOK_SOURCE="$(dirname "$0")/../hooks/pre-commit"
if [ -f "$HOOK_SOURCE" ]; then
  cp "$HOOK_SOURCE" .git/hooks/pre-commit
  chmod +x .git/hooks/pre-commit
  echo -e "${GREEN}✓ Pre-commit hook installed${NC}"
else
  echo -e "${YELLOW}⚠ Pre-commit hook not found, using simulation mode${NC}"
fi

# Create configuration
cat > .git-security-config.json <<'EOF'
{
  "enabled": true,
  "scanCredentials": true,
  "scanPHI": true,
  "failOnSecurity": true,
  "sensitivity": "medium",
  "minConfidence": 0.5,
  "excludeDirs": ["node_modules", ".git", "dist"]
}
EOF

echo -e "${GREEN}✓ Security configuration created${NC}"
echo ""

# =============================================================================
# TEST 1: Clean commit should pass
# =============================================================================
cat > clean-file.js <<'EOF'
// Clean JavaScript file with no security issues
function calculateTotal(items) {
  return items.reduce((sum, item) => sum + item.price, 0);
}

module.exports = { calculateTotal };
EOF

git add clean-file.js
run_test "Clean commit with no security issues" "git commit -m 'test: add clean file'" "pass"
git reset --soft HEAD~1 2>/dev/null || true

# =============================================================================
# TEST 2: Commit with API key should be blocked
# =============================================================================
cat > config-with-key.js <<'EOF'
// Config file with exposed API key
const config = {
  apiUrl: 'https://api.example.com',
  api_key: 'sk-1234567890abcdef1234567890abcdef',
  timeout: 5000
};

module.exports = config;
EOF

git add config-with-key.js
run_test "Block commit with API key" "git commit -m 'test: add config'" "fail"
git reset HEAD config-with-key.js 2>/dev/null || true
rm -f config-with-key.js

# =============================================================================
# TEST 3: Commit with password should be blocked
# =============================================================================
cat > credentials.env <<'EOF'
DATABASE_URL=postgresql://localhost:5432/mydb
password="SuperSecret123!"
API_ENDPOINT=https://api.example.com
EOF

git add credentials.env
run_test "Block commit with password" "git commit -m 'test: add env file'" "fail"
git reset HEAD credentials.env 2>/dev/null || true
rm -f credentials.env

# =============================================================================
# TEST 4: Commit with SSN (PHI) should be blocked
# =============================================================================
cat > patient-data.js <<'EOF'
// Patient data (TEST ONLY - DO NOT USE REAL DATA)
const testPatient = {
  name: 'Test Patient',
  ssn: '123-45-6789',
  dob: '1990-01-01'
};
EOF

git add patient-data.js
run_test "Block commit with SSN (PHI)" "git commit -m 'test: add patient data'" "fail"
git reset HEAD patient-data.js 2>/dev/null || true
rm -f patient-data.js

# =============================================================================
# TEST 5: Commit with MRN (PHI) should be blocked
# =============================================================================
cat > medical-record.js <<'EOF'
// Medical record lookup
function getPatientRecord() {
  return {
    MRN: 123456789,
    visitDate: '2024-01-01'
  };
}
EOF

git add medical-record.js
run_test "Block commit with MRN (PHI)" "git commit -m 'test: add medical record'" "fail"
git reset HEAD medical-record.js 2>/dev/null || true
rm -f medical-record.js

# =============================================================================
# TEST 6: Commit with bearer token should be blocked
# =============================================================================
cat > auth-header.js <<'EOF'
// Auth header with bearer token
const headers = {
  'Authorization': 'bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiIxMjM0NTY3ODkwIn0.dozjgNryP4J3jVmNHl0w5N_XgL0n3I9PlFUP0THsR8U',
  'Content-Type': 'application/json'
};
EOF

git add auth-header.js
run_test "Block commit with bearer token" "git commit -m 'test: add auth header'" "fail"
git reset HEAD auth-header.js 2>/dev/null || true
rm -f auth-header.js

# =============================================================================
# TEST 7: Clean commit after fixing should pass
# =============================================================================
cat > fixed-config.js <<'EOF'
// Fixed config using environment variables
const config = {
  apiUrl: 'https://api.example.com',
  apiKey: process.env.API_KEY,  // Using env var - SECURE
  timeout: 5000
};

module.exports = config;
EOF

git add fixed-config.js
run_test "Allow commit with secure environment variable usage" "git commit -m 'test: add secure config'" "pass"
git reset --soft HEAD~1 2>/dev/null || true

# =============================================================================
# TEST 8: Excluded directory should pass even with credentials
# =============================================================================
mkdir -p node_modules
cat > node_modules/package.js <<'EOF'
// This should be ignored (in node_modules)
const secret = "api_key:sk-1234567890abcdef";
EOF

git add node_modules/package.js
run_test "Allow commit in excluded directory (node_modules)" "git commit -m 'test: add node_modules'" "pass"
git reset --soft HEAD~1 2>/dev/null || true

# =============================================================================
# SUMMARY
# =============================================================================
echo ""
echo -e "${BLUE}═══════════════════════════════════════════════════════════${NC}"
echo -e "${BLUE}Test Summary${NC}"
echo -e "${BLUE}═══════════════════════════════════════════════════════════${NC}"
echo ""
echo -e "Total tests run:    ${BLUE}$TESTS_RUN${NC}"
echo -e "Tests passed:       ${GREEN}$TESTS_PASSED${NC}"
echo -e "Tests failed:       ${RED}$TESTS_FAILED${NC}"
echo ""

if [ $TESTS_FAILED -eq 0 ]; then
  echo -e "${GREEN}✅ All tests passed!${NC}"
  EXIT_CODE=0
else
  echo -e "${RED}❌ Some tests failed${NC}"
  EXIT_CODE=1
fi

echo ""
echo -e "${YELLOW}Cleaning up test directory...${NC}"
cd ..
rm -rf "$TEST_DIR"
echo -e "${GREEN}✓ Done${NC}"
echo ""

exit $EXIT_CODE
