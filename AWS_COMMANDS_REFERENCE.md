# AWS Commands Quick Reference

Essential AWS CLI commands for managing Conversation Maker.

## Setup & Deployment

### Complete Setup (Automated)
```bash
export ELEVENLABS_API_KEY=your_key_here
./setup-aws-services.sh
```

### Verify Setup
```bash
./verify-aws-setup.sh
```

### Deploy Lambda (Code Only)
```bash
./deploy-lambda-code-only.sh
```

### Deploy Lambda (Code + Environment)
```bash
export ELEVENLABS_API_KEY=your_key_here
./deploy-lambda.sh
```

### Cleanup All Resources
```bash
./cleanup-aws-services.sh
```

## Lambda Management

### Get Function Info
```bash
aws lambda get-function \
  --function-name conversation-maker-api \
  --region us-east-1
```

### Get Function Configuration
```bash
aws lambda get-function-configuration \
  --function-name conversation-maker-api \
  --region us-east-1
```

### Update Function Code
```bash
aws lambda update-function-code \
  --function-name conversation-maker-api \
  --zip-file fileb://conversation-maker-lambda.zip \
  --region us-east-1
```

### Update Environment Variables
```bash
aws lambda update-function-configuration \
  --function-name conversation-maker-api \
  --environment "Variables={
    NODE_ENV=production,
    ELEVENLABS_API_KEY=your_key,
    BEDROCK_MODEL_ID=us.anthropic.claude-3-haiku-20240307-v1:0
  }" \
  --region us-east-1
```

### Update Timeout
```bash
aws lambda update-function-configuration \
  --function-name conversation-maker-api \
  --timeout 60 \
  --region us-east-1
```

### Update Memory
```bash
aws lambda update-function-configuration \
  --function-name conversation-maker-api \
  --memory-size 1024 \
  --region us-east-1
```

### Invoke Function (Test)
```bash
aws lambda invoke \
  --function-name conversation-maker-api \
  --payload '{"httpMethod":"GET","path":"/api/health"}' \
  --region us-east-1 \
  response.json

cat response.json
```

### Delete Function
```bash
aws lambda delete-function \
  --function-name conversation-maker-api \
  --region us-east-1
```

## API Gateway Management

### List APIs
```bash
aws apigateway get-rest-apis --region us-east-1
```

### Get API Details
```bash
API_ID=your_api_id
aws apigateway get-rest-api \
  --rest-api-id $API_ID \
  --region us-east-1
```

### Get Resources
```bash
aws apigateway get-resources \
  --rest-api-id $API_ID \
  --region us-east-1
```

### Deploy API
```bash
aws apigateway create-deployment \
  --rest-api-id $API_ID \
  --stage-name prod \
  --region us-east-1
```

### Update Binary Media Types
```bash
aws apigateway update-rest-api \
  --rest-api-id $API_ID \
  --patch-operations op=add,path=/binaryMediaTypes/audio~1mpeg \
  --region us-east-1
```

### Delete API
```bash
aws apigateway delete-rest-api \
  --rest-api-id $API_ID \
  --region us-east-1
```

## IAM Management

### Get Role
```bash
aws iam get-role \
  --role-name ConversationMakerLambdaRole \
  --region us-east-1
```

### List Attached Policies
```bash
aws iam list-attached-role-policies \
  --role-name ConversationMakerLambdaRole \
  --region us-east-1
```

### Attach Policy
```bash
aws iam attach-role-policy \
  --role-name ConversationMakerLambdaRole \
  --policy-arn arn:aws:iam::aws:policy/AmazonBedrockFullAccess \
  --region us-east-1
```

### Detach Policy
```bash
aws iam detach-role-policy \
  --role-name ConversationMakerLambdaRole \
  --policy-arn arn:aws:iam::aws:policy/AmazonBedrockFullAccess \
  --region us-east-1
```

### Delete Role
```bash
# First detach all policies
aws iam detach-role-policy \
  --role-name ConversationMakerLambdaRole \
  --policy-arn arn:aws:iam::aws:policy/service-role/AWSLambdaBasicExecutionRole

aws iam detach-role-policy \
  --role-name ConversationMakerLambdaRole \
  --policy-arn arn:aws:iam::aws:policy/AmazonBedrockFullAccess

# Then delete role
aws iam delete-role \
  --role-name ConversationMakerLambdaRole \
  --region us-east-1
```

## CloudWatch Logs

### Tail Logs (Live)
```bash
aws logs tail /aws/lambda/conversation-maker-api \
  --follow \
  --region us-east-1
```

### Tail Logs (Last 100 Lines)
```bash
aws logs tail /aws/lambda/conversation-maker-api \
  --region us-east-1
```

### Tail Logs (Since Time)
```bash
aws logs tail /aws/lambda/conversation-maker-api \
  --since 1h \
  --region us-east-1
```

### Filter Logs (Errors Only)
```bash
aws logs tail /aws/lambda/conversation-maker-api \
  --filter-pattern "ERROR" \
  --region us-east-1
```

### List Log Streams
```bash
aws logs describe-log-streams \
  --log-group-name /aws/lambda/conversation-maker-api \
  --region us-east-1
```

### Delete Log Group
```bash
aws logs delete-log-group \
  --log-group-name /aws/lambda/conversation-maker-api \
  --region us-east-1
```

### Set Log Retention
```bash
aws logs put-retention-policy \
  --log-group-name /aws/lambda/conversation-maker-api \
  --retention-in-days 7 \
  --region us-east-1
```

## Bedrock

### List Foundation Models
```bash
aws bedrock list-foundation-models --region us-east-1
```

### Get Model Details
```bash
aws bedrock get-foundation-model \
  --model-identifier us.anthropic.claude-3-haiku-20240307-v1:0 \
  --region us-east-1
```

### List Model Access
```bash
aws bedrock list-model-customization-jobs --region us-east-1
```

## Amplify

### List Apps
```bash
aws amplify list-apps --region us-east-1
```

### Get App Details
```bash
APP_ID=your_app_id
aws amplify get-app \
  --app-id $APP_ID \
  --region us-east-1
```

### List Branches
```bash
aws amplify list-branches \
  --app-id $APP_ID \
  --region us-east-1
```

### Start Deployment
```bash
aws amplify start-job \
  --app-id $APP_ID \
  --branch-name main \
  --job-type RELEASE \
  --region us-east-1
```

### Update Environment Variables
```bash
aws amplify update-app \
  --app-id $APP_ID \
  --environment-variables REACT_APP_API_URL=https://api.example.com \
  --region us-east-1
```

### Delete App
```bash
aws amplify delete-app \
  --app-id $APP_ID \
  --region us-east-1
```

## CloudWatch Alarms

### Create Lambda Error Alarm
```bash
aws cloudwatch put-metric-alarm \
  --alarm-name conversation-maker-lambda-errors \
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

### Create API Gateway Error Alarm
```bash
aws cloudwatch put-metric-alarm \
  --alarm-name conversation-maker-api-errors \
  --alarm-description "Alert on API Gateway 5xx errors" \
  --metric-name 5XXError \
  --namespace AWS/ApiGateway \
  --statistic Sum \
  --period 300 \
  --threshold 10 \
  --comparison-operator GreaterThanThreshold \
  --dimensions Name=ApiName,Value=conversation-maker-api \
  --evaluation-periods 1 \
  --region us-east-1
```

### List Alarms
```bash
aws cloudwatch describe-alarms --region us-east-1
```

### Delete Alarm
```bash
aws cloudwatch delete-alarms \
  --alarm-names conversation-maker-lambda-errors \
  --region us-east-1
```

## Testing & Debugging

### Test API Health Endpoint
```bash
API_URL="https://YOUR_API_ID.execute-api.us-east-1.amazonaws.com/prod"
curl $API_URL/api/health
```

### Test Voices Endpoint
```bash
curl $API_URL/api/voices
```

### Test Conversation Generation
```bash
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

### Test Audio Synthesis
```bash
curl -X POST $API_URL/api/conversation/synthesize \
  -H 'Content-Type: application/json' \
  -d '{
    "text": "Hello, this is a test.",
    "voiceId": "21m00Tcm4TlvDq8ikWAM",
    "prosody": {
      "stability": 0.75,
      "similarity_boost": 0.75,
      "style": 0.5,
      "use_speaker_boost": true
    },
    "speed": 1.0
  }' \
  --output test-audio.mp3
```

## Account & Credentials

### Get Account ID
```bash
aws sts get-caller-identity --query Account --output text
```

### Get Current User
```bash
aws sts get-caller-identity
```

### Configure AWS CLI
```bash
aws configure
```

### List Configured Profiles
```bash
aws configure list-profiles
```

### Use Specific Profile
```bash
aws lambda get-function \
  --function-name conversation-maker-api \
  --profile my-profile \
  --region us-east-1
```

## Cost & Billing

### Get Cost and Usage
```bash
aws ce get-cost-and-usage \
  --time-period Start=2024-02-01,End=2024-02-28 \
  --granularity MONTHLY \
  --metrics BlendedCost \
  --region us-east-1
```

### Create Billing Alarm
```bash
aws cloudwatch put-metric-alarm \
  --alarm-name billing-alarm \
  --alarm-description "Alert when bill exceeds $50" \
  --metric-name EstimatedCharges \
  --namespace AWS/Billing \
  --statistic Maximum \
  --period 21600 \
  --threshold 50 \
  --comparison-operator GreaterThanThreshold \
  --evaluation-periods 1 \
  --region us-east-1
```

## Useful Aliases

Add these to your `~/.bashrc` or `~/.zshrc`:

```bash
# Conversation Maker aliases
alias cm-logs='aws logs tail /aws/lambda/conversation-maker-api --follow --region us-east-1'
alias cm-deploy='cd ~/conversation-maker && ./deploy-lambda-code-only.sh'
alias cm-verify='cd ~/conversation-maker && ./verify-aws-setup.sh'
alias cm-lambda='aws lambda get-function-configuration --function-name conversation-maker-api --region us-east-1'
alias cm-api='aws apigateway get-rest-apis --region us-east-1 --query "items[?name==\`conversation-maker-api\`]"'
```

## Environment Variables

Set these for convenience:

```bash
# Add to ~/.bashrc or ~/.zshrc
export AWS_REGION=us-east-1
export CM_FUNCTION_NAME=conversation-maker-api
export CM_API_NAME=conversation-maker-api
export ELEVENLABS_API_KEY=your_key_here

# Then use in commands
aws lambda get-function --function-name $CM_FUNCTION_NAME --region $AWS_REGION
```

## Quick Troubleshooting

### Lambda not responding
```bash
# Check function exists
aws lambda get-function --function-name conversation-maker-api --region us-east-1

# Check recent errors
aws logs tail /aws/lambda/conversation-maker-api --since 10m --region us-east-1

# Test invocation
aws lambda invoke --function-name conversation-maker-api \
  --payload '{"httpMethod":"GET","path":"/api/health"}' \
  response.json
```

### API Gateway issues
```bash
# Get API ID
API_ID=$(aws apigateway get-rest-apis --region us-east-1 \
  --query "items[?name=='conversation-maker-api'].id" --output text)

# Check deployment
aws apigateway get-deployments --rest-api-id $API_ID --region us-east-1

# Test endpoint
curl https://$API_ID.execute-api.us-east-1.amazonaws.com/prod/api/health
```

### Permission issues
```bash
# Check IAM role
aws iam get-role --role-name ConversationMakerLambdaRole

# Check attached policies
aws iam list-attached-role-policies --role-name ConversationMakerLambdaRole
```

---

**Pro Tip**: Save commonly used commands as shell scripts or aliases for faster access!
