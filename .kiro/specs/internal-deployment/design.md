# Internal Deployment — Design

## Architecture

```
                    YOU (your IP only)
                     │
                     │ HTTPS (443) — SG: <YOUR_IP>/32
                     ▼
┌─────────────────────────────────────────────────────────┐
│              EC2 Instance (us-east-1)                    │
│              Amazon Linux 2023 / t2.medium               │
│              IAM Role: ABM-EC2-Role                      │
│              SG: abm-sg (owner IP only, no 0.0.0.0/0)   │
│  ┌───────────────────────────────────────────────────┐  │
│  │  Node.js 20.x + PM2                              │  │
│  │  Express Server (Port 3001)                       │  │
│  │  ├── /api/abm/*  → ABM API routes                │  │
│  │  ├── /api/health → Health check                   │  │
│  │  └── /*          → Static files (client/build/)   │  │
│  └───────────────────────────────────────────────────┘  │
└────────────────────┬────────────────────────────────────┘
                     │ IAM Role credentials (automatic)
                     ▼
┌─────────────────────────────────────────────────────────┐
│              AWS Bedrock (us-east-1)                     │
│              Claude Sonnet 4                             │
│              (us.anthropic.claude-sonnet-4-20250514-v1:0)│
└─────────────────────────────────────────────────────────┘
```

No S3, no ALB, no Lambda — just EC2 talking to Bedrock. Simple.

Security group is locked to your IP only. No ports open to the internet.
When ready to share with the team, add corporate CIDR or put an ALB with Midway auth in front.

## Code Changes

### 1. Static file serving (server/index.js)

Add static file serving for production. Express serves `client/build/` and falls back to `index.html` for SPA routing.

```js
// After API routes, before error handler
if (process.env.NODE_ENV === 'production') {
  const clientBuild = path.join(__dirname, '../client/build');
  app.use(express.static(clientBuild));
  app.get('*', (req, res) => {
    res.sendFile(path.join(clientBuild, 'index.html'));
  });
}
```

### 2. CORS tightening (server/index.js)

In production, restrict CORS to the SuperNova domain instead of `*`.

```js
const ALLOWED_ORIGINS = process.env.NODE_ENV === 'production'
  ? [process.env.APP_DOMAIN || 'https://abm.amazon.dev']
  : ['http://localhost:3000', 'http://localhost:3001'];

app.use(cors({
  origin: ALLOWED_ORIGINS,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS', 'PATCH'],
  allowedHeaders: ['Content-Type', 'Authorization', 'Accept', 'Origin', 'X-Requested-With'],
  maxAge: 86400,
}));
```

### 3. Client production env (client/.env.production)

```
VITE_API_URL=
```

Empty string means all API calls go to same origin (the Express server).

### 4. .env.example update

Reflect production config with IAM role note.

### 5. deploy.sh

Script to build + upload + restart on EC2.

### 6. PM2 ecosystem file (ecosystem.config.cjs)

```js
module.exports = {
  apps: [{
    name: 'abm',
    script: 'server/index.js',
    env: {
      NODE_ENV: 'production',
      PORT: 3001,
      AWS_REGION: 'us-east-1',
      BEDROCK_MODEL_ID: 'us.anthropic.claude-sonnet-4-20250514-v1:0'
    },
    max_memory_restart: '512M',
    error_file: './logs/err.log',
    out_file: './logs/out.log',
    merge_logs: true
  }]
};
```

## What's NOT Changing
- All ABM service files (abm-processor, abm-conversation, abm-export, bedrock-retry) stay as-is
- All React components stay as-is
- Bedrock SDK already uses default credential chain (picks up IAM role automatically)
- No database, no S3, no additional AWS services needed
