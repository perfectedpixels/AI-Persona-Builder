# AWS Services Integration Summary

Complete overview of how Conversation Maker integrates with AWS services.

## Architecture Diagram

```
┌─────────────────────────────────────────────────────────────────┐
│                         USER BROWSER                             │
└────────────────────────────┬────────────────────────────────────┘
                             │
                             │ HTTPS
                             ↓
┌─────────────────────────────────────────────────────────────────┐
│                      AWS AMPLIFY                                 │
│  • Hosts React frontend (static files)                          │
│  • Auto-deploys from git (main branch)                          │
│  • CloudFront CDN distribution                                  │
│  • Environment: REACT_APP_API_URL                               │
└────────────────────────────┬────────────────────────────────────┘
                             │
                             │ HTTPS API Calls
                             ↓
┌─────────────────────────────────────────────────────────────────┐
│                      API GATEWAY                                 │
│  • REST API endpoint (Regional)                                 │
│  • {proxy+} resource with ANY method                            │
│  • Lambda proxy integration                                     │
│  • Binary media types: audio/mpeg                               │
│  • CORS enabled                                                 │
│  • Stage: prod                                                  │
└────────────────────────────┬────────────────────────────────────┘
                             │
                             │ Lambda Proxy
                             ↓
┌─────────────────────────────────────────────────────────────────┐
│                      AWS LAMBDA                                  │
│  • Function: conversation-maker-api                             │
│  • Runtime: Node.js 18.x                                        │
│  • Handler: lambda.handler                                      │
│  • Memory: 512 MB                                               │
│  • Timeout: 30 seconds                                          │
│  • Express.js app wrapped with serverless-http                  │
│  • IAM Role: ConversationMakerLambdaRole                        │
└──────────────┬──────────────────────────┬───────────────────────┘
               │                          │
               │ AWS SDK                  │ HTTPS
               ↓                          ↓
┌──────────────────────────┐  ┌──────────────────────────┐
│    AWS BEDROCK           │  │    ELEVENLABS API        │
│  • Claude 3 Haiku        │  │  • Text-to-Speech        │
│  • Script generation     │  │  • Voice library         │
│  • IAM role auth         │  │  • API key auth          │
└──────────────────────────┘  └──────────────────────────┘
               │
               │ Logs
               ↓
┌─────────────────────────────────────────────────────────────────┐
│                      CLOUDWATCH                                  │
│  • Log group: /aws/lambda/conversation-maker-api                │
│  • Lambda metrics (invocations, errors, duration)               │
│  • API Gateway metrics (requests, latency, errors)              │
└─────────────────────────────────────────────────────────────────┘
```

## AWS Services Used

### 1. AWS Lambda
**Purpose**: Serverless backend API

**Configuration**:
- Function name: `conversation-maker-api`
- Runtime: Node.js 18.x
- Handler: `lambda.handler`
- Memory: 512 MB
- Timeout: 30 seconds
- Execution role: `ConversationMakerLambdaRole`

**Environment Variables**:
```bash
NODE_ENV=production
AWS_REGION=us-east-1
ELEVENLABS_API_KEY=<your-key>
ELEVENLABS_MODEL_ID=eleven_monolingual_v1
BEDROCK_MODEL_ID=us.anthropic.claude-3-haiku-20240307-v1:0
```

**Code Structure**:
- `lambda.js` - Lambda handler (wraps Express with serverless-http)
- `server/index.js` - Express app
- `server/routes/` - API routes
- `server/services/bedrock.js` - AWS Bedrock integration
- `server/services/elevenlabs.js` - ElevenLabs integration

**Deployment**:
```bash
./deploy-lambda-code-only.sh  # Code only
./deploy-lambda.sh            # Code + env vars
```

### 2. API Gateway
**Purpose**: HTTP endpoint for Lambda function

**Configuration**:
- API name: `conversation-maker-api`
- Type: REST API (Regional)
- Stage: `prod`
- Resource: `{proxy+}` (catch-all)
- Method: `ANY` (all HTTP methods)
- Integration: Lambda Proxy
- Binary media types: `audio/mpeg`

**Endpoints**:
- `GET /api/health` - Health check
- `GET /api/voices` - List ElevenLabs voices
- `POST /api/conversation/generate` - Generate script
- `POST /api/conversation/synthesize` - Synthesize audio

**URL Format**:
```
https://{api-id}.execute-api.us-east-1.amazonaws.com/prod
```

### 3. IAM (Identity and Access Management)
**Purpose**: Permissions for Lambda execution

**Role**: `ConversationMakerLambdaRole`

**Trust Policy**:
```json
{
  "Version": "2012-10-17",
  "Statement": [{
    "Effect": "Allow",
    "Principal": {"Service": "lambda.amazonaws.com"},
    "Action": "sts:AssumeRole"
  }]
}
```

**Attached Policies**:
1. `AWSLambdaBasicExecutionRole` - CloudWatch Logs access
2. `AmazonBedrockFullAccess` - Bedrock API access

**Security Model**:
- ✅ No AWS credentials in code
- ✅ Lambda uses IAM role for AWS services
- ✅ Only third-party API keys in environment
- ✅ Frontend has no credentials

### 4. AWS Bedrock
**Purpose**: AI script generation using Claude

**Model**: `us.anthropic.claude-3-haiku-20240307-v1:0`

**Features**:
- Fast, cost-effective Claude model
- Conversation script generation
- Natural dialogue creation
- Multi-speaker support

**Authentication**: IAM role (no API keys needed)

**Usage**:
```javascript
const { BedrockRuntimeClient, InvokeModelCommand } = require('@aws-sdk/client-bedrock-runtime');

const client = new BedrockRuntimeClient({
  region: 'us-east-1'
  // Credentials automatically from IAM role
});
```

**Cost**: ~$0.25 per 1M input tokens, ~$1.25 per 1M output tokens

### 5. AWS Amplify
**Purpose**: Frontend hosting and CI/CD

**Configuration**:
- App name: `conversation-maker`
- Branch: `main`
- Build spec: `amplify.yml`
- Framework: React

**Environment Variables**:
```bash
REACT_APP_API_URL=https://{api-id}.execute-api.us-east-1.amazonaws.com/prod
```

**Build Process**:
1. Install dependencies (`npm install`)
2. Build React app (`npm run build`)
3. Deploy to CloudFront CDN
4. Auto-deploy on git push

**Features**:
- Automatic HTTPS
- Global CDN distribution
- Continuous deployment
- Preview deployments for branches

### 6. CloudWatch
**Purpose**: Logging and monitoring

**Log Group**: `/aws/lambda/conversation-maker-api`

**Metrics Tracked**:
- Lambda invocations
- Lambda errors
- Lambda duration
- Lambda concurrent executions
- API Gateway requests
- API Gateway 4xx/5xx errors
- API Gateway latency

**Log Retention**: 7-30 days (configurable)

**Viewing Logs**:
```bash
aws logs tail /aws/lambda/conversation-maker-api --follow --region us-east-1
```

## Third-Party Services

### ElevenLabs API
**Purpose**: Text-to-speech synthesis

**Features**:
- 26 professional voices
- Prosody controls (stability, similarity, style)
- Speed adjustment (0.7x - 1.2x)
- High-quality audio output

**Authentication**: API key (stored in Lambda environment)

**Endpoints Used**:
- `GET /v1/voices` - List available voices
- `POST /v1/text-to-speech/{voice_id}` - Synthesize audio

**Cost**: Based on character count and plan

## Data Flow

### 1. Script Generation Flow
```
User → Amplify → API Gateway → Lambda → Bedrock → Lambda → API Gateway → Amplify → User
```

1. User enters prompt in React app
2. Frontend sends POST to `/api/conversation/generate`
3. API Gateway forwards to Lambda
4. Lambda calls Bedrock with prompt
5. Bedrock generates conversation script
6. Lambda returns formatted script
7. Frontend displays editable script

### 2. Audio Synthesis Flow
```
User → Amplify → API Gateway → Lambda → ElevenLabs → Lambda → API Gateway → Amplify → User
```

1. User clicks "Generate Audio" for a line
2. Frontend sends POST to `/api/conversation/synthesize`
3. API Gateway forwards to Lambda
4. Lambda calls ElevenLabs API
5. ElevenLabs returns audio (MP3)
6. Lambda returns base64-encoded audio
7. Frontend decodes and plays audio

### 3. Voice List Flow
```
User → Amplify → API Gateway → Lambda → ElevenLabs → Lambda → API Gateway → Amplify → User
```

1. User opens voice configuration
2. Frontend sends GET to `/api/voices`
3. Lambda calls ElevenLabs API
4. Returns list of 26 voices
5. Frontend displays voice selector

## Security Architecture

### Authentication & Authorization
- **Frontend**: No authentication (public app)
- **API Gateway**: Open access (no API key required)
- **Lambda → Bedrock**: IAM role authentication
- **Lambda → ElevenLabs**: API key authentication

### Secrets Management
- **AWS Credentials**: Never stored (IAM role)
- **ElevenLabs API Key**: Lambda environment variable only
- **Frontend**: No secrets (all calls through Lambda)

### Network Security
- **HTTPS Only**: All traffic encrypted
- **CORS**: Configured in Lambda
- **API Gateway**: Regional endpoint
- **Amplify**: CloudFront with HTTPS

### Best Practices
✅ No credentials in code  
✅ No credentials in git  
✅ Environment variables for secrets  
✅ IAM roles for AWS services  
✅ Least privilege permissions  
✅ CloudWatch logging enabled  

## Cost Breakdown

### Monthly Cost Estimate (Light Usage)

**AWS Services**:
- Lambda: $0.20 (1M requests, 512MB, 1s avg duration)
- API Gateway: $3.50 (1M requests)
- Amplify: $5.00 (hosting + builds)
- Bedrock: $0.25 (1M input tokens)
- CloudWatch: $0.50 (logs)
- Data Transfer: $0.50

**Third-Party**:
- ElevenLabs: Variable (based on plan)

**Total AWS**: ~$10/month  
**Total with ElevenLabs**: ~$20-50/month

### Cost Optimization Tips
1. Use Lambda reserved concurrency
2. Enable API Gateway caching
3. Optimize Bedrock prompts
4. Set CloudWatch log retention
5. Use ElevenLabs efficiently

## Monitoring & Alerts

### Key Metrics to Monitor
1. Lambda error rate
2. Lambda duration (timeout warnings)
3. API Gateway 5xx errors
4. API Gateway latency
5. Bedrock throttling
6. ElevenLabs rate limits

### Recommended Alarms
```bash
# Lambda errors
aws cloudwatch put-metric-alarm \
  --alarm-name conversation-maker-errors \
  --metric-name Errors \
  --namespace AWS/Lambda \
  --statistic Sum \
  --period 300 \
  --threshold 5 \
  --comparison-operator GreaterThanThreshold

# API Gateway 5xx errors
aws cloudwatch put-metric-alarm \
  --alarm-name conversation-maker-api-errors \
  --metric-name 5XXError \
  --namespace AWS/ApiGateway \
  --statistic Sum \
  --period 300 \
  --threshold 10 \
  --comparison-operator GreaterThanThreshold
```

## Deployment Scripts

### Automated Setup
- `setup-aws-services.sh` - Complete AWS setup
- `verify-aws-setup.sh` - Verify deployment
- `cleanup-aws-services.sh` - Delete all resources

### Manual Deployment
- `deploy-lambda.sh` - Deploy Lambda with env vars
- `deploy-lambda-code-only.sh` - Update Lambda code only

### Git-Based Deployment
- Push to `main` branch → Amplify auto-deploys frontend

## Troubleshooting

### Common Issues

**Lambda Timeout**:
```bash
aws lambda update-function-configuration \
  --function-name conversation-maker-api \
  --timeout 60
```

**Bedrock Access Denied**:
- Enable Claude 3 Haiku in Bedrock console
- Verify IAM role has Bedrock permissions

**CORS Errors**:
- Check Lambda CORS headers
- Verify API Gateway configuration

**Audio Not Playing**:
- Check binary media types in API Gateway
- Verify ElevenLabs API key
- Check CloudWatch logs

## Documentation

- [QUICK_START.md](QUICK_START.md) - Get started fast
- [AWS_SETUP_GUIDE.md](AWS_SETUP_GUIDE.md) - Complete setup guide
- [AWS_CHECKLIST.md](AWS_CHECKLIST.md) - Deployment checklist
- [DEPLOYMENT_GUIDE.md](DEPLOYMENT_GUIDE.md) - Detailed deployment
- [README.md](README.md) - App overview

## Support Resources

- [AWS Lambda Documentation](https://docs.aws.amazon.com/lambda/)
- [AWS Bedrock Documentation](https://docs.aws.amazon.com/bedrock/)
- [API Gateway Documentation](https://docs.aws.amazon.com/apigateway/)
- [AWS Amplify Documentation](https://docs.aws.amazon.com/amplify/)
- [ElevenLabs API Docs](https://elevenlabs.io/docs)

---

**Ready to deploy?** Start with [QUICK_START.md](QUICK_START.md)!
