#!/bin/bash

# Deploy Conversation Maker to EC2
# Usage: ./deploy-to-ec2.sh <EC2_PUBLIC_IP>

set -e

if [ -z "$1" ]; then
    echo "Usage: ./deploy-to-ec2.sh <EC2_PUBLIC_IP>"
    exit 1
fi

EC2_IP=$1
KEY_FILE="conversation-maker-key.pem"
EC2_USER="ec2-user"

echo "🚀 Deploying Conversation Maker to EC2: $EC2_IP"

# Check if key file exists
if [ ! -f "$KEY_FILE" ]; then
    echo "❌ Key file not found: $KEY_FILE"
    exit 1
fi

# Step 1: Create deployment package
echo "📦 Creating deployment package..."
rm -rf deploy-temp
mkdir -p deploy-temp

# Copy server files
cp -r server deploy-temp/
cp -r lambda-package/server/knowledge-base deploy-temp/server/ 2>/dev/null || true

# Copy client build (or source if build doesn't exist)
if [ -d "client/build" ]; then
    cp -r client/build deploy-temp/client-build
else
    echo "⚠️  No client build found, will build on EC2"
fi

# Create .env file for server
cat > deploy-temp/server/.env <<EOF
PORT=3001
NODE_ENV=production
ELEVENLABS_API_KEY=${ELEVENLABS_API_KEY:-your_elevenlabs_key_here}
ELEVENLABS_MODEL_ID=eleven_monolingual_v1
BEDROCK_MODEL_ID=us.anthropic.claude-3-haiku-20240307-v1:0
EOF

# Create package.json for root if it doesn't exist
if [ ! -f "deploy-temp/package.json" ]; then
    cat > deploy-temp/package.json <<EOF
{
  "name": "conversation-maker",
  "version": "1.0.0",
  "scripts": {
    "start": "cd server && npm start"
  }
}
EOF
fi

# Create tar archive
tar -czf conversation-maker.tar.gz -C deploy-temp .

echo "✅ Deployment package created"

# Step 2: Copy files to EC2
echo "📤 Uploading files to EC2..."
scp -i $KEY_FILE -o StrictHostKeyChecking=no conversation-maker.tar.gz ${EC2_USER}@${EC2_IP}:/home/ec2-user/

# Step 3: Copy client source for building on EC2 (exclude node_modules and build)
echo "📤 Uploading client source..."
tar -czf client-source.tar.gz --exclude='node_modules' --exclude='build' client/
scp -i $KEY_FILE -o StrictHostKeyChecking=no client-source.tar.gz ${EC2_USER}@${EC2_IP}:/home/ec2-user/

echo "✅ Files uploaded"

# Step 4: Deploy on EC2
echo "🔧 Setting up application on EC2..."
ssh -i $KEY_FILE -o StrictHostKeyChecking=no ${EC2_USER}@${EC2_IP} << 'ENDSSH'
set -e

cd /home/ec2-user

# Extract server files
rm -rf app
mkdir -p app
tar -xzf conversation-maker.tar.gz -C app/
cd app

# Install server dependencies
echo "📦 Installing server dependencies..."
cd server
npm install --production
cd ..

# Extract and build client
echo "📦 Building client..."
cd /home/ec2-user
tar -xzf client-source.tar.gz
cd client
npm install
VITE_API_URL=http://$(curl -s http://169.254.169.254/latest/meta-data/public-ipv4):3001 npm run build
cd ..

# Move build to app directory
mv client/build app/client-build

# Configure nginx
echo "🔧 Configuring nginx..."
sudo tee /etc/nginx/conf.d/conversation-maker.conf > /dev/null <<'EOF'
server {
    listen 80;
    server_name _;

    # Serve React frontend
    location / {
        root /home/ec2-user/app/client-build;
        try_files $uri $uri/ /index.html;
    }

    # Proxy API requests to Node.js backend
    location /api/ {
        proxy_pass http://localhost:3001/api/;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }
}
EOF

# Start nginx
sudo systemctl enable nginx
sudo systemctl restart nginx

# Start Node.js server with PM2
echo "🚀 Starting Node.js server..."
cd /home/ec2-user/app/server
pm2 delete conversation-maker 2>/dev/null || true
pm2 start index.js --name conversation-maker
pm2 save
pm2 startup systemd -u ec2-user --hp /home/ec2-user

echo "✅ Application deployed successfully!"

ENDSSH

# Step 5: Get final status
echo ""
echo "✅ Deployment complete!"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "🌐 Application URL: http://${EC2_IP}"
echo "🔧 API URL: http://${EC2_IP}/api"
echo ""
echo "Useful commands:"
echo "  SSH: ssh -i ${KEY_FILE} ${EC2_USER}@${EC2_IP}"
echo "  View logs: ssh -i ${KEY_FILE} ${EC2_USER}@${EC2_IP} 'pm2 logs conversation-maker'"
echo "  Restart: ssh -i ${KEY_FILE} ${EC2_USER}@${EC2_IP} 'pm2 restart conversation-maker'"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"

# Cleanup
rm -rf deploy-temp conversation-maker.tar.gz client-source.tar.gz

echo "✅ Cleanup complete"
