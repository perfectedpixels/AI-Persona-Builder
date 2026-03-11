import React, { useState, useRef } from 'react';
import './ScriptPanel.css';
import { getEffectiveProsody, getEffectiveSpeed } from '../types/models';
import { PlayIcon, PauseIcon, StopIcon, SpinnerIcon, DeleteIcon, ArrowUpIcon, ArrowDownIcon, WarningIcon, FileIcon } from './Icons';
import API_URL from '../config';

function ScriptPanel({ 
  lines, 
  speakers, 
  selectedLineId,
  onLineAdd,
  onLineEdit,
  onLineDelete,
  onLineReorder,
  onLineSelect,
  onLineAudioUpdate,
  onImportTranscript,
  playbackState, 
  setPlaybackState,
  conversationName
}) {
  const [isGenerating, setIsGenerating] = useState(false);
  const [isGeneratingAll, setIsGeneratingAll] = useState(false);
  const [generationProgress, setGenerationProgress] = useState({ current: 0, total: 0 });
  const [editingLineId, setEditingLineId] = useState(null);
  const audioRef = useRef(null);

  const getSpeakerById = (speakerId) => {
    return speakers.find(s => s.id === speakerId);
  };

  const generateAudio = async (line, speaker) => {
    const prosody = getEffectiveProsody(line, speaker);
    const speed = getEffectiveSpeed(line, speaker);

    console.log('Generating audio with:', {
      text: line.text.substring(0, 50),
      voiceId: speaker.voiceId,
      prosody,
      speed
    });

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
    const contentType = response.headers.get('content-type');
    let audioBlob;
    
    if (contentType === 'audio/mpeg') {
      const blob = await response.blob();
      const text = await blob.text();
      
      // Check if it's base64 encoded
      if (text.match(/^[A-Za-z0-9+/=]+$/)) {
        // Decode base64
        const binaryString = atob(text);
        const bytes = new Uint8Array(binaryString.length);
        for (let i = 0; i < binaryString.length; i++) {
          bytes[i] = binaryString.charCodeAt(i);
        }
        audioBlob = new Blob([bytes], { type: 'audio/mpeg' });
      } else {
        audioBlob = blob;
      }
    } else {
      audioBlob = await response.blob();
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
      setPlaybackState(prev => ({ ...prev, currentLineIndex: index }));

      let audioUrl;
      
      // Use pre-generated audio if available and not stale
      if (!line.audioState.isStale && line.audioState.audioUrl) {
        audioUrl = line.audioState.audioUrl;
      } else {
        // Generate on-the-fly if not pre-generated
        setIsGenerating(true);
        audioUrl = await generateAudio(line, speaker);
        setIsGenerating(false);
      }

      if (audioRef.current) {
        audioRef.current.src = audioUrl;
        audioRef.current.onended = () => {
          setTimeout(() => {
            playNextLine(index + 1);
          }, 500);
        };
        await audioRef.current.play();
      }
    } catch (error) {
      console.error('Error playing line:', error);
      setIsGenerating(false);
      playNextLine(index + 1);
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

  const handleGenerateAllAudio = async () => {
    if (lines.length === 0) {
      alert('No lines to generate audio for');
      return;
    }

    // Check if all speakers have voices configured
    const missingVoices = speakers.filter(s => !s.voiceId);
    if (missingVoices.length > 0) {
      alert(`Please configure voices for: ${missingVoices.map(s => s.name).join(', ')}`);
      return;
    }

    setIsGeneratingAll(true);
    const sortedLines = lines.sort((a, b) => a.order - b.order);
    setGenerationProgress({ current: 0, total: sortedLines.length });

    for (let i = 0; i < sortedLines.length; i++) {
      const line = sortedLines[i];
      const speaker = getSpeakerById(line.speakerId);

      if (!speaker || !speaker.voiceId) {
        console.error(`Skipping line ${i + 1}: Speaker or voice not configured`);
        continue;
      }

      try {
        setGenerationProgress({ current: i + 1, total: sortedLines.length });
        
        // Generate audio
        const audioUrl = await generateAudio(line, speaker);
        
        // Get audio duration
        const audio = new Audio(audioUrl);
        await new Promise((resolve) => {
          audio.onloadedmetadata = () => {
            const duration = audio.duration;
            
            // Update line with audio URL and duration
            if (onLineAudioUpdate) {
              onLineAudioUpdate(line.id, audioUrl, duration);
            }
            
            resolve();
          };
        });
      } catch (error) {
        console.error(`Error generating audio for line ${i + 1}:`, error);
        // Continue with next line even if one fails
      }
    }

    setIsGeneratingAll(false);
    setGenerationProgress({ current: 0, total: 0 });
  };

  const handleExportTranscript = async () => {
    // Format conversation as transcript
    let transcript = `${conversationName}\n\n`;
    
    // Add each line with speaker name
    lines
      .sort((a, b) => a.order - b.order)
      .forEach(line => {
        const speaker = getSpeakerById(line.speakerId);
        if (speaker && line.text.trim()) {
          transcript += `${speaker.name}: ${line.text}\n`;
        }
      });
    
    // Try to use File System Access API (Chrome/Edge only)
    if ('showSaveFilePicker' in window) {
      try {
        const handle = await window.showSaveFilePicker({
          suggestedName: `${conversationName.replace(/[^a-z0-9]/gi, '_').toLowerCase()}_transcript.txt`,
          types: [{
            description: 'Text Files',
            accept: { 'text/plain': ['.txt'] }
          }]
        });
        
        const writable = await handle.createWritable();
        await writable.write(transcript);
        await writable.close();
        return;
      } catch (error) {
        if (error.name !== 'AbortError') {
          console.error('Save file error:', error);
        }
      }
    }
    
    // Fallback: Create blob and download
    const blob = new Blob([transcript], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `${conversationName.replace(/[^a-z0-9]/gi, '_').toLowerCase()}_transcript.txt`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  const handleImportTranscript = () => {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = '.txt';
    
    input.onchange = async (e) => {
      const file = e.target.files[0];
      if (!file) return;
      
      try {
        const text = await file.text();
        const textLines = text.split('\n').map(line => line.trim());
        
        if (textLines.length === 0) {
          throw new Error('Empty transcript file');
        }
        
        // Parse speaker lines - support multiple formats:
        // 1. "Speaker: dialogue" (same line)
        // 2. "Speaker:\n dialogue" (next line)
        // 3. "Speaker\n dialogue" (next line, no colon)
        const parsedLines = [];
        let currentSpeaker = null;
        
        for (let i = 0; i < textLines.length; i++) {
          const line = textLines[i];
          if (!line) continue;
          
          // Check if this line has a colon (potential speaker label)
          const colonIndex = line.indexOf(':');
          
          if (colonIndex !== -1) {
            const beforeColon = line.substring(0, colonIndex).trim();
            const afterColon = line.substring(colonIndex + 1).trim();
            
            // If there's text after the colon, it's format 1: "Speaker: dialogue"
            if (afterColon) {
              parsedLines.push({ 
                speakerName: beforeColon, 
                dialogue: afterColon 
              });
              currentSpeaker = beforeColon;
            } 
            // If nothing after colon, next line is the dialogue (format 2)
            else {
              currentSpeaker = beforeColon;
            }
          }
          // No colon - could be dialogue for previous speaker or a speaker name
          else {
            // If we have a current speaker, this is their dialogue
            if (currentSpeaker) {
              parsedLines.push({ 
                speakerName: currentSpeaker, 
                dialogue: line 
              });
              currentSpeaker = null; // Reset after using
            }
            // Otherwise, treat as speaker name (format 3)
            else {
              currentSpeaker = line;
            }
          }
        }
        
        if (parsedLines.length === 0) {
          throw new Error('No valid dialogue lines found. Supported formats:\n' +
                         '1. "Speaker: dialogue"\n' +
                         '2. "Speaker:\\n dialogue"\n' +
                         '3. "Speaker\\n dialogue"');
        }
        
        // Pass to parent to handle the actual import
        onImportTranscript(parsedLines);
        
        alert(`Transcript imported successfully! ${parsedLines.length} lines added.`);
      } catch (error) {
        console.error('Failed to import transcript:', error);
        alert(`Failed to import transcript: ${error.message}`);
      }
    };
    
    input.click();
  };

  const handleExportAudio = async () => {
    // Check if all audio is generated
    const staleLines = lines.filter(line => line.audioState.isStale || !line.audioState.audioUrl);
    if (staleLines.length > 0) {
      alert('Please generate all audio first using "Generate All Audio" button');
      return;
    }

    try {
      const sortedLines = lines.sort((a, b) => a.order - b.order);
      
      // Create audio context
      const audioContext = new (window.AudioContext || window.webkitAudioContext)();
      const sampleRate = audioContext.sampleRate;
      
      // Fetch and decode all audio
      const audioBuffers = [];
      for (const line of sortedLines) {
        const response = await fetch(line.audioState.audioUrl);
        const arrayBuffer = await response.arrayBuffer();
        const audioBuffer = await audioContext.decodeAudioData(arrayBuffer);
        audioBuffers.push(audioBuffer);
      }
      
      // Calculate total length (audio + 1 second padding between clips)
      const paddingDuration = 1.0; // 1 second
      const totalDuration = audioBuffers.reduce((sum, buffer) => sum + buffer.duration, 0) 
                          + (paddingDuration * (audioBuffers.length - 1));
      
      // Create combined buffer
      const numberOfChannels = audioBuffers[0].numberOfChannels;
      const combinedBuffer = audioContext.createBuffer(
        numberOfChannels,
        Math.ceil(totalDuration * sampleRate),
        sampleRate
      );
      
      // Copy audio data with padding
      let offset = 0;
      for (let i = 0; i < audioBuffers.length; i++) {
        const buffer = audioBuffers[i];
        
        for (let channel = 0; channel < numberOfChannels; channel++) {
          const sourceData = buffer.getChannelData(channel);
          const destData = combinedBuffer.getChannelData(channel);
          destData.set(sourceData, offset);
        }
        
        offset += buffer.length;
        
        // Add padding (silence) between clips, but not after the last one
        if (i < audioBuffers.length - 1) {
          offset += Math.ceil(paddingDuration * sampleRate);
        }
      }
      
      // Convert to WAV (since we can't easily encode to MP3 in browser)
      const wavBlob = await audioBufferToWav(combinedBuffer);
      
      // Try to use File System Access API (Chrome/Edge only)
      if ('showSaveFilePicker' in window) {
        try {
          const handle = await window.showSaveFilePicker({
            suggestedName: `${conversationName.replace(/[^a-z0-9]/gi, '_').toLowerCase()}_audio.wav`,
            types: [{
              description: 'Audio Files',
              accept: { 'audio/wav': ['.wav'] }
            }]
          });
          
          const writable = await handle.createWritable();
          await writable.write(wavBlob);
          await writable.close();
          return;
        } catch (error) {
          if (error.name !== 'AbortError') {
            console.error('Save file error:', error);
          }
        }
      }
      
      // Fallback: Create blob and download
      const url = URL.createObjectURL(wavBlob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `${conversationName.replace(/[^a-z0-9]/gi, '_').toLowerCase()}_audio.wav`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
      
      // Close audio context
      audioContext.close();
    } catch (error) {
      console.error('Error exporting audio:', error);
      alert('Failed to export audio. Please try again.');
    }
  };

  // Helper function to convert AudioBuffer to WAV
  const audioBufferToWav = (buffer) => {
    const numberOfChannels = buffer.numberOfChannels;
    const sampleRate = buffer.sampleRate;
    const format = 1; // PCM
    const bitDepth = 16;
    
    const bytesPerSample = bitDepth / 8;
    const blockAlign = numberOfChannels * bytesPerSample;
    
    const data = [];
    for (let i = 0; i < buffer.length; i++) {
      for (let channel = 0; channel < numberOfChannels; channel++) {
        const sample = buffer.getChannelData(channel)[i];
        const int16 = Math.max(-1, Math.min(1, sample)) * 0x7FFF;
        data.push(int16);
      }
    }
    
    const dataLength = data.length * bytesPerSample;
    const bufferLength = 44 + dataLength;
    const arrayBuffer = new ArrayBuffer(bufferLength);
    const view = new DataView(arrayBuffer);
    
    // WAV header
    const writeString = (offset, string) => {
      for (let i = 0; i < string.length; i++) {
        view.setUint8(offset + i, string.charCodeAt(i));
      }
    };
    
    writeString(0, 'RIFF');
    view.setUint32(4, bufferLength - 8, true);
    writeString(8, 'WAVE');
    writeString(12, 'fmt ');
    view.setUint32(16, 16, true); // fmt chunk size
    view.setUint16(20, format, true);
    view.setUint16(22, numberOfChannels, true);
    view.setUint32(24, sampleRate, true);
    view.setUint32(28, sampleRate * blockAlign, true);
    view.setUint16(32, blockAlign, true);
    view.setUint16(34, bitDepth, true);
    writeString(36, 'data');
    view.setUint32(40, dataLength, true);
    
    // Write audio data
    let offset = 44;
    for (let i = 0; i < data.length; i++) {
      view.setInt16(offset, data[i], true);
      offset += 2;
    }
    
    return new Blob([arrayBuffer], { type: 'audio/wav' });
  };

  const staleCount = lines.filter(line => line.audioState.isStale).length;

  const currentLine = playbackState.currentLineIndex >= 0 
    ? lines.sort((a, b) => a.order - b.order)[playbackState.currentLineIndex]
    : null;
  const currentSpeaker = currentLine ? getSpeakerById(currentLine.speakerId) : null;

  return (
    <div className="script-panel card">
      {/* Playback Controls - Pinned at top */}
      <div className="playback-controls-section">
        <div className="playback-header">
          <h2>Playback</h2>
          <div className="playback-stats">
            <span>{lines.length} lines</span>
            <span>•</span>
            <span>{speakers.length} speakers</span>
          </div>
        </div>

        {/* Timeline */}
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

        {/* Controls */}
        <div className="playback-controls">
          <button
            className="btn-control"
            onClick={handlePlay}
            disabled={playbackState.isPlaying || lines.length === 0}
          >
            <PlayIcon size={20} />
          </button>
          <button
            className="btn-control"
            onClick={handlePause}
            disabled={!playbackState.isPlaying}
          >
            <PauseIcon size={20} />
          </button>
          <button
            className="btn-control"
            onClick={handleStop}
            disabled={!playbackState.isPlaying && playbackState.currentLineIndex === -1}
          >
            <StopIcon size={20} />
          </button>
          
          <div className="control-divider" />
          
          <button
            className="btn-generate-all"
            onClick={handleGenerateAllAudio}
            disabled={isGeneratingAll || lines.length === 0 || staleCount === 0}
          >
            {isGeneratingAll ? (
              <>
                <SpinnerIcon size={16} />
                <span>Generating {generationProgress.current}/{generationProgress.total}</span>
              </>
            ) : staleCount === 0 ? (
              <span>All Audio Ready ✓</span>
            ) : (
              <span>Generate All Audio ({staleCount} stale)</span>
            )}
          </button>
          
          <button
            className="btn-import-transcript"
            onClick={handleImportTranscript}
          >
            <FileIcon size={16} />
            <span>Import Transcript</span>
          </button>
          
          <button
            className="btn-export-transcript"
            onClick={handleExportTranscript}
            disabled={lines.length === 0}
          >
            <FileIcon size={16} />
            <span>Export Transcript</span>
          </button>
          
          <button
            className="btn-export-audio"
            onClick={handleExportAudio}
            disabled={lines.length === 0 || staleCount > 0}
            title={staleCount > 0 ? 'Generate all audio first' : 'Export combined audio file'}
          >
            <FileIcon size={16} />
            <span>Export Audio</span>
          </button>
          
          {isGenerating && !isGeneratingAll && (
            <div className="generating-indicator">
              <SpinnerIcon size={16} />
              <span>Generating...</span>
            </div>
          )}
        </div>

        {/* Current Line Display */}
        {currentLine && currentSpeaker && (
          <div className="now-playing">
            <div className="now-playing-label">Now Playing:</div>
            <div className="now-playing-content">
              <div 
                className="speaker-indicator"
                style={{ backgroundColor: currentSpeaker.color }}
              />
              <span className="speaker-name">{currentSpeaker.name}</span>
              <span className="line-text">{currentLine.text}</span>
            </div>
          </div>
        )}
      </div>

      {/* Script - Scrollable */}
      <div className="script-section">
        <div className="script-header">
          <h3>Script</h3>
        </div>
        
        {lines.length === 0 ? (
          <div className="empty-state">
            <p>No script yet. Generate or import a script to get started!</p>
          </div>
        ) : (
          <div className="script-text">
            {lines
              .sort((a, b) => a.order - b.order)
              .map((line, index) => {
                const speaker = getSpeakerById(line.speakerId);
                const isEditing = line.id === editingLineId;
                const isCurrent = index === playbackState.currentLineIndex;
                
                return (
                  <div
                    key={line.id}
                    className={`script-line ${isCurrent ? 'playing' : ''} ${line.audioState.isStale ? 'stale' : ''}`}
                  >
                    <div className="script-line-content">
                      <div 
                        className="speaker-label"
                        style={{ color: speaker?.color }}
                      >
                        {speaker?.name}:
                      </div>
                      
                      {isEditing ? (
                        <textarea
                          className="dialogue-edit"
                          value={line.text}
                          onChange={(e) => onLineEdit(line.id, e.target.value)}
                          onBlur={() => setEditingLineId(null)}
                          onKeyDown={(e) => {
                            if (e.key === 'Escape') setEditingLineId(null);
                          }}
                          autoFocus
                        />
                      ) : (
                        <div 
                          className="dialogue-text"
                          onClick={() => setEditingLineId(line.id)}
                          title="Click to edit"
                        >
                          {line.text || <em className="empty-text">Click to add dialogue</em>}
                        </div>
                      )}
                    </div>
                    
                    <div className="script-line-actions">
                      {line.audioState.isStale && (
                        <span className="stale-badge" title="Audio needs regeneration">
                          <WarningIcon size={12} />
                        </span>
                      )}
                      <button
                        className="btn-icon-subtle"
                        onClick={() => {
                          if (index > 0) onLineReorder(line.id, index - 1);
                        }}
                        disabled={index === 0}
                        title="Move up"
                      >
                        <ArrowUpIcon size={14} />
                      </button>
                      <button
                        className="btn-icon-subtle"
                        onClick={() => {
                          if (index < lines.length - 1) onLineReorder(line.id, index + 1);
                        }}
                        disabled={index === lines.length - 1}
                        title="Move down"
                      >
                        <ArrowDownIcon size={14} />
                      </button>
                      <button
                        className="btn-icon-subtle delete"
                        onClick={() => onLineDelete(line.id)}
                        title="Delete line"
                      >
                        <DeleteIcon size={14} />
                      </button>
                    </div>
                  </div>
                );
              })}
          </div>
        )}
        
        {/* Add Line Section */}
        {speakers.length > 0 && (
          <div className="add-line-section">
            <div className="add-line-label">Add line for:</div>
            <div className="add-line-buttons">
              {speakers.map(speaker => (
                <button
                  key={speaker.id}
                  className="btn-add-line"
                  onClick={() => onLineAdd(speaker.id, '')}
                  title={`Add line for ${speaker.name}`}
                >
                  <div 
                    className="speaker-color-dot"
                    style={{ backgroundColor: speaker.color }}
                  />
                  <span>{speaker.name}</span>
                </button>
              ))}
            </div>
          </div>
        )}
      </div>

      <audio ref={audioRef} style={{ display: 'none' }} />
    </div>
  );
}

export default ScriptPanel;
