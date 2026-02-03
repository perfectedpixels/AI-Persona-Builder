require('dotenv').config();
const express = require('express');
const cors = require('cors');
const path = require('path');

const app = express();
const PORT = process.env.PORT || 3001;

// Middleware
app.use(cors());
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ extended: true, limit: '50mb' }));

// API Routes
const conversationRoutes = require('./routes/conversation');
const voicesRoutes = require('./routes/voices');
const generateRoutes = require('./routes/generate');

// Register more specific routes first
app.use('/api/conversation/generate', generateRoutes);
app.use('/api/conversation', conversationRoutes);
app.use('/api/voices', voicesRoutes);

app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', message: 'ElevenLabs Conversation Tool API' });
});

// Serve static files in production
if (process.env.NODE_ENV === 'production') {
  app.use(express.static(path.join(__dirname, '../public')));
  
  app.get('*', (req, res) => {
    res.sendFile(path.join(__dirname, '../public/index.html'));
  });
}

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
