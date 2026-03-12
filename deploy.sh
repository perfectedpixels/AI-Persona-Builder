#!/bin/bash
set -e

# ─── Configuration ───────────────────────────────────────────
# Update these for your EC2 instance
EC2_IP="${EC2_IP:-YOUR_EC2_IP_HERE}"
KEY_PATH="${KEY_PATH:-~/path/to/keypair.pem}"
EC2_USER="ec2-user"
REMOTE_DIR="/home/$EC2_USER/abm"
# ─────────────────────────────────────────────────────────────

if [ "$EC2_IP" = "YOUR_EC2_IP_HERE" ]; then
  echo "ERROR: Set EC2_IP before running."
  echo "  export EC2_IP=1.2.3.4"
  echo "  export KEY_PATH=~/path/to/keypair.pem"
  exit 1
fi

SSH_CMD="ssh -i $KEY_PATH $EC2_USER@$EC2_IP"
SCP_CMD="scp -i $KEY_PATH"

echo "=== Building frontend ==="
(cd client && npm run build)

echo "=== Uploading to EC2 ==="
# Create remote directory structure
$SSH_CMD "mkdir -p $REMOTE_DIR/server $REMOTE_DIR/client/build $REMOTE_DIR/logs"

# Upload server files
rsync -avz --delete -e "ssh -i $KEY_PATH" \
  --exclude 'node_modules' \
  server/ $EC2_USER@$EC2_IP:$REMOTE_DIR/server/

# Upload built frontend
rsync -avz --delete -e "ssh -i $KEY_PATH" \
  client/build/ $EC2_USER@$EC2_IP:$REMOTE_DIR/client/build/

# Upload root config files
$SCP_CMD package.json $EC2_USER@$EC2_IP:$REMOTE_DIR/
$SCP_CMD package-lock.json $EC2_USER@$EC2_IP:$REMOTE_DIR/
$SCP_CMD ecosystem.config.cjs $EC2_USER@$EC2_IP:$REMOTE_DIR/

echo "=== Installing dependencies on EC2 ==="
$SSH_CMD "cd $REMOTE_DIR && npm ci --omit=dev"

echo "=== Restarting PM2 ==="
$SSH_CMD "cd $REMOTE_DIR && pm2 startOrRestart ecosystem.config.cjs --env production"

echo ""
echo "=== Deployment complete ==="
echo "Check status:  $SSH_CMD 'pm2 status'"
echo "Check logs:    $SSH_CMD 'pm2 logs abm --lines 50'"
echo "Health check:  curl https://abm.amazon.dev/api/health"
