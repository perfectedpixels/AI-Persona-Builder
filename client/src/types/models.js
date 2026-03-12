/**
 * Data Models for ElevenLabs Conversation Tool
 * These models define the structure of conversations, speakers, lines, and related entities
 */

import { v4 as uuidv4 } from 'uuid';

// ============================================================================
// Speaker Model
// ============================================================================

/**
 * Creates a new Speaker with default values
 * @param {Object} overrides - Properties to override defaults
 * @returns {Object} Speaker object
 */
export function createSpeaker(overrides = {}) {
  return {
    id: uuidv4(),
    name: 'Speaker',
    context: '', // Character description/context for AI generation
    voiceId: null,
    defaultProsody: {
      stability: 0.75,
      similarity_boost: 0.75,
      style: 0.5,
      use_speaker_boost: true
    },
    defaultSpeed: 1.0,
    color: generateSpeakerColor(),
    ...overrides
  };
}

/**
 * Validates a Speaker object
 * @param {Object} speaker - Speaker to validate
 * @returns {boolean} True if valid
 */
export function validateSpeaker(speaker) {
  if (!speaker || typeof speaker !== 'object') return false;
  if (!speaker.id || typeof speaker.id !== 'string') return false;
  if (!speaker.name || typeof speaker.name !== 'string') return false;
  if (speaker.defaultSpeed < 0.5 || speaker.defaultSpeed > 2.0) return false;
  
  const prosody = speaker.defaultProsody;
  if (!prosody) return false;
  if (prosody.stability < 0 || prosody.stability > 1) return false;
  if (prosody.similarity_boost < 0 || prosody.similarity_boost > 1) return false;
  if (prosody.style < 0 || prosody.style > 1) return false;
  
  return true;
}

// ============================================================================
// Line Model
// ============================================================================

/**
 * Creates a new Line with default values
 * @param {Object} overrides - Properties to override defaults
 * @returns {Object} Line object
 */
export function createLine(overrides = {}) {
  return {
    id: uuidv4(),
    speakerId: null,
    text: '',
    order: 0,
    prosodyOverride: null,
    speedOverride: null,
    audioState: {
      isStale: true,
      audioUrl: null,
      duration: null
    },
    ...overrides
  };
}

/**
 * Validates a Line object
 * @param {Object} line - Line to validate
 * @returns {boolean} True if valid
 */
export function validateLine(line) {
  if (!line || typeof line !== 'object') return false;
  if (!line.id || typeof line.id !== 'string') return false;
  if (!line.speakerId || typeof line.speakerId !== 'string') return false;
  if (typeof line.text !== 'string') return false;
  if (typeof line.order !== 'number') return false;
  
  if (line.speedOverride !== null) {
    if (line.speedOverride < 0.5 || line.speedOverride > 2.0) return false;
  }
  
  if (line.prosodyOverride !== null) {
    const prosody = line.prosodyOverride;
    if (prosody.stability !== null && (prosody.stability < 0 || prosody.stability > 1)) return false;
    if (prosody.similarity_boost !== null && (prosody.similarity_boost < 0 || prosody.similarity_boost > 1)) return false;
    if (prosody.style !== null && (prosody.style < 0 || prosody.style > 1)) return false;
  }
  
  return true;
}

/**
 * Marks a line's audio as stale (needs regeneration)
 * @param {Object} line - Line to mark as stale
 * @returns {Object} Updated line
 */
export function markLineStale(line) {
  return {
    ...line,
    audioState: {
      ...line.audioState,
      isStale: true
    }
  };
}

/**
 * Updates line audio state after successful generation
 * @param {Object} line - Line to update
 * @param {string} audioUrl - URL of generated audio
 * @param {number} duration - Duration in seconds
 * @returns {Object} Updated line
 */
export function updateLineAudio(line, audioUrl, duration) {
  return {
    ...line,
    audioState: {
      isStale: false,
      audioUrl,
      duration
    }
  };
}

// ============================================================================
// Conversation Model
// ============================================================================

/**
 * Creates a new Conversation with default values
 * @param {Object} overrides - Properties to override defaults
 * @returns {Object} Conversation object
 */
export function createConversation(overrides = {}) {
  return {
    id: uuidv4(),
    name: 'New Conversation',
    context: '', // Conversation scenario/context
    speakers: [],
    lines: [],
    metadata: {
      created: Date.now(),
      modified: Date.now(),
      totalDuration: null
    },
    ...overrides
  };
}

/**
 * Validates a Conversation object
 * @param {Object} conversation - Conversation to validate
 * @returns {boolean} True if valid
 */
export function validateConversation(conversation) {
  if (!conversation || typeof conversation !== 'object') return false;
  if (!conversation.id || typeof conversation.id !== 'string') return false;
  if (!conversation.name || typeof conversation.name !== 'string') return false;
  if (!Array.isArray(conversation.speakers)) return false;
  if (!Array.isArray(conversation.lines)) return false;
  
  // Validate all speakers
  for (const speaker of conversation.speakers) {
    if (!validateSpeaker(speaker)) return false;
  }
  
  // Validate all lines
  for (const line of conversation.lines) {
    if (!validateLine(line)) return false;
  }
  
  // Validate that all line speakerIds reference existing speakers
  const speakerIds = new Set(conversation.speakers.map(s => s.id));
  for (const line of conversation.lines) {
    if (!speakerIds.has(line.speakerId)) return false;
  }
  
  return true;
}

/**
 * Calculates total duration of conversation
 * @param {Object} conversation - Conversation to calculate duration for
 * @returns {number|null} Total duration in seconds, or null if any line lacks duration
 */
export function calculateTotalDuration(conversation) {
  let total = 0;
  for (const line of conversation.lines) {
    if (line.audioState.duration === null) return null;
    total += line.audioState.duration;
  }
  return total;
}

// ============================================================================
// Template Model
// ============================================================================

/**
 * Creates a new Template
 * @param {Object} data - Template data
 * @returns {Object} Template object
 */
export function createTemplate(data) {
  return {
    id: uuidv4(),
    name: '',
    description: '',
    category: 'general',
    speakers: [],
    lines: [],
    ...data
  };
}

// ============================================================================
// Voice Model
// ============================================================================

/**
 * Creates a Voice object from ElevenLabs API response
 * @param {Object} voiceData - Voice data from API
 * @returns {Object} Voice object
 */
export function createVoice(voiceData) {
  return {
    id: voiceData.voice_id,
    name: voiceData.name,
    gender: voiceData.labels?.gender || 'neutral',
    description: voiceData.labels?.description || '',
    category: voiceData.category || 'general'
  };
}

// ============================================================================
// Utility Functions
// ============================================================================

/**
 * Generates a random color for speaker identification
 * @returns {string} Hex color code
 */
export function generateSpeakerColor() {
  const colors = [
    '#6264A7', // Teams primary
    '#4CC9F0', // Blue
    '#C77DFF', // Purple
    '#2D5016', // Green
    '#F44336', // Red
    '#4CAF50', // Light Green
    '#FF9800', // Amber
    '#9C27B0', // Deep Purple
    '#00BCD4', // Cyan
    '#FF5722'  // Deep Orange
  ];
  return colors[Math.floor(Math.random() * colors.length)];
}

/**
 * Gets effective prosody settings for a line (considering overrides)
 * @param {Object} line - Line object
 * @param {Object} speaker - Speaker object
 * @returns {Object} Effective prosody settings
 */
export function getEffectiveProsody(line, speaker) {
  if (!line.prosodyOverride) {
    return speaker.defaultProsody;
  }
  
  return {
    stability: line.prosodyOverride.stability ?? speaker.defaultProsody.stability,
    similarity_boost: line.prosodyOverride.similarity_boost ?? speaker.defaultProsody.similarity_boost,
    style: line.prosodyOverride.style ?? speaker.defaultProsody.style,
    use_speaker_boost: line.prosodyOverride.use_speaker_boost ?? speaker.defaultProsody.use_speaker_boost
  };
}

/**
 * Gets effective speed for a line (considering overrides)
 * @param {Object} line - Line object
 * @param {Object} speaker - Speaker object
 * @returns {number} Effective speed
 */
export function getEffectiveSpeed(line, speaker) {
  return line.speedOverride ?? speaker.defaultSpeed;
}

/**
 * Generates a cache key for audio generation
 * @param {Object} line - Line object
 * @param {Object} speaker - Speaker object
 * @returns {string} Cache key
 */
export function generateCacheKey(line, speaker) {
  const prosody = getEffectiveProsody(line, speaker);
  const speed = getEffectiveSpeed(line, speaker);
  
  const data = {
    text: line.text.trim(),
    voiceId: speaker.voiceId,
    prosody,
    speed
  };
  
  // Simple hash function for cache key
  return btoa(JSON.stringify(data));
}
