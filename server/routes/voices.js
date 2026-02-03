/**
 * Voices API Routes
 * Handles voice-related endpoints
 */

const express = require('express');
const router = express.Router();
const { getVoices, getVoiceInfo } = require('../services/elevenlabs');

// In-memory cache for voices (session-scoped)
let voicesCache = null;
let cacheTimestamp = null;
const CACHE_DURATION = 3600000; // 1 hour in milliseconds

/**
 * GET /api/voices
 * Gets list of available ElevenLabs voices
 */
router.get('/', async (req, res, next) => {
  try {
    // Check cache
    const now = Date.now();
    if (voicesCache && cacheTimestamp && (now - cacheTimestamp < CACHE_DURATION)) {
      console.log('Returning cached voices');
      return res.json({ voices: voicesCache, cached: true });
    }

    // Fetch from API
    console.log('Fetching voices from ElevenLabs API');
    const voices = await getVoices();
    
    // Update cache
    voicesCache = voices;
    cacheTimestamp = now;

    res.json({ voices, cached: false });
  } catch (error) {
    next(error);
  }
});

/**
 * GET /api/voices/:voiceId
 * Gets information about a specific voice
 */
router.get('/:voiceId', async (req, res, next) => {
  try {
    const { voiceId } = req.params;
    const voiceInfo = await getVoiceInfo(voiceId);
    res.json(voiceInfo);
  } catch (error) {
    next(error);
  }
});

module.exports = router;
