# ABM Internal Deployment Setup

## Prerequisites
- Amazon internal AWS account (via Isengard)
- Bindle for the application (https://bindles.amazon.com)
- SSH key pair for EC2 access

---

## Step 0: Get Your Current IP

You'll need this for the security group. Your IP will change if you switch networks/VPN.

```bash
# Get your current public IP
curl -s https://checkip.amazonaws.com
# Example output: 72.21.198.64
```

Save this — you'll use `<YOUR_IP>/32` in the security group rules below.

---

## Step 1: EC2 Instance

### Security Group: `abm-sg` (LOCKED DOWN — your IP only)

```bash
# Create security group
aws ec2 create-security-group \
  --group-name abm-sg \
  --description "ABM - restricted to owner IP only"

# Get your current IP
MY_IP=$(curl -s https://checkip.amazonaws.com)

# SSH — your IP only
aws ec2 authorize-security-group-ingress \
  --group-name abm-sg \
  --protocol tcp --port 22 \
  --cidr ${MY_IP}/32

# HTTPS — your IP only (NOT 0.0.0.0/0)
aws ec2 authorize-security-group-ingress \
  --group-name abm-sg \
  --protocol tcp --port 443 \
  --cidr ${MY_IP}/32

# App port — your IP only
aws ec2 authorize-security-group-ingress \
  --group-name abm-sg \
  --protocol tcp --port 3001 \
  --cidr ${MY_IP}/32

# NO port 80 open. No 0.0.0.0/0 on anything.
# If you need to demo to someone else, temporarily add their IP.

echo "Security group locked to: ${MY_IP}/32"
```

⚠️ **DO NOT open any port to 0.0.0.0/0 or ::/0** — that will trigger a security finding (potential sev2).

When you're ready to open it up to the team later, you can:
- Add the Amazon corporate CIDR range (VPN/office IPs) instead of 0.0.0.0/0
- Or put an ALB in front with Midway auth (the proper long-term solution)

### Launch Instance

```bash
# Launch Amazon Linux 2023, t2.medium, us-east-1
aws ec2 run-instances \
  --image-id resolve:ssm:/aws/service/ami-amazon-linux-latest/al2023-ami-kernel-default-x86_64 \
  --instance-type t2.medium \
  --key-name <YOUR_KEY_PAIR_NAME> \
  --security-groups abm-sg \
  --tag-specifications 'ResourceType=instance,Tags=[{Key=Name,Value=abm-server}]'
```

### Helper: Update Security Group When Your IP Changes

If you switch networks (home ↔ office ↔ VPN), your IP changes. Run this to update:

```bash
#!/bin/bash
# save as update-sg-ip.sh
SG_ID="<your-security-group-id>"  # sg-0abc123...
OLD_IP="<previous-ip>"             # or leave blank on first run

NEW_IP=$(curl -s https://checkip.amazonaws.com)

if [ -n "$OLD_IP" ]; then
  echo "Revoking old IP: $OLD_IP"
  for PORT in 22 443 3001; do
    aws ec2 revoke-security-group-ingress \
      --group-id $SG_ID --protocol tcp --port $PORT --cidr ${OLD_IP}/32 2>/dev/null
  done
fi

echo "Adding new IP: $NEW_IP"
for PORT in 22 443 3001; do
  aws ec2 authorize-security-group-ingress \
    --group-id $SG_ID --protocol tcp --port $PORT --cidr ${NEW_IP}/32
done

echo "Done. SG updated to $NEW_IP/32"
```

## Step 2: IAM Role for EC2

```bash
# Create trust policy
cat > abm-ec2-trust.json << 'EOF'
{
  "Version": "2012-10-17",
  "Statement": [{
    "Effect": "Allow",
    "Principal": { "Service": "ec2.amazonaws.com" },
    "Action": "sts:AssumeRole"
  }]
}
EOF

# Create role
aws iam create-role \
  --role-name ABM-EC2-Role \
  --assume-role-policy-document file://abm-ec2-trust.json

# Create permissions policy (Bedrock invoke only)
cat > abm-bedrock-policy.json << 'EOF'
{
  "Version": "2012-10-17",
  "Statement": [{
    "Effect": "Allow",
    "Action": "bedrock:InvokeModel",
    "Resource": "arn:aws:bedrock:*::foundation-model/*"
  }]
}
EOF

aws iam put-role-policy \
  --role-name ABM-EC2-Role \
  --policy-name ABM-Bedrock-Access \
  --policy-document file://abm-bedrock-policy.json

# Create instance profile and attach
aws iam create-instance-profile --instance-profile-name ABM-EC2-Profile
aws iam add-role-to-instance-profile \
  --instance-profile-name ABM-EC2-Profile \
  --role-name ABM-EC2-Role

# Attach to EC2 instance
aws ec2 associate-iam-instance-profile \
  --instance-id <INSTANCE_ID> \
  --iam-instance-profile Name=ABM-EC2-Profile
```

## Step 3: EC2 Server Setup

```bash
ssh -i /path/to/keypair.pem ec2-user@<EC2_IP>

# Install Node.js 20.x
curl -fsSL https://rpm.nodesource.com/setup_20.x | sudo bash -
sudo yum install -y nodejs

# Install PM2
sudo npm install -g pm2

# Verify
node --version   # v20.x
pm2 --version

# Setup PM2 to start on boot
pm2 startup
# Run the command it outputs (sudo env PATH=...)
```

## Step 4: SuperNova Domain + SSL

1. Go to https://supernova.corp.amazon.com
2. Request domain: `abm.amazon.dev` (CDO organization)
3. Provide your Bindle ID
4. Create IAM role for SuperNova:
   ```bash
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
   ```
5. Request SSL certificate in SuperNova (same region as EC2)
6. Click "Create records in Route 53" for DNS validation
7. Wait for certificate status: ISSUED
8. Add A record pointing to EC2 public IP

## Step 5: Anthropic Model Agreement

New accounts need an explicit marketplace subscription:
```bash
aws bedrock create-foundation-model-agreement \
  --model-id anthropic.claude-sonnet-4-20250514-v1:0
```

## Step 6: Create .env on EC2

```bash
cat > /home/ec2-user/abm/.env << 'EOF'
PORT=3001
NODE_ENV=production
AWS_REGION=us-east-1
BEDROCK_MODEL_ID=us.anthropic.claude-sonnet-4-20250514-v1:0
APP_DOMAIN=https://abm.amazon.dev
# ELEVENLABS_API_KEY=<add if using voice features>
EOF
```

No AWS_ACCESS_KEY_ID or AWS_SECRET_ACCESS_KEY — the EC2 IAM role provides credentials automatically.

## Step 7: First Deploy

```bash
# From your local machine
export EC2_IP=<your-ec2-ip>
export KEY_PATH=~/path/to/keypair.pem
./deploy.sh
```

## Step 8: Validation Gates

```bash
# 1. Identity — should show internal account ID
ssh -i $KEY_PATH ec2-user@$EC2_IP 'aws sts get-caller-identity'

# 2. Model — Bedrock invoke works with IAM role
ssh -i $KEY_PATH ec2-user@$EC2_IP 'aws bedrock-runtime invoke-model \
  --model-id us.anthropic.claude-sonnet-4-20250514-v1:0 \
  --content-type application/json \
  --accept application/json \
  --body "{\"anthropic_version\":\"bedrock-2023-05-31\",\"max_tokens\":50,\"messages\":[{\"role\":\"user\",\"content\":\"Say hi\"}]}" \
  /dev/stdout'

# 3. Health
curl https://abm.amazon.dev/api/health

# 4. SSL
openssl s_client -connect abm.amazon.dev:443 -servername abm.amazon.dev < /dev/null 2>/dev/null | head -5

# 5. Behavior — open https://abm.amazon.dev in browser, run full ABM flow
```
