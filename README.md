# ElevenLabs Conversation Tool

A standalone web application for creating, editing, and playing multi-speaker conversations using ElevenLabs text-to-speech voices.

## Features

- **Multi-Speaker Conversations**: Create dialogues with 2+ speakers
- **AI Script Generation**: Generate conversation scripts using AWS Bedrock
- **Voice Customization**: Fine-tune prosody and speed per speaker or per line
- **Sequential Playback**: Play conversations with natural pauses between speakers
- **Audio Export**: Export conversations as single merged audio files
- **Template Library**: Start with pre-built conversation templates
- **File Import/Export**: Import and export scripts in JSON or text format

## Tech Stack

- **Frontend**: React 18
- **Backend**: Node.js with Express
- **AI**: AWS Bedrock (Claude 3 Haiku)
- **Voice Synthesis**: ElevenLabs API
- **Deployment**: AWS Amplify + CodeCommit

## Setup

### Prerequisites

- Node.js 18+
- AWS Account with Bedrock access
- ElevenLabs API key

### Installation

1. Clone the repository:
```bash
git clone <your-codecommit-repo-url>
cd conversation-tool
```

2. Install dependencies:
```bash
npm run install-all
```

3. Configure environment variables:
```bash
cp .env.example .env
# Edit .env with your API keys and configuration
```

4. **IMPORTANT: Run security check before committing:**
```bash
npm run check-secrets
```

5. Start development server:
```bash
npm run dev
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

### AWS Amplify Deployment

1. Push code to AWS CodeCommit
2. Connect repository to AWS Amplify
3. Configure environment variables in Amplify Console:
   - `AWS_REGION`
   - `AWS_ACCESS_KEY_ID`
   - `AWS_SECRET_ACCESS_KEY`
   - `ELEVENLABS_API_KEY`
   - `REACT_APP_API_URL`
4. Deploy automatically on push to main branch

### Build for Production

```bash
npm run build
```

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

- `POST /api/conversation/generate` - Generate AI script
- `POST /api/conversation/synthesize` - Synthesize single line
- `POST /api/conversation/export` - Export merged audio
- `GET /api/voices` - Get available ElevenLabs voices
- `GET /api/templates` - Get conversation templates

## License

MIT
