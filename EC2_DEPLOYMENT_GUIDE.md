# EC2 Deployment Guide

This guide walks you through deploying the Conversation Maker application to an EC2 instance.

## Why EC2?

Moving to EC2 solves the AWS credential expiration issues you were experiencing with local development. The EC2 instance has an IAM role that provides persistent access to AWS Bedrock without credential rotation.

## Architecture

```
┌─────────────────────────────────────────┐
│         EC2 Instance (t3.medium)        │
│                                         │
│  ┌──────────────┐    ┌──────────────┐  │
│  │    Nginx     │    │   Node.js    │  │
│  │   (Port 80)  │───▶│  (Port 3001) │  │
│  │              │    │              │  │
│  │ React Build  │    │ Express API  │  │
│  └──────────────┘    └──────┬───────┘  │
│                             │          │
└─────────────────────────────┼──────────┘
                              │
                              ▼
                    ┌──────────────────┐
                    │  AWS Bedrock     │
                    │  (Claude Haiku)  │
                    └──────────────────┘
```

## Prerequisites

- AWS CLI configured with credentials
- Your ElevenLabs API key (already in server/.env)

## Step 1: Create EC2 Instance

Run the setup script:

```bash
cd conversation-maker
chmod +x setup-ec2.sh
./setup-ec2.sh
```

This script will:
- Create an EC2 key pair (saved as `conversation-maker-key.pem`)
- Create a security group with ports 22, 80, 443, and 3001 open
- Create an IAM role with Bedrock permissions
- Launch a t3.medium instance with Amazon Linux 2023
- Install Node.js, nginx, and PM2

The script will output:
- Instance ID
- Public IP address
- SSH command

**Save the public IP address** - you'll need it for deployment.

## Step 2: Wait for Instance Initialization

The instance needs 2-3 minutes to complete the user data script that installs software. You can check status:

```bash
# Get the public IP from ec2-instance-info.txt
PUBLIC_IP=$(grep "Public IP:" ec2-instance-info.txt | cut -d' ' -f3)

# SSH into the instance
ssh -i conversation-maker-key.pem ec2-user@$PUBLIC_IP

# Check if setup is complete
which node  # Should show /usr/bin/node
which nginx # Should show /usr/sbin/nginx
which pm2   # Should show /usr/bin/pm2
```

## Step 3: Deploy Application

Run the deployment script:

```bash
chmod +x deploy-to-ec2.sh
./deploy-to-ec2.sh <YOUR_EC2_PUBLIC_IP>
```

This script will:
- Package your server and client code
- Upload to EC2
- Install dependencies
- Build the React frontend with the correct API URL
- Configure nginx to serve the frontend and proxy API requests
- Start the Node.js backend with PM2 (process manager)

## Step 4: Access Your Application

Once deployment completes, open your browser:

```
http://<YOUR_EC2_PUBLIC_IP>
```

The API will be available at:

```
http://<YOUR_EC2_PUBLIC_IP>/api
```

## Managing Your Application

### View Logs

```bash
ssh -i conversation-maker-key.pem ec2-user@<PUBLIC_IP>
pm2 logs conversation-maker
```

### Restart Application

```bash
ssh -i conversation-maker-key.pem ec2-user@<PUBLIC_IP>
pm2 restart conversation-maker
```

### Stop Application

```bash
ssh -i conversation-maker-key.pem ec2-user@<PUBLIC_IP>
pm2 stop conversation-maker
```

### Update Application

To deploy updates, just run the deploy script again:

```bash
./deploy-to-ec2.sh <YOUR_EC2_PUBLIC_IP>
```

## Troubleshooting

### Can't connect to EC2

Check security group allows your IP:
```bash
aws ec2 describe-security-groups --group-names conversation-maker-sg
```

### Application not starting

SSH into instance and check logs:
```bash
ssh -i conversation-maker-key.pem ec2-user@<PUBLIC_IP>
pm2 logs conversation-maker
sudo tail -f /var/log/nginx/error.log
```

### Bedrock API errors

Verify IAM role is attached:
```bash
aws ec2 describe-instances --instance-ids <INSTANCE_ID> --query 'Reservations[0].Instances[0].IamInstanceProfile'
```

## Cost Estimate

- t3.medium instance: ~$0.0416/hour (~$30/month)
- Data transfer: Minimal for development use
- Bedrock API: Pay per use

## Cleanup

To delete all resources:

```bash
# Get instance ID
INSTANCE_ID=$(cat ec2-instance-info.txt | grep "Instance ID:" | cut -d' ' -f3)

# Terminate instance
aws ec2 terminate-instances --instance-ids $INSTANCE_ID

# Delete security group (after instance terminates)
aws ec2 delete-security-group --group-name conversation-maker-sg

# Delete key pair
aws ec2 delete-key-pair --key-name conversation-maker-key
rm conversation-maker-key.pem

# Delete IAM role
aws iam remove-role-from-instance-profile --instance-profile-name conversation-maker-ec2-role --role-name conversation-maker-ec2-role
aws iam delete-instance-profile --instance-profile-name conversation-maker-ec2-role
aws iam detach-role-policy --role-name conversation-maker-ec2-role --policy-arn arn:aws:iam::aws:policy/AmazonBedrockFullAccess
aws iam delete-role --role-name conversation-maker-ec2-role
```

## Next Steps

1. Set up a domain name and point it to your EC2 IP
2. Configure SSL/TLS with Let's Encrypt
3. Set up CloudWatch monitoring
4. Configure automated backups
5. Set up a staging environment

## Benefits of EC2 Deployment

✅ No credential expiration issues
✅ Persistent server environment
✅ Full control over the stack
✅ Easy to scale vertically (change instance type)
✅ Can add load balancer later for horizontal scaling
✅ Integrated with AWS services via IAM role
