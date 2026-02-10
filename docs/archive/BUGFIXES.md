# Bug Fixes - Speaker Configuration Persistence

## Issues Fixed

### 1. Speaker Voice Configurations Lost on Script Generation
**Problem**: When generating a new script, all speaker voice configurations (voice selection, prosody settings, speed) were being reset to defaults.

**Root Cause**: The `handleGenerateScript` function was replacing all speakers with newly generated ones, discarding the existing voice configurations.

**Solution**: Modified the script generation logic to:
- Match generated speakers with existing speakers by name (case-insensitive)
- Preserve voice configurations (voiceId, defaultProsody, defaultSpeed, color) from existing speakers
- Only assign default voices to truly new speakers

**Files Changed**: `client/src/components/ConversationEditor.js`

### 2. New Speaker Voice Configuration Not Saved
**Problem**: When adding a new speaker through the modal, voice configurations set in the modal were not being saved.

**Root Cause**: The `handleSaveNewSpeaker` function was only passing the speaker name to `onSpeakerAdd`, not the full speaker object with voice settings.

**Solution**: 
- Updated `handleSaveNewSpeaker` to pass the complete speaker data object
- Modified `handleSpeakerAdd` to accept either a string (legacy) or full speaker object
- When receiving a full object, merge it with the default speaker structure

**Files Changed**: 
- `client/src/components/ConversationPanel.js`
- `client/src/components/ConversationEditor.js`

## Testing Recommendations

1. **Test Script Generation with Configured Speakers**:
   - Configure 2 speakers with specific voices and prosody settings
   - Generate a script using those speakers
   - Verify voice configurations are preserved

2. **Test Adding New Speaker**:
   - Click "Add Speaker"
   - Configure voice, prosody, and speed in modal
   - Save the speaker
   - Verify all settings are retained

3. **Test Mixed Scenario**:
   - Configure 2 speakers with custom voices
   - Generate a script that uses those speakers plus adds a new one
   - Verify existing speakers keep their configurations
   - Verify new speaker gets default voice

## Commit
```
Fix: Preserve speaker voice configurations when generating scripts and adding speakers
```
