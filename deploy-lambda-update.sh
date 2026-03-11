#!/bin/bash

# Quick Lambda deployment script
# Updates the Lambda function with the latest code including ABM features

set -e

echo "📦 Creating Lambda deployment package..."

# Clean up old package
rm -rf lambda-package-temp
rm -f conversation-maker-lambda.zip

# Create temp directory
mkdir -p lambda-package-temp

# Copy files
cp -r server lambda-package-temp/
cp lambda.js lambda-package-temp/
cp package.json lambda-package-temp/
cp package-lock.json lambda-package-temp/

# Install production dependencies
cd lambda-package-temp
npm install --production --silent
cd ..

# Create ZIP
cd lambda-package-temp
zip -r ../conversation-maker-lambda.zip . -x "*.git*" "*.DS_Store" > /dev/null
cd ..

echo "✅ Package created: $(ls -lh conversation-maker-lambda.zip | awk '{print $5}')"
echo ""

echo "🚀 Deploying to AWS Lambda..."

# Update Lambda function
aws lambda update-function-code \
  --function-name conversation-maker-api \
  --zip-file fileb://conversation-maker-lambda.zip \
  --region us-east-1 \
  --query '[LastModified,State]' \
  --output table

echo ""
echo "✅ Lambda function updated!"
echo ""
echo "🧹 Cleaning up..."
rm -rf lambda-package-temp

echo "🎉 Deployment complete!"
echo ""
echo "Test the API:"
echo "curl https://uiolpncbm9.execute-api.us-east-1.amazonaws.com/prod/api/health"
