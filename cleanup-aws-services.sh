#!/bin/bash

# Cleanup AWS Services for Conversation Maker
# WARNING: This will delete all AWS resources created for this app

set -e

echo "⚠️  AWS Services Cleanup"
echo "========================"
echo ""
echo "This will DELETE the following resources:"
echo "• Lambda function: conversation-maker-api"
echo "• API Gateway: conversation-maker-api"
echo "• IAM Role: ConversationMakerLambdaRole"
echo "• CloudWatch log groups"
echo ""

read -p "Are you sure you want to continue? (type 'yes' to confirm): " CONFIRM

if [ "$CONFIRM" != "yes" ]; then
    echo "Cleanup cancelled."
    exit 0
fi

echo ""
echo "Starting cleanup..."
echo ""

REGION="us-east-1"
FUNCTION_NAME="conversation-maker-api"
ROLE_NAME="ConversationMakerLambdaRole"
API_NAME="conversation-maker-api"

# Colors
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
NC='\033[0m'

# 1. Delete API Gateway
echo "1️⃣  Deleting API Gateway..."
API_ID=$(aws apigateway get-rest-apis --region $REGION --query "items[?name=='${API_NAME}'].id" --output text 2>/dev/null || echo "")

if [ ! -z "$API_ID" ]; then
    aws apigateway delete-rest-api --rest-api-id $API_ID --region $REGION
    echo -e "${GREEN}✅ API Gateway deleted: $API_ID${NC}"
else
    echo -e "${YELLOW}⚠️  API Gateway not found${NC}"
fi
echo ""

# 2. Delete Lambda function
echo "2️⃣  Deleting Lambda function..."
if aws lambda get-function --function-name $FUNCTION_NAME --region $REGION &> /dev/null; then
    aws lambda delete-function --function-name $FUNCTION_NAME --region $REGION
    echo -e "${GREEN}✅ Lambda function deleted: $FUNCTION_NAME${NC}"
else
    echo -e "${YELLOW}⚠️  Lambda function not found${NC}"
fi
echo ""

# 3. Delete CloudWatch log group
echo "3️⃣  Deleting CloudWatch logs..."
LOG_GROUP="/aws/lambda/$FUNCTION_NAME"

if aws logs describe-log-groups --log-group-name-prefix $LOG_GROUP --region $REGION 2>/dev/null | grep -q $LOG_GROUP; then
    aws logs delete-log-group --log-group-name $LOG_GROUP --region $REGION
    echo -e "${GREEN}✅ CloudWatch log group deleted${NC}"
else
    echo -e "${YELLOW}⚠️  CloudWatch log group not found${NC}"
fi
echo ""

# 4. Detach and delete IAM role
echo "4️⃣  Deleting IAM role..."
if aws iam get-role --role-name $ROLE_NAME --region $REGION &> /dev/null; then
    # Detach policies
    echo "Detaching policies..."
    aws iam detach-role-policy \
        --role-name $ROLE_NAME \
        --policy-arn arn:aws:iam::aws:policy/service-role/AWSLambdaBasicExecutionRole \
        --region $REGION 2>/dev/null || true
    
    aws iam detach-role-policy \
        --role-name $ROLE_NAME \
        --policy-arn arn:aws:iam::aws:policy/AmazonBedrockFullAccess \
        --region $REGION 2>/dev/null || true
    
    # Delete role
    aws iam delete-role --role-name $ROLE_NAME --region $REGION
    echo -e "${GREEN}✅ IAM role deleted: $ROLE_NAME${NC}"
else
    echo -e "${YELLOW}⚠️  IAM role not found${NC}"
fi
echo ""

# 5. Clean up local files
echo "5️⃣  Cleaning up local files..."
rm -rf lambda-package conversation-maker-lambda.zip 2>/dev/null || true
echo -e "${GREEN}✅ Local deployment files cleaned${NC}"
echo ""

echo "================================"
echo "✅ Cleanup Complete!"
echo "================================"
echo ""
echo -e "${GREEN}Deleted Resources:${NC}"
echo "• Lambda function"
echo "• API Gateway"
echo "• IAM role"
echo "• CloudWatch logs"
echo ""
echo -e "${YELLOW}Note: Amplify app (if created) must be deleted manually:${NC}"
echo "https://console.aws.amazon.com/amplify/"
echo ""
echo -e "${YELLOW}Note: Bedrock model access remains enabled (no cost when not in use)${NC}"
echo ""
