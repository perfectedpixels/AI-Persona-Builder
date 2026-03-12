import React from 'react';
import DialControl from './DialControl';
import './PhaseC.css';

const PhaseC = ({ controls, onChange, onExport, isProcessing, hasDocuments }) => {
  const handleDialChange = (key, value) => {
    onChange({ ...controls, [key]: value });
  };

  const handleSelectChange = (key, value) => {
    onChange({ ...controls, [key]: value });
  };

  const toneOptions = [
    { value: 'professional', label: 'Professional' },
    { value: 'friendly', label: 'Friendly' },
    { value: 'casual', label: 'Casual' },
    { value: 'formal', label: 'Formal' },
    { value: 'empathetic', label: 'Empathetic' },
    { value: 'authoritative', label: 'Authoritative' },
    { value: 'youthful', label: 'Youthful' }
  ];

  return (
    <div className="phase-c">
      <div className="phase-header">
        <h2>Phase C: Agent Controls</h2>
        <p>Customize agent behavior</p>
      </div>

      {!hasDocuments ? (
        <div className="empty-state">
          <div className="empty-icon">🎛️</div>
          <p>Submit documents to unlock agent controls</p>
        </div>
      ) : (
        <div className="controls-list">
          <div className="control-group compact">
            <label className="control-label">
              <span>Tone</span>
              <span className="control-value">{controls.tone}</span>
            </label>
            <select
              className="control-select"
              value={controls.tone}
              onChange={(e) => handleSelectChange('tone', e.target.value)}
            >
              {toneOptions.map(opt => (
                <option key={opt.value} value={opt.value}>{opt.label}</option>
              ))}
            </select>
          </div>

          <DialControl
            label="Formality"
            value={controls.formality}
            onChange={(v) => handleDialChange('formality', v)}
            lowLabel="Casual"
            highLabel="Formal"
          />
          <DialControl
            label="Verbosity"
            value={controls.verbosity}
            onChange={(v) => handleDialChange('verbosity', v)}
            lowLabel="Brief"
            highLabel="Detailed"
          />
          <DialControl
            label="Empathy"
            value={controls.empathy}
            onChange={(v) => handleDialChange('empathy', v)}
            lowLabel="Direct"
            highLabel="Warm"
          />
          <DialControl
            label="Proactivity"
            value={controls.proactivity}
            onChange={(v) => handleDialChange('proactivity', v)}
            lowLabel="Reactive"
            highLabel="Proactive"
          />
          <DialControl
            label="Creativity"
            value={controls.creativity}
            onChange={(v) => handleDialChange('creativity', v)}
            lowLabel="Conventional"
            highLabel="Creative"
          />
          <DialControl
            label="Technical"
            value={controls.technicalDepth}
            onChange={(v) => handleDialChange('technicalDepth', v)}
            lowLabel="Plain"
            highLabel="Technical"
          />

          <button
            className="export-button compact"
            onClick={onExport}
            disabled={isProcessing}
          >
            📥 Export Framework
          </button>
        </div>
      )}
    </div>
  );
};

export default PhaseC;
