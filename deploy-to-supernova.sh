#!/bin/bash
# Deployment script for Conversation Maker to SuperNova
set -e

echo "🚀 Deploying Conversation Maker to SuperNova"
echo "=============================================="

# Configuration
EC2_IP="54.204.140.214"
EC2_INSTANCE_ID="i-06986a8cae45c7906"
DOMAIN="ai-personamaker.jllevine.people.aws.dev"
VPC_ID="vpc-0876c975"
REGION="us-east-1"
S3_BUCKET="conversation-maker-app-1770957587"

# Step 1: Create Security Group
echo ""
echo "📋 Step 1: Creating security group..."
SG_ID=$(aws ec2 create-security-group \
  --group-name conversation-maker-sg \
  --description "Compliant security group for conversation maker" \
  --vpc-id $VPC_ID \
  --region $REGION \
  --output text --query 'GroupId' 2>/dev/null || echo "")

if [ -z "$SG_ID" ]; then
  echo "⚠️  Security group might already exist, trying to find it..."
  SG_ID=$(aws ec2 describe-security-groups \
    --filters "Name=group-name,Values=conversation-maker-sg" "Name=vpc-id,Values=$VPC_ID" \
    --region $REGION \
    --query 'SecurityGroups[0].GroupId' \
    --output text)
fi

echo "✓ Security Group ID: $SG_ID"

# Step 2: Add Inbound Rules
echo ""
echo "📋 Step 2: Adding inbound rules..."

# SSH from your IP
aws ec2 authorize-security-group-ingress \
  --group-id $SG_ID \
  --protocol tcp \
  --port 22 \
  --cidr 67.185.74.87/32 \
  --region $REGION 2>/dev/null || echo "  SSH rule already exists"

# HTTP for health checks
aws ec2 authorize-security-group-ingress \
  --group-id $SG_ID \
  --protocol tcp \
  --port 80 \
  --cidr 0.0.0.0/0 \
  --region $REGION 2>/dev/null || echo "  HTTP rule already exists"

# HTTPS for traffic
aws ec2 authorize-security-group-ingress \
  --group-id $SG_ID \
  --protocol tcp \
  --port 443 \
  --cidr 0.0.0.0/0 \
  --region $REGION 2>/dev/null || echo "  HTTPS rule already exists"

# App port
aws ec2 authorize-security-group-ingress \
  --group-id $SG_ID \
  --protocol tcp \
  --port 3001 \
  --cidr 0.0.0.0/0 \
  --region $REGION 2>/dev/null || echo "  Port 3001 rule already exists"

echo "✓ Inbound rules configured"

# Step 3: Add Outbound Rule
echo ""
echo "📋 Step 3: Adding outbound rule..."
aws ec2 authorize-security-group-egress \
  --group-id $SG_ID \
  --protocol all \
  --cidr 0.0.0.0/0 \
  --region $REGION 2>/dev/null || echo "  Outbound rule already exists"

echo "✓ Outbound rule configured"

# Step 4: Attach Security Group to Instance
echo ""
echo "📋 Step 4: Attaching security group to EC2 instance..."

# Get current security groups
CURRENT_SGS=$(aws ec2 describe-instances \
  --instance-ids $EC2_INSTANCE_ID \
  --region $REGION \
  --query 'Reservations[0].Instances[0].SecurityGroups[*].GroupId' \
  --output text)

# Add new SG if not already attached
if [[ ! "$CURRENT_SGS" =~ "$SG_ID" ]]; then
  aws ec2 modify-instance-attribute \
    --instance-id $EC2_INSTANCE_ID \
    --groups $SG_ID \
    --region $REGION
  echo "✓ Security group attached"
else
  echo "✓ Security group already attached"
fi

# Step 5: Add SSM Policy to IAM Role
echo ""
echo "📋 Step 5: Adding SSM policy to IAM role..."
ROLE_NAME="conversation-maker-ec2-role"

aws iam attach-role-policy \
  --role-name $ROLE_NAME \
  --policy-arn arn:aws:iam::aws:policy/AmazonSSMManagedInstanceCore \
  --region $REGION 2>/dev/null || echo "  SSM policy already attached"

echo "✓ SSM policy configured"

echo ""
echo "=============================================="
echo "✅ Infrastructure setup complete!"
echo ""
echo "Next steps:"
echo "1. Wait 2-3 minutes for SSM agent to connect"
echo "2. Run: ./deploy-app-to-ec2.sh"
echo ""
echo "Or SSH manually:"
echo "  ssh -i conversation-maker-key.pem ec2-user@$EC2_IP"
