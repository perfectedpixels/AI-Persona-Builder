# Conversation JSON File Format

This document describes the JSON structure for conversation files that can be imported into the Conversation Maker tool.

## File Structure

```json
{
  "id": "string",
  "name": "string",
  "context": "string",
  "speakers": [/* array of speaker objects */],
  "lines": [/* array of line objects */],
  "metadata": {
    "created": 0,
    "modified": 0
  },
  "version": "1.0",
  "exportedAt": 0
}
```

## Root Object Properties

| Property | Type | Required | Description |
|----------|------|----------|-------------|
| `id` | string | Yes | Unique identifier for the conversation (can use timestamp) |
| `name` | string | Yes | Display name of the conversation |
| `context` | string | No | Description or scenario context for the conversation |
| `speakers` | array | Yes | Array of speaker objects (minimum 2) |
| `lines` | array | Yes | Array of dialogue line objects |
| `metadata` | object | No | Metadata about creation/modification times |
| `version` | string | No | Format version (currently "1.0") |
| `exportedAt` | number | No | Unix timestamp of export time |

## Speaker Object

Each speaker in the `speakers` array has the following structure:

```json
{
  "id": "uuid-string",
  "name": "Speaker Name",
  "context": "Character description",
  "voiceId": "elevenlabs-voice-id or null",
  "color": "#FF8C42",
  "defaultProsody": {
    "stability": 0.75,
    "similarity_boost": 0.75,
    "style": 0.5,
    "use_speaker_boost": true
  },
  "defaultSpeed": 1.0
}
```

### Speaker Properties

| Property | Type | Required | Description |
|----------|------|----------|-------------|
| `id` | string | Yes | Unique identifier (UUID format recommended) |
| `name` | string | Yes | Display name of the speaker |
| `context` | string | No | Character description/personality for AI generation |
| `voiceId` | string/null | No | ElevenLabs voice ID (null if not configured) |
| `color` | string | Yes | Hex color code for visual identification |
| `defaultProsody` | object | Yes | Voice prosody settings |
| `defaultSpeed` | number | Yes | Speech speed multiplier (0.7-1.2) |

### Prosody Object

| Property | Type | Range | Description |
|----------|------|-------|-------------|
| `stability` | number | 0.0-1.0 | Voice consistency (higher = more consistent) |
| `similarity_boost` | number | 0.0-1.0 | Similarity to original voice (higher = closer) |
| `style` | number | 0.0-1.0 | Style exaggeration level |
| `use_speaker_boost` | boolean | true/false | Enable speaker boost feature |

### Suggested Speaker Colors

```
#FF8C42  (Orange)
#4CC9F0  (Blue)
#C77DFF  (Purple)
#2D5016  (Green)
#F44336  (Red)
#4CAF50  (Light Green)
```

## Line Object

Each line in the `lines` array has the following structure:

```json
{
  "id": "uuid-string",
  "speakerId": "speaker-uuid",
  "text": "The dialogue text",
  "order": 0,
  "prosodyOverride": null,
  "speedOverride": null,
  "audioState": {
    "isStale": true,
    "audioUrl": null,
    "duration": null
  }
}
```

### Line Properties

| Property | Type | Required | Description |
|----------|------|----------|-------------|
| `id` | string | Yes | Unique identifier (UUID format recommended) |
| `speakerId` | string | Yes | Must match an `id` from the `speakers` array |
| `text` | string | Yes | The dialogue text for this line |
| `order` | number | Yes | Sequential order (0, 1, 2, ...) |
| `prosodyOverride` | object/null | No | Per-line prosody override (same structure as defaultProsody) |
| `speedOverride` | number/null | No | Per-line speed override (0.7-1.2) |
| `audioState` | object | Yes | Audio generation state |

### Audio State Object

| Property | Type | Description |
|----------|------|-------------|
| `isStale` | boolean | Whether audio needs (re)generation (set to `true` for new imports) |
| `audioUrl` | string/null | Blob URL for generated audio (null for imports) |
| `duration` | number/null | Audio duration in seconds (null for imports) |

## Metadata Object

```json
{
  "created": 1234567890000,
  "modified": 1234567890000
}
```

| Property | Type | Description |
|----------|------|-------------|
| `created` | number | Unix timestamp (milliseconds) of creation |
| `modified` | number | Unix timestamp (milliseconds) of last modification |

## Complete Example

```json
{
  "id": "1707523200000",
  "name": "Tech Interview Podcast",
  "context": "A podcast interview about AI technology",
  "speakers": [
    {
      "id": "550e8400-e29b-41d4-a716-446655440000",
      "name": "Host",
      "context": "Enthusiastic podcast host who asks insightful questions",
      "voiceId": null,
      "color": "#FF8C42",
      "defaultProsody": {
        "stability": 0.75,
        "similarity_boost": 0.75,
        "style": 0.5,
        "use_speaker_boost": true
      },
      "defaultSpeed": 1.0
    },
    {
      "id": "550e8400-e29b-41d4-a716-446655440001",
      "name": "Guest",
      "context": "AI researcher with deep technical knowledge",
      "voiceId": null,
      "color": "#4CC9F0",
      "defaultProsody": {
        "stability": 0.75,
        "similarity_boost": 0.75,
        "style": 0.5,
        "use_speaker_boost": true
      },
      "defaultSpeed": 1.0
    }
  ],
  "lines": [
    {
      "id": "line-001",
      "speakerId": "550e8400-e29b-41d4-a716-446655440000",
      "text": "Welcome to the show! Today we're talking about the future of AI.",
      "order": 0,
      "prosodyOverride": null,
      "speedOverride": null,
      "audioState": {
        "isStale": true,
        "audioUrl": null,
        "duration": null
      }
    },
    {
      "id": "line-002",
      "speakerId": "550e8400-e29b-41d4-a716-446655440001",
      "text": "Thanks for having me! I'm excited to discuss recent developments.",
      "order": 1,
      "prosodyOverride": null,
      "speedOverride": null,
      "audioState": {
        "isStale": true,
        "audioUrl": null,
        "duration": null
      }
    },
    {
      "id": "line-003",
      "speakerId": "550e8400-e29b-41d4-a716-446655440000",
      "text": "Let's start with the basics. What exactly is machine learning?",
      "order": 2,
      "prosodyOverride": null,
      "speedOverride": null,
      "audioState": {
        "isStale": true,
        "audioUrl": null,
        "duration": null
      }
    }
  ],
  "metadata": {
    "created": 1707523200000,
    "modified": 1707523200000
  },
  "version": "1.0",
  "exportedAt": 1707523200000
}
```

## Tips for LLM Generation

1. **Generate unique IDs**: Use UUIDs or timestamp-based IDs for speakers and lines
2. **Match speakerIds**: Ensure every line's `speakerId` matches a speaker's `id`
3. **Sequential order**: Lines should have sequential `order` values (0, 1, 2, ...)
4. **Set audioState**: Always set `isStale: true`, `audioUrl: null`, `duration: null` for new content
5. **Use speaker context**: The `context` field helps the AI generate character-appropriate dialogue
6. **Default values**: Use the default prosody and speed values shown above unless you have specific requirements
7. **Minimum speakers**: Include at least 2 speakers for a conversation
8. **Color variety**: Use different colors for each speaker for visual distinction

## Validation Rules

- All speaker IDs must be unique
- All line IDs must be unique
- Every line's `speakerId` must reference an existing speaker
- Line `order` values should be sequential starting from 0
- Speaker colors should be valid hex codes
- Prosody values must be between 0.0 and 1.0
- Speed values should be between 0.7 and 1.2
- At least 2 speakers required
- At least 1 line required
