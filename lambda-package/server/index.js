require('dotenv').config();
const express = require('express');
const cors = require('cors');
const path = require('path');

const app = express();
const PORT = process.env.PORT || 3001;

// Middleware - explicit CORS for API Gateway + cross-origin (preview, S3, localhost)
app.use(cors({
  origin: '*',
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS', 'PATCH'],
  allowedHeaders: ['Content-Type', 'Authorization', 'Accept', 'Origin', 'X-Requested-With'],
  maxAge: 86400,
}));
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ extended: true, limit: '50mb' }));

// API Routes
const conversationRoutes = require('./routes/conversation');
const voicesRoutes = require('./routes/voices');
const generateRoutes = require('./routes/generate');
const abmRoutes = require('./routes/abm');

// Register more specific routes first
app.use('/api/conversation/generate', generateRoutes);
app.use('/api/conversation', conversationRoutes);
app.use('/api/voices', voicesRoutes);
app.use('/api/abm', abmRoutes);

app.get('/api/health', (req, res) => {
  res.json({ 
    status: 'ok', 
    message: 'ElevenLabs Conversation Tool API',
    bedrock: process.env.BEDROCK_MODEL_ID ? 'configured' : 'not configured',
    elevenlabs: process.env.ELEVENLABS_API_KEY ? 'configured' : 'not configured'
  });
});

// Test Bedrock endpoint
app.get('/api/test-bedrock', async (req, res) => {
  try {
    const { BedrockRuntimeClient, InvokeModelCommand } = require('@aws-sdk/client-bedrock-runtime');
    const client = new BedrockRuntimeClient({ region: process.env.AWS_REGION || 'us-east-1' });
    
    const command = new InvokeModelCommand({
      modelId: process.env.BEDROCK_MODEL_ID || 'us.anthropic.claude-sonnet-4-20250514-v1:0',
      contentType: 'application/json',
      accept: 'application/json',
      body: JSON.stringify({
        anthropic_version: 'bedrock-2023-05-31',
        max_tokens: 100,
        messages: [{ role: 'user', content: 'Say hello in JSON format: {"message": "your message"}' }]
      })
    });
    
    const response = await client.send(command);
    const responseBody = JSON.parse(new TextDecoder().decode(response.body));
    
    res.json({ 
      success: true, 
      response: responseBody.content[0].text 
    });
  } catch (error) {
    res.status(500).json({ 
      success: false, 
      error: error.message,
      stack: error.stack 
    });
  }
});

// Error handling middleware
app.use((err, req, res, next) => {
  console.error('Error:', err);
  res.status(err.status || 500).json({
    error: err.message || 'Internal server error',
    ...(process.env.NODE_ENV === 'development' && { stack: err.stack })
  });
});

// Start server
app.listen(PORT, () => {
  console.log(`🚀 Server running on port ${PORT}`);
  console.log(`📝 Environment: ${process.env.NODE_ENV || 'development'}`);
  console.log(`🎤 ElevenLabs API: ${process.env.ELEVENLABS_API_KEY ? 'Configured' : 'Not configured'}`);
  console.log(`🤖 AWS Bedrock: ${process.env.AWS_REGION ? 'Configured' : 'Not configured'}`);
});

module.exports = app;
