import React, { useState, useRef } from 'react';
import './PlaybackManager.css';
import { getEffectiveProsody, getEffectiveSpeed } from '../types/models';
import { PlayIcon, PauseIcon, StopIcon, SpinnerIcon } from './Icons';
import API_URL from '../config';

function PlaybackManager({ lines, speakers, playbackState, setPlaybackState, audioCache }) {
  const [isGenerating, setIsGenerating] = useState(false);
  const audioRef = useRef(null);

  const getSpeakerById = (speakerId) => {
    return speakers.find(s => s.id === speakerId);
  };

  const generateAudio = async (line, speaker) => {
    const prosody = getEffectiveProsody(line, speaker);
    const speed = getEffectiveSpeed(line, speaker);

    const response = await fetch(`${API_URL}/api/conversation/synthesize`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        text: line.text,
        voiceId: speaker.voiceId,
        prosody,
        speed
      })
    });

    if (!response.ok) {
      throw new Error('Failed to generate audio');
    }

    // Handle base64 encoded response from Lambda/API Gateway
    const arrayBuffer = await response.arrayBuffer();
    const uint8Array = new Uint8Array(arrayBuffer);
    
    // Check if it's base64 by looking at the first few bytes
    // Base64 text will be ASCII characters, binary MP3 will start with ID3 or 0xFF
    const isBase64 = uint8Array[0] !== 0xFF && uint8Array[0] !== 0x49; // Not 0xFF (MP3) or 'I' (ID3)
    
    let audioBlob;
    if (isBase64) {
      // Decode base64
      const text = new TextDecoder().decode(uint8Array);
      const binaryString = atob(text);
      const bytes = new Uint8Array(binaryString.length);
      for (let i = 0; i < binaryString.length; i++) {
        bytes[i] = binaryString.charCodeAt(i);
      }
      audioBlob = new Blob([bytes], { type: 'audio/mpeg' });
    } else {
      // Already binary
      audioBlob = new Blob([uint8Array], { type: 'audio/mpeg' });
    }

    return URL.createObjectURL(audioBlob);
  };

  const handlePlay = async () => {
    if (lines.length === 0) {
      alert('No lines to play');
      return;
    }

    setPlaybackState(prev => ({ ...prev, isPlaying: true, currentLineIndex: 0 }));
    playNextLine(0);
  };

  const playNextLine = async (index) => {
    if (index >= lines.length) {
      // Playback complete
      setPlaybackState(prev => ({ ...prev, isPlaying: false, currentLineIndex: -1 }));
      return;
    }

    const line = lines.sort((a, b) => a.order - b.order)[index];
    const speaker = getSpeakerById(line.speakerId);

    if (!speaker || !speaker.voiceId) {
      console.error('Speaker or voice not configured');
      playNextLine(index + 1);
      return;
    }

    try {
      setIsGenerating(true);
      setPlaybackState(prev => ({ ...prev, currentLineIndex: index }));

      // Generate or retrieve audio
      let audioUrl;
      if (line.audioState.isStale || !line.audioState.audioUrl) {
        audioUrl = await generateAudio(line, speaker);
      } else {
        audioUrl = line.audioState.audioUrl;
      }

      // Play audio
      if (audioRef.current) {
        audioRef.current.src = audioUrl;
        audioRef.current.onended = () => {
          setTimeout(() => {
            playNextLine(index + 1);
          }, 500); // 500ms pause between lines
        };
        await audioRef.current.play();
      }
    } catch (error) {
      console.error('Error playing line:', error);
      // Continue to next line on error
      playNextLine(index + 1);
    } finally {
      setIsGenerating(false);
    }
  };

  const handlePause = () => {
    if (audioRef.current) {
      audioRef.current.pause();
    }
    setPlaybackState(prev => ({ ...prev, isPlaying: false }));
  };

  const handleStop = () => {
    if (audioRef.current) {
      audioRef.current.pause();
      audioRef.current.currentTime = 0;
    }
    setPlaybackState(prev => ({ ...prev, isPlaying: false, currentLineIndex: -1 }));
  };

  const currentLine = playbackState.currentLineIndex >= 0 
    ? lines.sort((a, b) => a.order - b.order)[playbackState.currentLineIndex]
    : null;
  const currentSpeaker = currentLine ? getSpeakerById(currentLine.speakerId) : null;

  return (
    <div className="playback-manager card">
      <h2>Playback</h2>
      
      <div className="playback-info">
        <div className="info-item">
          <span className="info-label">Lines:</span>
          <span className="info-value">{lines.length}</span>
        </div>
        <div className="info-item">
          <span className="info-label">Speakers:</span>
          <span className="info-value">{speakers.length}</span>
        </div>
      </div>

      {/* Timeline */}
      <div className="timeline-section">
        <h3>Timeline</h3>
        <div className="timeline">
          {lines.sort((a, b) => a.order - b.order).map((line, index) => {
            const speaker = getSpeakerById(line.speakerId);
            const isCurrent = index === playbackState.currentLineIndex;
            
            return (
              <div
                key={line.id}
                className={`timeline-segment ${isCurrent ? 'current' : ''}`}
                style={{ 
                  backgroundColor: speaker?.color,
                  opacity: isCurrent ? 1 : 0.6
                }}
                title={`${speaker?.name}: ${line.text.substring(0, 50)}...`}
              />
            );
          })}
        </div>
      </div>

      {/* Controls */}
      <div className="controls-section">
        <h3>Controls</h3>
        <div className="playback-controls">
          <button
            className="btn-control"
            onClick={handlePlay}
            disabled={playbackState.isPlaying || lines.length === 0}
          >
            <PlayIcon size={16} />
            <span>Play</span>
          </button>
          <button
            className="btn-control"
            onClick={handlePause}
            disabled={!playbackState.isPlaying}
          >
            <PauseIcon size={16} />
            <span>Pause</span>
          </button>
          <button
            className="btn-control"
            onClick={handleStop}
            disabled={!playbackState.isPlaying && playbackState.currentLineIndex === -1}
          >
            <StopIcon size={16} />
            <span>Stop</span>
          </button>
        </div>

        {isGenerating && (
          <div className="generating-indicator">
            <SpinnerIcon size={16} />
            <span>Generating audio...</span>
          </div>
        )}
      </div>

      {/* Current Line Display */}
      {currentLine && currentSpeaker && (
        <div className="current-line-display">
          <h3>Now Playing</h3>
          <div className="current-line">
            <div className="current-speaker">
              <div 
                className="speaker-indicator"
                style={{ backgroundColor: currentSpeaker.color }}
              />
              <span className="speaker-name">{currentSpeaker.name}</span>
            </div>
            <div className="current-text">{currentLine.text}</div>
          </div>
        </div>
      )}

      {/* Hidden audio element */}
      <audio ref={audioRef} style={{ display: 'none' }} />
    </div>
  );
}

export default PlaybackManager;