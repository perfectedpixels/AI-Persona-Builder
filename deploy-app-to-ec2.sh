#!/bin/bash
# Deploy application files to EC2
set -e

echo "📦 Deploying Conversation Maker Application"
echo "==========================================="

# Configuration
EC2_IP="54.204.140.214"
KEY_PATH="conversation-maker-key.pem"
S3_BUCKET="conversation-maker-app-1770957587"

# Step 1: Upload deployment packages to S3
echo ""
echo "📋 Step 1: Uploading to S3..."
aws s3 cp conversation-maker-deploy.tar.gz s3://$S3_BUCKET/deploy/
aws s3 cp conversation-maker-server.tar.gz s3://$S3_BUCKET/deploy/
echo "✓ Files uploaded to S3"

# Step 2: SSH and deploy
echo ""
echo "📋 Step 2: Deploying on EC2..."
ssh -i $KEY_PATH -o StrictHostKeyChecking=no ec2-user@$EC2_IP << 'ENDSSH'
  set -e
  
  echo "  → Creating directories..."
  mkdir -p /home/ec2-user/conversation-maker/dist
  mkdir -p /home/ec2-user/conversation-maker/server
  
  echo "  → Downloading from S3..."
  cd /home/ec2-user/conversation-maker
  aws s3 cp s3://conversation-maker-app-1770957587/deploy/conversation-maker-deploy.tar.gz .
  aws s3 cp s3://conversation-maker-app-1770957587/deploy/conversation-maker-server.tar.gz .
  
  echo "  → Extracting files..."
  tar -xzf conversation-maker-deploy.tar.gz -C dist/
  tar -xzf conversation-maker-server.tar.gz
  
  echo "  → Installing dependencies..."
  npm install --production
  
  echo "  → Creating .env file..."
  cat > server/.env <<EOF
PORT=3001
NODE_ENV=production
AWS_REGION=us-east-1
BEDROCK_MODEL_ID=us.anthropic.claude-3-haiku-20240307-v1:0
ELEVENLABS_API_KEY=${ELEVENLABS_API_KEY:-your_elevenlabs_key_here}
ELEVENLABS_MODEL_ID=eleven_monolingual_v1
EOF
  
  echo "  → Stopping old server..."
  sudo pkill -9 node || true
  sleep 2
  
  echo "  → Starting server..."
  cd server
  NODE_ENV=production node index.js > ../server.log 2>&1 &
  sleep 3
  
  echo "  → Testing server..."
  curl -s http://localhost:3001/api/health || echo "Health check failed"
  
  echo "✓ Application deployed"
ENDSSH

echo ""
echo "==========================================="
echo "✅ Application deployment complete!"
echo ""
echo "Test the app:"
echo "  http://$EC2_IP:3001"
echo ""
echo "Next: Set up Nginx and SSL"
echo "  Run: ./setup-nginx-ssl.sh"
