# Security Incident Response & Prevention

## Incident Summary
**Date**: 2026-02-03  
**Issue**: AWS Access Key `AKIA2YLBW7AEHBITDC7Y` exposed in Amplify environment variables  
**Detection**: AWS ACAT automated security scanning  
**Status**: Key disabled by AWS Epoxy Mitigations  

## Immediate Actions Required

### 1. Delete Exposed Credentials (DO THIS FIRST)
```bash
# List all access keys for your IAM user
aws iam list-access-keys --user-name <your-iam-username>

# Delete the exposed key (even though it's disabled)
aws iam delete-access-key \
  --access-key-id AKIA2YLBW7AEHBITDC7Y \
  --user-name <your-iam-username>
```

### 2. Remove AWS Credentials from Amplify Console
1. Go to AWS Amplify Console
2. Select your app: `d2b3efwoc19bjt`
3. Go to "Environment variables"
4. **DELETE** these variables:
   - `AWS_ACCESS_KEY_ID`
   - `AWS_SECRET_ACCESS_KEY`
5. Save changes

### 3. Clean Up Local Environment
```bash
cd conversation-tool

# Remove AWS credentials from .env (keep only ElevenLabs key)
# Edit .env to remove AWS_ACCESS_KEY_ID and AWS_SECRET_ACCESS_KEY
```

## Permanent Fix: Zero-Credential Architecture

### Architecture Change
**OLD (INSECURE)**: IAM User Access Keys everywhere  
**NEW (SECURE)**: IAM Roles with no hardcoded credentials

```
Frontend (Amplify) → API Gateway → Lambda (IAM Role) → Bedrock
                                      ↓
                                  ElevenLabs API
```

### Lambda Deployment with IAM Role

Lambda functions use **execution roles** instead of access keys. The Lambda service assumes the role on your behalf.

#### Step 1: Create Lambda Execution Role
```bash
# Create the role
aws iam create-role \
  --role-name ConversationMakerLambdaRole \
  --assume-role-policy-document '{
    "Version": "2012-10-17",
    "Statement": [{
      "Effect": "Allow",
      "Principal": {"Service": "lambda.amazonaws.com"},
      "Action": "sts:AssumeRole"
    }]
  }'

# Attach CloudWatch Logs permission
aws iam attach-role-policy \
  --role-name ConversationMakerLambdaRole \
  --policy-arn arn:aws:iam::aws:policy/service-role/AWSLambdaBasicExecutionRole

# Attach Bedrock permission
aws iam attach-role-policy \
  --role-name ConversationMakerLambdaRole \
  --policy-arn arn:aws:iam::aws:policy/AmazonBedrockFullAccess
```

#### Step 2: Deploy Lambda (Updated Script)
The deployment script has been updated to:
- ✅ Use IAM role instead of access keys
- ✅ Only pass ElevenLabs API key as environment variable
- ✅ Remove all AWS credential environment variables

#### Step 3: Update Amplify to Only Store Frontend URL
Amplify should ONLY have:
- `REACT_APP_API_URL` - The API Gateway URL (public, not sensitive)

## Prevention Measures

### Rule 1: NEVER Use IAM User Access Keys
- ❌ No `AWS_ACCESS_KEY_ID` in environment variables
- ❌ No `AWS_SECRET_ACCESS_KEY` anywhere
- ✅ Use IAM roles for all AWS services
- ✅ Use temporary credentials (STS) if absolutely necessary

### Rule 2: Amplify Environment Variables
**ONLY store non-AWS credentials:**
- ✅ `REACT_APP_API_URL` (public URL)
- ✅ Third-party API keys (ElevenLabs) - only if needed by frontend
- ❌ AWS credentials (use IAM roles instead)

### Rule 3: Lambda Environment Variables
**ONLY store third-party secrets:**
- ✅ `ELEVENLABS_API_KEY` (third-party service)
- ✅ `ELEVENLABS_MODEL_ID` (configuration)
- ❌ AWS credentials (Lambda uses execution role)

### Rule 4: Automated Security Scanning
```bash
# Run before every commit
npm run check-secrets

# Add to git pre-commit hook
cat > .git/hooks/pre-commit << 'EOF'
#!/bin/bash
npm run check-secrets || exit 1
EOF
chmod +x .git/hooks/pre-commit
```

### Rule 5: Regular Security Audits
- [ ] Review IAM roles quarterly
- [ ] Rotate third-party API keys annually
- [ ] Check AWS CloudTrail for unusual activity
- [ ] Review Amplify environment variables monthly

## Updated Deployment Process

### For Lambda Backend
```bash
# 1. Deploy Lambda with IAM role (no credentials needed)
cd conversation-tool
./deploy-lambda.sh

# 2. Create API Gateway (one-time setup)
# See DEPLOYMENT.md for API Gateway setup

# 3. Update Amplify with API Gateway URL
# Amplify Console → Environment Variables → REACT_APP_API_URL
```

### For Local Development
```bash
# Use AWS CLI profile (temporary credentials)
aws configure sso

# Or use IAM role if running on EC2/Cloud9
# No access keys needed!
```

## Verification Checklist

After implementing fixes:
- [ ] Exposed access key deleted from IAM
- [ ] AWS credentials removed from Amplify environment variables
- [ ] Lambda deployed with IAM execution role
- [ ] Lambda environment variables only contain ElevenLabs key
- [ ] API Gateway created and connected to Lambda
- [ ] Amplify updated with API Gateway URL only
- [ ] Local `.env` cleaned (no AWS credentials)
- [ ] Pre-commit hook installed
- [ ] Security scan passes: `npm run check-secrets`

## Monitoring

### AWS CloudTrail
Monitor for:
- Unauthorized API calls
- Failed authentication attempts
- Unusual Bedrock usage patterns

### Lambda Logs
```bash
# Check Lambda execution logs
aws logs tail /aws/lambda/conversation-maker-api --follow
```

### Cost Monitoring
Set up billing alerts for:
- Bedrock API usage
- Lambda invocations
- API Gateway requests

## Contact & Escalation

If you detect another security issue:
1. **DO NOT** commit anything to git
2. Immediately rotate/delete exposed credentials
3. Check CloudTrail for unauthorized usage
4. Document the incident
5. Review and update this document

## Lessons Learned

### What Went Wrong
1. Used IAM user access keys instead of IAM roles
2. Stored AWS credentials in Amplify environment variables
3. Didn't account for AWS security scanning of Amplify configs

### What We're Changing
1. Zero-credential architecture using IAM roles
2. Only third-party API keys in environment variables
3. Automated security scanning before every commit
4. Regular security audits

### Success Criteria
- ✅ No AWS credentials stored anywhere
- ✅ All AWS access via IAM roles
- ✅ Security scans pass automatically
- ✅ No security alerts from AWS
