# AWS Setup Checklist

Use this checklist to track your AWS deployment progress.

## Pre-Deployment

- [ ] AWS Account created
- [ ] AWS CLI installed (`aws --version`)
- [ ] AWS credentials configured (`aws configure`)
- [ ] Node.js 18+ installed (`node --version`)
- [ ] Git repository access
- [ ] ElevenLabs API key obtained

## AWS Bedrock Setup

- [ ] Access AWS Bedrock Console
- [ ] Navigate to "Model access"
- [ ] Enable "Claude 3 Haiku" model
- [ ] Wait for approval (usually instant)
- [ ] Verify model is available

## Backend Deployment

- [ ] Set `ELEVENLABS_API_KEY` environment variable
- [ ] Run `./setup-aws-services.sh` (or manual steps below)

### Manual Backend Steps (if not using automated script)

- [ ] Create IAM role: `ConversationMakerLambdaRole`
- [ ] Attach `AWSLambdaBasicExecutionRole` policy
- [ ] Attach `AmazonBedrockFullAccess` policy
- [ ] Package Lambda function
- [ ] Deploy Lambda function
- [ ] Configure Lambda environment variables
- [ ] Create API Gateway REST API
- [ ] Create `{proxy+}` resource
- [ ] Create `ANY` method
- [ ] Set up Lambda integration
- [ ] Add Lambda permission for API Gateway
- [ ] Enable binary media types (`audio/mpeg`)
- [ ] Deploy API to `prod` stage
- [ ] Save API Gateway URL

## Testing Backend

- [ ] Test Lambda directly: `aws lambda invoke ...`
- [ ] Test health endpoint: `curl $API_URL/api/health`
- [ ] Test voices endpoint: `curl $API_URL/api/voices`
- [ ] Test conversation generation
- [ ] Test audio synthesis
- [ ] Check CloudWatch logs
- [ ] Run `./verify-aws-setup.sh`

## Frontend Deployment

### Option A: AWS Amplify (Recommended)

- [ ] Go to AWS Amplify Console
- [ ] Click "New app" → "Host web app"
- [ ] Connect git repository
- [ ] Select branch: `main`
- [ ] Verify build settings (`amplify.yml`)
- [ ] Add environment variable: `REACT_APP_API_URL`
- [ ] Save and deploy
- [ ] Wait for build to complete
- [ ] Save Amplify app URL

### Option B: Local Development

- [ ] Create `client/.env` file
- [ ] Set `REACT_APP_API_URL` to API Gateway URL
- [ ] Run `cd client && npm install`
- [ ] Run `npm start`
- [ ] Test app at http://localhost:3000

## Testing Frontend

- [ ] Access app URL (Amplify or localhost)
- [ ] Test conversation generation
- [ ] Test voice selection
- [ ] Test audio synthesis
- [ ] Test audio playback
- [ ] Test export features
- [ ] Test import features
- [ ] Check browser console for errors

## Post-Deployment

- [ ] Document API Gateway URL
- [ ] Document Amplify app URL
- [ ] Set up CloudWatch alarms (optional)
- [ ] Configure custom domain (optional)
- [ ] Set up authentication (optional)
- [ ] Review security settings
- [ ] Test from different devices/browsers
- [ ] Share access with team

## Monitoring Setup (Optional)

- [ ] Create CloudWatch dashboard
- [ ] Set up error rate alarms
- [ ] Set up latency alarms
- [ ] Configure log retention (7-30 days)
- [ ] Set up SNS notifications
- [ ] Test alarm notifications

## Security Review

- [ ] Verify no AWS credentials in code
- [ ] Verify no API keys in git
- [ ] Run `./check-secrets.sh`
- [ ] Review IAM role permissions
- [ ] Check API Gateway CORS settings
- [ ] Review CloudWatch log access
- [ ] Enable AWS CloudTrail (optional)
- [ ] Set up AWS WAF (optional)

## Cost Optimization

- [ ] Review Lambda memory allocation
- [ ] Review Lambda timeout settings
- [ ] Consider API Gateway caching
- [ ] Set CloudWatch log retention
- [ ] Review Bedrock usage
- [ ] Review ElevenLabs usage
- [ ] Set up billing alarms

## Documentation

- [ ] Document API Gateway URL
- [ ] Document Amplify app URL
- [ ] Update team access docs
- [ ] Document any custom configurations
- [ ] Create runbook for common issues
- [ ] Document update procedures

## Maintenance

- [ ] Schedule regular security updates
- [ ] Monitor AWS costs
- [ ] Review CloudWatch logs weekly
- [ ] Test backup/restore procedures
- [ ] Keep dependencies updated
- [ ] Review and rotate API keys quarterly

## Troubleshooting Resources

If you encounter issues:

1. Run verification: `./verify-aws-setup.sh`
2. Check CloudWatch logs: `aws logs tail /aws/lambda/conversation-maker-api --follow`
3. Review [AWS_SETUP_GUIDE.md](AWS_SETUP_GUIDE.md) troubleshooting section
4. Check AWS service health dashboard
5. Verify all environment variables are set correctly

## Quick Commands Reference

```bash
# Deploy/Update Lambda
./deploy-lambda-code-only.sh

# Verify setup
./verify-aws-setup.sh

# View logs
aws logs tail /aws/lambda/conversation-maker-api --follow --region us-east-1

# Test API
curl https://YOUR_API_ID.execute-api.us-east-1.amazonaws.com/prod/api/health

# Update Lambda timeout
aws lambda update-function-configuration \
  --function-name conversation-maker-api \
  --timeout 60 \
  --region us-east-1

# Cleanup (delete all resources)
./cleanup-aws-services.sh
```

## Success Criteria

Your deployment is successful when:

- ✅ All backend tests pass
- ✅ API Gateway returns 200 responses
- ✅ Frontend loads without errors
- ✅ Conversation generation works
- ✅ Audio synthesis works
- ✅ Audio playback works
- ✅ No errors in CloudWatch logs
- ✅ No errors in browser console

## Next Steps After Deployment

1. Share app URL with team
2. Monitor usage and costs
3. Gather user feedback
4. Plan feature enhancements
5. Set up regular maintenance schedule

---

**Completed all items?** Congratulations! Your Conversation Maker app is live on AWS! 🎉
