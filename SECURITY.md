# Security Guidelines

## Overview

Conversation Maker uses a zero-credential security architecture. AWS access is handled via IAM roles, and third-party API keys are stored only in Lambda environment variables.

## Critical Rules

### ⚠️ NEVER Commit These Files
- `.env` (contains API keys)
- `.env.local`, `.env.production`, `.env.development`
- Any file containing credentials or secrets

### ✅ Before Every Commit
Run the security check script:
```bash
./check-secrets.sh
```

This script checks for:
- Exposed API keys
- AWS credentials in code
- `.env` files in git staging

## Architecture

### Zero-Credential Model
- **Lambda Function**: Uses IAM execution role for AWS service access
- **No AWS Keys**: All AWS access via IAM, no credentials in code
- **Third-Party Keys**: Only ElevenLabs API key, stored in Lambda environment

### What Goes Where

| Credential Type | Storage Location | Access Method |
|----------------|------------------|---------------|
| AWS Services | IAM Execution Role | Automatic via Lambda |
| ElevenLabs API Key | Lambda Environment Variables | `process.env.ELEVENLABS_API_KEY` |
| Local Development | `.env` file (gitignored) | `dotenv` package |

## Local Development

### Setting Up `.env`
```bash
# Copy example file
cp .env.example .env

# Add your ElevenLabs API key
echo "ELEVENLABS_API_KEY=your_key_here" >> .env
```

### Loading Environment Variables
```bash
# Option 1: Source the file
source .env

# Option 2: Use in scripts
export ELEVENLABS_API_KEY=$(grep ELEVENLABS_API_KEY .env | cut -d '=' -f2)
```

## Deployment Security

### Lambda Deployment
The deployment script requires the ElevenLabs API key:
```bash
# Full deployment (includes environment variables)
export ELEVENLABS_API_KEY=your_key_here
./deploy-lambda.sh

# Code-only deployment (preserves existing environment)
./deploy-lambda-code-only.sh
```

### What Gets Deployed
- ✅ Application code
- ✅ Dependencies (node_modules)
- ✅ Lambda configuration
- ❌ `.env` files (excluded by .gitignore)
- ❌ AWS credentials (not needed, uses IAM)

## Git Security

### .gitignore Protection
The following are automatically excluded from git:
```
.env
.env.local
.env.production
.env.development
node_modules/
*.log
```

### Pre-Commit Check
Always run before committing:
```bash
npm run check-secrets
# or
./check-secrets.sh
```

## API Key Management

### ElevenLabs API Key
- **Local**: Store in `.env` file
- **Lambda**: Set via deployment script or AWS Console
- **Rotation**: Update in Lambda environment variables only

### Rotating Keys
1. Generate new key in ElevenLabs dashboard
2. Update Lambda environment:
   ```bash
   aws lambda update-function-configuration \
     --function-name conversation-maker-api \
     --environment "Variables={ELEVENLABS_API_KEY=new_key_here}"
   ```
3. Update local `.env` file
4. Test both environments

## IAM Permissions

### Lambda Execution Role
The Lambda function requires these permissions:
- `AWSLambdaBasicExecutionRole` - CloudWatch Logs
- `AmazonBedrockFullAccess` - Bedrock API access

### CodeCommit Access
Team members with read-only access have:
- `codecommit:GitPull`
- `codecommit:GetBranch`
- `codecommit:GetCommit`
- `codecommit:GetRepository`
- `codecommit:ListBranches`

## Incident Response

### If Credentials Are Exposed

1. **Immediately rotate the exposed credential**
   - ElevenLabs: Generate new API key
   - AWS: Rotate IAM credentials (if applicable)

2. **Update all environments**
   - Lambda environment variables
   - Local `.env` files
   - Team member environments

3. **Review git history**
   ```bash
   # Search for exposed secrets
   git log -p | grep -i "api_key\|secret\|password"
   ```

4. **If found in git history**
   - Contact repository administrator
   - Consider repository cleanup (BFG Repo-Cleaner)
   - Notify affected team members

### If Repository Is Compromised

1. Rotate all credentials immediately
2. Review CloudWatch logs for unauthorized access
3. Check Lambda invocation history
4. Review Amplify deployment logs
5. Notify team members

## Best Practices

### Development
- ✅ Use `.env` files for local development
- ✅ Run security checks before committing
- ✅ Keep dependencies updated
- ✅ Use environment-specific configurations
- ❌ Never hardcode credentials
- ❌ Never commit `.env` files
- ❌ Never share credentials in chat/email

### Deployment
- ✅ Use IAM roles for AWS access
- ✅ Store secrets in Lambda environment variables
- ✅ Use code-only deployment for quick updates
- ✅ Test in development before production
- ❌ Never deploy with credentials in code
- ❌ Never use root AWS credentials

### Team Collaboration
- ✅ Share read-only repository access
- ✅ Use separate API keys per environment
- ✅ Document credential rotation procedures
- ✅ Use password managers for credential storage
- ❌ Never share credentials in plain text
- ❌ Never commit team credentials to git

## Security Checklist

### Before Committing
- [ ] Run `./check-secrets.sh`
- [ ] Verify no `.env` files in staging
- [ ] Check for hardcoded credentials
- [ ] Review diff for sensitive data

### Before Deploying
- [ ] Test locally first
- [ ] Verify environment variables are set
- [ ] Check Lambda IAM role permissions
- [ ] Review CloudWatch logs after deployment

### Regular Maintenance
- [ ] Rotate API keys quarterly
- [ ] Review IAM permissions monthly
- [ ] Update dependencies regularly
- [ ] Monitor CloudWatch logs for anomalies

## Resources

- [AWS Lambda Security Best Practices](https://docs.aws.amazon.com/lambda/latest/dg/lambda-security.html)
- [ElevenLabs API Security](https://elevenlabs.io/docs/security)
- [Git Secrets Prevention](https://git-scm.com/book/en/v2/Git-Tools-Credential-Storage)

## Contact

For security concerns or questions, contact the repository administrator.
