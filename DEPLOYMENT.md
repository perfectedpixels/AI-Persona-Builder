# Deployment Guide

## AWS CodeCommit + Amplify Deployment

### Step 1: Create CodeCommit Repository

1. Go to AWS CodeCommit console
2. Create a new repository named `elevenlabs-conversation-tool`
3. Note the repository URL

### Step 2: Push Code to CodeCommit

```bash
# Initialize git (if not already done)
cd conversation-tool
git init
git add .
git commit -m "Initial commit: ElevenLabs Conversation Tool"

# Add CodeCommit remote
git remote add origin <your-codecommit-repo-url>

# Push to CodeCommit
git push -u origin main
```

### Step 3: Set Up AWS Amplify

1. Go to AWS Amplify console
2. Click "New app" → "Host web app"
3. Select "AWS CodeCommit" as the repository service
4. Choose your `elevenlabs-conversation-tool` repository
5. Select the `main` branch
6. Amplify will auto-detect the `amplify.yml` build settings

### Step 4: Configure Environment Variables

In the Amplify Console, go to "Environment variables" and add:

```
AWS_REGION=us-east-1
AWS_ACCESS_KEY_ID=<your-access-key>
AWS_SECRET_ACCESS_KEY=<your-secret-key>
BEDROCK_MODEL_ID=us.anthropic.claude-3-haiku-20240307-v1:0
ELEVENLABS_API_KEY=<your-elevenlabs-key>
ELEVENLABS_MODEL_ID=eleven_monolingual_v1
REACT_APP_API_URL=<your-amplify-app-url>
NODE_ENV=production
```

### Step 5: Deploy

1. Click "Save and deploy"
2. Amplify will automatically build and deploy your app
3. Future pushes to `main` branch will trigger automatic deployments

### Step 6: Configure Custom Domain (Optional)

1. In Amplify Console, go to "Domain management"
2. Add your custom domain
3. Follow the DNS configuration instructions

## Local Development

```bash
# Install dependencies
npm run install-all

# Start development servers
npm run dev
```

Frontend: http://localhost:3000
Backend: http://localhost:3001

## Production Build

```bash
# Build for production
npm run build

# Start production server
npm start
```

## Environment Variables Required

### Development
- `ELEVENLABS_API_KEY` - Your ElevenLabs API key
- `AWS_ACCESS_KEY_ID` - AWS credentials for Bedrock
- `AWS_SECRET_ACCESS_KEY` - AWS credentials for Bedrock
- `AWS_REGION` - AWS region (default: us-east-1)

### Production (Amplify)
- All development variables plus:
- `REACT_APP_API_URL` - Your Amplify app URL
- `NODE_ENV=production`

## Troubleshooting

### Build Fails on Amplify
- Check that all environment variables are set
- Verify AWS credentials have Bedrock permissions
- Check build logs in Amplify Console

### API Not Working
- Verify REACT_APP_API_URL is set correctly
- Check CORS configuration in server/index.js
- Verify ElevenLabs API key is valid

### Audio Export Fails
- Ensure ffmpeg is installed on the server
- Check server logs for detailed error messages
- Verify audio file size limits

## AWS Permissions Required

### IAM Policy for Bedrock Access
```json
{
  "Version": "2012-10-17",
  "Statement": [
    {
      "Effect": "Allow",
      "Action": [
        "bedrock:InvokeModel"
      ],
      "Resource": "arn:aws:bedrock:*:*:model/*"
    }
  ]
}
```

### IAM Policy for Amplify
```json
{
  "Version": "2012-10-17",
  "Statement": [
    {
      "Effect": "Allow",
      "Action": [
        "codecommit:GitPull"
      ],
      "Resource": "arn:aws:codecommit:*:*:elevenlabs-conversation-tool"
    }
  ]
}
```
