import React, { useState } from 'react';
import './ScriptGenerationModal.css';
import { CloseIcon } from './Icons';

function ScriptGenerationModal({ isOpen, onClose, onGenerate, isGenerating }) {
  const [scenario, setScenario] = useState('');
  const [numSpeakers, setNumSpeakers] = useState(2);
  const [length, setLength] = useState('medium');

  const handleGenerate = () => {
    if (scenario.trim()) {
      onGenerate(scenario.trim(), { numSpeakers, length });
    }
  };

  const handleKeyPress = (e) => {
    if (e.key === 'Enter' && e.ctrlKey && scenario.trim()) {
      handleGenerate();
    }
  };

  if (!isOpen) return null;

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h2>✨ Generate Conversation Script</h2>
          <button className="btn-icon" onClick={onClose} title="Close">
            <CloseIcon size={20} />
          </button>
        </div>

        <div className="modal-body">
          <div className="form-group">
            <label htmlFor="scenario">Describe your scenario:</label>
            <textarea
              id="scenario"
              className="scenario-input"
              placeholder="A podcast interview about AI and creativity, where the host asks about the future of creative work..."
              value={scenario}
              onChange={(e) => setScenario(e.target.value)}
              onKeyDown={handleKeyPress}
              rows={5}
              disabled={isGenerating}
            />
            <p className="help-text">
              Tip: Be specific about the topic, tone, and context for best results. Press Ctrl+Enter to generate.
            </p>
          </div>

          <div className="form-group">
            <label>Number of speakers:</label>
            <div className="speaker-count-buttons">
              {[2, 3, 4, 5].map(count => (
                <button
                  key={count}
                  className={`btn-option ${numSpeakers === count ? 'active' : ''}`}
                  onClick={() => setNumSpeakers(count)}
                  disabled={isGenerating}
                >
                  {count}
                </button>
              ))}
            </div>
          </div>

          <div className="form-group">
            <label>Conversation length:</label>
            <div className="length-buttons">
              {[
                { value: 'short', label: 'Short', desc: '5-8 lines' },
                { value: 'medium', label: 'Medium', desc: '10-15 lines' },
                { value: 'long', label: 'Long', desc: '20-30 lines' }
              ].map(option => (
                <button
                  key={option.value}
                  className={`btn-option ${length === option.value ? 'active' : ''}`}
                  onClick={() => setLength(option.value)}
                  disabled={isGenerating}
                >
                  <div className="option-label">{option.label}</div>
                  <div className="option-desc">{option.desc}</div>
                </button>
              ))}
            </div>
          </div>
        </div>

        <div className="modal-footer">
          <button 
            className="btn-ghost" 
            onClick={onClose}
            disabled={isGenerating}
          >
            Cancel
          </button>
          <button 
            className="btn-primary" 
            onClick={handleGenerate}
            disabled={!scenario.trim() || isGenerating}
          >
            {isGenerating ? 'Generating...' : 'Generate Script'}
          </button>
        </div>
      </div>
    </div>
  );
}

export default ScriptGenerationModal;
