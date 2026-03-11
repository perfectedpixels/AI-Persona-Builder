#!/bin/bash

# EC2 Setup Script for Conversation Maker
# This script sets up an EC2 instance with the full application

set -e

echo "🚀 Setting up EC2 instance for Conversation Maker..."

# Configuration
INSTANCE_NAME="conversation-maker-app"
KEY_NAME="conversation-maker-key"
SECURITY_GROUP_NAME="conversation-maker-sg"
INSTANCE_TYPE="t3.medium"  # 2 vCPU, 4GB RAM - good for Node.js apps
AMI_ID="ami-0c55b159cbfafe1f0"  # Amazon Linux 2023 (update for your region)

# Step 1: Create key pair if it doesn't exist
echo "📝 Creating EC2 key pair..."
if ! aws ec2 describe-key-pairs --key-names $KEY_NAME 2>/dev/null; then
    aws ec2 create-key-pair \
        --key-name $KEY_NAME \
        --query 'KeyMaterial' \
        --output text > ${KEY_NAME}.pem
    chmod 400 ${KEY_NAME}.pem
    echo "✅ Key pair created and saved to ${KEY_NAME}.pem"
else
    echo "ℹ️  Key pair already exists"
fi

# Step 2: Create security group
echo "🔒 Creating security group..."
if ! aws ec2 describe-security-groups --group-names $SECURITY_GROUP_NAME 2>/dev/null; then
    SG_ID=$(aws ec2 create-security-group \
        --group-name $SECURITY_GROUP_NAME \
        --description "Security group for Conversation Maker app" \
        --query 'GroupId' \
        --output text)
    
    # Allow SSH (22)
    aws ec2 authorize-security-group-ingress \
        --group-id $SG_ID \
        --protocol tcp \
        --port 22 \
        --cidr 0.0.0.0/0
    
    # Allow HTTP (80)
    aws ec2 authorize-security-group-ingress \
        --group-id $SG_ID \
        --protocol tcp \
        --port 80 \
        --cidr 0.0.0.0/0
    
    # Allow HTTPS (443)
    aws ec2 authorize-security-group-ingress \
        --group-id $SG_ID \
        --protocol tcp \
        --port 443 \
        --cidr 0.0.0.0/0
    
    # Allow Node.js backend (3001)
    aws ec2 authorize-security-group-ingress \
        --group-id $SG_ID \
        --protocol tcp \
        --port 3001 \
        --cidr 0.0.0.0/0
    
    echo "✅ Security group created: $SG_ID"
else
    SG_ID=$(aws ec2 describe-security-groups \
        --group-names $SECURITY_GROUP_NAME \
        --query 'SecurityGroups[0].GroupId' \
        --output text)
    echo "ℹ️  Security group already exists: $SG_ID"
fi

# Step 3: Create IAM role for EC2 with Bedrock permissions
echo "👤 Creating IAM role for EC2..."
ROLE_NAME="conversation-maker-ec2-role"

if ! aws iam get-role --role-name $ROLE_NAME 2>/dev/null; then
    # Create trust policy
    cat > ec2-trust-policy.json <<EOF
{
  "Version": "2012-10-17",
  "Statement": [
    {
      "Effect": "Allow",
      "Principal": {
        "Service": "ec2.amazonaws.com"
      },
      "Action": "sts:AssumeRole"
    }
  ]
}
EOF

    aws iam create-role \
        --role-name $ROLE_NAME \
        --assume-role-policy-document file://ec2-trust-policy.json

    # Attach Bedrock policy
    aws iam attach-role-policy \
        --role-name $ROLE_NAME \
        --policy-arn arn:aws:iam::aws:policy/AmazonBedrockFullAccess

    # Create instance profile
    aws iam create-instance-profile \
        --instance-profile-name $ROLE_NAME

    aws iam add-role-to-instance-profile \
        --instance-profile-name $ROLE_NAME \
        --role-name $ROLE_NAME

    echo "✅ IAM role created"
    echo "⏳ Waiting 10 seconds for IAM role to propagate..."
    sleep 10
else
    echo "ℹ️  IAM role already exists"
fi

# Step 4: Get latest Amazon Linux 2023 AMI
echo "🔍 Finding latest Amazon Linux 2023 AMI..."
AMI_ID=$(aws ec2 describe-images \
    --owners amazon \
    --filters "Name=name,Values=al2023-ami-2023.*-x86_64" \
              "Name=state,Values=available" \
    --query 'sort_by(Images, &CreationDate)[-1].ImageId' \
    --output text)
echo "📦 Using AMI: $AMI_ID"

# Step 5: Create user data script
cat > user-data.sh <<'EOF'
#!/bin/bash
set -e

# Update system
yum update -y

# Install Node.js 18
curl -fsSL https://rpm.nodesource.com/setup_18.x | bash -
yum install -y nodejs

# Install git
yum install -y git

# Install nginx
yum install -y nginx

# Install pm2 globally
npm install -g pm2

# Create app directory
mkdir -p /home/ec2-user/app
cd /home/ec2-user/app

echo "✅ EC2 instance setup complete"
EOF

# Step 6: Launch EC2 instance
echo "🚀 Launching EC2 instance..."
INSTANCE_ID=$(aws ec2 run-instances \
    --image-id $AMI_ID \
    --instance-type $INSTANCE_TYPE \
    --key-name $KEY_NAME \
    --security-groups $SECURITY_GROUP_NAME \
    --iam-instance-profile Name=$ROLE_NAME \
    --user-data file://user-data.sh \
    --tag-specifications "ResourceType=instance,Tags=[{Key=Name,Value=$INSTANCE_NAME}]" \
    --query 'Instances[0].InstanceId' \
    --output text)

echo "✅ Instance launched: $INSTANCE_ID"
echo "⏳ Waiting for instance to be running..."

aws ec2 wait instance-running --instance-ids $INSTANCE_ID

# Get public IP
PUBLIC_IP=$(aws ec2 describe-instances \
    --instance-ids $INSTANCE_ID \
    --query 'Reservations[0].Instances[0].PublicIpAddress' \
    --output text)

echo ""
echo "✅ EC2 Instance is ready!"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "Instance ID: $INSTANCE_ID"
echo "Public IP: $PUBLIC_IP"
echo "SSH Command: ssh -i ${KEY_NAME}.pem ec2-user@${PUBLIC_IP}"
echo ""
echo "Next steps:"
echo "1. Wait 2-3 minutes for user data script to complete"
echo "2. Run: ./deploy-to-ec2.sh $PUBLIC_IP"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"

# Save instance info
cat > ec2-instance-info.txt <<EOF
Instance ID: $INSTANCE_ID
Public IP: $PUBLIC_IP
Key File: ${KEY_NAME}.pem
SSH Command: ssh -i ${KEY_NAME}.pem ec2-user@${PUBLIC_IP}
EOF

# Cleanup temp files
rm -f ec2-trust-policy.json user-data.sh

echo "✅ Instance info saved to ec2-instance-info.txt"
