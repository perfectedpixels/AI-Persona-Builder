import React, { useState } from 'react';
import './VoiceConfigModal.css';
import { CloseIcon } from './Icons';
import VoiceConfigurator from './VoiceConfigurator';

function VoiceConfigModal({
  speaker,
  selectedLine,
  availableVoices,
  voicesLoading,
  onClose,
  onSpeakerVoiceChange,
  onSpeakerProsodyChange,
  onSpeakerSpeedChange,
  onLineProsodyOverride,
  onLineSpeedOverride,
  onSpeakerEdit,
  onSpeakerDelete,
  onSpeakerContextChange,
  isCreatingNew = false,
  onSaveNew
}) {
  const [editedName, setEditedName] = useState(speaker.name);
  const [editedContext, setEditedContext] = useState(speaker.context || '');
  const [editedSpeaker, setEditedSpeaker] = useState(speaker);

  const handleSave = () => {
    if (editedName.trim()) {
      if (isCreatingNew) {
        onSaveNew({ ...editedSpeaker, name: editedName.trim(), context: editedContext.trim() });
      } else {
        onSpeakerEdit(speaker.id, editedName.trim());
        if (editedContext !== speaker.context) {
          onSpeakerContextChange(speaker.id, editedContext.trim());
        }
        onClose();
      }
    }
  };

  const handleDelete = () => {
    if (window.confirm(`Delete ${speaker.name}?`)) {
      onSpeakerDelete(speaker.id);
      onClose();
    }
  };

  // Wrapper functions for new speaker creation
  const handleVoiceChange = (speakerId, voiceId) => {
    if (isCreatingNew) {
      setEditedSpeaker(prev => ({ ...prev, voiceId }));
    } else {
      onSpeakerVoiceChange(speakerId, voiceId);
    }
  };

  const handleProsodyChange = (speakerId, prosodyChanges) => {
    if (isCreatingNew) {
      setEditedSpeaker(prev => ({
        ...prev,
        defaultProsody: { ...prev.defaultProsody, ...prosodyChanges }
      }));
    } else {
      onSpeakerProsodyChange(speakerId, prosodyChanges);
    }
  };

  const handleSpeedChange = (speakerId, speed) => {
    if (isCreatingNew) {
      setEditedSpeaker(prev => ({ ...prev, defaultSpeed: speed }));
    } else {
      onSpeakerSpeedChange(speakerId, speed);
    }
  };

  const currentSpeaker = isCreatingNew ? editedSpeaker : speaker;

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h2>{isCreatingNew ? 'New Speaker' : 'Speaker Configuration'}</h2>
          <button className="btn-icon" onClick={onClose}>
            <CloseIcon size={20} />
          </button>
        </div>
        
        <div className="modal-body">
          {/* Speaker Name Field */}
          <div className="speaker-name-section">
            <div 
              className="speaker-color-dot" 
              style={{ backgroundColor: currentSpeaker.color }}
            />
            <input
              type="text"
              className="speaker-name-field"
              value={editedName}
              onChange={(e) => setEditedName(e.target.value)}
              placeholder="Enter speaker name..."
              autoFocus={isCreatingNew}
            />
          </div>
          
          {/* Speaker Context/Character Field */}
          <div className="speaker-context-section">
            <label className="context-label">Character / Context</label>
            <textarea
              className="speaker-context-field"
              value={editedContext}
              onChange={(e) => setEditedContext(e.target.value)}
              placeholder="Describe this speaker's character, personality, or role (e.g., 'A skeptical journalist who asks tough questions', 'An enthusiastic tech entrepreneur')..."
              rows={3}
            />
            <div className="context-hint">
              This context helps the AI generate dialogue that matches the speaker's character
            </div>
          </div>
          
          {/* Voice Configuration */}
          <VoiceConfigurator
            selectedLine={null}
            selectedSpeaker={currentSpeaker}
            availableVoices={availableVoices}
            voicesLoading={voicesLoading}
            onSpeakerVoiceChange={handleVoiceChange}
            onSpeakerProsodyChange={handleProsodyChange}
            onSpeakerSpeedChange={handleSpeedChange}
            onLineProsodyOverride={onLineProsodyOverride}
            onLineSpeedOverride={onLineSpeedOverride}
          />
        </div>
        
        <div className="modal-footer">
          {!isCreatingNew && (
            <button className="btn-delete" onClick={handleDelete}>
              Delete Speaker
            </button>
          )}
          <div className="modal-footer-right">
            <button className="btn-ghost" onClick={onClose}>
              Cancel
            </button>
            <button 
              className="btn-primary" 
              onClick={handleSave}
              disabled={!editedName.trim()}
            >
              {isCreatingNew ? 'Add Speaker' : 'Save Changes'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

export default VoiceConfigModal;
