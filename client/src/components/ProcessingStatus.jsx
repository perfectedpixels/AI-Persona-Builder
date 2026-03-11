import React from 'react';
import './ProcessingStatus.css';

const ProcessingStatus = ({ status }) => {
  const steps = [
    { id: 'reading', label: 'Reading Documents', icon: '📄' },
    { id: 'extracting', label: 'Extracting Key Information', icon: '🔍' },
    { id: 'analyzing', label: 'Analyzing Product & Persona', icon: '🧠' },
    { id: 'generating', label: 'Generating Scenarios', icon: '✨' },
    { id: 'complete', label: 'Complete', icon: '✅' }
  ];

  const getStepStatus = (stepId) => {
    if (!status) return 'pending';
    if (status.currentStep === stepId) return 'active';
    const stepIndex = steps.findIndex(s => s.id === stepId);
    const currentIndex = steps.findIndex(s => s.id === status.currentStep);
    return stepIndex < currentIndex ? 'complete' : 'pending';
  };

  return (
    <div className="processing-status">
      <div className="status-header">
        <h3>Processing Your Documents</h3>
        {status?.message && <p className="status-message">{status.message}</p>}
      </div>

      <div className="status-steps">
        {steps.map((step, index) => {
          const stepStatus = getStepStatus(step.id);
          return (
            <div key={step.id} className={`status-step ${stepStatus}`}>
              <div className="step-icon">{step.icon}</div>
              <div className="step-content">
                <div className="step-label">{step.label}</div>
                {stepStatus === 'active' && (
                  <div className="step-progress">
                    <div className="progress-bar">
                      <div className="progress-fill"></div>
                    </div>
                  </div>
                )}
                {stepStatus === 'complete' && (
                  <div className="step-check">✓</div>
                )}
              </div>
              {index < steps.length - 1 && (
                <div className={`step-connector ${stepStatus === 'complete' ? 'complete' : ''}`}></div>
              )}
            </div>
          );
        })}
      </div>

      {status?.error && (
        <div className="status-error">
          <div className="error-icon">⚠️</div>
          <div className="error-message">
            <strong>Error:</strong> {status.error}
          </div>
        </div>
      )}

      {status?.details && (
        <div className="status-details">
          <details>
            <summary>Technical Details</summary>
            <pre>{JSON.stringify(status.details, null, 2)}</pre>
          </details>
        </div>
      )}
    </div>
  );
};

export default ProcessingStatus;
