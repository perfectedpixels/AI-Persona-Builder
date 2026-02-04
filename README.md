# ElevenLabs Conversation Maker

A web application for creating, editing, and playing multi-speaker conversations using ElevenLabs text-to-speech voices with AI-powered script generation.

## Live Application

🌐 **Production URL**: https://d2b3efwoc19bjt.amplifyapp.com

## Features

- **Multi-Speaker Conversations**: Create dialogues with 2+ speakers, each with unique voice configurations
- **AI Script Generation**: Generate natural conversation scripts using AWS Bedrock (Claude 3 Haiku)
- **Voice Customization**: Fine-tune prosody (stability, similarity, style) and speed per speaker or per line
- **Sequential Playback**: Play conversations with natural timing and speaker transitions
- **Conversation Management**: Save/load conversations with full state preservation (scenario, speakers, lines, voice settings)
- **Voice Preview**: Test voice configurations before applying to conversations
- **Persistent State**: Automatic localStorage backup prevents data loss on refresh

## Tech Stack

- **Frontend**: React 18 with functional components and hooks
- **Backend**: Node.js with Express (deployed as AWS Lambda via serverless-http)
- **AI**: AWS Bedrock (Claude 3 Haiku) for script generation
- **Voice Synthesis**: ElevenLabs API (26 voices with prosody controls)
- **Deployment**: 
  - Frontend: AWS Amplify (auto-deploy from CodeCommit)
  - Backend: AWS Lambda + API Gateway
  - IAM: Zero-credential architecture (Lambda execution role)

## Architecture

### Zero-Credential Security Model
- Lambda function uses IAM execution role for AWS service access
- No AWS credentials stored in code or environment variables
- ElevenLabs API key stored in Lambda environment variables only
- Frontend communicates with Lambda via API Gateway

### Data Flow
1. User creates/edits conversation in React frontend
2. Frontend stores state in localStorage for persistence
3. Script generation requests sent to Lambda via API Gateway
4. Lambda uses Bedrock for AI generation, ElevenLabs for voice synthesis
5. Audio returned as base64-encoded MP3 (decoded in frontend)

## Setup

### Prerequisites

- Node.js 18+
- AWS Account with:
  - Bedrock access (Claude 3 Haiku model)
  - Lambda execution permissions
  - API Gateway access
- ElevenLabs API key

### Local Development

1. Clone the repository:
```bash
git clone <your-codecommit-repo-url>
cd conversation-tool
```

2. Install dependencies:
```bash
npm install
cd client && npm install
cd ../server && npm install
```

3. Configure environment variables:
```bash
# Server .env (for local development only)
cp .env.example .env
# Add your ElevenLabs API key and AWS credentials
```

4. **SECURITY CHECK** - Before committing:
```bash
./check-secrets.sh
```

5. Start development servers:
```bash
# Terminal 1 - Backend
cd server && npm start

# Terminal 2 - Frontend  
cd client && npm start
```

The app will be available at:
- Frontend: http://localhost:3000
- Backend: http://localhost:3001

## Security

⚠️ **NEVER commit your `.env` file or any files containing API keys!**

Before committing to git:
```bash
npm run check-secrets
```

See [SECURITY.md](SECURITY.md) for detailed security guidelines.

## Deployment

### Current Production Setup

**Frontend (AWS Amplify)**
- App ID: `d2b3efwoc19bjt`
- URL: https://d2b3efwoc19bjt.amplifyapp.com
- Auto-deploys from CodeCommit `main` branch
- Environment variables configured in Amplify Console

**Backend (AWS Lambda)**
- Function: `conversation-maker-api`
- Runtime: Node.js 18.x
- Memory: 512MB, Timeout: 30s
- API Gateway: https://ic8yikinc1.execute-api.us-east-1.amazonaws.com/prod
- IAM Role: `ConversationMakerLambdaRole` (Bedrock + CloudWatch permissions)

### Deployment Process

#### Frontend Deployment
```bash
# Commit and push to CodeCommit
git add -A
git commit -m "Your changes"
git push origin main

# Amplify auto-deploys (check status in AWS Console)
```

#### Backend Deployment
```bash
# Package and deploy Lambda
./deploy-lambda.sh

# Or manually:
cd lambda-package
zip -r ../conversation-maker-lambda.zip .
aws lambda update-function-code \
  --function-name conversation-maker-api \
  --zip-file fileb://../conversation-maker-lambda.zip
```

### Environment Variables

**Lambda Environment Variables:**
- `ELEVENLABS_API_KEY` - ElevenLabs API key (only place credentials are stored)

**Amplify Environment Variables:**
- `REACT_APP_API_URL` - Lambda API Gateway URL

**Note**: AWS credentials are NOT stored anywhere - Lambda uses IAM execution role.

## Project Structure

```
conversation-tool/
├── client/              # React frontend
│   ├── public/
│   └── src/
│       ├── components/  # React components
│       ├── types/       # TypeScript types
│       └── utils/       # Utility functions
├── server/              # Express backend
│   ├── index.js         # Server entry point
│   ├── routes/          # API routes
│   ├── services/        # Business logic
│   └── templates/       # Conversation templates
├── amplify.yml          # Amplify build configuration
└── package.json         # Root package configuration
```

## API Endpoints

### Voice Management
- `GET /api/voices` - List available ElevenLabs voices

### Conversation Generation
- `POST /api/conversation/generate` - Generate AI conversation script
  - Body: `{ prompt, options: { length, turns }, speakers }`
  - Returns: `{ speakers, lines }`

### Audio Synthesis
- `POST /api/audio/synthesize` - Synthesize single line of dialogue
  - Body: `{ text, voiceId, prosody, speed }`
  - Returns: MP3 audio (base64-encoded in Lambda response)

- `POST /api/audio/preview` - Preview voice with sample text
  - Body: `{ voiceId, prosody, speed }`
  - Returns: MP3 audio (base64-encoded)

## Recent Fixes & Improvements

### v1.1.0 (February 2026)
- ✅ Fixed conversation context not persisting across sessions
- ✅ Fixed speaker configuration lost after script generation
- ✅ Fixed orphaned speaker references causing playback errors
- ✅ Fixed base64 audio decoding for Lambda responses
- ✅ Added validation for corrupted conversation data
- ✅ Implemented zero-credential security architecture
- ✅ Migrated from Elastic Beanstalk to Lambda + API Gateway

### Known Issues
- None currently reported

## Troubleshooting

### Voice Preview Not Working
- Check browser console for base64 decoding errors
- Verify API Gateway has `audio/mpeg` in binary media types
- Ensure Lambda has sufficient timeout (30s recommended)

### Speaker Configuration Lost
- Clear localStorage and refresh if data corruption detected
- Export conversations regularly as backup
- Check that speaker IDs match between lines and speakers array

### Audio Playback Issues
- Verify ElevenLabs API key is valid in Lambda environment
- Check CloudWatch logs for Lambda errors
- Ensure voice IDs are valid (use `/api/voices` to verify)

## License

MIT
