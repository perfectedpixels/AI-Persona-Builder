import React, { useState } from 'react';
import './ConversationDetails.css';
import { PlusIcon, CloseIcon } from './Icons';

function ConversationDetails({
  conversationName,
  speakers,
  onConversationNameChange,
  onSpeakerAdd,
  onSpeakerDelete,
  onSpeakerSelect,
  onSpeakerEdit,
  onGenerateScript,
  onImportScript
}) {
  const [newSpeakerName, setNewSpeakerName] = useState('');
  const [isEditingName, setIsEditingName] = useState(false);
  const [editingSpeakerId, setEditingSpeakerId] = useState(null);

  const handleAddSpeaker = () => {
    if (newSpeakerName.trim()) {
      onSpeakerAdd(newSpeakerName.trim());
      setNewSpeakerName('');
    }
  };

  return (
    <div className="conversation-details card">
      <div className="details-section">
        <h3>Conversation Details</h3>
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
          <h2 
            className="conversation-name"
            onClick={() => setIsEditingName(true)}
            title="Click to edit"
          >
            {conversationName}
          </h2>
        )}
      </div>

      <div className="speakers-section">
        <h3>Speakers ({speakers.length})</h3>
        <div className="speakers-list">
          {speakers.map(speaker => (
            <div 
              key={speaker.id} 
              className="speaker-item"
              onClick={() => onSpeakerSelect(speaker.id)}
            >
              <div 
                className="speaker-color" 
                style={{ backgroundColor: speaker.color }}
              />
              {editingSpeakerId === speaker.id ? (
                <input
                  type="text"
                  className="speaker-name-input"
                  value={speaker.name}
                  onChange={(e) => onSpeakerEdit(speaker.id, e.target.value)}
                  onBlur={() => setEditingSpeakerId(null)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') setEditingSpeakerId(null);
                    e.stopPropagation();
                  }}
                  onClick={(e) => e.stopPropagation()}
                  autoFocus
                />
              ) : (
                <span 
                  className="speaker-name"
                  onDoubleClick={(e) => {
                    e.stopPropagation();
                    setEditingSpeakerId(speaker.id);
                  }}
                  title="Double-click to edit"
                >
                  {speaker.name}
                </span>
              )}
              <button
                className="btn-icon"
                onClick={(e) => {
                  e.stopPropagation();
                  onSpeakerDelete(speaker.id);
                }}
                title="Delete speaker"
              >
                <CloseIcon size={14} />
              </button>
            </div>
          ))}
        </div>
        
        <div className="add-speaker">
          <input
            type="text"
            placeholder="Speaker name..."
            value={newSpeakerName}
            onChange={(e) => setNewSpeakerName(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleAddSpeaker()}
          />
          <button className="btn-secondary" onClick={handleAddSpeaker}>
            <PlusIcon size={16} />
            Add Speaker
          </button>
        </div>
      </div>

      <div className="actions-section">
        <h3>Script Actions</h3>
        <button className="btn-primary btn-full" onClick={onGenerateScript}>
          <PlusIcon size={16} />
          Generate Script
        </button>
        <button className="btn-ghost btn-full" onClick={onImportScript}>
          Import Script
        </button>
      </div>
    </div>
  );
}

export default ConversationDetails;
