# Changelog

All notable changes to Conversation Maker will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [1.2.0] - 2026-02-10

### Added
- Import Transcript feature in Script Panel
  - Supports multiple text formats (same line, next line with/without colon)
  - Automatically creates new speakers as needed
  - Appends to existing script without replacing
- Manual line addition for any speaker
  - "Add line for" section at bottom of script
  - Creates lines with proper ordering
- Audio export with 1-second padding between clips
  - Uses Web Audio API for processing
  - Exports as WAV format
- Code-only Lambda deployment script (`deploy-lambda-code-only.sh`)
  - Quick deployments without requiring API keys
  - Preserves existing environment variables
- Comprehensive JSON format documentation (`CONVERSATION_JSON_FORMAT.md`)
- Team access credentials and onboarding guide (`TEAM_ACCESS_MESSAGE.md`)

### Fixed
- Custom conversation length validation bug
  - Backend now accepts 'custom' as valid length option
  - Works with custom turn count
- Voice selection for new speakers
  - Modal now tracks local state changes
  - Voice dropdown updates immediately when changed
- Documentation cleanup
  - Moved historical docs to `docs/archive/`
  - Updated README with current features
  - Removed redundant/outdated files

### Changed
- Separated "Load Conversation" (JSON) from "Import Transcript" (TXT)
  - Load Conversation now only accepts JSON files
  - Import Transcript is a separate button in Script Panel
- Improved transcript import flexibility
  - Supports 3 different text formats
  - More forgiving parsing logic

## [1.1.1] - 2026-02-04

### Fixed
- Speaker preservation during script generation
  - All existing speakers now maintained when generating new scripts
  - Only speakers in generated script were being preserved (bug)
  - Voice configurations no longer lost after generation

## [1.1.0] - 2026-02-04

### Added
- Conversation context field
  - Scenario/context now persists across sessions
  - Used for AI script generation
- Data validation on conversation load
  - Detects and clears corrupted localStorage data
  - Validates speaker references in lines
- Base64 audio decoding
  - Handles Lambda's base64-encoded audio responses
  - Works for both voice preview and playback

### Fixed
- Speaker voice configurations lost on script generation
  - Voice settings now preserved when regenerating scripts
  - Matches speakers by name (case-insensitive)
- New speaker voice configuration not saved
  - Modal now passes full speaker object with voice settings
  - All prosody and speed settings retained
- Orphaned speaker references
  - Lines with invalid speaker IDs now detected and handled
  - Prevents playback errors from corrupted data
- Voice preview not working
  - Added base64 detection and decoding in frontend
  - Works with Lambda's audio response format
- Audio playback issues
  - Applied base64 decoding to PlaybackManager
  - Conversations now play correctly

### Changed
- Migrated from Elastic Beanstalk to Lambda + API Gateway
  - Serverless architecture
  - Zero-credential security model
  - IAM execution role for AWS services
- Improved speaker management
  - Better ID mapping between frontend and backend
  - Preserves all speaker properties during generation

## [1.0.0] - 2026-02-02

### Added
- Initial release
- Multi-speaker conversation creation
- AI-powered script generation using AWS Bedrock (Claude 3 Haiku)
- ElevenLabs voice synthesis integration (26 voices)
- Voice customization (prosody and speed controls)
- Sequential playback with visual timeline
- Voice preview functionality
- Conversation save/load (JSON export/import)
- Persistent state using localStorage
- AWS Amplify deployment for frontend
- AWS Lambda deployment for backend

### Features
- Create conversations with 2+ speakers
- Generate scripts with AI (short/medium/long)
- Customize voice per speaker
- Fine-tune prosody (stability, similarity, style, speaker boost)
- Adjust speech speed (0.7x - 1.2x)
- Per-line voice overrides
- Play conversations sequentially
- Export/import conversations as JSON
- Auto-save to localStorage

### Security
- Zero-credential architecture
- IAM execution role for Lambda
- No AWS credentials in code
- ElevenLabs API key in Lambda environment only
- Pre-commit security checks

---

## Version History Summary

- **1.2.0** - Import transcript, manual line addition, audio export, custom length fix
- **1.1.1** - Speaker preservation fix
- **1.1.0** - Context persistence, data validation, base64 audio, Lambda migration
- **1.0.0** - Initial release with core features
