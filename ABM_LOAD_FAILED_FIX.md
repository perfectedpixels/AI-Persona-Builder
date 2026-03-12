# Fix "Load failed" During Document Processing

## Cause
Document processing runs 2 Bedrock calls (extraction + scenario generation) and can take **30–90 seconds**. AWS API Gateway has a **29-second default integration timeout**. When processing exceeds that, the request fails with "Load failed" or "TypeError: Load failed".

## Fix: Increase API Gateway Integration Timeout

### Option 1: AWS Console (recommended)

1. Go to [API Gateway Console](https://console.aws.amazon.com/apigateway/) → **us-east-1**
2. Select your API: `conversation-maker-api`
3. Click **Resources** in the left sidebar
4. Select the `{proxy+}` resource (or the root `/` if that's your integration)
5. For the **ANY** method, click it
6. Click **Integration Request**
7. Expand **Integration Request** settings
8. Find **Timeout** — change from `29000` (29s) to `90000` (90 seconds)
9. Click **Save**
10. **Deploy** the API: Actions → Deploy API → select your stage (e.g. `prod`)

### Option 2: AWS CLI

```bash
# Get your API ID and resource ID first
API_ID="k7ocis6k3l"   # Your API ID from the URL
REGION="us-east-1"

# Get the proxy resource ID
RESOURCE_ID=$(aws apigateway get-resources --rest-api-id $API_ID --region $REGION \
  --query "items[?pathPart=='{proxy+}'].id" --output text)

# Update integration timeout (90 seconds)
aws apigateway update-integration \
  --rest-api-id $API_ID \
  --resource-id $RESOURCE_ID \
  --http-method ANY \
  --patch-operations op=replace,path=/timeoutInMillis,value=90000 \
  --region $REGION

# Redeploy
aws apigateway create-deployment --rest-api-id $API_ID --stage-name prod --region $REGION
```

### Option 3: Service Quota Increase (if 90s isn't enough)

If your account has the default 29s limit and the console won't let you set 90s:

1. Go to [Service Quotas](https://console.aws.amazon.com/servicequotas/)
2. Search for "Amazon API Gateway"
3. Find "Maximum integration timeout in milliseconds"
4. Request increase to `90000` or higher

## Also Check

- **Lambda timeout**: Should be at least 90 seconds. Update via:
  ```bash
  aws lambda update-function-configuration \
    --function-name conversation-maker-api \
    --timeout 90 \
    --region us-east-1
  ```
