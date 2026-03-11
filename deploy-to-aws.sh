#!/bin/bash

# Complete AWS Deployment Script for Conversation Maker
# This script deploys both Lambda backend and sets up API Gateway

set -e

echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "🚀 Conversation Maker - AWS Deployment"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""

# Check for ElevenLabs API key
if [ -z "$ELEVENLABS_API_KEY" ]; then
  echo "❌ ERROR: ELEVENLABS_API_KEY not set"
  echo ""
  echo "Please set your ElevenLabs API key:"
  echo "  export ELEVENLABS_API_KEY=your_key_here"
  echo ""
  echo "Then run this script again."
  exit 1
fi

echo "✅ ElevenLabs API key found"
echo ""

# Check AWS CLI
if ! command -v aws &> /dev/null; then
  echo "❌ ERROR: AWS CLI not found"
  echo "Install it from: https://aws.amazon.com/cli/"
  exit 1
fi

echo "✅ AWS CLI found"
echo ""

# Check AWS credentials
if ! aws sts get-caller-identity &> /dev/null; then
  echo "❌ ERROR: AWS credentials not configured"
  echo "Run: aws configure"
  exit 1
fi

ACCOUNT_ID=$(aws sts get-caller-identity --query Account --output text)
echo "✅ AWS credentials configured (Account: $ACCOUNT_ID)"
echo ""

echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "Step 1: Deploy Lambda Backend"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""

./deploy-lambda.sh

echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "Step 2: Setup API Gateway"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""

./setup-api-gateway.sh

echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "🎉 Backend Deployment Complete!"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""
echo "📋 What's Next?"
echo ""
echo "1. Your backend API is now live and ready"
echo ""
echo "2. Deploy the frontend using AWS Amplify:"
echo "   - See DEPLOYMENT_GUIDE.md for step-by-step instructions"
echo "   - Or use the AWS Amplify Console: https://console.aws.amazon.com/amplify/"
echo ""
echo "3. Don't forget to set REACT_APP_API_URL in Amplify environment variables"
echo ""
echo "📖 Full deployment guide: DEPLOYMENT_GUIDE.md"
echo ""
