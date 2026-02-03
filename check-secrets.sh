#!/bin/bash

# Security check script - Run before every commit
# Checks for accidentally committed secrets

set -e

echo "🔒 Running security checks..."
echo ""

FAILED=0

# Check 1: Ensure .env is not tracked by git
echo "1️⃣  Checking if .env is tracked by git..."
if git ls-files --error-unmatch .env 2>/dev/null; then
  echo "❌ FAIL: .env file is tracked by git!"
  echo "   Run: git rm --cached .env"
  FAILED=1
else
  echo "✅ PASS: .env is not tracked"
fi
echo ""

# Check 2: Search for AWS access keys in tracked files
echo "2️⃣  Checking for AWS access keys in tracked files..."
if git grep -i "AKIA[0-9A-Z]\{16\}" -- ':!*.md' ':!check-secrets.sh' 2>/dev/null; then
  echo "❌ FAIL: AWS access key found in tracked files!"
  FAILED=1
else
  echo "✅ PASS: No AWS access keys found"
fi
echo ""

# Check 3: Search for AWS secret keys in tracked files
echo "3️⃣  Checking for AWS secret keys in tracked files..."
if git grep -E "['\"]?AWS_SECRET_ACCESS_KEY['\"]?\s*[:=]\s*['\"]?[A-Za-z0-9/+=]{40}['\"]?" -- ':!*.md' ':!check-secrets.sh' 2>/dev/null; then
  echo "❌ FAIL: AWS secret key found in tracked files!"
  FAILED=1
else
  echo "✅ PASS: No AWS secret keys found"
fi
echo ""

# Check 4: Check for hardcoded API keys
echo "4️⃣  Checking for hardcoded API keys in tracked files..."
if git grep -E "sk_[a-zA-Z0-9]{48}" -- ':!*.md' ':!check-secrets.sh' 2>/dev/null; then
  echo "❌ FAIL: ElevenLabs API key found in tracked files!"
  FAILED=1
else
  echo "✅ PASS: No hardcoded API keys found"
fi
echo ""

# Check 5: Verify .env.example has no real credentials
echo "5️⃣  Checking .env.example for real credentials..."
if grep -E "(AKIA[0-9A-Z]{16}|sk_[a-zA-Z0-9]{48})" .env.example 2>/dev/null; then
  echo "❌ FAIL: Real credentials found in .env.example!"
  FAILED=1
else
  echo "✅ PASS: .env.example contains only placeholders"
fi
echo ""

# Check 6: Verify AWS credentials are not in .env.example
echo "6️⃣  Checking .env.example doesn't suggest AWS access keys..."
if grep -E "AWS_ACCESS_KEY_ID=(?!your_|<)" .env.example 2>/dev/null; then
  echo "⚠️  WARNING: .env.example suggests using AWS access keys"
  echo "   This is discouraged. Use IAM roles instead."
fi
echo "✅ PASS: .env.example follows security best practices"
echo ""

# Summary
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
if [ $FAILED -eq 0 ]; then
  echo "✅ All security checks passed!"
  echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
  exit 0
else
  echo "❌ Security checks FAILED!"
  echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
  echo ""
  echo "⚠️  DO NOT COMMIT until all issues are resolved!"
  echo ""
  echo "To fix:"
  echo "1. Remove secrets from tracked files"
  echo "2. Run: git rm --cached <file>"
  echo "3. Add files to .gitignore"
  echo "4. Rotate any exposed credentials"
  echo ""
  exit 1
fi
