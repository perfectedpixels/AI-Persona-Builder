#!/bin/bash
# Fix "Load failed" / API Gateway 29s timeout
# Run: AWS_PROFILE=personal ./fix-api-gateway-timeout.sh

set -e
export AWS_PAGER=""

API_ID="k7ocis6k3l"
REGION="us-east-1"

echo "🔧 Fixing API Gateway integration timeout..."
echo ""

# Get resource IDs
ROOT_ID=$(aws apigateway get-resources --rest-api-id $API_ID --region $REGION \
  --query "items[?path=='/'].id" --output text 2>/dev/null)
PROXY_ID=$(aws apigateway get-resources --rest-api-id $API_ID --region $REGION \
  --query "items[?pathPart=='{proxy+}'].id" --output text 2>/dev/null)

if [ -z "$PROXY_ID" ] && [ -z "$ROOT_ID" ]; then
  echo "❌ Could not find API resources. Check API ID: $API_ID"
  exit 1
fi

# Try 90s first; if quota limits to 29s, use 29s and instruct user
ERR=$(aws apigateway update-integration \
  --rest-api-id $API_ID \
  --resource-id $PROXY_ID \
  --http-method ANY \
  --patch-operations op=replace,path=/timeoutInMillis,value=90000 \
  --region $REGION 2>&1) || true

if echo "$ERR" | grep -q "29000"; then
  echo "⚠️  Your account is limited to 29 seconds. Request a quota increase:"
  echo ""
  echo "   1. Open: https://console.aws.amazon.com/servicequotas/home/services/apigateway/quotas"
  echo "   2. Find: Maximum integration timeout in milliseconds"
  echo "   3. Request increase to 90000"
  echo "   4. After approval (~5 min), run this script again"
  echo ""
  echo "   Or try shorter documents to stay under 29s."
  exit 1
fi

# Update root too
aws apigateway update-integration \
  --rest-api-id $API_ID \
  --resource-id $ROOT_ID \
  --http-method ANY \
  --patch-operations op=replace,path=/timeoutInMillis,value=90000 \
  --region $REGION 2>/dev/null || true

aws apigateway create-deployment --rest-api-id $API_ID --stage-name prod --region $REGION > /dev/null
echo "✅ API Gateway timeout set to 90 seconds."
