import React from 'react';
import { FadeIn } from 'rad-ui-package';
import Container from '@cloudscape-design/components/container';
import Header from '@cloudscape-design/components/header';
import Button from '@cloudscape-design/components/button';
import SpaceBetween from '@cloudscape-design/components/space-between';
import Box from '@cloudscape-design/components/box';
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
      <FadeIn>
        <Container
          header={
            <Header variant="h2" description="Customize agent behavior">
              🎛️ Controls
            </Header>
          }
        >
          {!hasDocuments ? (
            <Box textAlign="center" padding={{ vertical: 'xl' }}>
              <SpaceBetween size="s" alignItems="center">
                <Box fontSize="heading-xl">🎛️</Box>
                <Box color="text-body-secondary">Submit documents to unlock agent controls</Box>
              </SpaceBetween>
            </Box>
          ) : (
            <SpaceBetween size="m">
              <div className="control-group compact">
                <label className="control-label">
                  <span>Tone</span>
                  <Box fontSize="body-s" color="text-body-secondary">{controls.tone}</Box>
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

              <DialControl label="Formality" value={controls.formality} onChange={(v) => handleDialChange('formality', v)} lowLabel="Casual" highLabel="Formal" />
              <DialControl label="Verbosity" value={controls.verbosity} onChange={(v) => handleDialChange('verbosity', v)} lowLabel="Brief" highLabel="Detailed" />
              <DialControl label="Empathy" value={controls.empathy} onChange={(v) => handleDialChange('empathy', v)} lowLabel="Direct" highLabel="Warm" />
              <DialControl label="Proactivity" value={controls.proactivity} onChange={(v) => handleDialChange('proactivity', v)} lowLabel="Reactive" highLabel="Proactive" />
              <DialControl label="Creativity" value={controls.creativity} onChange={(v) => handleDialChange('creativity', v)} lowLabel="Conventional" highLabel="Creative" />
              <DialControl label="Technical" value={controls.technicalDepth} onChange={(v) => handleDialChange('technicalDepth', v)} lowLabel="Plain" highLabel="Technical" />

              <Button
                variant="primary"
                onClick={onExport}
                disabled={isProcessing}
                fullWidth
              >
                📥 Export Framework
              </Button>
            </SpaceBetween>
          )}
        </Container>
      </FadeIn>
    </div>
  );
};

export default PhaseC;
