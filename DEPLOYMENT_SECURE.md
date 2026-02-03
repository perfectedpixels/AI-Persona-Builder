# Secure Deployment Guide - Zero-Credential Architecture

## Overview

This deployment uses **IAM roles exclusively** - no access keys anywhere. This prevents credential exposure and follows AWS security best practices.

## Architecture

```
┌─────────────────┐
│  Amplify        │  Frontend (React)
│  (Static Host)  │  - Only serves HTML/CSS/JS
└────────┬────────┘  - No backend code
         │
         │ HTTPS
         ▼
┌─────────────────┐
│  API Gateway    │  REST API
│  (Public URL)   │  - Routes requests to Lambda
└────────┬────────┘  - No authentication (public API)
         │
         │ Invoke
         ▼
┌─────────────────┐
│  Lambda         │  Backend (Node.js/Express)
│  + IAM Role     │  - Executes with IAM role
└────────┬────────┘  - No access keys needed
         │
         ├─────────────────┐
         │                 │
         ▼                 ▼
┌─────────────┐   ┌──────────────┐
│  Bedrock    │   │  ElevenLabs  │
│  (AI)       │   │  (Voice)     │
└─────────────┘   └──────────────┘
```

## Prerequisites

1. **AWS CLI configured with SSO or IAM role**
   ```bash
   aws configure sso
   # OR use IAM role if on EC2/Cloud9
   ```

2. **ElevenLabs API Key**
   - Get from: https://elevenlabs.io/app/settings/api-keys

3. **Required AWS Permissions**
   - IAM: Create roles, attach policies
   - Lambda: Create/update functions
   - API Gateway: Create REST APIs
   - Amplify: Create apps, set environment variables

## Step 1: Clean Up Exposed Credentials

### 1.1 Delete Exposed AWS Access Key

```bash
# List your access keys
aws iam list-access-keys --user-name <your-iam-username>

# Delete the exposed key
aws iam delete-access-key \
  --access-key-id AKIA2YLBW7AEHBITDC7Y \
  --user-name <your-iam-username>
```

### 1.2 Remove AWS Credentials from Amplify

1. Go to AWS Amplify Console
2. Select app: `d2b3efwoc19bjt`
3. Go to "Environment variables"
4. **DELETE** these variables:
   - `AWS_ACCESS_KEY_ID`
   - `AWS_SECRET_ACCESS_KEY`
5. **KEEP** only:
   - `REACT_APP_API_URL` (will update later)
6. Save changes

### 1.3 Verify Local Environment

```bash
cd conversation-tool

# Check .env file - should NOT have AWS credentials
cat .env

# If AWS credentials exist, remove them
# Keep only: AWS_REGION, BEDROCK_MODEL_ID, ELEVENLABS_API_KEY
```

## Step 2: Deploy Lambda Backend

### 2.1 Set ElevenLabs API Key

```bash
export ELEVENLABS_API_KEY=sk_056db134bc26b4a70766c7b9442e5d5b27805389213bdcfb
```

### 2.2 Run Deployment Script

```bash
cd conversation-tool
./deploy-lambda.sh
```

The script will:
- ✅ Check that NO AWS credentials are in environment
- ✅ Create IAM role `ConversationMakerLambdaRole` (if needed)
- ✅ Attach Bedrock and CloudWatch permissions
- ✅ Package and deploy Lambda function
- ✅ Set ONLY ElevenLabs API key in Lambda environment

### 2.3 Verify Lambda Deployment

```bash
# Check Lambda function exists
aws lambda get-function --function-name conversation-maker-api

# Test Lambda invocation
aws lambda invoke \
  --function-name conversation-maker-api \
  --payload '{"httpMethod":"GET","path":"/api/health"}' \
  response.json

cat response.json
```

## Step 3: Create API Gateway

### 3.1 Create REST API

```bash
# Create API
API_ID=$(aws apigateway create-rest-api \
  --name "Conversation Maker API" \
  --description "API for ElevenLabs Conversation Tool" \
  --endpoint-configuration types=REGIONAL \
  --query 'id' \
  --output text)

echo "API ID: $API_ID"

# Get root resource ID
ROOT_ID=$(aws apigateway get-resources \
  --rest-api-id $API_ID \
  --query 'items[0].id' \
  --output text)

echo "Root Resource ID: $ROOT_ID"
```

### 3.2 Create Proxy Resource

```bash
# Create {proxy+} resource
RESOURCE_ID=$(aws apigateway create-resource \
  --rest-api-id $API_ID \
  --parent-id $ROOT_ID \
  --path-part '{proxy+}' \
  --query 'id' \
  --output text)

echo "Proxy Resource ID: $RESOURCE_ID"
```

### 3.3 Create ANY Method

```bash
# Create ANY method
aws apigateway put-method \
  --rest-api-id $API_ID \
  --resource-id $RESOURCE_ID \
  --http-method ANY \
  --authorization-type NONE

# Get Lambda ARN
ACCOUNT_ID=$(aws sts get-caller-identity --query Account --output text)
LAMBDA_ARN="arn:aws:lambda:us-east-1:${ACCOUNT_ID}:function:conversation-maker-api"

# Set Lambda integration
aws apigateway put-integration \
  --rest-api-id $API_ID \
  --resource-id $RESOURCE_ID \
  --http-method ANY \
  --type AWS_PROXY \
  --integration-http-method POST \
  --uri "arn:aws:apigateway:us-east-1:lambda:path/2015-03-31/functions/${LAMBDA_ARN}/invocations"
```

### 3.4 Grant API Gateway Permission to Invoke Lambda

```bash
aws lambda add-permission \
  --function-name conversation-maker-api \
  --statement-id apigateway-invoke \
  --action lambda:InvokeFunction \
  --principal apigateway.amazonaws.com \
  --source-arn "arn:aws:execute-api:us-east-1:${ACCOUNT_ID}:${API_ID}/*/*"
```

### 3.5 Deploy API

```bash
# Create deployment
aws apigateway create-deployment \
  --rest-api-id $API_ID \
  --stage-name prod

# Get API URL
API_URL="https://${API_ID}.execute-api.us-east-1.amazonaws.com/prod"
echo ""
echo "🎉 API Gateway URL: $API_URL"
echo ""
```

### 3.6 Test API Gateway

```bash
# Test health endpoint
curl "${API_URL}/api/health"

# Should return: {"status":"ok","service":"conversation-maker-api"}
```

## Step 4: Update Amplify Frontend

### 4.1 Update Environment Variable

1. Go to AWS Amplify Console
2. Select app: `d2b3efwoc19bjt`
3. Go to "Environment variables"
4. Update `REACT_APP_API_URL` to your API Gateway URL:
   ```
   REACT_APP_API_URL=https://<api-id>.execute-api.us-east-1.amazonaws.com/prod
   ```
5. Save changes

### 4.2 Trigger Rebuild

1. In Amplify Console, go to "Deployments"
2. Click "Redeploy this version"
3. Wait for build to complete

### 4.3 Test Full Application

1. Open: https://d2b3efwoc19bjt.amplifyapp.com
2. Verify voices load successfully
3. Create a conversation and test voice generation

## Step 5: Security Verification

### 5.1 Run Security Checks

```bash
cd conversation-tool
npm run check-secrets
```

Should output:
```
✅ All security checks passed!
```

### 5.2 Verify No AWS Credentials Anywhere

```bash
# Check git history
git log --all --source --full-history -- .env

# Should return nothing (empty)

# Check tracked files
git ls-files | xargs grep -l "AKIA" 2>/dev/null

# Should return nothing (empty)
```

### 5.3 Verify Lambda Uses IAM Role

```bash
# Check Lambda configuration
aws lambda get-function-configuration \
  --function-name conversation-maker-api \
  --query 'Role'

# Should return: arn:aws:iam::<account>:role/ConversationMakerLambdaRole
```

### 5.4 Verify Lambda Environment Variables

```bash
# Check Lambda environment variables
aws lambda get-function-configuration \
  --function-name conversation-maker-api \
  --query 'Environment.Variables'

# Should contain ONLY:
# - NODE_ENV
# - ELEVENLABS_API_KEY
# - ELEVENLABS_MODEL_ID
# - BEDROCK_MODEL_ID
# Should NOT contain AWS_ACCESS_KEY_ID or AWS_SECRET_ACCESS_KEY
```

## Step 6: Set Up Git Pre-Commit Hook (Optional)

```bash
cd conversation-tool

# Create pre-commit hook
cat > .git/hooks/pre-commit << 'EOF'
#!/bin/bash
npm run check-secrets || exit 1
EOF

chmod +x .git/hooks/pre-commit

echo "✅ Pre-commit hook installed"
```

## Local Development

### Using AWS SSO (Recommended)

```bash
# Configure SSO
aws configure sso

# Start development
cd conversation-tool
export ELEVENLABS_API_KEY=your_key_here
npm run dev
```

### Using IAM Role (EC2/Cloud9)

```bash
# No AWS configuration needed - uses instance role
cd conversation-tool
export ELEVENLABS_API_KEY=your_key_here
npm run dev
```

## Monitoring & Maintenance

### View Lambda Logs

```bash
# Tail logs in real-time
aws logs tail /aws/lambda/conversation-maker-api --follow

# View recent errors
aws logs filter-log-events \
  --log-group-name /aws/lambda/conversation-maker-api \
  --filter-pattern "ERROR"
```

### Update Lambda Code

```bash
cd conversation-tool
export ELEVENLABS_API_KEY=your_key_here
./deploy-lambda.sh
```

### Rotate ElevenLabs API Key

```bash
# 1. Generate new key in ElevenLabs dashboard
# 2. Update Lambda environment variable
aws lambda update-function-configuration \
  --function-name conversation-maker-api \
  --environment "Variables={
    NODE_ENV=production,
    ELEVENLABS_API_KEY=<new_key>,
    ELEVENLABS_MODEL_ID=eleven_monolingual_v1,
    BEDROCK_MODEL_ID=us.anthropic.claude-3-haiku-20240307-v1:0
  }"

# 3. Update local .env file
```

## Troubleshooting

### Lambda Returns 502 Bad Gateway

```bash
# Check Lambda logs
aws logs tail /aws/lambda/conversation-maker-api --follow

# Common causes:
# - Lambda timeout (increase to 30s)
# - Memory limit (increase to 512MB)
# - Missing dependencies in package
```

### API Gateway Returns 403 Forbidden

```bash
# Check Lambda permission
aws lambda get-policy --function-name conversation-maker-api

# Re-add permission if missing
aws lambda add-permission \
  --function-name conversation-maker-api \
  --statement-id apigateway-invoke \
  --action lambda:InvokeFunction \
  --principal apigateway.amazonaws.com
```

### Bedrock Access Denied

```bash
# Check Lambda execution role
aws iam list-attached-role-policies \
  --role-name ConversationMakerLambdaRole

# Should include: AmazonBedrockFullAccess
```

## Cost Optimization

### Lambda
- Free tier: 1M requests/month, 400,000 GB-seconds compute
- After free tier: $0.20 per 1M requests

### API Gateway
- Free tier: 1M API calls/month (12 months)
- After free tier: $3.50 per 1M requests

### Bedrock
- Claude 3 Haiku: ~$0.25 per 1M input tokens
- Pay per use, no minimum

### Amplify
- Free tier: 1000 build minutes/month, 15 GB served/month
- After free tier: $0.01 per build minute

## Security Best Practices

✅ **DO:**
- Use IAM roles for all AWS services
- Store only third-party API keys in environment variables
- Run `npm run check-secrets` before every commit
- Rotate API keys annually
- Monitor CloudTrail for unusual activity
- Use AWS SSO for local development

❌ **DON'T:**
- Store AWS access keys anywhere
- Commit `.env` files to git
- Put secrets in Amplify environment variables (except third-party APIs)
- Use root AWS credentials
- Share API keys in documentation

## Support

For issues:
1. Check Lambda logs: `aws logs tail /aws/lambda/conversation-maker-api --follow`
2. Verify security: `npm run check-secrets`
3. Review: `SECURITY_INCIDENT_RESPONSE.md`
