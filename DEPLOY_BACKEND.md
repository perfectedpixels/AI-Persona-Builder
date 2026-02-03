# Deploy Conversation Maker Backend to Elastic Beanstalk

## Quick Deploy via AWS Console

### Step 1: Create Application Package

```bash
cd conversation-tool
zip -r conversation-maker-backend.zip . -x "client/*" -x ".git/*" -x "*.md" -x "node_modules/*" -x "amplify-*.json"
```

### Step 2: Create Elastic Beanstalk Application

1. Go to: https://console.aws.amazon.com/elasticbeanstalk/
2. Click **"Create Application"**
3. Application name: `conversation-maker-api`
4. Platform: **Node.js 20**
5. Platform branch: **Node.js 20 running on 64bit Amazon Linux 2023**
6. Application code: **Upload your code**
7. Click **"Choose file"** and select `conversation-maker-backend.zip`
8. Click **"Create application"**

### Step 3: Configure Environment Variables

Once the environment is created:

1. Go to **Configuration** → **Software** → **Edit**
2. Add environment variables:
   ```
   NODE_ENV=production
   PORT=8081
   ELEVENLABS_API_KEY=sk_056db134bc26b4a70766c7b9442e5d5b27805389213bdcfb
   ELEVENLABS_MODEL_ID=eleven_monolingual_v1
   BEDROCK_MODEL_ID=us.anthropic.claude-3-haiku-20240307-v1:0
   ```
3. Click **"Apply"**

### Step 4: Get Backend URL

After deployment completes, copy the environment URL (e.g., `http://conversation-maker-api.us-east-1.elasticbeanstalk.com`)

### Step 5: Update Frontend

Update the Amplify app to use the backend URL:

```bash
aws amplify update-app --app-id d2b3efwoc19bjt \
  --environment-variables \
  BEDROCK_MODEL_ID=us.anthropic.claude-3-haiku-20240307-v1:0,\
ELEVENLABS_API_KEY=sk_056db134bc26b4a70766c7b9442e5d5b27805389213bdcfb,\
ELEVENLABS_MODEL_ID=eleven_monolingual_v1,\
NODE_ENV=production,\
PORT=3001,\
REACT_APP_API_URL=http://YOUR-EB-URL-HERE.elasticbeanstalk.com \
  --region us-east-1
```

Then trigger a rebuild in Amplify Console.

### Step 6: Enable CORS

The backend already has CORS enabled in `server/index.js`, but verify it allows your Amplify domain.

## Alternative: Use Existing Personality Explorer Backend

If you want to avoid creating a new Elastic Beanstalk environment, you could add the Conversation Maker endpoints to your existing Personality Explorer backend.

## Done!

Your app will be:
- **Frontend**: https://d2b3efwoc19bjt.amplifyapp.com
- **Backend**: http://your-eb-url.elasticbeanstalk.com

