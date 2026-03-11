# AWS Services Setup Guide

Complete guide to wire up Conversation Maker with AWS services.

## Architecture Overview

```
┌─────────────────┐
│   React App     │ ← AWS Amplify (Frontend)
│   (Client)      │
└────────┬────────┘
         │ HTTPS
         ↓
┌─────────────────┐
│  API Gateway    │ ← REST API Endpoint
└────────┬────────┘
         │
         ↓
┌─────────────────┐
│  Lambda         │ ← Node.js/Express Backend
│  (Serverless)   │
└────┬───────┬────┘
     │       │
     ↓       ↓
┌─────────┐ ┌──────────────┐
│ Bedrock │ │ ElevenLabs   │
│ (Claude)│ │ API          │
└─────────┘ └──────────────┘
```

## AWS Services Used

1. **AWS Lambda** - Serverless backend (Node.js/Express)
2. **API Gateway** - REST API endpoint with CORS support
3. **IAM** - Execution role with Bedrock permissions
4. **Bedrock** - Claude 3 Haiku for script generation
5. **CloudWatch** - Logging and monitoring
6. **Amplify** - Frontend hosting and CI/CD

## Prerequisites

- AWS Account with Bedrock access
- AWS CLI installed and configured
- Node.js 18+
- ElevenLabs API key
- Git repository (for Amplify deployment)

## Quick Setup (Automated)

### Option 1: Complete Setup (Recommended)

Run the automated setup script:

```bash
cd conversation-maker

# Set your ElevenLabs API key
export ELEVENLABS_API_KEY=your_key_here

# Run setup script
chmod +x setup-aws-services.sh
./setup-aws-services.sh
```

This script will:
- ✅ Create IAM role with Bedrock permissions
- ✅ Package and deploy Lambda function
- ✅ Create and configure API Gateway
- ✅ Set up binary media types for audio
- ✅ Configure environment variables
- ✅ Test the deployment

### Option 2: Verify Existing Setup

If you've already deployed, verify everything is working:

```bash
chmod +x verify-aws-setup.sh
./verify-aws-setup.sh
```

This will test:
- AWS credentials
- Lambda function
- API Gateway
- IAM role
- Bedrock access
- Environment variables
- API endpoints

## Manual Setup (Step by Step)

### Step 1: Enable AWS Bedrock

1. Go to [AWS Bedrock Console](https://console.aws.amazon.com/bedrock/)
2. Navigate to "Model access"
3. Click "Enable specific models"
4. Enable "Claude 3 Haiku" by Anthropic
5. Wait for approval (usually instant)

### Step 2: Deploy Backend

```bash
cd conversation-maker

# Set environment variable
export ELEVENLABS_API_KEY=your_key_here

# Deploy Lambda
./deploy-lambda.sh
```

### Step 3: Create API Gateway

```bash
# Get Lambda ARN
LAMBDA_ARN=$(aws lambda get-function \
  --function-name conversation-maker-api \
  --query 'Configuration.FunctionArn' \
  --output text \
  --region us-east-1)

# Create REST API
API_ID=$(aws apigateway create-rest-api \
  --name "conversation-maker-api" \
  --description "Conversation Maker API" \
  --endpoint-configuration types=REGIONAL \
  --region us-east-1 \
  --query 'id' \
  --output text)

echo "API ID: $API_ID"

# Get root resource
ROOT_ID=$(aws apigateway get-resources \
  --rest-api-id $API_ID \
  --region us-east-1 \
  --query 'items[0].id' \
  --output text)

# Create proxy resource
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

# Add Lambda permission
aws lambda add-permission \
  --function-name conversation-maker-api \
  --statement-id apigateway-invoke \
  --action lambda:InvokeFunction \
  --principal apigateway.amazonaws.com \
  --source-arn "arn:aws:execute-api:us-east-1:*:$API_ID/*/*" \
  --region us-east-1

# Enable binary media types
aws apigateway update-rest-api \
  --rest-api-id $API_ID \
  --patch-operations op=add,path=/binaryMediaTypes/audio~1mpeg \
  --region us-east-1

# Deploy to prod
aws apigateway create-deployment \
  --rest-api-id $API_ID \
  --stage-name prod \
  --region us-east-1

# Get API URL
API_URL="https://$API_ID.execute-api.us-east-1.amazonaws.com/prod"
echo "API URL: $API_URL"
```

### Step 4: Deploy Frontend to Amplify

#### Via AWS Console:

1. Go to [AWS Amplify Console](https://console.aws.amazon.com/amplify/)
2. Click "New app" → "Host web app"
3. Choose your git provider (CodeCommit, GitHub, etc.)
4. Select repository: `conversation-maker`
5. Branch: `main`
6. Build settings: Auto-detected from `amplify.yml`
7. Add environment variable:
   - Key: `REACT_APP_API_URL`
   - Value: `https://YOUR_API_ID.execute-api.us-east-1.amazonaws.com/prod`
8. Click "Save and deploy"

#### Via AWS CLI:

```bash
# Create Amplify app
APP_ID=$(aws amplify create-app \
  --name conversation-maker \
  --repository https://git-codecommit.us-east-1.amazonaws.com/v1/repos/conversation-maker \
  --region us-east-1 \
  --query 'app.appId' \
  --output text)

# Create branch
aws amplify create-branch \
  --app-id $APP_ID \
  --branch-name main \
  --region us-east-1

# Set environment variable
aws amplify update-app \
  --app-id $APP_ID \
  --environment-variables REACT_APP_API_URL=$API_URL \
  --region us-east-1

# Start deployment
aws amplify start-job \
  --app-id $APP_ID \
  --branch-name main \
  --job-type RELEASE \
  --region us-east-1
```

## Testing Your Setup

### Test API Endpoints

```bash
# Set your API URL
API_URL="https://YOUR_API_ID.execute-api.us-east-1.amazonaws.com/prod"

# Test health check
curl $API_URL/api/health

# Test voices endpoint
curl $API_URL/api/voices

# Test conversation generation
curl -X POST $API_URL/api/conversation/generate \
  -H 'Content-Type: application/json' \
  -d '{
    "prompt": "A quick chat about weather",
    "options": {"length": "short"},
    "speakers": [
      {"name": "Alice", "context": "Cheerful"},
      {"name": "Bob", "context": "Curious"}
    ]
  }'
```

### Test Lambda Directly

```bash
aws lambda invoke \
  --function-name conversation-maker-api \
  --payload '{"httpMethod":"GET","path":"/api/health"}' \
  --region us-east-1 \
  response.json

cat response.json
```

### View Logs

```bash
# Tail Lambda logs
aws logs tail /aws/lambda/conversation-maker-api --follow --region us-east-1

# View specific log stream
aws logs describe-log-streams \
  --log-group-name /aws/lambda/conversation-maker-api \
  --region us-east-1
```

## Updating Your Deployment

### Update Lambda Code Only

```bash
./deploy-lambda-code-only.sh
```

### Update Lambda with New Environment Variables

```bash
export ELEVENLABS_API_KEY=new_key_here
./deploy-lambda.sh
```

### Update Frontend

Just push to your git repository:

```bash
git add .
git commit -m "Update frontend"
git push origin main
```

Amplify will auto-deploy.

## Configuration

### Environment Variables

#### Lambda Environment Variables:
- `NODE_ENV` - Set to "production"
- `AWS_REGION` - AWS region (us-east-1)
- `ELEVENLABS_API_KEY` - Your ElevenLabs API key
- `ELEVENLABS_MODEL_ID` - ElevenLabs model (eleven_monolingual_v1)
- `BEDROCK_MODEL_ID` - Bedrock model ID (us.anthropic.claude-3-haiku-20240307-v1:0)

#### Amplify Environment Variables:
- `REACT_APP_API_URL` - Your API Gateway URL

### IAM Permissions

The Lambda execution role needs:
- `AWSLambdaBasicExecutionRole` - CloudWatch Logs
- `AmazonBedrockFullAccess` - Bedrock API access

## Troubleshooting

### Lambda Timeout Errors

Increase timeout:
```bash
aws lambda update-function-configuration \
  --function-name conversation-maker-api \
  --timeout 60 \
  --region us-east-1
```

### Bedrock Access Denied

1. Check model is enabled in Bedrock console
2. Verify IAM role has Bedrock permissions
3. Ensure you're using the correct region (us-east-1)

### CORS Errors

The Lambda function includes CORS headers. If issues persist:
1. Check API Gateway CORS configuration
2. Verify binary media types include `audio/mpeg`
3. Check browser console for specific errors

### Audio Not Playing

1. Verify ElevenLabs API key is valid
2. Check API Gateway binary media types
3. Ensure Lambda timeout is sufficient (30s+)
4. Check CloudWatch logs for errors

### Build Failures in Amplify

1. Check build logs in Amplify console
2. Verify Node.js version (18+)
3. Check `amplify.yml` configuration
4. Ensure `REACT_APP_API_URL` is set

## Security Best Practices

✅ **What we do:**
- No AWS credentials in code or environment
- Lambda uses IAM execution role
- Only third-party API keys in Lambda environment
- Frontend has no API keys
- All API calls go through Lambda

❌ **What to avoid:**
- Never commit `.env` files
- Never hardcode API keys
- Never expose AWS credentials
- Never commit `node_modules`

### Check for Secrets

Before committing:
```bash
./check-secrets.sh
```

## Cost Optimization

### Estimated Monthly Costs (Light Usage)

- Lambda: ~$0.20 (1M requests + compute)
- API Gateway: ~$3.50 (1M requests)
- Amplify: ~$5 (hosting + builds)
- Bedrock: Pay per token (~$0.25 per 1M input tokens)
- ElevenLabs: Based on your plan
- CloudWatch: ~$0.50 (logs)

**Total: ~$10/month for light usage**

### Cost Reduction Tips

1. Use Lambda reserved concurrency
2. Enable API Gateway caching
3. Optimize Bedrock prompts (fewer tokens)
4. Use ElevenLabs efficiently
5. Set CloudWatch log retention (7-30 days)

## Monitoring

### CloudWatch Metrics

Monitor these metrics:
- Lambda invocations
- Lambda errors
- Lambda duration
- API Gateway 4xx/5xx errors
- API Gateway latency

### Set Up Alarms

```bash
# Create alarm for Lambda errors
aws cloudwatch put-metric-alarm \
  --alarm-name conversation-maker-errors \
  --alarm-description "Alert on Lambda errors" \
  --metric-name Errors \
  --namespace AWS/Lambda \
  --statistic Sum \
  --period 300 \
  --threshold 5 \
  --comparison-operator GreaterThanThreshold \
  --dimensions Name=FunctionName,Value=conversation-maker-api \
  --evaluation-periods 1 \
  --region us-east-1
```

## Advanced Configuration

### Custom Domain

1. Register domain in Route 53
2. Create SSL certificate in ACM
3. Configure custom domain in API Gateway
4. Update Amplify with custom domain

### Authentication

Add AWS Cognito for user authentication:
1. Create Cognito User Pool
2. Add Cognito authorizer to API Gateway
3. Update frontend with Amplify Auth

### Rate Limiting

Add API Gateway usage plans:
```bash
aws apigateway create-usage-plan \
  --name "conversation-maker-plan" \
  --throttle burstLimit=100,rateLimit=50 \
  --quota limit=10000,period=DAY \
  --region us-east-1
```

## Support

### Useful Links

- [AWS Bedrock Documentation](https://docs.aws.amazon.com/bedrock/)
- [AWS Lambda Documentation](https://docs.aws.amazon.com/lambda/)
- [API Gateway Documentation](https://docs.aws.amazon.com/apigateway/)
- [AWS Amplify Documentation](https://docs.aws.amazon.com/amplify/)
- [ElevenLabs API Documentation](https://elevenlabs.io/docs)

### Get Help

- Check CloudWatch logs first
- Run `./verify-aws-setup.sh` to diagnose issues
- Review error messages in browser console
- Check AWS service health dashboard

## Next Steps

1. ✅ Complete AWS setup
2. ✅ Test all endpoints
3. ✅ Deploy frontend to Amplify
4. 🔄 Set up custom domain (optional)
5. 🔄 Add authentication (optional)
6. 🔄 Configure monitoring and alarms
7. 🔄 Set up CI/CD pipeline

---

**Need help?** Check the troubleshooting section or review CloudWatch logs.
