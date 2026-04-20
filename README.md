# Conversation Maker

AI-powered conversation script generator with voice synthesis. Create multi-speaker dialogues with custom voices, generate scripts using AI, and produce professional audio conversations.

## Features

- **AI Script Generation** — Generate natural conversations using AWS Bedrock (Claude)
- **26 Professional Voices** — ElevenLabs voice library with per-speaker configuration
- **Prosody Controls** — Fine-tune stability, similarity boost, style, and speed
- **Sequential Playback** — Play conversations with natural timing and visual timeline
- **Import/Export** — JSON conversations and plain text transcripts
- **Audio Export** — Combined WAV file with padding between clips

## Tech Stack

- **Frontend**: React 18 + Vite
- **Backend**: Node.js + Express
- **AI**: AWS Bedrock (Claude)
- **Voice**: ElevenLabs API
- **Hosting**: Vercel (frontend), backend hosted separately

## Local Development

1. **Install dependencies**:
```bash
npm run install-all
```

2. **Configure environment**:
```bash
cp .env.example .env
# Add your ElevenLabs API key and AWS config to .env
```

3. **Start development servers**:
```bash
npm run dev
```

Frontend: http://localhost:3000
Backend: http://localhost:3001

## Deployment

### Frontend (Vercel)

The frontend deploys to Vercel automatically. Config is in `vercel.json`.

### Backend

The Express server in `server/` needs to be hosted separately (e.g., Railway, Render, Fly.io, or your own server). Set `VITE_API_URL` in the client environment to point to your backend.

## Project Structure

```
├── client/              # React frontend (Vite)
│   ├── src/
│   ├── public/
│   ├── index.html
│   └── vite.config.js
├── server/              # Express backend
│   ├── routes/
│   ├── services/
│   └── index.js
├── vercel.json          # Vercel deployment config
├── package.json         # Root dependencies & scripts
└── .env.example         # Environment template
```

## API Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/health` | Health check |
| GET | `/api/voices` | List ElevenLabs voices |
| POST | `/api/conversation/generate` | Generate AI conversation |
| POST | `/api/conversation/synthesize` | Synthesize voice audio |

## Documentation

- [CONVERSATION_JSON_FORMAT.md](CONVERSATION_JSON_FORMAT.md) — JSON file format spec
- [SECURITY.md](SECURITY.md) — Security guidelines
- [CHANGELOG.md](CHANGELOG.md) — Version history

## License

MIT
