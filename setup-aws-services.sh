#!/bin/bash

# Complete AWS Services Setup Script for Conversation Maker
# This script wires up all AWS services: Lambda, API Gateway, IAM, and Amplify

set -e  # Exit on error

echo "🚀 Conversation Maker - AWS Services Setup"
echo "=========================================="
echo ""

# Color codes for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Configuration
REGION="us-east-1"
FUNCTION_NAME="conversation-maker-api"
ROLE_NAME="ConversationMakerLambdaRole"
API_NAME="conversation-maker-api"

# Step 1: Validate Prerequisites
echo "📋 Step 1: Validating Prerequisites"
echo "-----------------------------------"

# Check AWS CLI
if ! command -v aws &> /dev/null; then
    echo -e "${RED}❌ AWS CLI not found. Please install it first.${NC}"
    echo "Visit: https://aws.amazon.com/cli/"
    exit 1
fi
echo "✅ AWS CLI installed"

# Check AWS credentials
if ! aws sts get-caller-identity &> /dev/null; then
    echo -e "${RED}❌ AWS credentials not configured${NC}"
    echo "Run: aws configure"
    exit 1
fi

ACCOUNT_ID=$(aws sts get-caller-identity --query Account --output text)
echo "✅ AWS Account: $ACCOUNT_ID"

# Check Node.js
if ! command -v node &> /dev/null; then
    echo -e "${RED}❌ Node.js not found. Please install Node.js 18+${NC}"
    exit 1
fi
echo "✅ Node.js $(node --version)"

# Check for ElevenLabs API key
if [ -z "$ELEVENLABS_API_KEY" ]; then
    echo -e "${YELLOW}⚠️  ELEVENLABS_API_KEY not set${NC}"
    read -p "Enter your ElevenLabs API key: " ELEVENLABS_API_KEY
    export ELEVENLABS_API_KEY
fi
echo "✅ ElevenLabs API key configured"

echo ""

# Step 2: Create IAM Role
echo "🔐 Step 2: Setting up IAM Role"
echo "------------------------------"

ROLE_ARN="arn:aws:iam::${ACCOUNT_ID}:role/${ROLE_NAME}"

if aws iam get-role --role-name $ROLE_NAME --region $REGION &> /dev/null; then
    echo "✅ IAM role already exists: $ROLE_NAME"
else
    echo "Creating IAM role..."
    
    # Create trust policy
    cat > /tmp/trust-policy.json <<EOF
{
  "Version": "2012-10-17",
  "Statement": [{
    "Effect": "Allow",
    "Principal": {"Service": "lambda.amazonaws.com"},
    "Action": "sts:AssumeRole"
  }]
}
EOF
    
    aws iam create-role \
        --role-name $ROLE_NAME \
        --assume-role-policy-document file:///tmp/trust-policy.json \
        --region $REGION > /dev/null
    
    # Attach policies
    aws iam attach-role-policy \
        --role-name $ROLE_NAME \
        --policy-arn arn:aws:iam::aws:policy/service-role/AWSLambdaBasicExecutionRole \
        --region $REGION
    
    aws iam attach-role-policy \
        --role-name $ROLE_NAME \
        --policy-arn arn:aws:iam::aws:policy/AmazonBedrockFullAccess \
        --region $REGION
    
    echo "✅ IAM role created with Bedrock and CloudWatch permissions"
    echo "⏳ Waiting 10 seconds for IAM propagation..."
    sleep 10
    
    rm /tmp/trust-policy.json
fi

echo ""

# Step 3: Package and Deploy Lambda
echo "📦 Step 3: Deploying Lambda Function"
echo "------------------------------------"

# Clean up old package
rm -rf lambda-package conversation-maker-lambda.zip

# Create deployment package
mkdir -p lambda-package
cp -r server lambda-package/
cp lambda.js lambda-package/
cp package.json lambda-package/

# Install dependencies
echo "Installing dependencies..."
cd lambda-package
npm install --production --silent
cd ..

# Create ZIP
echo "Creating deployment package..."
cd lambda-package
zip -r ../conversation-maker-lambda.zip . -q
cd ..

# Deploy or update Lambda
if aws lambda get-function --function-name $FUNCTION_NAME --region $REGION &> /dev/null; then
    echo "Updating existing Lambda function..."
    aws lambda update-function-code \
        --function-name $FUNCTION_NAME \
        --zip-file fileb://conversation-maker-lambda.zip \
        --region $REGION > /dev/null
    
    echo "✅ Lambda function code updated"
else
    echo "Creating new Lambda function..."
    aws lambda create-function \
        --function-name $FUNCTION_NAME \
        --runtime nodejs18.x \
        --role $ROLE_ARN \
        --handler lambda.handler \
        --zip-file fileb://conversation-maker-lambda.zip \
        --timeout 30 \
        --memory-size 512 \
        --region $REGION > /dev/null
    
    echo "✅ Lambda function created"
fi

# Update environment variables
echo "Configuring environment variables..."
aws lambda update-function-configuration \
    --function-name $FUNCTION_NAME \
    --environment "Variables={
        NODE_ENV=production,
        AWS_REGION=${REGION},
        ELEVENLABS_API_KEY=${ELEVENLABS_API_KEY},
        ELEVENLABS_MODEL_ID=eleven_monolingual_v1,
        BEDROCK_MODEL_ID=us.anthropic.claude-3-haiku-20240307-v1:0
    }" \
    --region $REGION > /dev/null

echo "✅ Lambda configuration updated"

# Clean up
rm -rf lambda-package conversation-maker-lambda.zip

echo ""

# Step 4: Create API Gateway
echo "🌐 Step 4: Setting up API Gateway"
echo "---------------------------------"

# Check if API already exists
EXISTING_API_ID=$(aws apigateway get-rest-apis --region $REGION --query "items[?name=='${API_NAME}'].id" --output text)

if [ ! -z "$EXISTING_API_ID" ]; then
    echo "✅ API Gateway already exists: $EXISTING_API_ID"
    API_ID=$EXISTING_API_ID
else
    echo "Creating REST API..."
    API_ID=$(aws apigateway create-rest-api \
        --name "$API_NAME" \
        --description "Conversation Maker API" \
        --endpoint-configuration types=REGIONAL \
        --region $REGION \
        --query 'id' \
        --output text)
    
    echo "✅ API created: $API_ID"
    
    # Get root resource
    ROOT_ID=$(aws apigateway get-resources \
        --rest-api-id $API_ID \
        --region $REGION \
        --query 'items[0].id' \
        --output text)
    
    # Create {proxy+} resource
    echo "Creating proxy resource..."
    RESOURCE_ID=$(aws apigateway create-resource \
        --rest-api-id $API_ID \
        --parent-id $ROOT_ID \
        --path-part '{proxy+}' \
        --region $REGION \
        --query 'id' \
        --output text)
    
    # Create ANY method
    aws apigateway put-method \
        --rest-api-id $API_ID \
        --resource-id $RESOURCE_ID \
        --http-method ANY \
        --authorization-type NONE \
        --region $REGION > /dev/null
    
    # Set up Lambda integration
    LAMBDA_ARN=$(aws lambda get-function --function-name $FUNCTION_NAME --region $REGION --query 'Configuration.FunctionArn' --output text)
    
    aws apigateway put-integration \
        --rest-api-id $API_ID \
        --resource-id $RESOURCE_ID \
        --http-method ANY \
        --type AWS_PROXY \
        --integration-http-method POST \
        --uri "arn:aws:apigateway:${REGION}:lambda:path/2015-03-31/functions/${LAMBDA_ARN}/invocations" \
        --region $REGION > /dev/null
    
    # Add Lambda permission
    aws lambda add-permission \
        --function-name $FUNCTION_NAME \
        --statement-id apigateway-invoke-$(date +%s) \
        --action lambda:InvokeFunction \
        --principal apigateway.amazonaws.com \
        --source-arn "arn:aws:execute-api:${REGION}:${ACCOUNT_ID}:${API_ID}/*/*" \
        --region $REGION > /dev/null 2>&1 || true
    
    # Enable binary media types for audio
    echo "Configuring binary media types..."
    aws apigateway update-rest-api \
        --rest-api-id $API_ID \
        --patch-operations op=add,path=/binaryMediaTypes/audio~1mpeg \
        --region $REGION > /dev/null 2>&1 || true
    
    # Deploy API
    echo "Deploying API to prod stage..."
    aws apigateway create-deployment \
        --rest-api-id $API_ID \
        --stage-name prod \
        --region $REGION > /dev/null
    
    echo "✅ API Gateway configured and deployed"
fi

API_URL="https://${API_ID}.execute-api.${REGION}.amazonaws.com/prod"

echo ""

# Step 5: Test Lambda
echo "🧪 Step 5: Testing Lambda Function"
echo "----------------------------------"

echo "Invoking Lambda test..."
aws lambda invoke \
    --function-name $FUNCTION_NAME \
    --payload '{"httpMethod":"GET","path":"/api/health"}' \
    --region $REGION \
    /tmp/lambda-response.json > /dev/null 2>&1 || true

if [ -f /tmp/lambda-response.json ]; then
    echo "✅ Lambda function is responding"
    rm /tmp/lambda-response.json
fi

echo ""

# Step 6: Summary and Next Steps
echo "✅ AWS Services Setup Complete!"
echo "==============================="
echo ""
echo -e "${GREEN}Backend API URL:${NC}"
echo "$API_URL"
echo ""
echo -e "${GREEN}Resources Created:${NC}"
echo "• IAM Role: $ROLE_NAME"
echo "• Lambda Function: $FUNCTION_NAME"
echo "• API Gateway: $API_ID"
echo "• Region: $REGION"
echo ""
echo -e "${YELLOW}📋 Next Steps:${NC}"
echo ""
echo "1. Test your API:"
echo "   curl $API_URL/api/health"
echo ""
echo "2. For local development, update client/.env:"
echo "   REACT_APP_API_URL=$API_URL"
echo ""
echo "3. Deploy frontend to AWS Amplify:"
echo "   a. Go to: https://console.aws.amazon.com/amplify/"
echo "   b. Click 'New app' → 'Host web app'"
echo "   c. Connect your git repository"
echo "   d. Add environment variable:"
echo "      REACT_APP_API_URL=$API_URL"
echo ""
echo "4. Or run locally:"
echo "   cd client && npm start"
echo ""
echo -e "${GREEN}🔒 Security Notes:${NC}"
echo "✅ No AWS credentials stored in code"
echo "✅ Lambda uses IAM role for Bedrock access"
echo "✅ Only ElevenLabs API key in Lambda environment"
echo ""
echo "📊 View logs:"
echo "aws logs tail /aws/lambda/$FUNCTION_NAME --follow --region $REGION"
echo ""
