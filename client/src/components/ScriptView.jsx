import React, { useState } from 'react';
import './ScriptView.css';
import { EditIcon, DeleteIcon, ArrowUpIcon, ArrowDownIcon, WarningIcon } from './Icons';

function ScriptView({
  lines,
  speakers,
  selectedLineId,
  onLineEdit,
  onLineDelete,
  onLineReorder,
  onLineSelect
}) {
  const [editingLineId, setEditingLineId] = useState(null);

  const getSpeakerById = (speakerId) => {
    return speakers.find(s => s.id === speakerId);
  };

  if (lines.length === 0) {
    return (
      <div className="script-view">
        <div className="empty-state">
          <p>No script yet. Generate or import a script to get started!</p>
        </div>
      </div>
    );
  }

  return (
    <div className="script-view">
      <div className="script-header">
        <h3>Script ({lines.length} lines)</h3>
      </div>
      
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
    </div>
  );
}

export default ScriptView;
