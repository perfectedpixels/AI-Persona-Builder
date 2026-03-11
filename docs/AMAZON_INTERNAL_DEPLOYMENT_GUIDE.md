# Amazon Internal Deployment Guide
## Complete Playbook for Deploying Internal Web Applications

This guide documents the complete setup for deploying internal web applications at Amazon, based on our video annotator deployment experience.

---

## Table of Contents
1. [Architecture Overview](#architecture-overview)
2. [EC2 Instance Setup](#ec2-instance-setup)
3. [Domain & SSL Setup (SuperNova)](#domain--ssl-setup-supernova)
4. [S3 Storage Configuration](#s3-storage-configuration)
5. [Application Deployment](#application-deployment)
6. [Troubleshooting Common Issues](#troubleshooting-common-issues)
7. [Quick Reference Commands](#quick-reference-commands)

---

## Architecture Overview

### Our Stack
```
┌─────────────────────────────────────────────────────────────┐
│                    video-annotator.amazon.dev                │
│                    (SuperNova Domain + SSL)                  │
└────────────────────┬────────────────────────────────────────┘
                     │
                     ▼
┌─────────────────────────────────────────────────────────────┐
│              EC2 Instance (us-east-1)                        │
│  ┌──────────────────────────────────────────────────────┐   │
│  │  Node.js Server (Port 3002)                          │   │
│  │  - Express API                                       │   │
│  │  - Socket.io for real-time                          │   │
│  │  - Serves static frontend (dist/)                   │   │
│  └──────────────────────────────────────────────────────┘   │
└────────────────────┬────────────────────────────────────────┘
                     │
                     ▼
┌─────────────────────────────────────────────────────────────┐
│              S3 Bucket (us-east-1)                           │
│              your-video-annotation-bucket                    │
│  - Public read access for videos/                           │
│  - CORS enabled                                              │
│  - Direct URLs (no presigned URLs needed)                   │
└─────────────────────────────────────────────────────────────┘
```

### Key Components
- **EC2**: Hosts Node.js server and serves frontend
- **SuperNova**: Provides custom `.amazon.dev` domain with SSL
- **S3**: Stores large media files (videos)
- **Route 53**: DNS management (via SuperNova)
- **ACM**: SSL certificate management (via SuperNova)

---

## EC2 Instance Setup

### 1. Launch EC2 Instance

**Instance Details:**
- **AMI**: Amazon Linux 2023
- **Instance Type**: t2.medium or larger (for video processing)
- **Region**: us-east-1 (or your preferred region)
- **Storage**: 30GB+ (depending on local storage needs)

**Security Group Rules:**
```
Inbound Rules:
- Port 22 (SSH): Your IP or Amazon network
- Port 80 (HTTP): 0.0.0.0/0 (for SuperNova health checks)
- Port 443 (HTTPS): 0.0.0.0/0 (for HTTPS traffic)
- Port 3002 (Custom): 0.0.0.0/0 (your app port)

Outbound Rules:
- All traffic: 0.0.0.0/0
```

### 2. Initial Server Setup

SSH into your instance:
```bash
ssh -i /path/to/keypair.pem ec2-user@<EC2_IP>
```

Install Node.js:
```bash
# Install Node.js 20.x
curl -fsSL https://rpm.nodesource.com/setup_20.x | sudo bash -
sudo yum install -y nodejs

# Verify installation
node --version
npm --version
```

Install Git (if needed):
```bash
sudo yum install -y git
```

### 3. Deploy Your Application

Upload your code:
```bash
# From your local machine
scp -i /path/to/keypair.pem -r server/ ec2-user@<EC2_IP>:/home/ec2-user/
scp -i /path/to/keypair.pem -r dist/ ec2-user@<EC2_IP>:/home/ec2-user/
```

Install dependencies:
```bash
# On EC2 instance
cd /home/ec2-user/server
npm install
```

### 4. Run Server as Background Process

**Simple approach (what we used):**
```bash
cd /home/ec2-user/server
AWS_S3_BUCKET=your-bucket-name \
AWS_REGION=us-east-1 \
S3_PUBLIC_ACCESS=true \
NODE_ENV=production \
node index.js > ../server.log 2>&1 &
```

**Better approach (using PM2):**
```bash
# Install PM2 globally
sudo npm install -g pm2

# Start your app
pm2 start index.js --name "video-annotator" \
  --env AWS_S3_BUCKET=your-bucket-name \
  --env AWS_REGION=us-east-1 \
  --env S3_PUBLIC_ACCESS=true \
  --env NODE_ENV=production

# Save PM2 configuration
pm2 save

# Setup PM2 to start on boot
pm2 startup
# Follow the command it outputs
```

### 5. IAM Role for EC2 (Recommended)

Instead of using AWS credentials, attach an IAM role to your EC2 instance:

**Create IAM Role:**
1. Go to IAM Console → Roles → Create Role
2. Select "AWS Service" → "EC2"
3. Attach policies:
   - `AmazonS3FullAccess` (or custom policy with specific bucket access)
   - `AmazonTranscribeFullAccess` (if using transcription)
4. Name it: `VideoAnnotatorEC2Role`

**Attach to EC2:**
1. EC2 Console → Select instance
2. Actions → Security → Modify IAM role
3. Select `VideoAnnotatorEC2Role`

**Benefits:**
- No need to manage AWS credentials
- Automatic credential rotation
- More secure

---

## Domain & SSL Setup (SuperNova)

SuperNova is Amazon's internal service for managing custom domains and SSL certificates.

### Prerequisites

1. **Bindle**: You need a Bindle (Amazon's resource management system)
   - Go to: https://bindles.amazon.com
   - Create a new Bindle for your application
   - Note the Bindle ID

2. **IAM Role for SuperNova**: 
   ```bash
   # Create IAM role with trust policy
   aws iam create-role \
     --role-name Nova-DO-NOT-DELETE \
     --assume-role-policy-document '{
       "Version": "2012-10-17",
       "Statement": [{
         "Effect": "Allow",
         "Principal": {"Service": "supernova.amazonaws.com"},
         "Action": "sts:AssumeRole"
       }]
     }'
   
   # Note the Role ARN (you'll need this)
   ```

### Step-by-Step SuperNova Setup

#### 1. Request Domain via SuperNova

Go to: https://supernova.corp.amazon.com

**Domain Request:**
- **Domain Name**: `your-app-name.amazon.dev`
- **Organization**: Choose `CDO` (for `.amazon.dev` domains)
- **Bindle**: Select your Bindle
- **IAM Role ARN**: `arn:aws:iam::<ACCOUNT_ID>:role/Nova-DO-NOT-DELETE`
- **DNS Management**: Let SuperNova manage DNS

**Important Notes:**
- `.aws.dev` domains require Production Isengard accounts
- `.amazon.dev` domains work with CDO organization
- Domain approval is usually instant

#### 2. Request SSL Certificate

In SuperNova, after domain is created:

1. Click "Request Certificate"
2. **Certificate Details:**
   - **Domain**: `your-app-name.amazon.dev`
   - **Region**: `us-east-1` (must match your EC2 region)
   - **Key Algorithm**: RSA 2048 (most compatible)
   - **Export**: Disable export (keep private key in AWS)

3. **DNS Validation:**
   - SuperNova will show a CNAME record
   - Click "Create records in Route 53" button
   - Wait 5-10 minutes for validation

4. **Verify Certificate:**
   ```bash
   aws acm describe-certificate \
     --certificate-arn <CERTIFICATE_ARN> \
     --region us-east-1
   ```
   Status should be "ISSUED"

#### 3. Point Domain to EC2

**Option A: Using SuperNova UI**
1. Go to your domain in SuperNova
2. Add A record pointing to your EC2 IP

**Option B: Using AWS CLI**
```bash
# Get your hosted zone ID
aws route53 list-hosted-zones-by-name \
  --dns-name your-app-name.amazon.dev

# Create A record
aws route53 change-resource-record-sets \
  --hosted-zone-id <ZONE_ID> \
  --change-batch '{
    "Changes": [{
      "Action": "CREATE",
      "ResourceRecordSet": {
        "Name": "your-app-name.amazon.dev",
        "Type": "A",
        "TTL": 300,
        "ResourceRecords": [{"Value": "<EC2_IP>"}]
      }
    }]
  }'
```

#### 4. Configure Application Load Balancer (Optional but Recommended)

For production, use an ALB with SSL termination:

```bash
# Create ALB
aws elbv2 create-load-balancer \
  --name video-annotator-alb \
  --subnets <SUBNET_1> <SUBNET_2> \
  --security-groups <SG_ID>

# Create target group
aws elbv2 create-target-group \
  --name video-annotator-targets \
  --protocol HTTP \
  --port 3002 \
  --vpc-id <VPC_ID>

# Register EC2 instance
aws elbv2 register-targets \
  --target-group-arn <TG_ARN> \
  --targets Id=<INSTANCE_ID>

# Add HTTPS listener with certificate
aws elbv2 create-listener \
  --load-balancer-arn <ALB_ARN> \
  --protocol HTTPS \
  --port 443 \
  --certificates CertificateArn=<CERT_ARN> \
  --default-actions Type=forward,TargetGroupArn=<TG_ARN>
```

Then point your domain to the ALB DNS name instead of EC2 IP.

### Testing Domain & SSL

```bash
# Test DNS resolution
nslookup your-app-name.amazon.dev

# Test HTTPS
curl -I https://your-app-name.amazon.dev

# Check SSL certificate
openssl s_client -connect your-app-name.amazon.dev:443 -servername your-app-name.amazon.dev
```

---

## S3 Storage Configuration

### Why S3?
- Store large files (videos, images) outside EC2
- Scalable and durable
- Cost-effective
- Can serve files directly to users

### 1. Create S3 Bucket

```bash
aws s3api create-bucket \
  --bucket your-app-bucket \
  --region us-east-1
```

### 2. Configure Public Access (for internal tools)

**Disable Block Public Access:**
```bash
aws s3api put-public-access-block \
  --bucket your-app-bucket \
  --public-access-block-configuration \
    "BlockPublicAcls=false,IgnorePublicAcls=false,BlockPublicPolicy=false,RestrictPublicBuckets=false"
```

**Add Bucket Policy:**
```bash
cat > bucket-policy.json <<EOF
{
  "Version": "2012-10-17",
  "Statement": [{
    "Sid": "PublicReadGetObject",
    "Effect": "Allow",
    "Principal": "*",
    "Action": "s3:GetObject",
    "Resource": "arn:aws:s3:::your-app-bucket/public/*"
  }]
}
EOF

aws s3api put-bucket-policy \
  --bucket your-app-bucket \
  --policy file://bucket-policy.json
```

### 3. Configure CORS

```bash
cat > cors-config.json <<EOF
{
  "CORSRules": [{
    "AllowedHeaders": ["*"],
    "AllowedMethods": ["GET", "HEAD"],
    "AllowedOrigins": ["*"],
    "ExposeHeaders": ["ETag"],
    "MaxAgeSeconds": 3600
  }]
}
EOF

aws s3api put-bucket-cors \
  --bucket your-app-bucket \
  --cors-configuration file://cors-config.json
```

### 4. Application Code for S3

**Using AWS SDK v3:**

```javascript
// s3-service.js
import { S3Client, PutObjectCommand, GetObjectCommand } from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';

const s3Client = new S3Client({ region: process.env.AWS_REGION });
const BUCKET_NAME = process.env.AWS_S3_BUCKET;
const USE_PUBLIC_URLS = process.env.S3_PUBLIC_ACCESS === 'true';

// Upload file
export async function uploadFile(buffer, key, contentType) {
  await s3Client.send(new PutObjectCommand({
    Bucket: BUCKET_NAME,
    Key: key,
    Body: buffer,
    ContentType: contentType
  }));
  return key;
}

// Get URL (public or presigned)
export async function getFileUrl(key) {
  if (USE_PUBLIC_URLS) {
    return `https://${BUCKET_NAME}.s3.${process.env.AWS_REGION}.amazonaws.com/${key}`;
  }
  
  // Presigned URL (expires in 1 hour)
  const command = new GetObjectCommand({ Bucket: BUCKET_NAME, Key: key });
  return await getSignedUrl(s3Client, command, { expiresIn: 3600 });
}
```

### 5. Public URLs vs Presigned URLs

**Public URLs:**
- ✅ Never expire
- ✅ Simple, direct access
- ✅ Better for video previews/thumbnails
- ✅ Works outside Amazon firewall
- ⚠️ Anyone with URL can access
- **Use for**: Internal tools, public content

**Presigned URLs:**
- ✅ Temporary access (1 hour default)
- ✅ More secure
- ✅ Can restrict by IP, time, etc.
- ❌ Expire and need refresh
- ❌ Complex URLs with credentials
- **Use for**: Sensitive content, external sharing

**Our Choice:** Public URLs for internal tool simplicity

---

## Application Deployment

### Frontend Build & Deploy

```bash
# Build frontend locally
npm run build

# Upload to EC2
scp -i /path/to/keypair.pem -r dist/* ec2-user@<EC2_IP>:/home/ec2-user/dist/

# Or use rsync for faster updates
rsync -avz -e "ssh -i /path/to/keypair.pem" \
  dist/ ec2-user@<EC2_IP>:/home/ec2-user/dist/
```

### Backend Deploy

```bash
# Upload server code
scp -i /path/to/keypair.pem -r server/* ec2-user@<EC2_IP>:/home/ec2-user/server/

# SSH and restart
ssh -i /path/to/keypair.pem ec2-user@<EC2_IP>

# Kill old process
sudo pkill -9 node

# Start new process
cd /home/ec2-user/server
AWS_S3_BUCKET=your-bucket \
AWS_REGION=us-east-1 \
S3_PUBLIC_ACCESS=true \
NODE_ENV=production \
node index.js > ../server.log 2>&1 &
```

### Deployment Script

Create `deploy.sh`:
```bash
#!/bin/bash
set -e

EC2_IP="3.81.247.175"
KEY_PATH="~/path/to/keypair.pem"

echo "Building frontend..."
npm run build

echo "Uploading frontend..."
scp -i $KEY_PATH -r dist/* ec2-user@$EC2_IP:/home/ec2-user/dist/

echo "Uploading backend..."
scp -i $KEY_PATH -r server/* ec2-user@$EC2_IP:/home/ec2-user/server/

echo "Restarting server..."
ssh -i $KEY_PATH ec2-user@$EC2_IP << 'ENDSSH'
  sudo pkill -9 node
  cd /home/ec2-user/server
  AWS_S3_BUCKET=your-bucket \
  AWS_REGION=us-east-1 \
  S3_PUBLIC_ACCESS=true \
  NODE_ENV=production \
  node index.js > ../server.log 2>&1 &
ENDSSH

echo "✓ Deployment complete!"
echo "Check logs: ssh -i $KEY_PATH ec2-user@$EC2_IP 'tail -f /home/ec2-user/server.log'"
```

---

## Troubleshooting Common Issues

### Issue 1: Video Previews Don't Load Outside Firewall

**Symptoms:**
- Videos work inside Amazon network
- Fail outside Amazon network
- Browser shows CORS errors or 403 Forbidden

**Solution:**
1. Use public S3 URLs instead of presigned URLs
2. Configure S3 bucket for public read access
3. Ensure CORS is configured
4. Check Block Public Access settings

**Verify:**
```bash
# Test S3 URL directly
curl -I https://your-bucket.s3.region.amazonaws.com/path/to/file

# Should return HTTP 200
```

### Issue 2: SSL Certificate Not Working

**Symptoms:**
- Browser shows "Not Secure"
- Certificate errors
- HTTPS not working

**Solution:**
1. Verify certificate is issued in ACM
2. Check certificate is in same region as ALB/CloudFront
3. Ensure DNS validation CNAME is created
4. Wait 5-10 minutes for propagation

**Verify:**
```bash
aws acm describe-certificate \
  --certificate-arn <ARN> \
  --region us-east-1 \
  | jq '.Certificate.Status'
```

### Issue 3: Domain Not Resolving

**Symptoms:**
- `nslookup` fails
- Domain doesn't point to EC2

**Solution:**
1. Check Route 53 hosted zone exists
2. Verify A record points to correct IP
3. Wait for DNS propagation (up to 5 minutes)

**Verify:**
```bash
nslookup your-app.amazon.dev
dig your-app.amazon.dev
```

### Issue 4: Server Crashes or Stops

**Symptoms:**
- App stops responding
- Process not running

**Solution:**
1. Use PM2 for process management
2. Check server logs for errors
3. Ensure enough memory/CPU

**Debug:**
```bash
# Check if process is running
ps aux | grep node

# Check logs
tail -100 /home/ec2-user/server.log

# Check system resources
top
free -h
df -h
```

### Issue 5: Data Lost on Server Restart

**Symptoms:**
- Videos/comments disappear after restart
- Data not persisting

**Solution:**
1. Implement file-based persistence
2. Save data to JSON files
3. Load data on server startup
4. Auto-save on changes

**Example:**
```javascript
// Save data periodically
setInterval(saveData, 5 * 60 * 1000); // Every 5 minutes

// Save on process exit
process.on('SIGINT', () => {
  saveData();
  process.exit(0);
});
```

---

## Quick Reference Commands

### EC2 Management
```bash
# SSH into instance
ssh -i /path/to/keypair.pem ec2-user@<EC2_IP>

# Check running processes
ps aux | grep node

# View server logs
tail -f /home/ec2-user/server.log

# Check disk space
df -h

# Check memory
free -h
```

### S3 Management
```bash
# List buckets
aws s3 ls

# List bucket contents
aws s3 ls s3://your-bucket/

# Upload file
aws s3 cp file.txt s3://your-bucket/

# Download file
aws s3 cp s3://your-bucket/file.txt .

# Make bucket public
aws s3api put-bucket-policy --bucket your-bucket --policy file://policy.json
```

### Route 53 / DNS
```bash
# List hosted zones
aws route53 list-hosted-zones

# Get records for zone
aws route53 list-resource-record-sets --hosted-zone-id <ZONE_ID>

# Test DNS
nslookup your-app.amazon.dev
dig your-app.amazon.dev
```

### ACM / SSL Certificates
```bash
# List certificates
aws acm list-certificates --region us-east-1

# Describe certificate
aws acm describe-certificate --certificate-arn <ARN> --region us-east-1

# Test SSL
openssl s_client -connect your-app.amazon.dev:443
```

### Deployment
```bash
# Build and deploy
npm run build
scp -i key.pem -r dist/* ec2-user@<IP>:/home/ec2-user/dist/

# Restart server
ssh -i key.pem ec2-user@<IP> 'sudo pkill -9 node && cd server && node index.js > ../server.log 2>&1 &'

# Hard refresh browser
# Mac: Cmd + Shift + R
# Windows: Ctrl + Shift + R
```

---

## Best Practices

### Security
1. ✅ Use IAM roles instead of access keys
2. ✅ Restrict security group rules to necessary ports
3. ✅ Use SSL/HTTPS for all traffic
4. ✅ Keep dependencies updated
5. ✅ Don't commit secrets to git

### Performance
1. ✅ Use S3 for large files
2. ✅ Enable gzip compression
3. ✅ Use CDN (CloudFront) for static assets
4. ✅ Implement caching headers
5. ✅ Monitor resource usage

### Reliability
1. ✅ Use PM2 or systemd for process management
2. ✅ Implement health checks
3. ✅ Set up CloudWatch alarms
4. ✅ Regular backups of data
5. ✅ Document deployment process

### Development
1. ✅ Use environment variables for configuration
2. ✅ Separate dev/staging/prod environments
3. ✅ Version control everything
4. ✅ Test before deploying
5. ✅ Keep deployment scripts updated

---

## Resources

### Internal Amazon Tools
- **SuperNova**: https://supernova.corp.amazon.com
- **Bindles**: https://bindles.amazon.com
- **Isengard**: https://isengard.amazon.com
- **Phone Tool**: https://phonetool.amazon.com

### AWS Documentation
- **EC2**: https://docs.aws.amazon.com/ec2/
- **S3**: https://docs.aws.amazon.com/s3/
- **Route 53**: https://docs.aws.amazon.com/route53/
- **ACM**: https://docs.aws.amazon.com/acm/

### Useful Wikis
- SuperNova Setup: https://w.amazon.com/bin/view/SuperNova/
- Bindles Guide: https://w.amazon.com/bin/view/Bindles/

---

## Summary Checklist

When deploying a new internal app:

- [ ] Create EC2 instance with appropriate security group
- [ ] Install Node.js and dependencies
- [ ] Create S3 bucket for media storage
- [ ] Configure S3 for public access (if needed)
- [ ] Create Bindle for your application
- [ ] Create IAM role for SuperNova
- [ ] Request domain via SuperNova
- [ ] Request SSL certificate
- [ ] Validate certificate via Route 53
- [ ] Point domain to EC2 (or ALB)
- [ ] Deploy application code
- [ ] Set up process management (PM2)
- [ ] Test from inside and outside Amazon network
- [ ] Document your specific configuration
- [ ] Set up monitoring and alerts

---

**Last Updated**: February 2026
**Maintainer**: Your Team
**Questions**: Contact your team lead or post in your team's Slack channel
