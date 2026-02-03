#!/bin/bash

# Security check script - Run before committing to git
# This script checks for accidentally committed secrets

echo "🔒 Running security checks..."

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

ERRORS=0

# Check 1: Verify .env is in .gitignore
echo "Checking .gitignore..."
if grep -q "^\.env$" .gitignore; then
  echo -e "${GREEN}✓${NC} .env is in .gitignore"
else
  echo -e "${RED}✗${NC} .env is NOT in .gitignore!"
  ERRORS=$((ERRORS + 1))
fi

# Check 2: Verify .env is not tracked by git
echo "Checking if .env is tracked..."
if git ls-files --error-unmatch .env 2>/dev/null; then
  echo -e "${RED}✗${NC} .env is tracked by git! Remove it immediately!"
  echo "  Run: git rm --cached .env"
  ERRORS=$((ERRORS + 1))
else
  echo -e "${GREEN}✓${NC} .env is not tracked by git"
fi

# Check 3: Search for potential secrets in tracked files
echo "Searching for potential secrets in tracked files..."
PATTERNS=(
  "aws_access_key_id.*=.*[A-Z0-9]{20}"
  "aws_secret_access_key.*=.*[A-Za-z0-9/+=]{40}"
  "AKIA[0-9A-Z]{16}"
  "elevenlabs.*api.*key.*=.*[a-f0-9]{32}"
)

for pattern in "${PATTERNS[@]}"; do
  if git grep -i -E "$pattern" -- ':!*.md' ':!check-secrets.sh' ':!SECURITY.md' 2>/dev/null; then
    echo -e "${RED}✗${NC} Found potential secret matching pattern: $pattern"
    ERRORS=$((ERRORS + 1))
  fi
done

# Check 4: Verify .env has no actual values
echo "Checking .env file for actual credentials..."
if [ -f .env ]; then
  if grep -E "^(AWS_ACCESS_KEY_ID|AWS_SECRET_ACCESS_KEY|ELEVENLABS_API_KEY)=.+$" .env | grep -v "your_.*_here" | grep -v "=\s*$"; then
    echo -e "${YELLOW}⚠${NC}  .env file contains values (this is OK for local dev, but verify they're not committed)"
    # Not counting as error since .env should be gitignored
  else
    echo -e "${GREEN}✓${NC} .env file has no credentials (or only placeholders)"
  fi
fi

# Check 5: Verify amplify/ directory is gitignored
echo "Checking amplify directory..."
if [ -d amplify ]; then
  if git ls-files --error-unmatch amplify/ 2>/dev/null; then
    echo -e "${RED}✗${NC} amplify/ directory is tracked by git!"
    ERRORS=$((ERRORS + 1))
  else
    echo -e "${GREEN}✓${NC} amplify/ directory is not tracked"
  fi
else
  echo -e "${GREEN}✓${NC} amplify/ directory doesn't exist yet"
fi

# Summary
echo ""
echo "================================"
if [ $ERRORS -eq 0 ]; then
  echo -e "${GREEN}✓ All security checks passed!${NC}"
  echo "Safe to commit."
  exit 0
else
  echo -e "${RED}✗ Found $ERRORS security issue(s)!${NC}"
  echo "DO NOT COMMIT until these are resolved."
  echo ""
  echo "If you accidentally committed secrets:"
  echo "1. Remove from git: git rm --cached <file>"
  echo "2. Rotate ALL exposed credentials immediately"
  echo "3. See SECURITY.md for detailed recovery steps"
  exit 1
fi
