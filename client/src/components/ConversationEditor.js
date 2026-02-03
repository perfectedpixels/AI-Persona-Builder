import React, { useState, useEffect, useCallback } from 'react';
import './ConversationEditor.css';
import { createConversation, createSpeaker, markLineStale } from '../types/models';
import { PlusIcon } from './Icons';
import ConversationPanel from './ConversationPanel';
import ScriptPanel from './ScriptPanel';

function ConversationEditor() {
  // Conversation state
  const [conversation, setConversation] = useState(() => {
    // Try to load from localStorage first
    const saved = localStorage.getItem('conversation-tool-state');
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch (error) {
        console.error('Failed to parse saved conversation:', error);
      }
    }
    
    // Default initial state
    const initial = createConversation();
    // Add two default speakers
    const speaker1 = createSpeaker({ name: 'Speaker 1', color: '#FF8C42' });
    const speaker2 = createSpeaker({ name: 'Speaker 2', color: '#4CC9F0' });
    return {
      ...initial,
      speakers: [speaker1, speaker2]
    };
  });

  // Save conversation to localStorage whenever it changes
  useEffect(() => {
    localStorage.setItem('conversation-tool-state', JSON.stringify(conversation));
  }, [conversation]);

  // Playback state
  const [playbackState, setPlaybackState] = useState({
    isPlaying: false,
    currentLineIndex: -1,
    audioCache: new Map()
  });

  // UI state
  const [uiState, setUiState] = useState({
    selectedLineId: null,
    selectedSpeakerId: null,
    isExporting: false,
    isSaving: false,
    isGeneratingScript: false
  });

  // Available voices from API
  const [availableVoices, setAvailableVoices] = useState([]);
  const [voicesLoading, setVoicesLoading] = useState(true);

  // Load voices on mount
  useEffect(() => {
    loadVoices();
  }, []);

  const loadVoices = async () => {
    try {
      console.log('Loading voices from /api/voices...');
      const response = await fetch('/api/voices');
      
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }
      
      const data = await response.json();
      console.log('Voices loaded:', data.voices?.length || 0, 'voices');
      
      if (!data.voices || !Array.isArray(data.voices)) {
        throw new Error('Invalid voices response format');
      }
      
      setAvailableVoices(data.voices);
      
      // Set default voices for speakers if not set
      if (data.voices.length > 0) {
        setConversation(prev => ({
          ...prev,
          speakers: prev.speakers.map((speaker, index) => ({
            ...speaker,
            voiceId: speaker.voiceId || data.voices[index % data.voices.length].id
          }))
        }));
      }
    } catch (error) {
      console.error('Failed to load voices:', error);
      alert(`Failed to load voices: ${error.message}. Check console for details.`);
    } finally {
      setVoicesLoading(false);
    }
  };

  // ============================================================================
  // Line Management
  // ============================================================================

  const handleLineEdit = useCallback((lineId, text) => {
    setConversation(prev => ({
      ...prev,
      lines: prev.lines.map(line =>
        line.id === lineId ? markLineStale({ ...line, text }) : line
      ),
      metadata: { ...prev.metadata, modified: Date.now() }
    }));
  }, []);

  const handleLineAudioUpdate = useCallback((lineId, audioUrl, duration) => {
    setConversation(prev => ({
      ...prev,
      lines: prev.lines.map(line =>
        line.id === lineId ? {
          ...line,
          audioState: {
            isStale: false,
            audioUrl,
            duration
          }
        } : line
      ),
      metadata: { ...prev.metadata, modified: Date.now() }
    }));
  }, []);

  const handleLineDelete = useCallback((lineId) => {
    setConversation(prev => ({
      ...prev,
      lines: prev.lines.filter(line => line.id !== lineId)
        .map((line, index) => ({ ...line, order: index })),
      metadata: { ...prev.metadata, modified: Date.now() }
    }));
    
    // Clear selection if deleted line was selected
    setUiState(prev => ({
      ...prev,
      selectedLineId: prev.selectedLineId === lineId ? null : prev.selectedLineId
    }));
  }, []);

  const handleLineReorder = useCallback((lineId, newIndex) => {
    setConversation(prev => {
      const lines = [...prev.lines];
      const oldIndex = lines.findIndex(l => l.id === lineId);
      const [movedLine] = lines.splice(oldIndex, 1);
      lines.splice(newIndex, 0, movedLine);
      
      return {
        ...prev,
        lines: lines.map((line, index) => ({ ...line, order: index })),
        metadata: { ...prev.metadata, modified: Date.now() }
      };
    });
  }, []);

  const handleLineSelect = useCallback((lineId) => {
    setUiState(prev => ({ ...prev, selectedLineId: lineId }));
  }, []);

  // ============================================================================
  // Speaker Management
  // ============================================================================

  const handleSpeakerAdd = useCallback((name) => {
    const newSpeaker = createSpeaker({ 
      name,
      voiceId: availableVoices[conversation.speakers.length % availableVoices.length]?.id
    });
    
    setConversation(prev => ({
      ...prev,
      speakers: [...prev.speakers, newSpeaker],
      metadata: { ...prev.metadata, modified: Date.now() }
    }));
    
    setUiState(prev => ({ ...prev, selectedSpeakerId: newSpeaker.id }));
  }, [availableVoices, conversation.speakers.length]);

  const handleSpeakerDelete = useCallback((speakerId) => {
    // Don't allow deleting if speaker has lines
    const hasLines = conversation.lines.some(line => line.speakerId === speakerId);
    if (hasLines) {
      alert('Cannot delete speaker with existing lines. Delete the lines first.');
      return;
    }
    
    setConversation(prev => ({
      ...prev,
      speakers: prev.speakers.filter(s => s.id !== speakerId),
      metadata: { ...prev.metadata, modified: Date.now() }
    }));
    
    setUiState(prev => ({
      ...prev,
      selectedSpeakerId: prev.selectedSpeakerId === speakerId ? null : prev.selectedSpeakerId
    }));
  }, [conversation.lines]);

  const handleSpeakerSelect = useCallback((speakerId) => {
    setUiState(prev => ({ ...prev, selectedSpeakerId: speakerId }));
  }, []);

  const handleSpeakerEdit = useCallback((speakerId, newName) => {
    if (!newName.trim()) return;
    
    setConversation(prev => ({
      ...prev,
      speakers: prev.speakers.map(s =>
        s.id === speakerId ? { ...s, name: newName.trim() } : s
      ),
      metadata: { ...prev.metadata, modified: Date.now() }
    }));
  }, []);

  const handleSpeakerContextChange = useCallback((speakerId, newContext) => {
    setConversation(prev => ({
      ...prev,
      speakers: prev.speakers.map(s =>
        s.id === speakerId ? { ...s, context: newContext } : s
      ),
      metadata: { ...prev.metadata, modified: Date.now() }
    }));
  }, []);

  // ============================================================================
  // Voice Configuration
  // ============================================================================

  const handleSpeakerVoiceChange = useCallback((speakerId, voiceId) => {
    setConversation(prev => ({
      ...prev,
      speakers: prev.speakers.map(s =>
        s.id === speakerId ? { ...s, voiceId } : s
      ),
      // Mark all lines for this speaker as stale
      lines: prev.lines.map(line =>
        line.speakerId === speakerId ? markLineStale(line) : line
      ),
      metadata: { ...prev.metadata, modified: Date.now() }
    }));
  }, []);

  const handleSpeakerProsodyChange = useCallback((speakerId, prosodySettings) => {
    setConversation(prev => ({
      ...prev,
      speakers: prev.speakers.map(s =>
        s.id === speakerId ? { ...s, defaultProsody: { ...s.defaultProsody, ...prosodySettings } } : s
      ),
      // Mark all lines for this speaker as stale
      lines: prev.lines.map(line =>
        line.speakerId === speakerId ? markLineStale(line) : line
      ),
      metadata: { ...prev.metadata, modified: Date.now() }
    }));
  }, []);

  const handleSpeakerSpeedChange = useCallback((speakerId, speed) => {
    setConversation(prev => ({
      ...prev,
      speakers: prev.speakers.map(s =>
        s.id === speakerId ? { ...s, defaultSpeed: speed } : s
      ),
      // Mark all lines for this speaker as stale
      lines: prev.lines.map(line =>
        line.speakerId === speakerId ? markLineStale(line) : line
      ),
      metadata: { ...prev.metadata, modified: Date.now() }
    }));
  }, []);

  const handleLineProsodyOverride = useCallback((lineId, prosodySettings) => {
    setConversation(prev => ({
      ...prev,
      lines: prev.lines.map(line =>
        line.id === lineId ? markLineStale({ ...line, prosodyOverride: prosodySettings }) : line
      ),
      metadata: { ...prev.metadata, modified: Date.now() }
    }));
  }, []);

  const handleLineSpeedOverride = useCallback((lineId, speed) => {
    setConversation(prev => ({
      ...prev,
      lines: prev.lines.map(line =>
        line.id === lineId ? markLineStale({ ...line, speedOverride: speed }) : line
      ),
      metadata: { ...prev.metadata, modified: Date.now() }
    }));
  }, []);

  // ============================================================================
  // Script Generation
  // ============================================================================

  const handleGenerateScript = useCallback(async (scenario, options) => {
    setUiState(prev => ({ ...prev, isGeneratingScript: true }));

    try {
      const response = await fetch('/api/conversation/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          prompt: scenario, 
          options,
          speakers: conversation.speakers.map(s => ({
            name: s.name,
            context: s.context
          }))
        })
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to generate script');
      }

      const { speakers: generatedSpeakers, lines: generatedLines } = await response.json();

      // Assign voices to generated speakers
      const speakersWithVoices = generatedSpeakers.map((speaker, index) => ({
        ...speaker,
        voiceId: availableVoices[index % availableVoices.length]?.id || speaker.voiceId
      }));

      // Update conversation with generated content
      setConversation(prev => ({
        ...prev,
        speakers: speakersWithVoices,
        lines: generatedLines,
        metadata: { ...prev.metadata, modified: Date.now() }
      }));

      setUiState(prev => ({ 
        ...prev, 
        isGeneratingScript: false
      }));
    } catch (error) {
      console.error('Script generation failed:', error);
      alert(`Failed to generate script: ${error.message}`);
      setUiState(prev => ({ ...prev, isGeneratingScript: false }));
    }
  }, [availableVoices, conversation.speakers]);

  const handleImportScript = useCallback(() => {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = '.json';
    
    input.onchange = async (e) => {
      const file = e.target.files[0];
      if (!file) return;
      
      try {
        const text = await file.text();
        const data = JSON.parse(text);
        
        // Validate the loaded data has required structure
        if (!data.speakers || !data.lines) {
          throw new Error('Invalid conversation file format');
        }
        
        setConversation(data);
        alert('Conversation loaded successfully!');
      } catch (error) {
        console.error('Failed to load conversation:', error);
        alert(`Failed to load conversation: ${error.message}`);
      }
    };
    
    input.click();
  }, []);

  const handleNewConversation = useCallback(() => {
    if (window.confirm('Create a new conversation? This will clear all current data.')) {
      const initial = createConversation();
      const speaker1 = createSpeaker({ name: 'Speaker 1', color: '#FF8C42' });
      const speaker2 = createSpeaker({ name: 'Speaker 2', color: '#4CC9F0' });
      
      setConversation({
        ...initial,
        speakers: [speaker1, speaker2]
      });
      
      // Clear localStorage
      localStorage.removeItem('conversation-tool-state');
    }
  }, []);

  // ============================================================================
  // Conversation Management
  // ============================================================================

  const handleConversationNameChange = useCallback((newName) => {
    if (!newName.trim()) return;
    
    setConversation(prev => ({
      ...prev,
      name: newName.trim(),
      metadata: { ...prev.metadata, modified: Date.now() }
    }));
  }, []);

  const handleExportScript = useCallback(async () => {
    // Export full conversation as JSON
    const conversationData = {
      ...conversation,
      exportedAt: Date.now(),
      version: '1.0'
    };
    
    const jsonString = JSON.stringify(conversationData, null, 2);
    
    // Try to use File System Access API (Chrome/Edge only)
    if ('showSaveFilePicker' in window) {
      try {
        const handle = await window.showSaveFilePicker({
          suggestedName: `${conversation.name.replace(/[^a-z0-9]/gi, '_').toLowerCase()}.json`,
          types: [{
            description: 'Conversation Files',
            accept: { 'application/json': ['.json'] }
          }]
        });
        
        const writable = await handle.createWritable();
        await writable.write(jsonString);
        await writable.close();
        return;
      } catch (error) {
        if (error.name !== 'AbortError') {
          console.error('Save file error:', error);
        }
      }
    }
    
    // Fallback: Create blob and download
    const blob = new Blob([jsonString], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `${conversation.name.replace(/[^a-z0-9]/gi, '_').toLowerCase()}.json`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  }, [conversation]);

  // Get selected line and speaker
  const selectedLine = conversation.lines.find(l => l.id === uiState.selectedLineId) || null;
  const selectedSpeaker = conversation.speakers.find(s => s.id === uiState.selectedSpeakerId) || null;

  return (
    <div className="conversation-editor">
      <header className="editor-header">
        <div className="header-left">
          <h1>Conversation Maker</h1>
        </div>
        <div className="header-right">
          <button className="btn-new-conversation" onClick={handleNewConversation}>
            <PlusIcon size={16} />
            <span>New Conversation</span>
          </button>
        </div>
      </header>

      <div className="editor-layout">
        <ConversationPanel
          conversationName={conversation.name}
          speakers={conversation.speakers}
          lines={conversation.lines}
          onConversationNameChange={handleConversationNameChange}
          onSpeakerAdd={handleSpeakerAdd}
          onSpeakerDelete={handleSpeakerDelete}
          onSpeakerSelect={handleSpeakerSelect}
          onSpeakerEdit={handleSpeakerEdit}
          onSpeakerContextChange={handleSpeakerContextChange}
          onGenerateScript={handleGenerateScript}
          onImportScript={handleImportScript}
          onExportScript={handleExportScript}
          onNewConversation={handleNewConversation}
          selectedLine={selectedLine}
          selectedSpeaker={selectedSpeaker}
          availableVoices={availableVoices}
          voicesLoading={voicesLoading}
          onSpeakerVoiceChange={handleSpeakerVoiceChange}
          onSpeakerProsodyChange={handleSpeakerProsodyChange}
          onSpeakerSpeedChange={handleSpeakerSpeedChange}
          onLineProsodyOverride={handleLineProsodyOverride}
          onLineSpeedOverride={handleLineSpeedOverride}
          isGeneratingScript={uiState.isGeneratingScript}
        />

        <ScriptPanel
          lines={conversation.lines}
          speakers={conversation.speakers}
          selectedLineId={uiState.selectedLineId}
          onLineEdit={handleLineEdit}
          onLineDelete={handleLineDelete}
          onLineReorder={handleLineReorder}
          onLineSelect={handleLineSelect}
          onLineAudioUpdate={handleLineAudioUpdate}
          playbackState={playbackState}
          setPlaybackState={setPlaybackState}
          conversationName={conversation.name}
        />
      </div>
    </div>
  );
}

export default ConversationEditor;
