# Add agentmaker.perfectpixels.com (Masked Subdomain)

Use **agentmaker.perfectpixels.com** as the URL while content is served from your host. The subdomain stays in the address bar (masked).

---

## Option A: Vercel (Recommended if project is on Vercel)

1. **Vercel Dashboard** → Your project → **Settings** → **Domains**
2. Click **Add** and enter: `agentmaker.perfectpixels.com`
3. Vercel will show DNS instructions.
4. **In your DNS** (where perfectpixels.com is managed — e.g. Namecheap, GoDaddy, Cloudflare, Route 53):
   - **Type:** CNAME
   - **Name:** `agentmaker` (or `agentmaker.perfectpixels` depending on provider)
   - **Value:** `cname.vercel-dns.com`
5. Save. DNS propagation can take a few minutes to 48 hours.
6. Ensure `VITE_API_URL` is set in Vercel env vars (API Gateway URL).

**Result:** `https://agentmaker.perfectpixels.com` serves your app; URL stays masked.

---

## Option B: CloudFront + S3 (If using S3 only)

If you're not on Vercel and want to keep S3:

### 1. Create CloudFront distribution

```bash
# Create distribution pointing to S3 website
aws cloudfront create-distribution \
  --origin-domain-name conversation-maker-app-582234715800.s3-website-us-east-1.amazonaws.com \
  --default-root-object index.html \
  --viewer-protocol-policy redirect-to-https
```

Or use the **AWS Console**:
1. CloudFront → Create distribution
2. **Origin domain:** `conversation-maker-app-582234715800.s3-website-us-east-1.amazonaws.com` (S3 website endpoint, not bucket)
3. **Viewer protocol policy:** Redirect HTTP to HTTPS
4. **Default root object:** `index.html`
5. **Alternate domain names (CNAMEs):** `agentmaker.perfectpixels.com`
6. **SSL certificate:** Request new in ACM (us-east-1) for `agentmaker.perfectpixels.com`
7. Create distribution and note the **Distribution domain name** (e.g. `d1234abcd.cloudfront.net`)

### 2. Add DNS record

In your DNS for perfectpixels.com:
- **Type:** CNAME
- **Name:** `agentmaker`
- **Value:** `d1234abcd.cloudfront.net` (your CloudFront domain)

### 3. S3 / CloudFront behavior for SPA

Ensure CloudFront serves `index.html` for 404s (for client-side routing). Add a custom error response:
- **HTTP error code:** 403 and 404
- **Response page path:** `/index.html`
- **HTTP response code:** 200

**Result:** `https://agentmaker.perfectpixels.com` serves your S3 app; URL stays masked.

---

## Quick reference

| Subdomain | Purpose |
|-----------|---------|
| `agentmaker.perfectpixels.com` | Agent Behavior Maker app |

| If using | DNS CNAME target |
|----------|------------------|
| Vercel | `cname.vercel-dns.com` |
| CloudFront | `xxxxx.cloudfront.net` (your distribution) |
