import React, { useState, useEffect } from 'react';
import './ProcessingStatus.css';

const GRID_SIZE = 5;
const SWEEP_DURATION = 4;

const radialDelay = (row, col) => {
  const center = (GRID_SIZE - 1) / 2;
  const distance = Math.sqrt((row - center) ** 2 + (col - center) ** 2);
  const maxDistance = Math.sqrt(center ** 2 + center ** 2);
  return (distance / maxDistance) * (SWEEP_DURATION * 0.35);
};

const PixelDotGrid = () => (
  <div className="pixel-dot-grid" style={{ '--sweep-duration': `${SWEEP_DURATION}s` }}>
    {Array.from({ length: GRID_SIZE }, (_, row) => (
      <div className="pixel-dot-row" key={row}>
        {Array.from({ length: GRID_SIZE }, (_, col) => (
          <span
            key={col}
            className="pixel-dot variant-radial"
            style={{ animationDelay: `${radialDelay(row, col)}s` }}
          />
        ))}
      </div>
    ))}
  </div>
);

const ProcessingStatus = ({ status, compact }) => {
  const stepLabels = [
    'reading documents',
    'extracting key information',
    'analyzing product & persona',
    'generating scenarios',
    'finalizing results'
  ];

  const stepMap = { reading: 0, extracting: 1, analyzing: 2, generating: 3, complete: 4 };
  const currentIdx = status ? (stepMap[status.currentStep] ?? 0) : 0;
  const done = status?.currentStep === 'complete';

  // Cycle through step text
  const [displayIdx, setDisplayIdx] = useState(currentIdx);
  useEffect(() => {
    setDisplayIdx(currentIdx);
  }, [currentIdx]);

  // Error state
  if (status?.error) {
    return (
      <div className={`processing-status ${compact ? 'processing-status--compact' : ''}`}>
        <div className="thinking-error">
          <div className="thinking-step-line">
            <span className="thinking-error-icon">⚠️</span>
            <span className="thinking-step-text thinking-step-text--error">
              {status.error}
            </span>
          </div>
          {status?.details && (
            <div className="status-details">
              <details>
                <summary>Technical details</summary>
                <pre>{JSON.stringify(status.details, null, 2)}</pre>
              </details>
            </div>
          )}
        </div>
      </div>
    );
  }

  if (done) return null;

  return (
    <div className={`processing-status ${compact ? 'processing-status--compact' : ''}`}>
      <div className="thinking-reasoning">
        <div className="thinking-layout">
          <div className="thinking-step-line">
            <PixelDotGrid />
            <span className="thinking-step-text" key={displayIdx}>
              {stepLabels[displayIdx]?.charAt(0).toUpperCase() + stepLabels[displayIdx]?.slice(1)}
            </span>
          </div>
          {!compact && (
            <div className="thinking-progress-dots">
              {stepLabels.map((_, i) => (
                <span
                  key={i}
                  className={`thinking-dot ${i < currentIdx ? 'thinking-dot--done' : ''} ${i === currentIdx ? 'thinking-dot--active' : ''}`}
                />
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default ProcessingStatus;
