# Lambda Update Instructions

## Upload the New Lambda Package

Since you don't have CLI permissions, you'll need to upload via the AWS Console:

### Steps:

1. **Go to AWS Lambda Console**
   - Navigate to: https://console.aws.amazon.com/lambda/
   - Region: us-east-1

2. **Find Your Function**
   - Click on function: `conversation-maker-api`

3. **Upload the Package**
   - In the "Code" tab, click "Upload from" dropdown
   - Select ".zip file"
   - Click "Upload" button
   - Select file: `conversation-maker-lambda.zip` (7MB)
   - Click "Save"

4. **Wait for Upload**
   - The upload may take 30-60 seconds
   - You'll see "Successfully updated the function conversation-maker-api"

5. **Verify Environment Variables**
   - Click on "Configuration" tab
   - Click "Environment variables"
   - Confirm these are set:
     - `BEDROCK_MODEL_ID`: us.anthropic.claude-3-haiku-20240307-v1:0
     - `ELEVENLABS_API_KEY`: <your-key-from-elevenlabs-dashboard>
     - `ELEVENLABS_MODEL_ID`: eleven_monolingual_v1
     - `NODE_ENV`: production
   - DO NOT set AWS_REGION (it's automatically provided by Lambda)

6. **Test the Deployment**
   - Open: http://localhost:3003
   - Try submitting documents in Phase A
   - Check browser console for errors
   - If errors occur, check Lambda logs in CloudWatch

## What's Included in This Update

- ABM routes: `/api/abm/process-documents`, `/api/abm/generate-conversation`
- Document processing with Bedrock (lectures temporarily disabled)
- Increased max_tokens to 4000 for document processing
- Test endpoint: `/api/test-bedrock` (already working)
- JSON parsing with fallback logic for Bedrock responses

## Troubleshooting

If document processing still fails:

1. **Check CloudWatch Logs**
   - Go to CloudWatch console
   - Find log group: `/aws/lambda/conversation-maker-api`
   - Look for error messages

2. **Test Bedrock Connection**
   - Visit: https://uiolpncbm9.execute-api.us-east-1.amazonaws.com/prod/api/test-bedrock
   - Should return: `{"success": true, "response": "..."}`

3. **Check IAM Permissions**
   - Lambda execution role should have `AmazonBedrockFullAccess` policy
   - Verify in IAM console

## File Location

The Lambda package is located at:
```
conversation-maker/conversation-maker-lambda.zip
```

Size: 7.0 MB
