# Security Guidelines

## Critical Rules

### Never Commit These Files
- `.env` (contains API keys)
- `.env.local`, `.env.production`, `.env.development`
- Any file containing credentials or secrets

### Before Every Commit
```bash
npm run check-secrets
```

## Environment Variables

| Variable | Where | Description |
|----------|-------|-------------|
| `ELEVENLABS_API_KEY` | Server `.env` | ElevenLabs API key |
| `AWS_REGION` | Server `.env` | AWS region for Bedrock |
| `BEDROCK_MODEL_ID` | Server `.env` | Bedrock model ID |
| `VITE_API_URL` | Client `.env` | Backend API URL |

- Never hardcode credentials in source code
- Use `.env` files locally (gitignored)
- Use platform environment variables in production (Vercel, etc.)

## If Credentials Are Exposed

1. Rotate the exposed credential immediately
2. Update all environments (local `.env`, hosting platform env vars)
3. Review git history: `git log -p | grep -i "api_key\|secret\|password"`
4. If found in history, use BFG Repo-Cleaner to scrub it
