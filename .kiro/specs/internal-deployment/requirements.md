# Internal Deployment — Requirements

## Goal
Migrate the Agent Behavior Maker (ABM) from a personal local-dev setup to a secured Amazon internal deployment, accessible via a `.amazon.dev` domain with SSL.

## Context
- App is a Vite React frontend + Express Node.js backend
- Backend calls AWS Bedrock (Claude Sonnet 4) for AI processing
- Currently runs locally: client on port 3000, server on port 3001
- Personal AWS account (`582234715800`) with `perfectpixels-bot` IAM user credentials
- Needs to move to an internal Amazon account with proper IAM roles, no hardcoded keys

## Reference Documents
- `~/Dropbox/playground/AMAZON_INTERNAL_DEPLOYMENT_GUIDE.md` — EC2 + SuperNova + S3 playbook
- `~/Dropbox/playground/AWS_MIGRATION.md` — Account migration runbook with validation gates

---

## Requirements

### R1: EC2 Instance
- Amazon Linux 2023, t2.medium or larger (Bedrock calls are CPU-light but need memory for Node)
- Security group locked to owner's IP only (`<YOUR_IP>/32`) on ports 22, 443, 3001
- NO ports open to 0.0.0.0/0 or ::/0 — this triggers security findings (sev2 risk)
- Port 80 not needed (no public health checks until ALB/Midway is added later)
- IAM role attached to EC2 (no access keys in env vars or code)
- Node.js 20.x installed
- PM2 for process management with auto-restart on crash and boot
- Helper script to update SG when IP changes (network/VPN switch)

### R2: IAM Role for EC2
- Role: `ABM-EC2-Role` assumed by `ec2.amazonaws.com`
- Permissions:
  - `bedrock:InvokeModel` for Claude Sonnet 4 (all regions for inference profiles)
  - No S3 needed (ABM doesn't use S3 storage)
  - No Knowledge Base access needed (ABM uses direct Bedrock invoke only)

### R3: SuperNova Domain + SSL
- Request `.amazon.dev` domain via SuperNova (e.g. `abm.amazon.dev` or `agent-behavior-maker.amazon.dev`)
- SSL certificate via ACM in same region as EC2
- DNS validation via Route 53
- Domain pointed to EC2 public IP (or ALB if scaling later)

### R4: Production Build & Serving
- Vite builds frontend to `client/build/`
- Express serves static files from `client/build/` in production
- Single port (3001) serves both API and frontend — no separate Vite dev server
- `VITE_API_URL` set to empty string or relative path (same origin)

### R5: Environment Configuration
- `.env` on EC2 contains only:
  - `PORT=3001`
  - `NODE_ENV=production`
  - `AWS_REGION=us-east-1`
  - `BEDROCK_MODEL_ID=us.anthropic.claude-sonnet-4-20250514-v1:0`
  - `ELEVENLABS_API_KEY=<key>` (if ElevenLabs features are used)
- No `AWS_ACCESS_KEY_ID` or `AWS_SECRET_ACCESS_KEY` — EC2 IAM role provides credentials automatically

### R6: Security Hardening
- Remove any hardcoded credentials from codebase
- Ensure `.env` files are in `.gitignore` (already done)
- Remove personal account references from code and docs
- ElevenLabs API key stays in env var (not in code)
- CORS restricted to the SuperNova domain (not `*`)

### R7: Deployment Script
- `deploy.sh` that:
  1. Builds frontend (`cd client && npm run build`)
  2. Uploads server + built frontend to EC2 via scp/rsync
  3. Installs dependencies on EC2
  4. Restarts PM2 process

### R8: Validation Gates (from migration runbook)
1. Identity gate: `aws sts get-caller-identity` returns internal account
2. Model gate: Bedrock invoke succeeds from EC2 with IAM role
3. Health gate: `/api/health` returns ok with `bedrock: configured`
4. Behavior gate: Full ABM flow works (upload docs → scenarios → conversation → export)
5. SSL gate: `https://<domain>.amazon.dev` loads with valid cert

### R9: Code Changes Required
- `server/index.js`: Serve static files from `client/build/` when `NODE_ENV=production`
- `server/index.js`: Tighten CORS to SuperNova domain in production
- `client/.env.production`: `VITE_API_URL=` (empty — same origin)
- Remove `AWS_ACCESS_KEY_ID` / `AWS_SECRET_ACCESS_KEY` from any config files
- Update `.env.example` to reflect production setup
