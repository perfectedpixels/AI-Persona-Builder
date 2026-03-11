# Deploy to Personal Account (582234715800)

## 1. Configure AWS for Personal Account

You need credentials for account `582234715800`. Create an IAM user with deploy permissions or use existing credentials.

**Option A: Use a named profile**

```bash
aws configure --profile personal
# Enter:
#   AWS Access Key ID: <your-access-key>
#   AWS Secret Access Key: <your-secret-key>
#   Default region: us-east-1
```

**Option B: Set environment variables**

```bash
export AWS_ACCESS_KEY_ID=<your-access-key>
export AWS_SECRET_ACCESS_KEY=<your-secret-key>
export AWS_DEFAULT_REGION=us-east-1
```

## 2. Run the Deploy Script

```bash
cd conversation-maker

# Set ElevenLabs key (required for voice synthesis)
export ELEVENLABS_API_KEY=your_elevenlabs_key_here

# If using profile:
AWS_PROFILE=personal ./deploy-to-personal-account.sh

# Or if using env vars (default credentials):
./deploy-to-personal-account.sh
```

## 3. What Gets Created

- **IAM Role**: ConversationMakerLambdaRole (Bedrock + CloudWatch)
- **Lambda**: conversation-maker-api (Node.js 18, Claude Sonnet 4)
- **API Gateway**: REST API with proxy to Lambda
- **S3 Bucket**: conversation-maker-app-582234715800 (static website)
- **Frontend**: Built and uploaded to S3

## 4. Output URLs

After deployment you'll see:

- **Frontend**: http://conversation-maker-app-582234715800.s3-website-us-east-1.amazonaws.com
- **API**: https://<api-id>.execute-api.us-east-1.amazonaws.com/prod

## 5. Troubleshooting

**Wrong account error**: Run `aws sts get-caller-identity` — it should show Account `582234715800` before deploying.

**Proxy errors**: If AWS CLI fails with proxy errors, run:
```bash
unset http_proxy https_proxy HTTP_PROXY HTTPS_PROXY
```

**ElevenLabs key**: If you don't have one, set a placeholder for the deploy (voice features won't work until you add a real key): `export ELEVENLABS_API_KEY=placeholder`
