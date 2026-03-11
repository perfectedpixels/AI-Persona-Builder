#!/bin/bash

# Setup API Gateway for Conversation Maker Lambda
# Run this after deploying Lambda with ./deploy-lambda.sh

set -e

echo "🚀 Setting up API Gateway for Conversation Maker..."
echo ""

# Get Lambda ARN
echo "📋 Getting Lambda function details..."
LAMBDA_ARN=$(aws lambda get-function \
  --function-name conversation-maker-api \
  --query 'Configuration.FunctionArn' \
  --output text \
  --region us-east-1)

if [ -z "$LAMBDA_ARN" ]; then
  echo "❌ ERROR: Lambda function 'conversation-maker-api' not found"
  echo "Run ./deploy-lambda.sh first"
  exit 1
fi

echo "✅ Found Lambda: $LAMBDA_ARN"
echo ""

# Check if API already exists
echo "🔍 Checking for existing API Gateway..."
EXISTING_API=$(aws apigateway get-rest-apis \
  --query "items[?name=='conversation-maker-api'].id" \
  --output text \
  --region us-east-1)

if [ ! -z "$EXISTING_API" ]; then
  echo "⚠️  API Gateway 'conversation-maker-api' already exists (ID: $EXISTING_API)"
  echo ""
  read -p "Do you want to delete and recreate it? (y/N): " -n 1 -r
  echo
  if [[ $REPLY =~ ^[Yy]$ ]]; then
    echo "🗑️  Deleting existing API..."
    aws apigateway delete-rest-api \
      --rest-api-id $EXISTING_API \
      --region us-east-1
    echo "✅ Deleted"
  else
    echo "Keeping existing API. Exiting."
    exit 0
  fi
fi

echo ""
echo "📝 Creating REST API..."
API_ID=$(aws apigateway create-rest-api \
  --name "conversation-maker-api" \
  --description "Conversation Maker API Gateway" \
  --endpoint-configuration types=REGIONAL \
  --region us-east-1 \
  --query 'id' \
  --output text)

echo "✅ API created: $API_ID"
echo ""

# Get root resource
echo "📋 Getting root resource..."
ROOT_ID=$(aws apigateway get-resources \
  --rest-api-id $API_ID \
  --region us-east-1 \
  --query 'items[0].id' \
  --output text)

# Create {proxy+} resource
echo "📝 Creating proxy resource..."
RESOURCE_ID=$(aws apigateway create-resource \
  --rest-api-id $API_ID \
  --parent-id $ROOT_ID \
  --path-part '{proxy+}' \
  --region us-east-1 \
  --query 'id' \
  --output text)

echo "✅ Proxy resource created"
echo ""

# Create ANY method
echo "📝 Creating ANY method..."
aws apigateway put-method \
  --rest-api-id $API_ID \
  --resource-id $RESOURCE_ID \
  --http-method ANY \
  --authorization-type NONE \
  --region us-east-1 > /dev/null

echo "✅ Method created"
echo ""

# Set up Lambda integration
echo "🔗 Connecting to Lambda..."
aws apigateway put-integration \
  --rest-api-id $API_ID \
  --resource-id $RESOURCE_ID \
  --http-method ANY \
  --type AWS_PROXY \
  --integration-http-method POST \
  --uri "arn:aws:apigateway:us-east-1:lambda:path/2015-03-31/functions/$LAMBDA_ARN/invocations" \
  --region us-east-1 > /dev/null

echo "✅ Lambda integration configured"
echo ""

# Add Lambda permission
echo "🔐 Adding Lambda invoke permission..."
aws lambda add-permission \
  --function-name conversation-maker-api \
  --statement-id apigateway-invoke-$(date +%s) \
  --action lambda:InvokeFunction \
  --principal apigateway.amazonaws.com \
  --source-arn "arn:aws:execute-api:us-east-1:*:$API_ID/*/*" \
  --region us-east-1 > /dev/null 2>&1 || echo "⚠️  Permission may already exist (OK)"

echo "✅ Permission added"
echo ""

# Enable binary media types for audio
echo "🎵 Enabling binary media types for audio..."
aws apigateway update-rest-api \
  --rest-api-id $API_ID \
  --patch-operations op=add,path=/binaryMediaTypes/audio~1mpeg \
  --region us-east-1 > /dev/null

echo "✅ Binary media types configured"
echo ""

# Deploy API
echo "🚀 Deploying API to 'prod' stage..."
aws apigateway create-deployment \
  --rest-api-id $API_ID \
  --stage-name prod \
  --stage-description "Production deployment" \
  --description "Initial deployment" \
  --region us-east-1 > /dev/null

echo "✅ API deployed"
echo ""

# Get API URL
API_URL="https://$API_ID.execute-api.us-east-1.amazonaws.com/prod"

echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "🎉 API Gateway setup complete!"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""
echo "📋 API Details:"
echo "   API ID:  $API_ID"
echo "   Region:  us-east-1"
echo "   Stage:   prod"
echo ""
echo "🌐 API URL:"
echo "   $API_URL"
echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""
echo "📋 Next Steps:"
echo ""
echo "1. Test your API:"
echo "   curl $API_URL/api/voices"
echo ""
echo "2. Deploy frontend with Amplify:"
echo "   - Set environment variable: REACT_APP_API_URL=$API_URL"
echo "   - See DEPLOYMENT_GUIDE.md for details"
echo ""
echo "3. Update local .env for testing:"
echo "   echo 'REACT_APP_API_URL=$API_URL' >> .env"
echo ""
