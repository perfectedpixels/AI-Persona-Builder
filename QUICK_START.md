# Quick Start - AWS Setup

Get your Conversation Maker app running on AWS in minutes.

## Prerequisites Checklist

- [ ] AWS Account with Bedrock access
- [ ] AWS CLI installed (`aws --version`)
- [ ] AWS credentials configured (`aws configure`)
- [ ] Node.js 18+ installed (`node --version`)
- [ ] ElevenLabs API key

## 🚀 One-Command Setup

```bash
cd conversation-maker
export ELEVENLABS_API_KEY=your_key_here
./setup-aws-services.sh
```

That's it! The script will:
1. Create IAM role with Bedrock permissions
2. Deploy Lambda function
3. Create API Gateway
4. Configure everything automatically

## ✅ Verify Setup

```bash
./verify-aws-setup.sh
```

## 🧪 Test Your API

```bash
# Get your API URL from setup output, then:
API_URL="https://YOUR_API_ID.execute-api.us-east-1.amazonaws.com/prod"

# Test health
curl $API_URL/api/health

# Test voices
curl $API_URL/api/voices

# Generate conversation
curl -X POST $API_URL/api/conversation/generate \
  -H 'Content-Type: application/json' \
  -d '{
    "prompt": "A podcast about AI",
    "options": {"length": "short"},
    "speakers": [
      {"name": "Host", "context": "Enthusiastic"},
      {"name": "Guest", "context": "Expert"}
    ]
  }'
```

## 🌐 Deploy Frontend

### Option 1: AWS Amplify (Recommended)

1. Go to [AWS Amplify Console](https://console.aws.amazon.com/amplify/)
2. Click "New app" → "Host web app"
3. Connect your git repository
4. Add environment variable:
   - `REACT_APP_API_URL` = Your API Gateway URL
5. Deploy!

### Option 2: Local Development

```bash
# Update client config
echo "REACT_APP_API_URL=$API_URL" > client/.env

# Start frontend
cd client
npm install
npm start
```

Visit http://localhost:3000

## 📊 Monitor Your App

```bash
# View Lambda logs
aws logs tail /aws/lambda/conversation-maker-api --follow --region us-east-1

# Check Lambda status
aws lambda get-function --function-name conversation-maker-api --region us-east-1
```

## 🔄 Update Your App

### Update Backend Code
```bash
./deploy-lambda-code-only.sh
```

### Update Environment Variables
```bash
export ELEVENLABS_API_KEY=new_key
./deploy-lambda.sh
```

### Update Frontend
```bash
git add .
git commit -m "Update"
git push origin main
```
(Amplify auto-deploys)

## 🆘 Troubleshooting

### "Bedrock access denied"
Enable Claude 3 Haiku in [Bedrock Console](https://console.aws.amazon.com/bedrock/)

### "Lambda timeout"
```bash
aws lambda update-function-configuration \
  --function-name conversation-maker-api \
  --timeout 60 \
  --region us-east-1
```

### "CORS error"
Already configured! Check API Gateway binary media types include `audio/mpeg`

### "Audio not playing"
1. Verify ElevenLabs API key
2. Check CloudWatch logs
3. Ensure Lambda timeout is 30s+

## 📚 Full Documentation

- [AWS_SETUP_GUIDE.md](AWS_SETUP_GUIDE.md) - Complete setup guide
- [DEPLOYMENT_GUIDE.md](DEPLOYMENT_GUIDE.md) - Deployment details
- [README.md](README.md) - App features and usage

## 🎯 What's Next?

1. ✅ Test all API endpoints
2. ✅ Deploy frontend to Amplify
3. 🔄 Set up custom domain
4. 🔄 Add monitoring alarms
5. 🔄 Configure authentication

## 💰 Cost Estimate

Light usage (~1000 requests/month):
- Lambda: $0.20
- API Gateway: $3.50
- Amplify: $5.00
- Bedrock: $0.25
- CloudWatch: $0.50

**Total: ~$10/month**

## 🔒 Security Notes

✅ No AWS credentials in code  
✅ Lambda uses IAM role  
✅ Only ElevenLabs key in environment  
✅ Frontend has no API keys  

Before committing:
```bash
./check-secrets.sh
```

---

**Ready to go?** Run `./setup-aws-services.sh` and you're live in minutes!
