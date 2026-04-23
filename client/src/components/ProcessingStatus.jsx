import React from 'react';
import { ThinkingReasoning, AIThinking } from 'rad-ui-package';
import Box from '@cloudscape-design/components/box';
import StatusIndicator from '@cloudscape-design/components/status-indicator';
import './ProcessingStatus.css';

const ProcessingStatus = ({ status, compact }) => {
  const stepLabels = [
    'reading documents',
    'extracting key information',
    'analyzing product & persona',
    'generating scenarios',
    'finalizing results'
  ];

  const done = status?.currentStep === 'complete';

  // Error state
  if (status?.error) {
    return (
      <div className={`processing-status ${compact ? 'processing-status--compact' : ''}`}>
        <div className="thinking-error">
          <StatusIndicator type="error">{status.error}</StatusIndicator>
          {status?.details && (
            <div className="status-details">
              <details>
                <summary><Box fontSize="body-s" color="text-body-secondary">Technical details</Box></summary>
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
      <ThinkingReasoning
        steps={stepLabels}
        stepDuration={3000}
        centered={false}
      />
    </div>
  );
};

export default ProcessingStatus;
