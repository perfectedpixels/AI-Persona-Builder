# Conversation Maker - Deployment Information

## 🎉 Your App is Live!

**Deployed:** February 12, 2026

---

## 🌐 URLs

### Frontend (S3 Static Website)
**URL:** http://conversation-maker-app-1770957587.s3-website-us-east-1.amazonaws.com

### Backend API
**URL:** https://uiolpncbm9.execute-api.us-east-1.amazonaws.com/prod

**Endpoints:**
- Health: `GET /api/health`
- Voices: `GET /api/voices`
- Generate: `POST /api/conversation/generate`
- Synthesize: `POST /api/conversation/synthesize`

---

## 📦 AWS Resources

### Lambda Function
- **Name:** conversation-maker-api
- **Runtime:** Node.js 18.x
- **Memory:** 512 MB
- **Timeout:** 30 seconds
- **Region:** us-east-1

### API Gateway
- **ID:** uiolpncbm9
- **Type:** REST API (Regional)
- **Stage:** prod

### S3 Bucket
- **Name:** conversation-maker-app-1770957587
- **Region:** us-east-1
- **Website Hosting:** Enabled

### IAM Role
- **Name:** ConversationMakerLambdaRole
- **Permissions:** Bedrock, CloudWatch Logs

---

## 🔧 Management Commands

### View Lambda Logs
```bash
aws logs tail /aws/lambda/conversation-maker-api --follow --region us-east-1
```

### Update Lambda Code
```bash
cd conversation-maker
export ELEVENLABS_API_KEY=your_key
./deploy-lambda-code-only.sh
```

### Update Frontend
```bash
cd conversation-maker/client
npm run build
aws s3 sync build/ s3://conversation-maker-app-1770957587/ --delete
```

### Test API
```bash
# Health check
curl https://uiolpncbm9.execute-api.us-east-1.amazonaws.com/prod/api/health

# List voices
curl https://uiolpncbm9.execute-api.us-east-1.amazonaws.com/prod/api/voices
```

---

## 💰 Cost Estimate

**Monthly costs (light usage ~1000 requests):**
- Lambda: $0.20
- API Gateway: $3.50
- S3: $0.50
- Data Transfer: $0.50
- Bedrock: $0.25
- **Total AWS: ~$5/month**
- ElevenLabs: Based on your plan

---

## 🔒 Security

- ✅ No AWS credentials in code
- ✅ Lambda uses IAM role for Bedrock
- ✅ ElevenLabs API key in Lambda environment only
- ✅ Frontend has no API keys
- ✅ HTTPS for API (HTTP for S3 website)

**Note:** S3 website uses HTTP. For HTTPS, add CloudFront (see upgrade section below).

---

## 🚀 Upgrade to HTTPS (Optional)

To add HTTPS with CloudFront:

```bash
# Create CloudFront distribution
aws cloudfront create-distribution \
  --origin-domain-name conversation-maker-app-1770957587.s3-website-us-east-1.amazonaws.com \
  --default-root-object index.html
```

Or use the AWS Console:
1. Go to CloudFront
2. Create distribution
3. Origin: Your S3 website endpoint
4. Wait 15-20 minutes for deployment
5. Get CloudFront URL (https://xxxxx.cloudfront.net)

---

## 📊 Monitoring

### CloudWatch Metrics
- Lambda invocations
- Lambda errors
- Lambda duration
- API Gateway requests
- API Gateway errors

### View Metrics
```bash
# Lambda metrics
aws cloudwatch get-metric-statistics \
  --namespace AWS/Lambda \
  --metric-name Invocations \
  --dimensions Name=FunctionName,Value=conversation-maker-api \
  --start-time $(date -u -d '1 hour ago' +%Y-%m-%dT%H:%M:%S) \
  --end-time $(date -u +%Y-%m-%dT%H:%M:%S) \
  --period 3600 \
  --statistics Sum \
  --region us-east-1
```

---

## 🛠️ Troubleshooting

### Frontend not loading
1. Check S3 bucket policy is public
2. Verify files uploaded: `aws s3 ls s3://conversation-maker-app-1770957587/`
3. Check website hosting is enabled

### API errors
1. Check Lambda logs: `aws logs tail /aws/lambda/conversation-maker-api --follow`
2. Verify environment variables: `aws lambda get-function-configuration --function-name conversation-maker-api --query 'Environment.Variables'`
3. Test API directly: `curl https://uiolpncbm9.execute-api.us-east-1.amazonaws.com/prod/api/health`

### Voice synthesis not working
1. Verify ElevenLabs API key is set in Lambda
2. Check CloudWatch logs for ElevenLabs errors
3. Test voices endpoint: `curl https://uiolpncbm9.execute-api.us-east-1.amazonaws.com/prod/api/voices`

---

## 🗑️ Cleanup (Delete Everything)

To remove all resources:

```bash
cd conversation-maker

# Delete S3 bucket
aws s3 rb s3://conversation-maker-app-1770957587 --force

# Delete Lambda and API Gateway
./cleanup-aws-services.sh
```

---

## 📝 Notes

- S3 website endpoint uses HTTP (not HTTPS)
- For production, consider adding CloudFront for HTTPS
- Lambda environment variables don't include AWS_REGION (it's reserved)
- Backend API uses HTTPS via API Gateway

---

**Deployed by:** Kiro AI Assistant  
**Date:** February 12, 2026  
**Status:** ✅ Live and Working
