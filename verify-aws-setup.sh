#!/bin/bash

# Verify AWS Services Setup for Conversation Maker
# Tests all AWS integrations: Lambda, API Gateway, Bedrock, and ElevenLabs

set -e

echo "🔍 Verifying AWS Services Setup"
echo "================================"
echo ""

REGION="us-east-1"
FUNCTION_NAME="conversation-maker-api"

# Colors
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
NC='\033[0m'

# Test 1: AWS Credentials
echo "1️⃣  Testing AWS Credentials..."
if aws sts get-caller-identity &> /dev/null; then
    ACCOUNT_ID=$(aws sts get-caller-identity --query Account --output text)
    echo -e "${GREEN}✅ AWS credentials valid (Account: $ACCOUNT_ID)${NC}"
else
    echo -e "${RED}❌ AWS credentials not configured${NC}"
    exit 1
fi
echo ""

# Test 2: Lambda Function
echo "2️⃣  Testing Lambda Function..."
if aws lambda get-function --function-name $FUNCTION_NAME --region $REGION &> /dev/null; then
    echo -e "${GREEN}✅ Lambda function exists: $FUNCTION_NAME${NC}"
    
    # Get Lambda details
    LAMBDA_RUNTIME=$(aws lambda get-function-configuration --function-name $FUNCTION_NAME --region $REGION --query 'Runtime' --output text)
    LAMBDA_MEMORY=$(aws lambda get-function-configuration --function-name $FUNCTION_NAME --region $REGION --query 'MemorySize' --output text)
    LAMBDA_TIMEOUT=$(aws lambda get-function-configuration --function-name $FUNCTION_NAME --region $REGION --query 'Timeout' --output text)
    
    echo "   Runtime: $LAMBDA_RUNTIME"
    echo "   Memory: ${LAMBDA_MEMORY}MB"
    echo "   Timeout: ${LAMBDA_TIMEOUT}s"
else
    echo -e "${RED}❌ Lambda function not found${NC}"
    exit 1
fi
echo ""

# Test 3: API Gateway
echo "3️⃣  Testing API Gateway..."
API_ID=$(aws apigateway get-rest-apis --region $REGION --query "items[?name=='conversation-maker-api'].id" --output text)

if [ ! -z "$API_ID" ]; then
    API_URL="https://${API_ID}.execute-api.${REGION}.amazonaws.com/prod"
    echo -e "${GREEN}✅ API Gateway exists: $API_ID${NC}"
    echo "   URL: $API_URL"
else
    echo -e "${RED}❌ API Gateway not found${NC}"
    exit 1
fi
echo ""

# Test 4: IAM Role
echo "4️⃣  Testing IAM Role..."
if aws iam get-role --role-name ConversationMakerLambdaRole --region $REGION &> /dev/null; then
    echo -e "${GREEN}✅ IAM role exists: ConversationMakerLambdaRole${NC}"
    
    # Check attached policies
    POLICIES=$(aws iam list-attached-role-policies --role-name ConversationMakerLambdaRole --region $REGION --query 'AttachedPolicies[].PolicyName' --output text)
    echo "   Attached policies: $POLICIES"
else
    echo -e "${RED}❌ IAM role not found${NC}"
    exit 1
fi
echo ""

# Test 5: Bedrock Access
echo "5️⃣  Testing AWS Bedrock Access..."
if aws bedrock list-foundation-models --region $REGION &> /dev/null 2>&1; then
    echo -e "${GREEN}✅ Bedrock API accessible${NC}"
    
    # Check if Claude 3 Haiku is available
    HAIKU_AVAILABLE=$(aws bedrock list-foundation-models --region $REGION --query "modelSummaries[?contains(modelId, 'claude-3-haiku')].modelId" --output text 2>/dev/null || echo "")
    
    if [ ! -z "$HAIKU_AVAILABLE" ]; then
        echo -e "${GREEN}✅ Claude 3 Haiku model available${NC}"
    else
        echo -e "${YELLOW}⚠️  Claude 3 Haiku model not found. You may need to enable it in Bedrock console.${NC}"
        echo "   Visit: https://console.aws.amazon.com/bedrock/"
    fi
else
    echo -e "${YELLOW}⚠️  Cannot verify Bedrock access (may need permissions)${NC}"
fi
echo ""

# Test 6: Lambda Environment Variables
echo "6️⃣  Testing Lambda Environment Variables..."
ENV_VARS=$(aws lambda get-function-configuration --function-name $FUNCTION_NAME --region $REGION --query 'Environment.Variables' --output json)

if echo "$ENV_VARS" | grep -q "ELEVENLABS_API_KEY"; then
    echo -e "${GREEN}✅ ELEVENLABS_API_KEY configured${NC}"
else
    echo -e "${RED}❌ ELEVENLABS_API_KEY not set${NC}"
fi

if echo "$ENV_VARS" | grep -q "BEDROCK_MODEL_ID"; then
    echo -e "${GREEN}✅ BEDROCK_MODEL_ID configured${NC}"
else
    echo -e "${YELLOW}⚠️  BEDROCK_MODEL_ID not set${NC}"
fi
echo ""

# Test 7: API Gateway Health Check
echo "7️⃣  Testing API Gateway Endpoint..."
HEALTH_RESPONSE=$(curl -s -o /dev/null -w "%{http_code}" "$API_URL/api/health" 2>/dev/null || echo "000")

if [ "$HEALTH_RESPONSE" = "200" ]; then
    echo -e "${GREEN}✅ API Gateway responding (HTTP 200)${NC}"
elif [ "$HEALTH_RESPONSE" = "000" ]; then
    echo -e "${YELLOW}⚠️  Could not reach API Gateway (check network/CORS)${NC}"
else
    echo -e "${YELLOW}⚠️  API Gateway returned HTTP $HEALTH_RESPONSE${NC}"
fi
echo ""

# Test 8: Lambda Invocation Test
echo "8️⃣  Testing Lambda Direct Invocation..."
aws lambda invoke \
    --function-name $FUNCTION_NAME \
    --payload '{"httpMethod":"GET","path":"/api/health","headers":{}}' \
    --region $REGION \
    /tmp/lambda-test-response.json > /dev/null 2>&1

if [ -f /tmp/lambda-test-response.json ]; then
    STATUS_CODE=$(cat /tmp/lambda-test-response.json | grep -o '"statusCode":[0-9]*' | cut -d':' -f2 || echo "0")
    
    if [ "$STATUS_CODE" = "200" ]; then
        echo -e "${GREEN}✅ Lambda invocation successful${NC}"
    else
        echo -e "${YELLOW}⚠️  Lambda returned status code: $STATUS_CODE${NC}"
    fi
    
    rm /tmp/lambda-test-response.json
else
    echo -e "${RED}❌ Lambda invocation failed${NC}"
fi
echo ""

# Test 9: Check CloudWatch Logs
echo "9️⃣  Checking CloudWatch Logs..."
LOG_GROUP="/aws/lambda/$FUNCTION_NAME"

if aws logs describe-log-groups --log-group-name-prefix $LOG_GROUP --region $REGION | grep -q $LOG_GROUP; then
    echo -e "${GREEN}✅ CloudWatch log group exists${NC}"
    echo "   View logs: aws logs tail $LOG_GROUP --follow --region $REGION"
else
    echo -e "${YELLOW}⚠️  CloudWatch log group not found (will be created on first invocation)${NC}"
fi
echo ""

# Summary
echo "================================"
echo "📊 Verification Summary"
echo "================================"
echo ""
echo -e "${GREEN}API Endpoint:${NC}"
echo "$API_URL"
echo ""
echo -e "${GREEN}Test Commands:${NC}"
echo ""
echo "# Test health endpoint:"
echo "curl $API_URL/api/health"
echo ""
echo "# Test voices endpoint:"
echo "curl $API_URL/api/voices"
echo ""
echo "# Test conversation generation:"
echo "curl -X POST $API_URL/api/conversation/generate \\"
echo "  -H 'Content-Type: application/json' \\"
echo "  -d '{\"prompt\":\"A quick chat about weather\",\"options\":{\"length\":\"short\"},\"speakers\":[{\"name\":\"Alice\"},{\"name\":\"Bob\"}]}'"
echo ""
echo -e "${GREEN}View Logs:${NC}"
echo "aws logs tail $LOG_GROUP --follow --region $REGION"
echo ""
echo -e "${GREEN}Update Lambda Code:${NC}"
echo "./deploy-lambda-code-only.sh"
echo ""
