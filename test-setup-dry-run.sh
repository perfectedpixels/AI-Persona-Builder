#!/bin/bash

# Dry-run test of AWS setup scripts
# Tests script logic without actually deploying to AWS

echo "🧪 Testing AWS Setup Scripts (Dry Run)"
echo "======================================"
echo ""

# Colors
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
NC='\033[0m'

TESTS_PASSED=0
TESTS_FAILED=0

# Test 1: Check script syntax
echo "Test 1: Checking script syntax..."
if bash -n setup-aws-services.sh && \
   bash -n verify-aws-setup.sh && \
   bash -n cleanup-aws-services.sh && \
   bash -n deploy-lambda-code-only.sh; then
    echo -e "${GREEN}✅ All scripts have valid syntax${NC}"
    ((TESTS_PASSED++))
else
    echo -e "${RED}❌ Syntax errors found${NC}"
    ((TESTS_FAILED++))
fi
echo ""

# Test 2: Check script permissions
echo "Test 2: Checking script permissions..."
if [ -x setup-aws-services.sh ] && \
   [ -x verify-aws-setup.sh ] && \
   [ -x cleanup-aws-services.sh ] && \
   [ -x deploy-lambda-code-only.sh ]; then
    echo -e "${GREEN}✅ All scripts are executable${NC}"
    ((TESTS_PASSED++))
else
    echo -e "${RED}❌ Some scripts are not executable${NC}"
    ((TESTS_FAILED++))
fi
echo ""

# Test 3: Check documentation exists
echo "Test 3: Checking documentation files..."
DOCS=(
    "AWS_SETUP_COMPLETE.md"
    "QUICK_START.md"
    "AWS_SETUP_GUIDE.md"
    "AWS_SERVICES_SUMMARY.md"
    "AWS_CHECKLIST.md"
    "AWS_COMMANDS_REFERENCE.md"
)

ALL_DOCS_EXIST=true
for doc in "${DOCS[@]}"; do
    if [ ! -f "$doc" ]; then
        echo -e "${RED}❌ Missing: $doc${NC}"
        ALL_DOCS_EXIST=false
    fi
done

if $ALL_DOCS_EXIST; then
    echo -e "${GREEN}✅ All documentation files exist${NC}"
    ((TESTS_PASSED++))
else
    ((TESTS_FAILED++))
fi
echo ""

# Test 4: Check Lambda package structure
echo "Test 4: Checking Lambda package structure..."
if [ -f "lambda.js" ] && \
   [ -f "package.json" ] && \
   [ -d "server" ] && \
   [ -f "server/index.js" ]; then
    echo -e "${GREEN}✅ Lambda package structure is correct${NC}"
    ((TESTS_PASSED++))
else
    echo -e "${RED}❌ Lambda package structure incomplete${NC}"
    ((TESTS_FAILED++))
fi
echo ""

# Test 5: Check server dependencies
echo "Test 5: Checking server dependencies..."
if [ -f "server/package.json" ]; then
    REQUIRED_DEPS=("express" "@aws-sdk/client-bedrock-runtime" "axios")
    MISSING_DEPS=()
    
    for dep in "${REQUIRED_DEPS[@]}"; do
        if ! grep -q "\"$dep\"" server/package.json; then
            MISSING_DEPS+=("$dep")
        fi
    done
    
    if [ ${#MISSING_DEPS[@]} -eq 0 ]; then
        echo -e "${GREEN}✅ All required dependencies present${NC}"
        ((TESTS_PASSED++))
    else
        echo -e "${RED}❌ Missing dependencies: ${MISSING_DEPS[*]}${NC}"
        ((TESTS_FAILED++))
    fi
else
    echo -e "${RED}❌ server/package.json not found${NC}"
    ((TESTS_FAILED++))
fi
echo ""

# Test 6: Check Amplify configuration
echo "Test 6: Checking Amplify configuration..."
if [ -f "amplify.yml" ]; then
    if grep -q "REACT_APP_API_URL" amplify.yml; then
        echo -e "${GREEN}✅ Amplify configuration is correct${NC}"
        ((TESTS_PASSED++))
    else
        echo -e "${YELLOW}⚠️  REACT_APP_API_URL not found in amplify.yml${NC}"
        ((TESTS_FAILED++))
    fi
else
    echo -e "${RED}❌ amplify.yml not found${NC}"
    ((TESTS_FAILED++))
fi
echo ""

# Test 7: Check environment example
echo "Test 7: Checking environment example..."
if [ -f ".env.example" ]; then
    if grep -q "ELEVENLABS_API_KEY" .env.example && \
       grep -q "BEDROCK_MODEL_ID" .env.example; then
        echo -e "${GREEN}✅ Environment example is complete${NC}"
        ((TESTS_PASSED++))
    else
        echo -e "${YELLOW}⚠️  Some environment variables missing from example${NC}"
        ((TESTS_FAILED++))
    fi
else
    echo -e "${RED}❌ .env.example not found${NC}"
    ((TESTS_FAILED++))
fi
echo ""

# Test 8: Check client structure
echo "Test 8: Checking client structure..."
if [ -d "client" ] && \
   [ -f "client/package.json" ] && \
   [ -d "client/src" ] && \
   [ -f "client/src/config.js" ]; then
    echo -e "${GREEN}✅ Client structure is correct${NC}"
    ((TESTS_PASSED++))
else
    echo -e "${RED}❌ Client structure incomplete${NC}"
    ((TESTS_FAILED++))
fi
echo ""

# Test 9: Simulate prerequisite checks
echo "Test 9: Simulating prerequisite checks..."
PREREQ_PASSED=true

# Check Node.js
if command -v node &> /dev/null; then
    NODE_VERSION=$(node --version)
    echo "  ✓ Node.js: $NODE_VERSION"
else
    echo -e "  ${RED}✗ Node.js not found${NC}"
    PREREQ_PASSED=false
fi

# Check AWS CLI
if command -v aws &> /dev/null; then
    AWS_VERSION=$(aws --version 2>&1 | head -n1)
    echo "  ✓ AWS CLI: $AWS_VERSION"
else
    echo -e "  ${RED}✗ AWS CLI not found${NC}"
    PREREQ_PASSED=false
fi

# Check npm
if command -v npm &> /dev/null; then
    NPM_VERSION=$(npm --version)
    echo "  ✓ npm: $NPM_VERSION"
else
    echo -e "  ${RED}✗ npm not found${NC}"
    PREREQ_PASSED=false
fi

if $PREREQ_PASSED; then
    echo -e "${GREEN}✅ All prerequisites installed${NC}"
    ((TESTS_PASSED++))
else
    echo -e "${RED}❌ Some prerequisites missing${NC}"
    ((TESTS_FAILED++))
fi
echo ""

# Test 10: Check README updates
echo "Test 10: Checking README updates..."
if grep -q "AWS_SETUP_COMPLETE.md" README.md && \
   grep -q "QUICK_START.md" README.md; then
    echo -e "${GREEN}✅ README includes new documentation${NC}"
    ((TESTS_PASSED++))
else
    echo -e "${YELLOW}⚠️  README may need updates${NC}"
    ((TESTS_FAILED++))
fi
echo ""

# Summary
echo "======================================"
echo "Test Summary"
echo "======================================"
echo -e "${GREEN}Passed: $TESTS_PASSED${NC}"
echo -e "${RED}Failed: $TESTS_FAILED${NC}"
echo ""

if [ $TESTS_FAILED -eq 0 ]; then
    echo -e "${GREEN}🎉 All tests passed! Ready for deployment.${NC}"
    echo ""
    echo "Next steps:"
    echo "1. Refresh AWS credentials: aws configure sso (or aws configure)"
    echo "2. Set ElevenLabs API key: export ELEVENLABS_API_KEY=your_key"
    echo "3. Run setup: ./setup-aws-services.sh"
    exit 0
else
    echo -e "${RED}⚠️  Some tests failed. Please review the output above.${NC}"
    exit 1
fi
