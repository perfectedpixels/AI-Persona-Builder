#!/bin/bash

# Deploy Conversation Maker API to AWS Lambda
# SECURITY: Uses IAM roles - NO access keys required!

set -e  # Exit on error

echo "🔒 Security Check: Verifying no AWS credentials in environment..."
if [ ! -z "$AWS_ACCESS_KEY_ID" ] || [ ! -z "$AWS_SECRET_ACCESS_KEY" ]; then
  echo "⚠️  WARNING: AWS credentials detected in environment!"
  echo "This deployment uses IAM roles. Unset AWS_ACCESS_KEY_ID and AWS_SECRET_ACCESS_KEY."
  echo ""
  echo "Run: unset AWS_ACCESS_KEY_ID AWS_SECRET_ACCESS_KEY"
  exit 1
fi

echo "✅ No AWS credentials in environment (good!)"
echo ""

# Check for ElevenLabs API key
if [ -z "$ELEVENLABS_API_KEY" ]; then
  echo "❌ ERROR: ELEVENLABS_API_KEY not set"
  echo "Run: export ELEVENLABS_API_KEY=your_key_here"
  exit 1
fi

echo "📦 Creating Lambda deployment package..."

# Create temp directory
rm -rf lambda-package
mkdir -p lambda-package

# Copy server code
cp -r server lambda-package/
cp lambda.js lambda-package/
cp package.json lambda-package/
cp package-lock.json lambda-package/

# Install production dependencies
cd lambda-package
npm install --production --silent
cd ..

# Create ZIP file
cd lambda-package
zip -r ../conversation-maker-lambda.zip . -x "*.git*" "*.DS_Store" > /dev/null
cd ..

echo "✅ Package created: conversation-maker-lambda.zip"
echo ""

# Get AWS account ID
ACCOUNT_ID=$(aws sts get-caller-identity --query Account --output text)
ROLE_ARN="arn:aws:iam::${ACCOUNT_ID}:role/ConversationMakerLambdaRole"

echo "🔍 Checking if IAM role exists..."

# Check if role exists
if aws iam get-role --role-name ConversationMakerLambdaRole 2>/dev/null; then
  echo "✅ IAM role exists: ConversationMakerLambdaRole"
else
  echo "📝 Creating IAM role: ConversationMakerLambdaRole"
  
  # Create IAM role
  aws iam create-role \
    --role-name ConversationMakerLambdaRole \
    --assume-role-policy-document '{
      "Version": "2012-10-17",
      "Statement": [{
        "Effect": "Allow",
        "Principal": {"Service": "lambda.amazonaws.com"},
        "Action": "sts:AssumeRole"
      }]
    }' > /dev/null
  
  # Attach CloudWatch Logs policy
  aws iam attach-role-policy \
    --role-name ConversationMakerLambdaRole \
    --policy-arn arn:aws:iam::aws:policy/service-role/AWSLambdaBasicExecutionRole
  
  # Attach Bedrock policy
  aws iam attach-role-policy \
    --role-name ConversationMakerLambdaRole \
    --policy-arn arn:aws:iam::aws:policy/AmazonBedrockFullAccess
  
  echo "✅ IAM role created with Bedrock and CloudWatch permissions"
  echo "⏳ Waiting 10 seconds for IAM role to propagate..."
  sleep 10
fi

echo ""
echo "🚀 Deploying to AWS Lambda..."

# Try to update existing function
if aws lambda update-function-code \
  --function-name conversation-maker-api \
  --zip-file fileb://conversation-maker-lambda.zip \
  --region us-east-1 > /dev/null 2>&1; then
  
  echo "✅ Lambda function code updated"
  
else
  echo "📝 Creating new Lambda function..."
  
  # Create function
  aws lambda create-function \
    --function-name conversation-maker-api \
    --runtime nodejs18.x \
    --role "$ROLE_ARN" \
    --handler lambda.handler \
    --zip-file fileb://conversation-maker-lambda.zip \
    --timeout 30 \
    --memory-size 512 \
    --region us-east-1 > /dev/null
  
  echo "✅ Lambda function created"
fi

echo ""
echo "⚙️  Updating Lambda configuration..."

# Set environment variables (ONLY third-party API keys, NO AWS credentials)
aws lambda update-function-configuration \
  --function-name conversation-maker-api \
  --environment "Variables={
    NODE_ENV=production,
    ELEVENLABS_API_KEY=${ELEVENLABS_API_KEY},
    ELEVENLABS_MODEL_ID=eleven_monolingual_v1,
    BEDROCK_MODEL_ID=us.anthropic.claude-3-haiku-20240307-v1:0
  }" \
  --region us-east-1 > /dev/null

echo "✅ Lambda configuration updated"
echo ""

# Clean up
rm -rf lambda-package
rm conversation-maker-lambda.zip

echo "🎉 Deployment complete!"
echo ""
echo "📋 Next Steps:"
echo "1. Create API Gateway (if not exists): See DEPLOYMENT.md"
echo "2. Update Amplify environment variable: REACT_APP_API_URL=<api-gateway-url>"
echo "3. Test Lambda: aws lambda invoke --function-name conversation-maker-api response.json"
echo ""
echo "🔒 Security Notes:"
echo "✅ Lambda uses IAM role (no access keys)"
echo "✅ Only ElevenLabs API key stored in environment"
echo "✅ AWS credentials obtained automatically via execution role"
