import React, { useState } from 'react';
import './PhaseA.css';
import MUSEPILOT_SAMPLE from '../data/musepilot-sample';
import PHASE_A_HELP from '../data/phase-a-help';

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
    if (file) {
      handleFileUpload(docType, file);
    }
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
          console.error(`Error reading file for ${docType}:`, error);
          setFileError(`Failed to read file: ${doc.file.name}`);
          return;
        }
      } else {
        // Send only serializable fields (type, content, url) — never the File object
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
      <div className="document-section">
        <div className="document-section-head">
          <h3>{title}</h3>
          <label className="input-mode-label">
            <span className="input-mode-label-text">Provide as</span>
            <select
              className="input-mode-select"
              value={doc.type}
              onChange={(e) => handleInputTypeChange(docType, e.target.value)}
            >
              <option value="text">Paste text</option>
              <option value="file">Upload .txt</option>
              <option value="url">Google Doc URL</option>
            </select>
          </label>
        </div>
        <p className="doc-description">{description}</p>

        {doc.type !== 'none' && (
          <>
            {doc.type === 'text' && (
              <textarea
                className="doc-textarea"
                placeholder={`Paste your ${title.toLowerCase()} here...`}
                value={doc.content}
                onChange={(e) => handleTextChange(docType, e.target.value)}
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
                  {doc.file ? (
                    <span>✅ {doc.file.name}</span>
                  ) : (
                    <span>📁 Click to upload or drag file here</span>
                  )}
                </label>
              </div>
            )}

            {doc.type === 'url' && (
              <input
                type="text"
                className="doc-url-input"
                placeholder="https://docs.google.com/document/d/..."
                value={doc.url}
                onChange={(e) => handleUrlChange(docType, e.target.value)}
              />
            )}
          </>
        )}
      </div>
    );
  };

  return (
    <div className="phase-a">
      <div className="phase-header">
        <h2>1. Documents</h2>
        <p>
          Add three inputs: product proposal, user persona, and agent framework.
        </p>
        <details className="phase-a-help-details">
          <summary className="phase-a-help-summary">What should I put in each field?</summary>
          <div className="phase-a-help-body">
            {PHASE_A_HELP.sections.map(section => (
              <section key={section.id} className="help-section">
                <h3>{section.title}</h3>
                <p className="help-section-desc">{section.description}</p>
                {section.tips.map((tip, i) => (
                  <div key={i} className="help-tip">
                    <h4>{tip.heading}</h4>
                    <p>{tip.text}</p>
                  </div>
                ))}
              </section>
            ))}
            <div className="help-general">
              <h3>General tips</h3>
              <ul>
                {PHASE_A_HELP.generalTips.map((tip, i) => (
                  <li key={i}>{tip}</li>
                ))}
              </ul>
            </div>
          </div>
        </details>
        <button
          className="demo-button"
          onClick={loadDemo}
          disabled={isProcessing}
        >
          🎨 Try Demo — Museum Tour Guide
        </button>
      </div>

      {renderDocumentInput(
        'productProposal',
        '1. Product Proposal',
        'Define your product using the 4Qs format: What, Who, Why, How'
      )}

      {renderDocumentInput(
        'userPersona',
        '2. User Persona',
        'Describe your end user (PersonaUser) - their needs, goals, and motivations'
      )}

      {renderDocumentInput(
        'agentFramework',
        '3. Agent Framework',
        'Define your LLM agent (AgentLLM) - personality, tone, capabilities, tools'
      )}

      {fileError && (
        <div className="phase-a-inline-error" role="alert">
          {fileError}
          <button type="button" className="phase-a-inline-error-dismiss" onClick={() => setFileError(null)} aria-label="Dismiss">×</button>
        </div>
      )}

      <button
        className="submit-button"
        onClick={handleSubmit}
        disabled={!isReadyToSubmit() || isProcessing}
      >
        {isProcessing ? '⏳ Processing...' : '🚀 Generate Scenarios'}
      </button>
    </div>
  );
};

export default PhaseA;
