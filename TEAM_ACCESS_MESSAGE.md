Hey team,

I've created read-only access to the Conversation Maker repository. Here's what you need to get started:

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
REPOSITORY ACCESS CREDENTIALS (READ-ONLY)
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

Clone URL:
https://git-codecommit.us-east-1.amazonaws.com/v1/repos/conversation-maker

Git Username:
conversation-maker-readonly-at-739476174856

Git Password:
xH5xy2HchsV0JjjkDRzG+yiB+F+3icfyF/9IlbDTb3EkKpl0BXzoBo7CTKQ=

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
GETTING STARTED
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

1. Clone the repository:
   git clone https://git-codecommit.us-east-1.amazonaws.com/v1/repos/conversation-maker

2. When prompted, enter:
   - Username: conversation-maker-readonly-at-739476174856
   - Password: xH5xy2HchsV0JjjkDRzG+yiB+F+3icfyF/9IlbDTb3EkKpl0BXzoBo7CTKQ=

3. (Optional) To avoid re-entering credentials every time:
   git config --global credential.helper store
   Then the next time you pull, Git will save your credentials.

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
PROJECT OVERVIEW
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

Conversation Maker - AI-powered conversation script generator with voice synthesis

WHAT IT DOES:
This tool helps create and produce multi-speaker conversations with AI-generated scripts and voice synthesis:

1. Script Generation
   - AI-powered conversation generation using AWS Bedrock (Claude)
   - Define speakers with custom personalities and contexts
   - Generate scripts with custom length (short/medium/long/custom turns)
   - Manual script editing and line-by-line control

2. Voice Configuration
   - ElevenLabs voice synthesis integration
   - Per-speaker voice selection and configuration
   - Prosody controls (stability, similarity, style, speaker boost)
   - Speed adjustment (0.7x - 1.2x)
   - Per-line voice overrides for fine-tuning

3. Audio Production
   - Generate audio for individual lines or entire scripts
   - Real-time playback with visual timeline
   - Export combined audio with 1-second padding between clips
   - Export transcript in text format

4. Import/Export
   - Save/load full conversations (JSON format with all settings)
   - Import transcripts from text files (flexible format support)
   - Export transcripts and audio files

KEY FEATURES:
✓ Multi-speaker conversations (2-10 speakers)
✓ AI script generation with context awareness
✓ Professional voice synthesis (ElevenLabs)
✓ Real-time audio playback and editing
✓ Flexible import/export formats
✓ Per-line and per-speaker voice customization
✓ Visual speaker identification with colors

LIVE DEMO:
Frontend: https://main.d3xxxxxxxxxx.amplifyapp.com/ (check Amplify console for actual URL)

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
TECH STACK
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

Frontend:
- React 18 (single-page application)
- Deployed via AWS Amplify (auto-deploys on git push)
- Local state management with localStorage persistence

Backend:
- Node.js + Express
- Deployed on AWS Lambda (serverless)
- API Gateway for HTTP endpoints

AI & Voice:
- AWS Bedrock (Claude 3 Haiku) - Script generation
- ElevenLabs - Text-to-speech synthesis and voice library
- Web Audio API - Audio processing and concatenation

Security:
- Lambda environment variables - API keys (ElevenLabs)
- IAM Roles - AWS service access (no hardcoded credentials)
- Amplify CI/CD - Automated frontend deployment

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
DEVELOPMENT
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

Local Setup:
1. npm install (in root and client directories)
2. Copy .env.example to .env and add your ElevenLabs API key
3. npm run dev (starts local development server)

Deployment:
- Frontend: Push to main → Amplify auto-deploys
- Backend: Run ./deploy-lambda-code-only.sh to update Lambda function

Project Structure:
- /client - React frontend application
- /server - Express backend API
- /lambda-package - Lambda deployment package
- lambda.js - Lambda handler wrapper

Key Files:
- client/src/components/ConversationEditor.js - Main app component
- client/src/components/ScriptPanel.js - Script editing and playback
- client/src/components/ConversationPanel.js - Speaker and generation controls
- server/routes/generate.js - Script generation endpoint
- server/services/bedrock.js - AWS Bedrock integration
- server/services/elevenlabs.js - ElevenLabs voice synthesis

Documentation:
- README.md - Project overview and setup
- CONVERSATION_JSON_FORMAT.md - JSON file format specification
- DEPLOYMENT.md - Deployment instructions
- deploy-lambda-code-only.sh - Quick Lambda deployment script

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
IMPORTANT NOTES
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

✓ You have READ-ONLY access (can clone and pull, cannot push)
✓ These credentials are CodeCommit-specific (no AWS Console access)
✓ Store credentials securely (use a password manager)
✓ Shared credentials - do not modify or delete

Questions? Let me know!

Best,
Ray
