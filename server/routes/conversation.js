/**
 * Conversation API Routes
 * Handles conversation-related endpoints
 */

const express = require('express');
const router = express.Router();
const { synthesizeSpeech } = require('../services/elevenlabs');

/**
 * POST /api/conversation/synthesize
 * Synthesizes a single line of dialogue
 */
router.post('/synthesize', async (req, res, next) => {
  try {
    const { text, voiceId, prosody, speed, modelId } = req.body;

    // Validate required fields
    if (!text) {
      return res.status(400).json({ error: 'Text is required' });
    }
    if (!voiceId) {
      return res.status(400).json({ error: 'Voice ID is required' });
    }

    // Synthesize speech
    const audioBuffer = await synthesizeSpeech({
      text,
      voiceId,
      prosody,
      speed,
      modelId
    });

    // Return audio
    res.set({
      'Content-Type': 'audio/mpeg',
      'Content-Length': audioBuffer.length,
      'Cache-Control': 'public, max-age=31536000' // Cache for 1 year
    });
    
    res.send(audioBuffer);
  } catch (error) {
    next(error);
  }
});

module.exports = router;
