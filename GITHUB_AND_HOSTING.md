# GitHub + Live Hosting Setup

## 1. Create GitHub Repository

1. Go to [github.com/new](https://github.com/new)
2. Repository name: `conversation-maker` (or your choice)
3. Visibility: Public or Private
4. **Do not** initialize with README (you already have code)
5. Create repository

## 2. Push to GitHub

```bash
cd "/Users/jllevine/Dropbox/playground/AI Persona tool/conversation-maker"

# Add GitHub as remote (replace YOUR_USERNAME and REPO_NAME with yours)
git remote add github https://github.com/YOUR_USERNAME/conversation-maker.git

# Or if you want GitHub as primary:
# git remote rename origin codecommit
# git remote add origin https://github.com/YOUR_USERNAME/conversation-maker.git

# Commit any uncommitted changes
git add -A
git status   # Review changes
git commit -m "Add Vite migration, ABM updates, GitHub + Vercel setup"

# Push to GitHub
git push github main
# Or: git push -u github main
```

## 3. Host on Vercel (Recommended)

Vercel auto-deploys from GitHub and works well with Vite.

1. Go to [vercel.com](https://vercel.com) and sign in with GitHub
2. Click **Add New** → **Project**
3. Import your `conversation-maker` repo
4. **Configure:**
   - **Root Directory:** `client` (or leave blank — `vercel.json` sets it)
   - **Framework Preset:** Other (Vite)
   - **Build Command:** `npm run build`
   - **Output Directory:** `build`
5. **Environment Variables** (critical):
   - `VITE_API_URL` = your API Gateway URL (see below)
   - **Personal account (582234715800):** Deploy first with `AWS_PROFILE=personal ./deploy-to-personal-account.sh`, then use the API URL from the output
   - **Other account:** Use the API URL from your deployment (e.g. `https://xxxxx.execute-api.us-east-1.amazonaws.com/prod`)
6. Deploy

Your app will be live at `https://conversation-maker-xxx.vercel.app` (or your custom domain).

## 4. Subdomain (Later — perfectpixels)

When ready to add a subdomain (e.g., `abm.perfectpixels.com` or `conversation.perfectpixels.com`):

### Option A: Vercel Custom Domain
1. Vercel Dashboard → Project → Settings → Domains
2. Add `abm.perfectpixels.com` (or your chosen subdomain)
3. Vercel will show DNS instructions
4. In your DNS (where perfectpixels.com is managed), add:
   - **Type:** CNAME
   - **Name:** `abm` (or `conversation`)
   - **Value:** `cname.vercel-dns.com`

### Option B: Keep S3 + Add CloudFront
If you prefer to stay on AWS:
1. Create CloudFront distribution pointing to your S3 bucket
2. Add alternate domain `abm.perfectpixels.com`
3. Request/attach SSL cert in ACM
4. Add CNAME in DNS pointing to CloudFront

## 5. Backend (Personal Account)

To use the **personal account** API (582234715800):

1. Configure AWS for personal account:
   ```bash
   aws configure --profile personal
   # Enter Access Key + Secret for account 582234715800
   ```

2. Deploy to personal account:
   ```bash
   export ELEVENLABS_API_KEY=your_key
   AWS_PROFILE=personal ./deploy-to-personal-account.sh
   ```

3. Copy the **API URL** from the deploy output and set it in Vercel:
   - Vercel → Project → Settings → Environment Variables
   - `VITE_API_URL` = `https://xxxxx.execute-api.us-east-1.amazonaws.com/prod`

The frontend will call it for:
- `/api/voices` — ElevenLabs voices
- `/api/conversation/*` — Script generation, synthesis
- `/api/abm/*` — Agent Behavior Maker

## 6. Redeploy Backend (If Needed)

```bash
cd "/Users/jllevine/Dropbox/playground/AI Persona tool/conversation-maker"
export ELEVENLABS_API_KEY=your_key
AWS_PROFILE=personal ./deploy-to-personal-account.sh
```

## Quick Reference

| Item | Value |
|------|-------|
| Personal account | 582234715800 |
| Deploy command | `AWS_PROFILE=personal ./deploy-to-personal-account.sh` |
| Vercel env var | `VITE_API_URL` = API URL from deploy output |
| S3 (personal) | `http://conversation-maker-app-582234715800.s3-website-us-east-1.amazonaws.com` |
