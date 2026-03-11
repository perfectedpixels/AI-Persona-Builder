# Conversation Maker

AI-powered conversation script generator with voice synthesis. Create multi-speaker dialogues with custom voices, generate scripts using AI, and produce professional audio conversations.

## Live Application

🌐 **Production URL**: https://d2b3efwoc19bjt.amplifyapp.com

## Features

### Script Creation & Editing
- **AI Script Generation**: Generate natural conversations using AWS Bedrock (Claude 3 Haiku)
- **Custom Length Control**: Short (5-8 turns), Medium (10-15), Long (20-30), or Custom turn count
- **Manual Editing**: Add, edit, delete, and reorder individual lines
- **Import Transcripts**: Import existing scripts from text files (flexible format support)
- **Multi-Speaker Support**: 2-10 speakers with unique personalities and contexts

### Voice Synthesis & Customization
- **26 Professional Voices**: ElevenLabs voice library with diverse options
- **Per-Speaker Configuration**: Assign unique voices to each speaker
- **Prosody Controls**: Fine-tune stability, similarity boost, style, and speaker boost
- **Speed Adjustment**: 0.7x - 1.2x speed control per speaker or per line
- **Per-Line Overrides**: Override voice settings for individual lines
- **Voice Preview**: Test voice configurations before applying

### Audio Production
- **Sequential Playback**: Play conversations with natural timing and visual timeline
- **Batch Generation**: Generate audio for all lines at once
- **Export Audio**: Combined audio file with 1-second padding between clips (WAV format)
- **Export Transcript**: Plain text transcript export

### Data Management
- **Save/Load Conversations**: Full conversation export/import (JSON format)
- **Persistent State**: Automatic localStorage backup prevents data loss
- **Speaker Preservation**: Voice configurations maintained across script regeneration

## Tech Stack

### Frontend
- React 18 with functional components and hooks
- Vite for fast builds and dev server
- Deployed via AWS Amplify (auto-deploy from CodeCommit)
- Web Audio API for audio processing

### Backend
- Node.js + Express
- Deployed as AWS Lambda (serverless)
- API Gateway for HTTP endpoints

### AI & Voice Services
- **AWS Bedrock** (Claude 3 Haiku) - Script generation
- **ElevenLabs API** - Text-to-speech synthesis and voice library

### Security
- Zero-credential architecture (Lambda IAM execution role)
- No AWS credentials in code or environment variables
- ElevenLabs API key stored in Lambda environment only

## Quick Start

### 🚀 AWS Deployment (Recommended)

Deploy to AWS in minutes with automated setup:

```bash
cd conversation-maker
export ELEVENLABS_API_KEY=your_key_here
./setup-aws-services.sh
```

See [QUICK_START.md](QUICK_START.md) for the fastest path to production.

For detailed AWS setup instructions, see [AWS_SETUP_GUIDE.md](AWS_SETUP_GUIDE.md).

### 💻 Local Development

1. **Clone the repository**:
```bash
git clone https://git-codecommit.us-east-1.amazonaws.com/v1/repos/conversation-maker
cd conversation-maker
```

2. **Install dependencies**:
```bash
npm install
cd client && npm install && cd ..
cd server && npm install && cd ..
```

3. **Configure environment**:
```bash
cp .env.example .env
# Add your ElevenLabs API key to .env
```

4. **Start development servers**:
```bash
# Terminal 1 - Backend
cd server && npm start

# Terminal 2 - Frontend (Vite)
cd client && npm run dev
```

Frontend: http://localhost:3000  
Backend: http://localhost:3001

## Deployment

### Complete AWS Setup
```bash
./setup-aws-services.sh
```
Creates Lambda, API Gateway, IAM roles, and configures everything automatically.

### Update Backend (Lambda)
```bash
# Code changes only
./deploy-lambda-code-only.sh

# Code + environment variables
export ELEVENLABS_API_KEY=your_key_here
./deploy-lambda.sh
```

### Update Frontend (Amplify)
Automatically deploys when you push to the `main` branch:
```bash
git add -A
git commit -m "Your changes"
git push origin main
```

### Verify Deployment
```bash
./verify-aws-setup.sh
```

## Project Structure

```
conversation-maker/
├── client/                    # React frontend
│   ├── public/
│   └── src/
│       ├── components/        # React components
│       │   ├── ConversationEditor.js    # Main app container
│       │   ├── ConversationPanel.js     # Speaker & generation controls
│       │   ├── ScriptPanel.js           # Script editing & playback
│       │   ├── VoiceConfigModal.js      # Voice configuration UI
│       │   └── ...
│       ├── types/             # Data models
│       └── config.js          # API configuration
├── server/                    # Express backend
│   ├── index.js              # Server entry point
│   ├── routes/               # API routes
│   │   └── generate.js       # Script generation endpoint
│   └── services/             # Business logic
│       ├── bedrock.js        # AWS Bedrock integration
│       └── elevenlabs.js     # ElevenLabs API integration
├── lambda-package/           # Lambda deployment package
├── lambda.js                 # Lambda handler wrapper
├── deploy-lambda-code-only.sh  # Quick Lambda deployment
├── deploy-lambda.sh          # Full Lambda deployment
└── amplify.yml               # Amplify build configuration
```

## API Endpoints

### Voice Management
- `GET /api/voices` - List available ElevenLabs voices

### Script Generation
- `POST /api/conversation/generate` - Generate AI conversation script
  ```json
  {
    "prompt": "A podcast interview about AI",
    "options": {
      "length": "medium",  // or "short", "long", "custom"
      "turns": 10          // required if length is "custom"
    },
    "speakers": [
      { "name": "Host", "context": "Enthusiastic interviewer" },
      { "name": "Guest", "context": "AI researcher" }
    ]
  }
  ```

### Audio Synthesis
- `POST /api/conversation/synthesize` - Synthesize dialogue audio
  ```json
  {
    "text": "Hello, welcome to the show!",
    "voiceId": "21m00Tcm4TlvDq8ikWAM",
    "prosody": {
      "stability": 0.75,
      "similarity_boost": 0.75,
      "style": 0.5,
      "use_speaker_boost": true
    },
    "speed": 1.0
  }
  ```

## Import/Export Formats

### JSON Conversation Format
Full conversation with all settings (speakers, voices, prosody, lines).  
See [CONVERSATION_JSON_FORMAT.md](CONVERSATION_JSON_FORMAT.md) for detailed specification.

### Text Transcript Format
Simple text format for importing scripts. Supports multiple formats:

**Format 1** (same line):
```
Speaker 1: Hello, how are you?
Speaker 2: I'm doing great, thanks!
```

**Format 2** (next line with colon):
```
Speaker 1:
Hello, how are you?
Speaker 2:
I'm doing great, thanks!
```

**Format 3** (next line without colon):
```
Speaker 1
Hello, how are you?
Speaker 2
I'm doing great, thanks!
```

## Security

⚠️ **NEVER commit `.env` files or API keys to git!**

Before committing:
```bash
./check-secrets.sh
```

See [SECURITY.md](SECURITY.md) for detailed security guidelines.

## Recent Updates

### v1.2.0 (February 2026)
- ✅ Added Import Transcript feature with flexible format support
- ✅ Added manual line addition for any speaker
- ✅ Added audio export with 1-second padding between clips
- ✅ Fixed custom conversation length validation
- ✅ Fixed voice selection for new speakers
- ✅ Created code-only Lambda deployment script

### v1.1.0 (February 2026)
- ✅ Fixed speaker preservation during script generation
- ✅ Fixed conversation context persistence
- ✅ Fixed base64 audio decoding for Lambda responses
- ✅ Added validation for corrupted conversation data
- ✅ Implemented zero-credential security architecture

## Troubleshooting

### Voice Preview Not Working
- Check browser console for errors
- Verify API Gateway has `audio/mpeg` in binary media types
- Ensure Lambda timeout is sufficient (30s recommended)

### Custom Length Not Working
- Ensure Lambda backend is deployed with latest code
- Run `./deploy-lambda-code-only.sh` to update

### Audio Playback Issues
- Verify ElevenLabs API key is valid in Lambda environment
- Check CloudWatch logs: `/aws/lambda/conversation-maker-api`
- Ensure voice IDs are valid (use `/api/voices` endpoint)

## Documentation

### Setup & Deployment
- [AWS_SETUP_COMPLETE.md](AWS_SETUP_COMPLETE.md) - 🎉 Complete AWS setup package overview
- [QUICK_START.md](QUICK_START.md) - ⭐ Get started in minutes
- [AWS_SETUP_GUIDE.md](AWS_SETUP_GUIDE.md) - 📖 Complete AWS setup guide
- [AWS_CHECKLIST.md](AWS_CHECKLIST.md) - ✅ Deployment checklist
- [DEPLOYMENT_GUIDE.md](DEPLOYMENT_GUIDE.md) - 📋 Detailed deployment instructions

### Reference
- [AWS_SERVICES_SUMMARY.md](AWS_SERVICES_SUMMARY.md) - 🏗️ Architecture and services overview
- [AWS_COMMANDS_REFERENCE.md](AWS_COMMANDS_REFERENCE.md) - 💻 AWS CLI commands reference
- [CONVERSATION_JSON_FORMAT.md](CONVERSATION_JSON_FORMAT.md) - JSON file format specification
- [SECURITY.md](SECURITY.md) - Security guidelines
- [CHANGELOG.md](CHANGELOG.md) - Version history
- [TEAM_ACCESS_MESSAGE.md](TEAM_ACCESS_MESSAGE.md) - Team access credentials

## Team Access

Read-only repository access is available for team members.  
See [TEAM_ACCESS_MESSAGE.md](TEAM_ACCESS_MESSAGE.md) for credentials and setup instructions.

## License

MIT
