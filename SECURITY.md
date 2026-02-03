# Security Checklist

## Before Committing to Git

### ✅ Environment Variables
- [ ] `.env` file is listed in `.gitignore`
- [ ] `.env` file contains NO actual credentials (only empty values or placeholders)
- [ ] `.env.example` is safe to commit (no real keys)
- [ ] All sensitive keys are empty in `.env`

### ✅ AWS Credentials
- [ ] `AWS_ACCESS_KEY_ID` is NOT hardcoded anywhere
- [ ] `AWS_SECRET_ACCESS_KEY` is NOT hardcoded anywhere
- [ ] AWS credentials are only in `.env` (which is gitignored)
- [ ] Production credentials are set in Amplify Console (not in code)

### ✅ API Keys
- [ ] `ELEVENLABS_API_KEY` is NOT hardcoded anywhere
- [ ] API keys are only loaded from environment variables
- [ ] No API keys in client-side code
- [ ] No API keys in comments or documentation

### ✅ Git Configuration
- [ ] `.gitignore` includes `.env*` files
- [ ] `.gitignore` includes `amplify/` directory
- [ ] No sensitive files tracked by git

## Files That Should NEVER Be Committed

```
.env
.env.local
.env.production
.env.development
amplify/
.amplifyrc
*.pem
*.key
*.cert
config/secrets.json
```

## Safe to Commit

```
.env.example          # Template with no real values
.gitignore           # Git ignore rules
amplify.yml          # Build configuration (no secrets)
package.json         # Dependencies (no secrets)
README.md            # Documentation
DEPLOYMENT.md        # Deployment guide
```

## How to Check Before Committing

```bash
# Check what files will be committed
git status

# Check if .env is tracked (should return nothing)
git ls-files | grep .env

# Search for potential secrets in tracked files
git grep -i "aws_access_key"
git grep -i "aws_secret"
git grep -i "api_key"

# If you accidentally committed secrets:
# 1. Remove from git history
git filter-branch --force --index-filter \
  "git rm --cached --ignore-unmatch .env" \
  --prune-empty --tag-name-filter cat -- --all

# 2. Force push (WARNING: rewrites history)
git push origin --force --all

# 3. ROTATE ALL EXPOSED CREDENTIALS IMMEDIATELY
```

## Environment Variable Best Practices

### Development
- Store in `.env` file (gitignored)
- Never share `.env` file
- Use `.env.example` as template

### Production (AWS Amplify)
- Set in Amplify Console → Environment Variables
- Never commit production credentials
- Use IAM roles when possible

### Client-Side Variables
- Only use `REACT_APP_*` prefix for client variables
- NEVER put secrets in client variables
- Client variables are PUBLIC (visible in browser)

## AWS IAM Best Practices

### Principle of Least Privilege
- Create dedicated IAM user for this app
- Only grant necessary permissions:
  - `bedrock:InvokeModel` for AI generation
  - `codecommit:GitPull` for Amplify deployment
- Never use root credentials

### Credential Rotation
- Rotate AWS access keys every 90 days
- Rotate ElevenLabs API key if exposed
- Update keys in Amplify Console after rotation

## Monitoring

### AWS CloudTrail
- Monitor API calls for unusual activity
- Set up alerts for unauthorized access attempts

### Git History
- Regularly scan for accidentally committed secrets
- Use tools like `git-secrets` or `truffleHog`

## Emergency Response

### If Credentials Are Exposed

1. **Immediately rotate/delete exposed credentials**
   - AWS: Delete access key in IAM Console
   - ElevenLabs: Regenerate API key

2. **Check for unauthorized usage**
   - AWS CloudTrail logs
   - ElevenLabs usage dashboard

3. **Update all deployment environments**
   - Local `.env` file
   - Amplify environment variables
   - Team members' local environments

4. **Review git history**
   - Remove from all commits
   - Force push cleaned history
   - Notify team members to re-clone

## Automated Security Scanning

### Pre-commit Hook (Optional)
```bash
# .git/hooks/pre-commit
#!/bin/bash
if git diff --cached --name-only | grep -q "\.env$"; then
  echo "ERROR: Attempting to commit .env file!"
  exit 1
fi
```

### GitHub/GitLab Secret Scanning
- Enable secret scanning in repository settings
- Configure alerts for detected secrets
- Review and remediate any findings

## Contact

If you discover a security issue:
1. Do NOT commit the issue to git
2. Rotate any exposed credentials immediately
3. Contact the team lead
4. Document the incident for review
