const express = require('express');
const router = express.Router();
const { generateConversationScript } = require('../services/bedrock');
const { v4: uuidv4 } = require('uuid');

/**
 * Parse generated script into speakers and lines
 */
function parseGeneratedScript(scriptText) {
  const lines = scriptText.split('\n').filter(line => line.trim());
  const speakers = new Map();
  const parsedLines = [];
  
  // Speaker colors for UI
  const colors = ['#FF8C42', '#4CC9F0', '#C77DFF', '#2D5016', '#F44336', '#4CAF50'];
  
  lines.forEach((line, index) => {
    // Match format: "Speaker Name: dialogue text"
    const match = line.match(/^([^:]+):\s*(.+)$/);
    if (match) {
      const [, speakerName, text] = match;
      const cleanSpeakerName = speakerName.trim();
      
      // Get or create speaker
      if (!speakers.has(cleanSpeakerName)) {
        const speakerId = uuidv4();
        speakers.set(cleanSpeakerName, {
          id: speakerId,
          name: cleanSpeakerName,
          voiceId: '', // Will be assigned by frontend
          defaultProsody: {
            stability: 0.75,
            similarity_boost: 0.80,
            style: 0.50,
            use_speaker_boost: true
          },
          defaultSpeed: 1.0,
          color: colors[speakers.size % colors.length]
        });
      }
      
      const speaker = speakers.get(cleanSpeakerName);
      parsedLines.push({
        id: uuidv4(),
        speakerId: speaker.id,
        text: text.trim(),
        order: parsedLines.length,
        prosodyOverride: null,
        speedOverride: null,
        audioState: {
          isStale: true,
          audioUrl: null,
          duration: null
        }
      });
    }
  });
  
  return {
    speakers: Array.from(speakers.values()),
    lines: parsedLines
  };
}

/**
 * POST /api/conversation/generate
 * Generate conversation script using AI
 */
router.post('/', async (req, res) => {
  try {
    const { prompt, options, speakers } = req.body;

    if (!prompt || typeof prompt !== 'string' || !prompt.trim()) {
      return res.status(400).json({ error: 'Prompt is required' });
    }

    // Validate options
    const numSpeakers = options?.numSpeakers || 2;
    const length = options?.length || 'medium';

    if (numSpeakers < 2 || numSpeakers > 10) {
      return res.status(400).json({ error: 'Number of speakers must be between 2 and 10' });
    }

    if (!['short', 'medium', 'long'].includes(length)) {
      return res.status(400).json({ error: 'Length must be short, medium, or long' });
    }

    // Generate script using Bedrock with speaker contexts
    const scriptText = await generateConversationScript(
      prompt.trim(), 
      { numSpeakers, length },
      speakers || []
    );

    // Parse the generated script
    const { speakers: parsedSpeakers, lines } = parseGeneratedScript(scriptText);

    if (parsedSpeakers.length === 0 || lines.length === 0) {
      return res.status(500).json({ 
        error: 'Failed to parse generated script. Please try again with a different prompt.' 
      });
    }

    res.json({ speakers: parsedSpeakers, lines });
  } catch (error) {
    console.error('Script generation error:', error);
    res.status(500).json({ 
      error: error.message || 'Failed to generate conversation script' 
    });
  }
});

module.exports = router;
