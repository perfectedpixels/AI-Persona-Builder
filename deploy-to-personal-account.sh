#!/bin/bash
# Deploy Conversation Maker to personal AWS account (582234715800)
# Based on AWS_MIGRATION.md runbook
#
# Usage:
#   AWS_PROFILE=personal ./deploy-to-personal-account.sh
#   # or: export AWS_PROFILE=personal && ./deploy-to-personal-account.sh
#
# After deploy, set Vercel env var: VITE_API_URL = <API URL from output>

set -e

# Prevent AWS CLI from using a pager (which blocks the script)
export AWS_PAGER=""

echo "🚀 Deploying Conversation Maker to personal AWS account..."
echo ""

# Use personal profile if set (avoids wrong-account errors)
if [ -n "$AWS_PROFILE" ]; then
  echo "Using AWS profile: $AWS_PROFILE"
fi

# Configuration
REGION="us-east-1"
ACCOUNT_ID="582234715800"
FUNCTION_NAME="conversation-maker-api"
ROLE_NAME="ConversationMakerLambdaRole"
API_NAME="conversation-maker-api"
S3_BUCKET="conversation-maker-app-${ACCOUNT_ID}"
MODEL_ID="us.anthropic.claude-sonnet-4-20250514-v1:0"

# Verify we're on the right account
echo "🔍 Verifying AWS identity..."
CURRENT_ACCOUNT=$(aws sts get-caller-identity --query Account --output text 2>&1)
if [ "$CURRENT_ACCOUNT" != "$ACCOUNT_ID" ]; then
  echo "❌ Wrong AWS account! Expected $ACCOUNT_ID (personal), got $CURRENT_ACCOUNT"
  echo ""
  echo "Switch to your personal account:"
  echo "  export AWS_PROFILE=personal"
  echo "  ./deploy-to-personal-account.sh"
  echo ""
  echo "Or configure the personal profile:"
  echo "  aws configure --profile personal"
  echo "  (use Access Key + Secret for account $ACCOUNT_ID)"
  echo ""
  echo "Then run: AWS_PROFILE=personal ./deploy-to-personal-account.sh"
  exit 1
fi
echo "✅ Confirmed account: $ACCOUNT_ID"
echo ""

# ============================================================
# STEP 1: Accept Anthropic model agreement (if not already done)
# ============================================================
echo "📋 Step 1: Checking Anthropic model agreement..."
# This may already be done from the chatbot migration
aws bedrock create-foundation-model-agreement \
  --model-id "anthropic.claude-sonnet-4-20250514-v1:0" \
  --region $REGION 2>/dev/null || echo "  (Agreement may already exist - continuing)"
echo ""

# ============================================================
# STEP 2: Create IAM Role for Lambda
# ============================================================
echo "📋 Step 2: Creating IAM role..."
ROLE_ARN="arn:aws:iam::${ACCOUNT_ID}:role/${ROLE_NAME}"

if aws iam get-role --role-name $ROLE_NAME > /dev/null 2>&1; then
  echo "✅ IAM role already exists: $ROLE_NAME"
else
  echo "  Creating IAM role: $ROLE_NAME"
  aws iam create-role \
    --role-name $ROLE_NAME \
    --assume-role-policy-document '{
      "Version": "2012-10-17",
      "Statement": [{
        "Effect": "Allow",
        "Principal": {"Service": "lambda.amazonaws.com"},
        "Action": "sts:AssumeRole"
      }]
    }'

  # Attach policies
  aws iam attach-role-policy \
    --role-name $ROLE_NAME \
    --policy-arn arn:aws:iam::aws:policy/service-role/AWSLambdaBasicExecutionRole

  aws iam attach-role-policy \
    --role-name $ROLE_NAME \
    --policy-arn arn:aws:iam::aws:policy/AmazonBedrockFullAccess

  echo "  Waiting 10s for role propagation..."
  sleep 10
  echo "✅ IAM role created"
fi
echo ""

# ============================================================
# STEP 3: Build Lambda deployment package
# ============================================================
echo "📋 Step 3: Building Lambda deployment package..."

# Clean up old packages
rm -rf lambda-package deploy-temp
rm -f conversation-maker-lambda.zip

# Create package directory
mkdir -p lambda-package

# Copy server code
cp -r server lambda-package/
cp lambda.js lambda-package/
cp package.json lambda-package/
cp package-lock.json lambda-package/ 2>/dev/null || true

# Install production dependencies
cd lambda-package
npm install --production --no-optional 2>/dev/null
cd ..

# Create zip
cd lambda-package
zip -r ../conversation-maker-lambda.zip . -x "*.git*" "*.DS_Store" > /dev/null
cd ..

ZIPSIZE=$(ls -lh conversation-maker-lambda.zip | awk '{print $5}')
echo "✅ Lambda package built: conversation-maker-lambda.zip ($ZIPSIZE)"
echo ""

# ============================================================
# STEP 4: Create or update Lambda function
# ============================================================
echo "📋 Step 4: Deploying Lambda function..."

# Read ElevenLabs key from env or .env
if [ -n "$ELEVENLABS_API_KEY" ]; then
  ELEVENLABS_KEY="$ELEVENLABS_API_KEY"
elif [ -f .env ] && grep -q ELEVENLABS_API_KEY .env; then
  ELEVENLABS_KEY=$(grep ELEVENLABS_API_KEY .env | cut -d= -f2)
else
  echo "❌ ELEVENLABS_API_KEY required. Set it: export ELEVENLABS_API_KEY=your_key"
  exit 1
fi

if aws lambda get-function --function-name $FUNCTION_NAME --region $REGION > /dev/null 2>&1; then
  echo "  Updating existing Lambda function..."
  aws lambda update-function-code \
    --function-name $FUNCTION_NAME \
    --zip-file fileb://conversation-maker-lambda.zip \
    --region $REGION > /dev/null

  # Wait for update to complete
  echo "  Waiting for update..."
  aws lambda wait function-updated --function-name $FUNCTION_NAME --region $REGION 2>/dev/null || sleep 5

  aws lambda update-function-configuration \
    --function-name $FUNCTION_NAME \
    --timeout 90 \
    --environment "Variables={
      NODE_ENV=production,
      ELEVENLABS_API_KEY=${ELEVENLABS_KEY},
      ELEVENLABS_MODEL_ID=eleven_monolingual_v1,
      BEDROCK_MODEL_ID=${MODEL_ID}
    }" \
    --region $REGION > /dev/null
else
  echo "  Creating new Lambda function..."
  aws lambda create-function \
    --function-name $FUNCTION_NAME \
    --runtime nodejs18.x \
    --role "$ROLE_ARN" \
    --handler lambda.handler \
    --zip-file fileb://conversation-maker-lambda.zip \
    --timeout 90 \
    --memory-size 512 \
    --environment "Variables={
      NODE_ENV=production,
      ELEVENLABS_API_KEY=${ELEVENLABS_KEY},
      ELEVENLABS_MODEL_ID=eleven_monolingual_v1,
      BEDROCK_MODEL_ID=${MODEL_ID}
    }" \
    --region $REGION > /dev/null

  echo "  Waiting for function to be active..."
  aws lambda wait function-active --function-name $FUNCTION_NAME --region $REGION 2>/dev/null || sleep 10
fi
echo "✅ Lambda function deployed"
echo ""

# ============================================================
# STEP 5: Create API Gateway
# ============================================================
echo "📋 Step 5: Setting up API Gateway..."

EXISTING_API=$(aws apigateway get-rest-apis \
  --query "items[?name=='${API_NAME}'].id" \
  --output text \
  --region $REGION 2>/dev/null)

if [ ! -z "$EXISTING_API" ] && [ "$EXISTING_API" != "None" ]; then
  API_ID=$EXISTING_API
  echo "✅ API Gateway already exists: $API_ID"
fi

# Set integration timeout to 90s (document processing can take 30-90s)
# Default is 29s; without this, long requests return 504
if [ ! -z "$API_ID" ]; then
  echo "  Setting API Gateway integration timeout to 90s..."
  for RESOURCE_ID in $(aws apigateway get-resources --rest-api-id $API_ID --region $REGION --query 'items[].id' --output text 2>/dev/null); do
    aws apigateway update-integration \
      --rest-api-id $API_ID \
      --resource-id $RESOURCE_ID \
      --http-method ANY \
      --patch-operations op=replace,path=/timeoutInMillis,value=90000 \
      --region $REGION 2>/dev/null || true
  done
  aws apigateway create-deployment --rest-api-id $API_ID --stage-name prod --region $REGION > /dev/null 2>&1 || true
  echo "  (If timeout update failed, request quota increase in Service Quotas: API Gateway → Maximum integration timeout)"

  # Add CORS headers to 4XX/5XX gateway responses (504 timeouts otherwise show "Origin not allowed")
  echo "  Adding CORS headers to error responses..."
  for RT in DEFAULT_4XX DEFAULT_5XX; do
    aws apigateway put-gateway-response \
      --rest-api-id $API_ID \
      --response-type $RT \
      --response-parameters '{"gatewayresponse.header.Access-Control-Allow-Origin":"*","gatewayresponse.header.Access-Control-Allow-Headers":"Content-Type,Authorization,Accept,Origin,X-Requested-With"}' \
      --region $REGION 2>/dev/null || true
  done
  aws apigateway create-deployment --rest-api-id $API_ID --stage-name prod --region $REGION > /dev/null 2>&1 || true

  # Enable binary media type for zip export (fixes "Inappropriate file type" on macOS)
  echo "  Enabling application/zip binary media type..."
  aws apigateway update-rest-api \
    --rest-api-id $API_ID \
    --patch-operations op=add,path=/binaryMediaTypes/application~1zip \
    --region $REGION 2>/dev/null || true
  aws apigateway create-deployment --rest-api-id $API_ID --stage-name prod --region $REGION > /dev/null 2>&1 || true
fi

if [ -z "$API_ID" ]; then
  echo "  Creating REST API..."
  API_ID=$(aws apigateway create-rest-api \
    --name "$API_NAME" \
    --description "Conversation Maker API" \
    --endpoint-configuration types=REGIONAL \
    --query 'id' \
    --output text \
    --region $REGION)

  # Get root resource ID
  ROOT_ID=$(aws apigateway get-resources \
    --rest-api-id $API_ID \
    --query 'items[?path==`/`].id' \
    --output text \
    --region $REGION)

  # Create proxy resource {proxy+}
  PROXY_ID=$(aws apigateway create-resource \
    --rest-api-id $API_ID \
    --parent-id $ROOT_ID \
    --path-part '{proxy+}' \
    --query 'id' \
    --output text \
    --region $REGION)

  LAMBDA_ARN="arn:aws:lambda:${REGION}:${ACCOUNT_ID}:function:${FUNCTION_NAME}"
  LAMBDA_URI="arn:aws:apigateway:${REGION}:lambda:path/2015-03-31/functions/${LAMBDA_ARN}/invocations"

  # Create ANY method on proxy
  aws apigateway put-method \
    --rest-api-id $API_ID \
    --resource-id $PROXY_ID \
    --http-method ANY \
    --authorization-type NONE \
    --region $REGION > /dev/null

  aws apigateway put-integration \
    --rest-api-id $API_ID \
    --resource-id $PROXY_ID \
    --http-method ANY \
    --type AWS_PROXY \
    --integration-http-method POST \
    --uri "$LAMBDA_URI" \
    --region $REGION > /dev/null

  # Create ANY method on root
  aws apigateway put-method \
    --rest-api-id $API_ID \
    --resource-id $ROOT_ID \
    --http-method ANY \
    --authorization-type NONE \
    --region $REGION > /dev/null

  aws apigateway put-integration \
    --rest-api-id $API_ID \
    --resource-id $ROOT_ID \
    --http-method ANY \
    --type AWS_PROXY \
    --integration-http-method POST \
    --uri "$LAMBDA_URI" \
    --region $REGION > /dev/null

  # Add Lambda permission
  aws lambda add-permission \
    --function-name $FUNCTION_NAME \
    --statement-id apigateway-invoke-$(date +%s) \
    --action lambda:InvokeFunction \
    --principal apigateway.amazonaws.com \
    --source-arn "arn:aws:execute-api:${REGION}:${ACCOUNT_ID}:${API_ID}/*" \
    --region $REGION > /dev/null

  # Deploy to prod stage
  aws apigateway create-deployment \
    --rest-api-id $API_ID \
    --stage-name prod \
    --region $REGION > /dev/null

  echo "✅ API Gateway created: $API_ID"
  # Set 90s timeout on new integrations
  for RESOURCE_ID in $(aws apigateway get-resources --rest-api-id $API_ID --region $REGION --query 'items[].id' --output text 2>/dev/null); do
    aws apigateway update-integration \
      --rest-api-id $API_ID \
      --resource-id $RESOURCE_ID \
      --http-method ANY \
      --patch-operations op=replace,path=/timeoutInMillis,value=90000 \
      --region $REGION 2>/dev/null || true
  done
  # CORS on error responses (504 etc.)
  for RT in DEFAULT_4XX DEFAULT_5XX; do
    aws apigateway put-gateway-response \
      --rest-api-id $API_ID \
      --response-type $RT \
      --response-parameters '{"gatewayresponse.header.Access-Control-Allow-Origin":"*","gatewayresponse.header.Access-Control-Allow-Headers":"Content-Type,Authorization,Accept,Origin,X-Requested-With"}' \
      --region $REGION 2>/dev/null || true
  done
  aws apigateway update-rest-api --rest-api-id $API_ID --patch-operations op=add,path=/binaryMediaTypes/application~1zip --region $REGION 2>/dev/null || true
  aws apigateway create-deployment --rest-api-id $API_ID --stage-name prod --region $REGION > /dev/null 2>&1 || true
fi

API_URL="https://${API_ID}.execute-api.${REGION}.amazonaws.com/prod"
echo "  API URL: $API_URL"
echo ""

# ============================================================
# STEP 6: Build and deploy frontend
# ============================================================
echo "📋 Step 6: Building frontend..."

# Update client .env with new API URL
echo "VITE_API_URL=${API_URL}" > client/.env

cd client
npm run build 2>/dev/null
cd ..
echo "✅ Frontend built"
echo ""

# Create S3 bucket for frontend
echo "📋 Step 7: Deploying frontend to S3..."

if aws s3 ls "s3://${S3_BUCKET}" 2>/dev/null; then
  echo "  S3 bucket exists: $S3_BUCKET"
else
  echo "  Creating S3 bucket: $S3_BUCKET"
  aws s3 mb "s3://${S3_BUCKET}" --region $REGION

  # Enable website hosting
  aws s3 website "s3://${S3_BUCKET}" \
    --index-document index.html \
    --error-document index.html

  # Set bucket policy for public access
  aws s3api put-public-access-block \
    --bucket $S3_BUCKET \
    --public-access-block-configuration "BlockPublicAcls=false,IgnorePublicAcls=false,BlockPublicPolicy=false,RestrictPublicBuckets=false"

  aws s3api put-bucket-policy \
    --bucket $S3_BUCKET \
    --policy "{
      \"Version\": \"2012-10-17\",
      \"Statement\": [{
        \"Sid\": \"PublicReadGetObject\",
        \"Effect\": \"Allow\",
        \"Principal\": \"*\",
        \"Action\": \"s3:GetObject\",
        \"Resource\": \"arn:aws:s3:::${S3_BUCKET}/*\"
      }]
    }"
fi

# Upload build files
aws s3 sync client/build/ "s3://${S3_BUCKET}/" --delete --region $REGION > /dev/null
echo "✅ Frontend deployed to S3"
echo ""

S3_URL="http://${S3_BUCKET}.s3-website-${REGION}.amazonaws.com"

# ============================================================
# STEP 8: Validation gates
# ============================================================
echo "📋 Step 8: Running validation gates..."
echo ""

# Gate 1: Identity
echo "  Gate 1 - Identity: ✅ (verified at start)"

# Gate 2: Health check
echo -n "  Gate 2 - API Health: "
HEALTH=$(curl -s "${API_URL}/api/health" 2>/dev/null)
if echo "$HEALTH" | grep -q '"status":"ok"'; then
  echo "✅"
else
  echo "⚠️  Health check returned: $HEALTH"
fi

# Gate 3: Bedrock test
echo -n "  Gate 3 - Bedrock: "
BEDROCK=$(curl -s "${API_URL}/api/test-bedrock" 2>/dev/null)
if echo "$BEDROCK" | grep -q '"success":true'; then
  echo "✅"
else
  echo "⚠️  Bedrock test returned: $BEDROCK"
fi

echo ""
echo "============================================================"
echo "🎉 DEPLOYMENT COMPLETE!"
echo "============================================================"
echo ""
echo "Frontend:  $S3_URL"
echo "API:       $API_URL"
echo "Lambda:    $FUNCTION_NAME"
echo "Account:   $ACCOUNT_ID"
echo "Model:     $MODEL_ID"
echo ""
echo "Test endpoints:"
echo "  curl ${API_URL}/api/health"
echo "  curl ${API_URL}/api/test-bedrock"
echo ""
echo "To point Vercel to this personal API:"
echo "  Vercel → Project → Settings → Environment Variables"
echo "  Set VITE_API_URL = ${API_URL}"
echo ""
