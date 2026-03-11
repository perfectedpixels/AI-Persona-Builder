# AWS Deployment Guide

## Overview
This guide will help you deploy your own instance of Conversation Maker to AWS.

## Architecture
- **Frontend**: AWS Amplify (React app)
- **Backend**: AWS Lambda + API Gateway (Node.js/Express)
- **AI Services**: AWS Bedrock (Claude) + ElevenLabs API

## Prerequisites
1. AWS Account with:
   - AWS Bedrock access (Claude 3 Haiku model enabled)
   - Permissions to create Lambda, API Gateway, IAM roles, and Amplify apps
2. AWS CLI installed and configured (`aws configure`)
3. ElevenLabs API key
4. Git repository (you'll need write access for your own fork)

## Step 1: Deploy Backend (Lambda + API Gateway)

### 1.1 Set your ElevenLabs API key
```bash
export ELEVENLABS_API_KEY=your_elevenlabs_api_key_here
```

### 1.2 Deploy Lambda function
```bash
cd conversation-maker
./deploy-lambda.sh
```

This script will:
- Create IAM role with Bedrock and CloudWatch permissions
- Package and deploy Lambda function
- Set environment variables (ElevenLabs API key only)

### 1.3 Create API Gateway

```bash
# Get your Lambda function ARN
LAMBDA_ARN=$(aws lambda get-function --function-name conversation-maker-api --query 'Configuration.FunctionArn' --output text --region us-east-1)

# Create REST API
API_ID=$(aws apigateway create-rest-api \
  --name "conversation-maker-api" \
  --description "Conversation Maker API" \
  --endpoint-configuration types=REGIONAL \
  --region us-east-1 \
  --query 'id' \
  --output text)

echo "API ID: $API_ID"

# Get root resource ID
ROOT_ID=$(aws apigateway get-resources \
  --rest-api-id $API_ID \
  --region us-east-1 \
  --query 'items[0].id' \
  --output text)

# Create {proxy+} resource
RESOURCE_ID=$(aws apigateway create-resource \
  --rest-api-id $API_ID \
  --parent-id $ROOT_ID \
  --path-part '{proxy+}' \
  --region us-east-1 \
  --query 'id' \
  --output text)

# Create ANY method
aws apigateway put-method \
  --rest-api-id $API_ID \
  --resource-id $RESOURCE_ID \
  --http-method ANY \
  --authorization-type NONE \
  --region us-east-1

# Set up Lambda integration
aws apigateway put-integration \
  --rest-api-id $API_ID \
  --resource-id $RESOURCE_ID \
  --http-method ANY \
  --type AWS_PROXY \
  --integration-http-method POST \
  --uri "arn:aws:apigateway:us-east-1:lambda:path/2015-03-31/functions/$LAMBDA_ARN/invocations" \
  --region us-east-1

# Add Lambda permission for API Gateway
aws lambda add-permission \
  --function-name conversation-maker-api \
  --statement-id apigateway-invoke \
  --action lambda:InvokeFunction \
  --principal apigateway.amazonaws.com \
  --source-arn "arn:aws:execute-api:us-east-1:*:$API_ID/*/*" \
  --region us-east-1

# Enable binary media types for audio
aws apigateway update-rest-api \
  --rest-api-id $API_ID \
  --patch-operations op=add,path=/binaryMediaTypes/audio~1mpeg \
  --region us-east-1

# Deploy API
aws apigateway create-deployment \
  --rest-api-id $API_ID \
  --stage-name prod \
  --region us-east-1

# Get API URL
API_URL="https://$API_ID.execute-api.us-east-1.amazonaws.com/prod"
echo ""
echo "✅ API Gateway created!"
echo "API URL: $API_URL"
echo ""
echo "Save this URL - you'll need it for Amplify deployment"
```

## Step 2: Create Your Own Git Repository

Since you have read-only access to the original repo, create your own:

```bash
# Initialize new git repo in your project
cd conversation-maker
rm -rf .git
git init
git add .
git commit -m "Initial commit - forked from conversation-maker"

# Create a new CodeCommit repository
aws codecommit create-repository \
  --repository-name my-conversation-maker \
  --repository-description "My fork of Conversation Maker" \
  --region us-east-1

# Add remote and push
git remote add origin https://git-codecommit.us-east-1.amazonaws.com/v1/repos/my-conversation-maker
git push -u origin main
```

Or use GitHub/GitLab if you prefer.

## Step 3: Deploy Frontend (AWS Amplify)

### 3.1 Create Amplify App via Console

1. Go to AWS Amplify Console: https://console.aws.amazon.com/amplify/
2. Click "New app" → "Host web app"
3. Choose your git provider (CodeCommit, GitHub, etc.)
4. Select your repository: `my-conversation-maker`
5. Branch: `main`
6. App name: `my-conversation-maker`

### 3.2 Configure Build Settings

Amplify will auto-detect the `amplify.yml` file. Verify it looks correct.

### 3.3 Add Environment Variable

In Amplify Console:
1. Go to "Environment variables"
2. Add variable:
   - Key: `REACT_APP_API_URL`
   - Value: `https://YOUR_API_ID.execute-api.us-east-1.amazonaws.com/prod`
   - (Use the API URL from Step 1.3)

### 3.4 Deploy

Click "Save and deploy"

Amplify will:
- Install dependencies
- Build React app
- Deploy to CloudFront CDN

Your app will be available at: `https://[branch].[app-id].amplifyapp.com`

## Step 4: Enable CORS (if needed)

If you get CORS errors, update your Lambda to include proper headers. The current code should already handle this, but verify in `server/index.js`.

## Step 5: Test Your Deployment

1. Visit your Amplify URL
2. Try generating a conversation
3. Test voice synthesis
4. Check CloudWatch logs if issues occur:
   ```bash
   aws logs tail /aws/lambda/conversation-maker-api --follow --region us-east-1
   ```

## Updating Your Deployment

### Update Backend (Lambda)
```bash
# Code changes only
./deploy-lambda-code-only.sh

# Code + environment variables
export ELEVENLABS_API_KEY=your_key
./deploy-lambda.sh
```

### Update Frontend (Amplify)
Just push to your git repository:
```bash
git add .
git commit -m "Your changes"
git push origin main
```

Amplify will auto-deploy.

## Cost Estimates

- **Lambda**: ~$0.20 per 1M requests + compute time
- **API Gateway**: ~$3.50 per 1M requests
- **Amplify**: ~$0.15 per build minute + $0.15/GB hosting
- **Bedrock**: Pay per token (Claude 3 Haiku is cheapest)
- **ElevenLabs**: Based on your plan

For light usage, expect < $5/month for AWS services.

## Troubleshooting

### Lambda timeout errors
Increase timeout:
```bash
aws lambda update-function-configuration \
  --function-name conversation-maker-api \
  --timeout 60 \
  --region us-east-1
```

### Bedrock access denied
Enable Claude 3 Haiku in Bedrock console:
https://console.aws.amazon.com/bedrock/

### Audio not playing
Check API Gateway binary media types include `audio/mpeg`

### Build failures in Amplify
Check build logs in Amplify console and verify Node.js version matches (18+)

## Security Notes

✅ No AWS credentials stored in code or environment
✅ Lambda uses IAM execution role for Bedrock access
✅ Only ElevenLabs API key stored in Lambda environment
✅ Frontend has no API keys (all calls go through Lambda)

## Next Steps

- Set up custom domain in Amplify
- Add CloudWatch alarms for errors
- Set up AWS WAF for API protection
- Add authentication (Cognito) if needed
