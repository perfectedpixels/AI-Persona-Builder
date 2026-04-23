import React, { useState } from 'react';
import { FadeIn, StaggerChildren } from 'rad-ui-package';
import Container from '@cloudscape-design/components/container';
import Header from '@cloudscape-design/components/header';
import Button from '@cloudscape-design/components/button';
import SpaceBetween from '@cloudscape-design/components/space-between';
import Box from '@cloudscape-design/components/box';
import Textarea from '@cloudscape-design/components/textarea';
import FormField from '@cloudscape-design/components/form-field';
import Select from '@cloudscape-design/components/select';
import Input from '@cloudscape-design/components/input';
import ExpandableSection from '@cloudscape-design/components/expandable-section';
import StatusIndicator from '@cloudscape-design/components/status-indicator';
import './PhaseA.css';
import MUSEPILOT_SAMPLE from '../data/musepilot-sample';
import PHASE_A_HELP from '../data/phase-a-help';

const INPUT_TYPE_OPTIONS = [
  { value: 'text', label: 'Paste text' },
  { value: 'file', label: 'Upload .txt' },
  { value: 'url', label: 'Google Doc URL' },
];

const PhaseA = ({ onSubmit, isProcessing }) => {
  const [fileError, setFileError] = useState(null);
  const [documents, setDocuments] = useState({
    productProposal: { type: 'text', content: '', file: null, url: '' },
    userPersona: { type: 'text', content: '', file: null, url: '' },
    agentFramework: { type: 'text', content: '', file: null, url: '' }
  });

  const handleInputTypeChange = (docType, inputType) => {
    setFileError(null);
    setDocuments(prev => ({
      ...prev,
      [docType]: { ...prev[docType], type: inputType, content: '', file: null, url: '' }
    }));
  };

  const handleTextChange = (docType, text) => {
    setDocuments(prev => ({
      ...prev,
      [docType]: { ...prev[docType], content: text }
    }));
  };

  const handleFileUpload = (docType, file) => {
    setDocuments(prev => ({
      ...prev,
      [docType]: { ...prev[docType], file }
    }));
  };

  const handleDragOver = (e) => {
    e.preventDefault();
    e.stopPropagation();
  };

  const handleDrop = (docType, e) => {
    e.preventDefault();
    e.stopPropagation();
    const file = e.dataTransfer.files[0];
    if (file) handleFileUpload(docType, file);
  };

  const handleUrlChange = (docType, url) => {
    setDocuments(prev => ({
      ...prev,
      [docType]: { ...prev[docType], url }
    }));
  };

  const handleSubmit = async () => {
    setFileError(null);
    const processedDocs = {};

    for (const [docType, doc] of Object.entries(documents)) {
      if (doc.type === 'file' && doc.file) {
        const ext = doc.file.name.split('.').pop().toLowerCase();
        if (['doc', 'docx', 'pdf'].includes(ext)) {
          setFileError(`"${doc.file.name}" is ${ext.toUpperCase()}. Paste text or use a .txt file.`);
          return;
        }
        try {
          const text = await readFileAsText(doc.file);
          processedDocs[docType] = { type: doc.type, content: text, url: '' };
        } catch (error) {
          setFileError(`Failed to read file: ${doc.file.name}`);
          return;
        }
      } else {
        processedDocs[docType] = { type: doc.type, content: doc.content, url: doc.url };
      }
    }
    onSubmit(processedDocs);
  };

  const readFileAsText = (file) => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = (e) => resolve(e.target.result);
      reader.onerror = (e) => reject(e);
      reader.readAsText(file);
    });
  };

  const isReadyToSubmit = () => {
    return Object.values(documents).every(doc => {
      if (doc.type === 'text') return doc.content.trim().length > 0;
      if (doc.type === 'file') return doc.file !== null;
      if (doc.type === 'url') return doc.url.trim().length > 0;
      return false;
    });
  };

  const loadDemo = () => {
    setDocuments({
      productProposal: { type: 'text', content: MUSEPILOT_SAMPLE.productProposal, file: null, url: '' },
      userPersona: { type: 'text', content: MUSEPILOT_SAMPLE.userPersona, file: null, url: '' },
      agentFramework: { type: 'text', content: MUSEPILOT_SAMPLE.agentFramework, file: null, url: '' }
    });
  };

  const renderDocumentInput = (docType, title, description) => {
    const doc = documents[docType];
    return (
      <FormField
        label={<span style={{ color: 'var(--rad-accent-orange)', fontWeight: 600 }}>{title}</span>}
        description={description}
        secondaryControl={
          <Select
            selectedOption={INPUT_TYPE_OPTIONS.find(o => o.value === doc.type)}
            onChange={({ detail }) => handleInputTypeChange(docType, detail.selectedOption.value)}
            options={INPUT_TYPE_OPTIONS}
          />
        }
      >
        {doc.type === 'text' && (
          <Textarea
            placeholder={`Paste your ${title.toLowerCase()} here...`}
            value={doc.content}
            onChange={({ detail }) => handleTextChange(docType, detail.value)}
            rows={4}
          />
        )}
        {doc.type === 'file' && (
          <div
            className="file-upload-zone"
            onDragOver={handleDragOver}
            onDrop={(e) => handleDrop(docType, e)}
          >
            <input
              type="file"
              id={`file-${docType}`}
              accept=".txt"
              onChange={(e) => handleFileUpload(docType, e.target.files[0])}
              style={{ display: 'none' }}
            />
            <label htmlFor={`file-${docType}`} className="file-upload-label">
              {doc.file
                ? <StatusIndicator type="success">{doc.file.name}</StatusIndicator>
                : <span>📁 Click to upload or drag file here</span>
              }
            </label>
          </div>
        )}
        {doc.type === 'url' && (
          <Input
            placeholder="https://docs.google.com/document/d/..."
            value={doc.url}
            onChange={({ detail }) => handleUrlChange(docType, detail.value)}
          />
        )}
      </FormField>
    );
  };

  return (
    <div className="phase-a">
      <FadeIn>
        <Container
          header={
            <Header
              variant="h2"
              description="Add three inputs: product proposal, user persona, and agent framework."
            >
              📄 Documents
            </Header>
          }
        >
          <SpaceBetween size="l">
            <ExpandableSection headerText="What should I put in each field?" variant="footer">
              <SpaceBetween size="m">
                {PHASE_A_HELP.sections.map(section => (
                  <div key={section.id}>
                    <Box fontWeight="bold" color="text-status-info">{section.title}</Box>
                    <Box fontSize="body-s" color="text-body-secondary">{section.description}</Box>
                    {section.tips.map((tip, i) => (
                      <div key={i} style={{ marginTop: 6 }}>
                        <Box fontWeight="bold" fontSize="body-s">{tip.heading}</Box>
                        <Box fontSize="body-s" color="text-body-secondary">{tip.text}</Box>
                      </div>
                    ))}
                  </div>
                ))}
                <div>
                  <Box fontWeight="bold" color="text-status-info">General tips</Box>
                  <ul style={{ margin: 0, paddingLeft: 20, fontSize: 13, color: 'var(--rad-text-secondary)' }}>
                    {PHASE_A_HELP.generalTips.map((tip, i) => <li key={i}>{tip}</li>)}
                  </ul>
                </div>
              </SpaceBetween>
            </ExpandableSection>

            <Button
              variant="normal"
              onClick={loadDemo}
              disabled={isProcessing}
              fullWidth
            >
              🎨 Try Demo — Museum Tour Guide
            </Button>

            <StaggerChildren>
              {renderDocumentInput('productProposal', '1. Product Proposal', 'Define your product using the 4Qs format: What, Who, Why, How')}
              {renderDocumentInput('userPersona', '2. User Persona', 'Describe your end user — their needs, goals, and motivations')}
              {renderDocumentInput('agentFramework', '3. Agent Framework', 'Define your LLM agent — personality, tone, capabilities, tools')}
            </StaggerChildren>

            {fileError && (
              <StatusIndicator type="error">{fileError}</StatusIndicator>
            )}

            <Button
              variant="primary"
              onClick={handleSubmit}
              disabled={!isReadyToSubmit() || isProcessing}
              loading={isProcessing}
              fullWidth
            >
              {isProcessing ? 'Processing...' : 'Generate Scenarios'}
            </Button>
          </SpaceBetween>
        </Container>
      </FadeIn>
    </div>
  );
};

export default PhaseA;
