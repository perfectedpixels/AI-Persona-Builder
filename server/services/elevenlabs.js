/**
 * ElevenLabs API Service
 * Handles text-to-speech synthesis using ElevenLabs API
 */

const axios = require('axios');

const ELEVENLABS_API_URL = 'https://api.elevenlabs.io/v1';
const API_KEY = process.env.ELEVENLABS_API_KEY;

/**
 * Synthesizes text to speech using ElevenLabs API
 * @param {Object} params - Synthesis parameters
 * @param {string} params.text - Text to synthesize
 * @param {string} params.voiceId - ElevenLabs voice ID
 * @param {Object} params.prosody - Prosody settings
 * @param {number} params.speed - Speech speed (0.5 - 2.0)
 * @param {string} params.modelId - ElevenLabs model ID
 * @returns {Promise<Buffer>} Audio buffer
 */
async function synthesizeSpeech({ text, voiceId, prosody, speed = 1.0, modelId }) {
  if (!API_KEY) {
    throw new Error('ELEVENLABS_API_KEY not configured');
  }

  if (!text || !voiceId) {
    throw new Error('Text and voiceId are required');
  }

  // Clamp speed to valid range (0.7 - 1.2 for most models)
  const clampedSpeed = Math.max(0.7, Math.min(1.2, speed ?? 1.0));

  const voiceSettings = {
    stability: prosody?.stability ?? 0.75,
    similarity_boost: prosody?.similarity_boost ?? 0.75,
    style: prosody?.style ?? 0.5,
    use_speaker_boost: prosody?.use_speaker_boost ?? true,
    speed: clampedSpeed
  };

  console.log('Synthesizing speech with settings:', {
    text: text.substring(0, 50),
    voiceId,
    voiceSettings
  });

  try {
    const response = await axios.post(
      `${ELEVENLABS_API_URL}/text-to-speech/${voiceId}`,
      {
        text,
        model_id: modelId || process.env.ELEVENLABS_MODEL_ID || 'eleven_monolingual_v1',
        voice_settings: voiceSettings
      },
      {
        headers: {
          'Accept': 'audio/mpeg',
          'Content-Type': 'application/json',
          'xi-api-key': API_KEY
        },
        responseType: 'arraybuffer'
      }
    );

    return Buffer.from(response.data);
  } catch (error) {
    console.error('ElevenLabs API Error:', error.response?.data || error.message);
    
    if (error.response?.status === 401) {
      throw new Error('Invalid ElevenLabs API key');
    } else if (error.response?.status === 429) {
      throw new Error('Rate limit exceeded. Please try again later.');
    } else if (error.response?.status === 400) {
      throw new Error('Invalid request parameters');
    }
    
    throw new Error(`Failed to synthesize speech: ${error.message}`);
  }
}

/**
 * Gets list of available voices from ElevenLabs
 * @returns {Promise<Array>} Array of voice objects
 */
async function getVoices() {
  if (!API_KEY) {
    throw new Error('ELEVENLABS_API_KEY not configured');
  }

  try {
    const response = await axios.get(
      `${ELEVENLABS_API_URL}/voices`,
      {
        headers: {
          'xi-api-key': API_KEY
        }
      }
    );

    return response.data.voices.map(voice => ({
      id: voice.voice_id,
      name: voice.name,
      gender: voice.labels?.gender || 'neutral',
      description: voice.labels?.description || '',
      category: voice.category || 'general',
      previewUrl: voice.preview_url
    }));
  } catch (error) {
    console.error('ElevenLabs API Error:', error.response?.data || error.message);
    
    if (error.response?.status === 401) {
      throw new Error('Invalid ElevenLabs API key');
    }
    
    throw new Error(`Failed to fetch voices: ${error.message}`);
  }
}

/**
 * Gets information about a specific voice
 * @param {string} voiceId - Voice ID
 * @returns {Promise<Object>} Voice information
 */
async function getVoiceInfo(voiceId) {
  if (!API_KEY) {
    throw new Error('ELEVENLABS_API_KEY not configured');
  }

  try {
    const response = await axios.get(
      `${ELEVENLABS_API_URL}/voices/${voiceId}`,
      {
        headers: {
          'xi-api-key': API_KEY
        }
      }
    );

    return {
      id: response.data.voice_id,
      name: response.data.name,
      gender: response.data.labels?.gender || 'neutral',
      description: response.data.labels?.description || '',
      category: response.data.category || 'general',
      previewUrl: response.data.preview_url
    };
  } catch (error) {
    console.error('ElevenLabs API Error:', error.response?.data || error.message);
    throw new Error(`Failed to fetch voice info: ${error.message}`);
  }
}

module.exports = {
  synthesizeSpeech,
  getVoices,
  getVoiceInfo
};
