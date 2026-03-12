# Internal Deployment — Tasks

## Code Changes (can do now)

- [x] Task 1: Update server/index.js — static file serving for production
- [x] Task 2: Update server/index.js — CORS tightening for production
- [x] Task 3: Create client/.env.production with empty VITE_API_URL
- [x] Task 4: Update .env.example for production config
- [x] Task 5: Create ecosystem.config.cjs (PM2 config)
- [x] Task 6: Create deploy.sh script
- [x] Task 7: Security audit — removed ElevenLabs key from .env, flagged hardcoded AWS key in deploy-to-personal-account.sh. Old deploy scripts in docs/archive/ have stale keys but are gitignored/archived.

## Infrastructure (manual steps — requires AWS console/CLI)

- [ ] Task 8: Create EC2 instance + security group
- [ ] Task 9: Create IAM role (ABM-EC2-Role) and attach to EC2
- [ ] Task 10: Install Node.js 20.x + PM2 on EC2
- [ ] Task 11: SuperNova domain request + SSL certificate
- [ ] Task 12: DNS validation + point domain to EC2
- [ ] Task 13: First deployment via deploy.sh
- [ ] Task 14: Run validation gates (identity, model, health, behavior, SSL)
