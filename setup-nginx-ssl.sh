#!/bin/bash
# Setup Nginx and SSL with Let's Encrypt
set -e

echo "🔒 Setting up Nginx and SSL"
echo "==========================="

# Configuration
EC2_IP="54.204.140.214"
KEY_PATH="conversation-maker-key.pem"
DOMAIN="ai-personamaker.jllevine.people.aws.dev"
EMAIL="jllevine@amazon.com"

echo ""
echo "📋 Installing Nginx and Certbot on EC2..."
ssh -i $KEY_PATH ec2-user@$EC2_IP << 'ENDSSH'
  set -e
  
  echo "  → Installing Nginx..."
  sudo yum install -y nginx
  
  echo "  → Installing Certbot..."
  sudo yum install -y python3-pip
  sudo pip3 install certbot certbot-nginx
  
  echo "  → Enabling Nginx..."
  sudo systemctl enable nginx
  sudo systemctl start nginx
  
  echo "✓ Nginx and Certbot installed"
ENDSSH

echo ""
echo "📋 Uploading Nginx configuration..."
aws s3 cp nginx-config.conf s3://conversation-maker-app-1770957587/deploy/

ssh -i $KEY_PATH ec2-user@$EC2_IP << ENDSSH
  set -e
  
  echo "  → Downloading config..."
  aws s3 cp s3://conversation-maker-app-1770957587/deploy/nginx-config.conf /tmp/
  
  echo "  → Installing config..."
  sudo cp /tmp/nginx-config.conf /etc/nginx/conf.d/conversation-maker.conf
  
  echo "  → Testing config..."
  sudo nginx -t
  
  echo "  → Reloading Nginx..."
  sudo systemctl reload nginx
  
  echo "✓ Nginx configured"
ENDSSH

echo ""
echo "📋 Getting SSL certificate..."
ssh -i $KEY_PATH ec2-user@$EC2_IP << ENDSSH
  set -e
  
  echo "  → Running Certbot..."
  sudo certbot --nginx \
    -d $DOMAIN \
    --non-interactive \
    --agree-tos \
    --email $EMAIL \
    --redirect
  
  echo "✓ SSL certificate installed"
ENDSSH

echo ""
echo "==========================="
echo "✅ Nginx and SSL setup complete!"
echo ""
echo "Your app is now live at:"
echo "  https://$DOMAIN"
echo ""
echo "Test it:"
echo "  curl -I https://$DOMAIN"
