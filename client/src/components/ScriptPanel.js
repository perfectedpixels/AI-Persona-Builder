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

  const handleExportAudio = async () => {
    // Check if all audio is generated
    const staleLines = lines.filter(line => line.audioState.isStale || !line.audioState.audioUrl);
    if (staleLines.length > 0) {
      alert('Please generate all audio first using "Generate All Audio" button');
      return;
    }

    try {
      // Fetch all audio blobs
      const sortedLines = lines.sort((a, b) => a.order - b.order);
      const audioBlobs = [];
      
      for (const line of sortedLines) {
        const response = await fetch(line.audioState.audioUrl);
        const blob = await response.blob();
        audioBlobs.push(blob);
      }

      // Concatenate all audio blobs
      const combinedBlob = new Blob(audioBlobs, { type: 'audio/mpeg' });
      
      // Try to use File System Access API (Chrome/Edge only)
      if ('showSaveFilePicker' in window) {
        try {
          const handle = await window.showSaveFilePicker({
            suggestedName: `${conversationName.replace(/[^a-z0-9]/gi, '_').toLowerCase()}_audio.mp3`,
            types: [{
              description: 'Audio Files',
              accept: { 'audio/mpeg': ['.mp3'] }
            }]
          });
          
          const writable = await handle.createWritable();
          await writable.write(combinedBlob);
          await writable.close();
          return;
        } catch (error) {
          if (error.name !== 'AbortError') {
            console.error('Save file error:', error);
          }
        }
      }
      
      // Fallback: Create blob and download
      const url = URL.createObjectURL(combinedBlob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `${conversationName.replace(/[^a-z0-9]/gi, '_').toLowerCase()}_audio.mp3`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
    } catch (error) {
      console.error('Error exporting audio:', error);
      alert('Failed to export audio. Please try again.');
    }
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
