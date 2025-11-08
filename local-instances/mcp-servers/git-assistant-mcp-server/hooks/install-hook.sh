#!/bin/bash
# Install Pre-Commit Hook Script
# Installs the security-enabled git pre-commit hook

set -e

# Colors
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
BLUE='\033[0;34m'
NC='\033[0m'

# Get repository root
if ! git rev-parse --git-dir > /dev/null 2>&1; then
  echo -e "${RED}Error: Not a git repository${NC}"
  exit 1
fi

REPO_ROOT=$(git rev-parse --show-toplevel)
HOOKS_DIR="$REPO_ROOT/.git/hooks"
HOOK_SOURCE="$(dirname "$0")/pre-commit"
HOOK_DEST="$HOOKS_DIR/pre-commit"

echo -e "${BLUE}Installing security pre-commit hook...${NC}"
echo ""

# Check if hook already exists
if [ -f "$HOOK_DEST" ]; then
  echo -e "${YELLOW}⚠️  Pre-commit hook already exists${NC}"
  echo "Location: $HOOK_DEST"
  echo ""
  read -p "Do you want to backup and replace it? (y/N) " -n 1 -r
  echo
  if [[ ! $REPLY =~ ^[Yy]$ ]]; then
    echo -e "${YELLOW}Installation cancelled${NC}"
    exit 0
  fi

  # Backup existing hook
  BACKUP="$HOOK_DEST.backup.$(date +%Y%m%d_%H%M%S)"
  mv "$HOOK_DEST" "$BACKUP"
  echo -e "${GREEN}✓ Backed up existing hook to: $BACKUP${NC}"
fi

# Copy hook
cp "$HOOK_SOURCE" "$HOOK_DEST"
chmod +x "$HOOK_DEST"

echo -e "${GREEN}✓ Pre-commit hook installed successfully${NC}"
echo ""

# Create default configuration if it doesn't exist
CONFIG_FILE="$REPO_ROOT/.git-security-config.json"
if [ ! -f "$CONFIG_FILE" ]; then
  cat > "$CONFIG_FILE" <<'EOF'
{
  "enabled": true,
  "scanCredentials": true,
  "scanPHI": true,
  "failOnSecurity": true,
  "sensitivity": "medium",
  "minConfidence": 0.5,
  "excludeDirs": [
    "node_modules",
    ".git",
    "dist",
    "build",
    "coverage"
  ],
  "cacheTimeout": 30
}
EOF
  echo -e "${GREEN}✓ Created default security configuration${NC}"
  echo "  Location: $CONFIG_FILE"
  echo ""
fi

echo -e "${BLUE}Configuration:${NC}"
echo "  Hook location: $HOOK_DEST"
echo "  Config file: $CONFIG_FILE"
echo ""

echo -e "${BLUE}Usage:${NC}"
echo "  • The hook runs automatically before every commit"
echo "  • It scans for credentials and PHI in staged files"
echo "  • To bypass (emergencies only): git commit --no-verify"
echo "  • To disable: Set 'enabled: false' in config file"
echo ""

echo -e "${GREEN}✅ Installation complete!${NC}"
