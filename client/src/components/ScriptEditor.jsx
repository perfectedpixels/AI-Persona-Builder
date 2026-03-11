import React, { useState } from 'react';
import './ScriptEditor.css';
import { PlusIcon, CloseIcon, EditIcon, DeleteIcon, ArrowUpIcon, ArrowDownIcon, WarningIcon, FileIcon } from './Icons';

function ScriptEditor({
  lines,
  speakers,
  selectedLineId,
  onLineAdd,
  onLineEdit,
  onLineDelete,
  onLineReorder,
  onLineSelect,
  onSpeakerAdd,
  onSpeakerDelete,
  onSpeakerSelect,
  onGenerateScript
}) {
  const [newSpeakerName, setNewSpeakerName] = useState('');
  const [editingLineId, setEditingLineId] = useState(null);

  const handleAddSpeaker = () => {
    if (newSpeakerName.trim()) {
      onSpeakerAdd(newSpeakerName.trim());
      setNewSpeakerName('');
    }
  };

  const handleAddLine = (speakerId) => {
    onLineAdd(speakerId, 'New line...');
  };

  const getSpeakerById = (speakerId) => {
    return speakers.find(s => s.id === speakerId);
  };

  return (
    <div className="script-editor card">
      <h2>Script Editor</h2>
      
      {/* Action Buttons */}
      <div className="action-buttons">
        <button className="btn-secondary" onClick={onGenerateScript}>
          <PlusIcon size={16} />
          Generate Script
        </button>
        <button className="btn-ghost" onClick={() => alert('Templates coming soon!')}>
          <FileIcon size={16} />
          Load Template
        </button>
        <button className="btn-ghost" onClick={() => alert('Import coming soon!')}>
          <FileIcon size={16} />
          Import File
        </button>
      </div>
      
      {/* Speakers Section */}
      <div className="speakers-section">
        <h3>Speakers</h3>
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
              <span className="speaker-name">{speaker.name}</span>
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
            onKeyPress={(e) => e.key === 'Enter' && handleAddSpeaker()}
          />
          <button className="btn-primary" onClick={handleAddSpeaker}>
            <PlusIcon size={16} />
            Add Speaker
          </button>
        </div>
      </div>

      {/* Lines Section */}
      <div className="lines-section">
        <h3>Lines ({lines.length})</h3>
        
        {lines.length === 0 ? (
          <div className="empty-state">
            <p>No lines yet. Add a line to get started!</p>
          </div>
        ) : (
          <div className="lines-list">
            {lines
              .sort((a, b) => a.order - b.order)
              .map((line, index) => {
                const speaker = getSpeakerById(line.speakerId);
                const isSelected = line.id === selectedLineId;
                const isEditing = line.id === editingLineId;
                
                return (
                  <div
                    key={line.id}
                    className={`line-item ${isSelected ? 'selected' : ''} ${line.audioState.isStale ? 'stale' : ''}`}
                    onClick={() => onLineSelect(line.id)}
                  >
                    <div className="line-header">
                      <div 
                        className="line-speaker-indicator"
                        style={{ backgroundColor: speaker?.color }}
                      />
                      <span className="line-speaker-name">{speaker?.name}</span>
                      {line.audioState.isStale && (
                        <span className="stale-indicator" title="Audio needs regeneration">
                          <WarningIcon size={14} />
                        </span>
                      )}
                      <span className="line-order">#{index + 1}</span>
                    </div>
                    
                    {isEditing ? (
                      <textarea
                        className="line-text-edit"
                        value={line.text}
                        onChange={(e) => onLineEdit(line.id, e.target.value)}
                        onBlur={() => setEditingLineId(null)}
                        autoFocus
                        rows={3}
                      />
                    ) : (
                      <div 
                        className="line-text"
                        onDoubleClick={() => setEditingLineId(line.id)}
                      >
                        {line.text || <em>Empty line</em>}
                      </div>
                    )}
                    
                    <div className="line-actions">
                      <button
                        className="btn-icon"
                        onClick={(e) => {
                          e.stopPropagation();
                          setEditingLineId(line.id);
                        }}
                        title="Edit"
                      >
                        <EditIcon size={14} />
                      </button>
                      <button
                        className="btn-icon"
                        onClick={(e) => {
                          e.stopPropagation();
                          if (index > 0) onLineReorder(line.id, index - 1);
                        }}
                        disabled={index === 0}
                        title="Move up"
                      >
                        <ArrowUpIcon size={14} />
                      </button>
                      <button
                        className="btn-icon"
                        onClick={(e) => {
                          e.stopPropagation();
                          if (index < lines.length - 1) onLineReorder(line.id, index + 1);
                        }}
                        disabled={index === lines.length - 1}
                        title="Move down"
                      >
                        <ArrowDownIcon size={14} />
                      </button>
                      <button
                        className="btn-icon delete"
                        onClick={(e) => {
                          e.stopPropagation();
                          onLineDelete(line.id);
                        }}
                        title="Delete"
                      >
                        <DeleteIcon size={14} />
                      </button>
                    </div>
                  </div>
                );
              })}
          </div>
        )}
        
        {speakers.length > 0 && (
          <div className="add-line-section">
            <select 
              className="speaker-select"
              onChange={(e) => e.target.value && handleAddLine(e.target.value)}
              value=""
            >
              <option value="">
                <PlusIcon size={14} /> Add line for...
              </option>
              {speakers.map(speaker => (
                <option key={speaker.id} value={speaker.id}>
                  {speaker.name}
                </option>
              ))}
            </select>
          </div>
        )}
      </div>
    </div>
  );
}

export default ScriptEditor;