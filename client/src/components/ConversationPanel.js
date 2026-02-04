import React, { useState } from 'react';
import './ConversationPanel.css';
import { PlusIcon, FileIcon } from './Icons';
import VoiceConfigModal from './VoiceConfigModal';

function ConversationPanel({
  conversationName,
  conversationContext,
  speakers,
  lines,
  onConversationNameChange,
  onConversationContextChange,
  onSpeakerAdd,
  onSpeakerDelete,
  onSpeakerSelect,
  onSpeakerEdit,
  onSpeakerContextChange,
  onGenerateScript,
  onImportScript,
  onExportScript,
  onNewConversation,
  selectedLine,
  selectedSpeaker,
  availableVoices,
  voicesLoading,
  onSpeakerVoiceChange,
  onSpeakerProsodyChange,
  onSpeakerSpeedChange,
  onLineProsodyOverride,
  onLineSpeedOverride,
  isGeneratingScript
}) {
  const [isEditingName, setIsEditingName] = useState(false);
  const [voiceModalOpen, setVoiceModalOpen] = useState(false);
  const [voiceModalSpeaker, setVoiceModalSpeaker] = useState(null);
  const [isCreatingNewSpeaker, setIsCreatingNewSpeaker] = useState(false);
  
  // Script generation options
  const [length, setLength] = useState('medium');
  const [customTurns, setCustomTurns] = useState(10);

  const handleSpeakerClick = (speaker) => {
    onSpeakerSelect(speaker.id);
    setVoiceModalSpeaker(speaker);
    setIsCreatingNewSpeaker(false);
    setVoiceModalOpen(true);
  };

  const handleCloseVoiceModal = () => {
    setVoiceModalOpen(false);
    setVoiceModalSpeaker(null);
    setIsCreatingNewSpeaker(false);
  };

  // Get the latest speaker data from the speakers array
  const currentModalSpeaker = voiceModalSpeaker && !isCreatingNewSpeaker
    ? speakers.find(s => s.id === voiceModalSpeaker.id) || voiceModalSpeaker
    : voiceModalSpeaker;

  const handleAddSpeakerClick = () => {
    // Create a temporary speaker for the modal
    const tempSpeaker = {
      id: 'temp-' + Date.now(),
      name: `Speaker ${speakers.length + 1}`,
      context: '',
      color: '#FF8C42',
      voiceId: availableVoices[speakers.length % availableVoices.length]?.id || null,
      defaultProsody: {
        stability: 0.75,
        similarity_boost: 0.75,
        style: 0.5,
        use_speaker_boost: true
      },
      defaultSpeed: 1.0
    };
    setVoiceModalSpeaker(tempSpeaker);
    setIsCreatingNewSpeaker(true);
    setVoiceModalOpen(true);
  };

  const handleSaveNewSpeaker = (speakerData) => {
    // Pass the full speaker data including voice configuration
    onSpeakerAdd(speakerData);
    handleCloseVoiceModal();
  };

  const handleGenerateScript = () => {
    if (conversationContext.trim()) {
      const options = { 
        length,
        turns: length === 'custom' ? customTurns : undefined
      };
      onGenerateScript(conversationContext.trim(), options);
    }
  };

  return (
    <div className="conversation-panel card">
      {/* Conversation Details */}
      <div className="conversation-details">
        <h2>Conversation Details</h2>
        <div className="detail-item">
          <label>Name</label>
          {isEditingName ? (
            <input
              type="text"
              className="conversation-name-input"
              value={conversationName}
              onChange={(e) => onConversationNameChange(e.target.value)}
              onBlur={() => setIsEditingName(false)}
              onKeyDown={(e) => e.key === 'Enter' && setIsEditingName(false)}
              autoFocus
            />
          ) : (
            <div 
              className="conversation-name"
              onClick={() => setIsEditingName(true)}
              title="Click to edit"
            >
              {conversationName}
            </div>
          )}
        </div>
        
        {/* Script Generation Options */}
        <div className="detail-item">
          <label>Scenario</label>
          <textarea
            className="scenario-input"
            placeholder="Describe your conversation scenario..."
            value={conversationContext}
            onChange={(e) => onConversationContextChange(e.target.value)}
            rows={3}
            disabled={isGeneratingScript}
          />
        </div>
        
        <div className="detail-row">
          <div className="detail-item detail-item-inline">
            <label>Speakers</label>
            <div className="speaker-count">{speakers.length}</div>
          </div>
          
          <div className="detail-item detail-item-inline">
            <label>Length</label>
            <div className="length-controls">
              <div className="length-buttons">
                {[
                  { value: 'short', label: 'Short' },
                  { value: 'medium', label: 'Medium' },
                  { value: 'long', label: 'Long' },
                  { value: 'custom', label: 'Custom' }
                ].map(option => (
                  <button
                    key={option.value}
                    className={`btn-option ${length === option.value ? 'active' : ''}`}
                    onClick={() => setLength(option.value)}
                    disabled={isGeneratingScript}
                  >
                    {option.label}
                  </button>
                ))}
              </div>
              <div className="turns-display">
                {length === 'short' && <span className="turns-info">5-8 turns</span>}
                {length === 'medium' && <span className="turns-info">10-15 turns</span>}
                {length === 'long' && <span className="turns-info">20-30 turns</span>}
                {length === 'custom' && (
                  <div className="custom-turns-input">
                    <input
                      type="number"
                      min="2"
                      max="50"
                      value={customTurns}
                      onChange={(e) => setCustomTurns(parseInt(e.target.value) || 10)}
                      disabled={isGeneratingScript}
                      placeholder="Turns"
                    />
                    <span className="turns-label">turns</span>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Speakers Section */}
      <div className="speakers-section">
        <h3>Speakers</h3>
        <div className="speakers-list">
          {speakers.map(speaker => (
            <div 
              key={speaker.id} 
              className="speaker-item"
              onClick={() => handleSpeakerClick(speaker)}
            >
              <div 
                className="speaker-color" 
                style={{ backgroundColor: speaker.color }}
              />
              <span className="speaker-name" title="Click to configure">
                {speaker.name}
              </span>
            </div>
          ))}
        </div>
        
        <button className="btn-secondary btn-full" onClick={handleAddSpeakerClick}>
          <PlusIcon size={16} />
          Add Speaker
        </button>
      </div>

      {/* Action Buttons */}
      <div className="action-buttons">
        <button 
          className="btn-primary btn-full" 
          onClick={handleGenerateScript}
          disabled={!conversationContext.trim() || isGeneratingScript}
        >
          <PlusIcon size={16} />
          {isGeneratingScript ? 'Generating...' : 'Generate Script'}
        </button>
        
        <button className="btn-ghost btn-full" onClick={onImportScript}>
          <FileIcon size={16} />
          Load Conversation
        </button>
        
        <button 
          className="btn-ghost btn-full" 
          onClick={onExportScript}
          disabled={!lines || lines.length === 0}
        >
          <FileIcon size={16} />
          Save Conversation
        </button>
      </div>

      {/* Voice Configuration Modal */}
      {voiceModalOpen && currentModalSpeaker && (
        <VoiceConfigModal
          key={currentModalSpeaker.id}
          speaker={currentModalSpeaker}
          selectedLine={selectedLine}
          availableVoices={availableVoices}
          voicesLoading={voicesLoading}
          onClose={handleCloseVoiceModal}
          onSpeakerVoiceChange={onSpeakerVoiceChange}
          onSpeakerProsodyChange={onSpeakerProsodyChange}
          onSpeakerSpeedChange={onSpeakerSpeedChange}
          onLineProsodyOverride={onLineProsodyOverride}
          onLineSpeedOverride={onLineSpeedOverride}
          onSpeakerEdit={onSpeakerEdit}
          onSpeakerDelete={onSpeakerDelete}
          onSpeakerContextChange={onSpeakerContextChange}
          isCreatingNew={isCreatingNewSpeaker}
          onSaveNew={handleSaveNewSpeaker}
        />
      )}
    </div>
  );
}

export default ConversationPanel;
