#!/bin/bash

# Deploy ONLY code changes to Lambda (doesn't touch environment variables)
# Use this for quick deployments when you haven't changed API keys

set -e  # Exit on error

echo "📦 Creating Lambda deployment package..."

# Create temp directory
rm -rf lambda-package-temp
mkdir -p lambda-package-temp

# Copy server code
cp -r server lambda-package-temp/
cp lambda.js lambda-package-temp/
cp package.json lambda-package-temp/
cp package-lock.json lambda-package-temp/

# Install production dependencies
cd lambda-package-temp
npm install --production --silent
cd ..

# Create ZIP file
cd lambda-package-temp
zip -r ../conversation-maker-lambda.zip . -x "*.git*" "*.DS_Store" > /dev/null
cd ..

echo "✅ Package created: conversation-maker-lambda.zip"
echo ""

echo "🚀 Deploying code to AWS Lambda..."

# Update function code only (doesn't touch environment variables)
aws lambda update-function-code \
  --function-name conversation-maker-api \
  --zip-file fileb://conversation-maker-lambda.zip \
  --region us-east-1 > /dev/null

echo "✅ Lambda function code updated"
echo ""

# Clean up
rm -rf lambda-package-temp
rm conversation-maker-lambda.zip

echo "🎉 Deployment complete!"
echo ""
echo "ℹ️  Note: This only updated the code. Environment variables were not changed."
echo "   If you need to update API keys, use ./deploy-lambda.sh instead"
