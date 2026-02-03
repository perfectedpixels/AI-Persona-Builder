import React, { useState, useEffect } from 'react';
import './VoiceConfigurator.css';
import { MicrophoneIcon } from './Icons';

function VoiceConfigurator({
  selectedLine,
  selectedSpeaker,
  availableVoices,
  voicesLoading,
  onSpeakerVoiceChange,
  onSpeakerProsodyChange,
  onSpeakerSpeedChange,
  onLineProsodyOverride,
  onLineSpeedOverride
}) {
  const [enableLineOverrides, setEnableLineOverrides] = useState(false);
  const [isPreviewingVoice, setIsPreviewingVoice] = useState(false);
  const [previewAudio, setPreviewAudio] = useState(null);

  // Debug logging
  useEffect(() => {
    console.log('VoiceConfigurator - availableVoices:', availableVoices?.length || 0);
    console.log('VoiceConfigurator - voicesLoading:', voicesLoading);
  }, [availableVoices, voicesLoading]);

  // Cleanup audio on unmount
  useEffect(() => {
    return () => {
      if (previewAudio) {
        previewAudio.pause();
        previewAudio.currentTime = 0;
      }
    };
  }, [previewAudio]);

  if (!selectedSpeaker && !selectedLine) {
    return (
      <div className="voice-configurator card">
        <h2>
          <MicrophoneIcon size={20} />
          Voice Configuration
        </h2>
        <div className="empty-state">
          <p>Select a speaker or line to configure voice settings</p>
        </div>
      </div>
    );
  }

  const speaker = selectedSpeaker;
  const line = selectedLine;

  const handleVoiceChange = (voiceId) => {
    if (speaker) {
      onSpeakerVoiceChange(speaker.id, voiceId);
    }
  };

  const handleProsodyChange = (key, value) => {
    if (enableLineOverrides && line) {
      const override = line.prosodyOverride || {};
      onLineProsodyOverride(line.id, { ...override, [key]: value });
    } else if (speaker) {
      onSpeakerProsodyChange(speaker.id, { [key]: value });
    }
  };

  const handleSpeedChange = (value) => {
    if (enableLineOverrides && line) {
      onLineSpeedOverride(line.id, value);
    } else if (speaker) {
      onSpeakerSpeedChange(speaker.id, value);
    }
  };

  const handlePreviewVoice = async () => {
    if (!speaker?.voiceId || isPreviewingVoice) return;

    // Get the absolute latest prosody and speed values
    const latestProsody = enableLineOverrides && line?.prosodyOverride
      ? { ...speaker?.defaultProsody, ...line.prosodyOverride }
      : speaker?.defaultProsody || {};

    const latestSpeed = enableLineOverrides && line?.speedOverride !== null
      ? line.speedOverride
      : speaker?.defaultSpeed || 1.0;

    console.log('Preview with prosody:', latestProsody);
    console.log('Preview with speed:', latestSpeed);

    setIsPreviewingVoice(true);

    try {
      // Stop any currently playing preview
      if (previewAudio) {
        previewAudio.pause();
        previewAudio.currentTime = 0;
      }

      const response = await fetch('/api/conversation/synthesize', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          text: 'This is the way this voice sounds in conversation.',
          voiceId: speaker.voiceId,
          prosody: latestProsody,
          speed: latestSpeed
        })
      });

      if (!response.ok) {
        throw new Error('Failed to generate voice preview');
      }

      const blob = await response.blob();
      const audioUrl = URL.createObjectURL(blob);
      const audio = new Audio(audioUrl);
      
      setPreviewAudio(audio);
      
      audio.onended = () => {
        setIsPreviewingVoice(false);
        URL.revokeObjectURL(audioUrl);
      };

      audio.onerror = () => {
        setIsPreviewingVoice(false);
        URL.revokeObjectURL(audioUrl);
        alert('Failed to play voice preview');
      };

      await audio.play();
    } catch (error) {
      console.error('Voice preview error:', error);
      alert('Failed to preview voice');
      setIsPreviewingVoice(false);
    }
  };

  const currentProsody = enableLineOverrides && line?.prosodyOverride
    ? { ...speaker?.defaultProsody, ...line.prosodyOverride }
    : speaker?.defaultProsody || {};

  const currentSpeed = enableLineOverrides && line?.speedOverride !== null
    ? line.speedOverride
    : speaker?.defaultSpeed || 1.0;

  return (
    <div className="voice-configurator card">
      <h2>
        <MicrophoneIcon size={20} />
        Voice Configuration
      </h2>

      {line && (
        <div className="line-override-toggle">
          <label>
            <input
              type="checkbox"
              checked={enableLineOverrides}
              onChange={(e) => setEnableLineOverrides(e.target.checked)}
            />
            <span>Enable per-line overrides</span>
          </label>
        </div>
      )}

      {/* Voice Selection */}
      {speaker && !enableLineOverrides && (
        <div className="config-section">
          <label className="config-label">Voice</label>
          {voicesLoading ? (
            <div className="loading">Loading voices...</div>
          ) : (
            <div className="voice-select-container">
              <select
                className="voice-select"
                value={speaker.voiceId || ''}
                onChange={(e) => handleVoiceChange(e.target.value)}
              >
                <option value="">Select a voice...</option>
                {availableVoices.map(voice => (
                  <option key={voice.id} value={voice.id}>
                    {voice.name} ({voice.gender})
                  </option>
                ))}
              </select>
              <button
                className="btn-preview"
                onClick={handlePreviewVoice}
                disabled={!speaker.voiceId || isPreviewingVoice}
                title="Preview voice"
              >
                {isPreviewingVoice ? 'Playing...' : 'Preview'}
              </button>
            </div>
          )}
        </div>
      )}

      {/* Prosody Settings */}
      <div className="config-section">
        <h3>Prosody Settings</h3>
        
        <div className="slider-group">
          <label className="slider-label">
            <span>Stability</span>
            <span className="slider-value">{currentProsody.stability?.toFixed(2)}</span>
          </label>
          <input
            type="range"
            min="0"
            max="1"
            step="0.01"
            value={currentProsody.stability || 0.75}
            onChange={(e) => handleProsodyChange('stability', parseFloat(e.target.value))}
            className="slider"
          />
          <div className="slider-hint">Lower = more variable, Higher = more consistent</div>
        </div>

        <div className="slider-group">
          <label className="slider-label">
            <span>Similarity Boost</span>
            <span className="slider-value">{currentProsody.similarity_boost?.toFixed(2)}</span>
          </label>
          <input
            type="range"
            min="0"
            max="1"
            step="0.01"
            value={currentProsody.similarity_boost || 0.75}
            onChange={(e) => handleProsodyChange('similarity_boost', parseFloat(e.target.value))}
            className="slider"
          />
          <div className="slider-hint">Higher = closer to original voice</div>
        </div>

        <div className="slider-group">
          <label className="slider-label">
            <span>Style</span>
            <span className="slider-value">{currentProsody.style?.toFixed(2)}</span>
          </label>
          <input
            type="range"
            min="0"
            max="1"
            step="0.01"
            value={currentProsody.style || 0.5}
            onChange={(e) => handleProsodyChange('style', parseFloat(e.target.value))}
            className="slider"
          />
          <div className="slider-hint">Exaggeration of the style</div>
        </div>

        <div className="checkbox-group">
          <label>
            <input
              type="checkbox"
              checked={currentProsody.use_speaker_boost || false}
              onChange={(e) => handleProsodyChange('use_speaker_boost', e.target.checked)}
            />
            <span>Use Speaker Boost</span>
          </label>
        </div>
      </div>

      {/* Speed Control */}
      <div className="config-section">
        <h3>Speed</h3>
        
        <div className="slider-group">
          <label className="slider-label">
            <span>Speech Rate</span>
            <span className="slider-value">{currentSpeed.toFixed(2)}x</span>
          </label>
          <input
            type="range"
            min="0.5"
            max="2.0"
            step="0.1"
            value={currentSpeed}
            onChange={(e) => handleSpeedChange(parseFloat(e.target.value))}
            className="slider"
          />
          <div className="slider-hint">0.5x (slow) to 2.0x (fast)</div>
        </div>
      </div>

      {enableLineOverrides && line && (
        <div className="override-info">
          ℹ️ Changes apply only to the selected line
        </div>
      )}
    </div>
  );
}

export default VoiceConfigurator;