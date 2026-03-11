import React, { useState } from 'react';
import './PhaseA.css';
import MUSEPILOT_SAMPLE from '../data/musepilot-sample';

const PhaseA = ({ onSubmit, isProcessing }) => {
  const [documents, setDocuments] = useState({
    productProposal: { type: 'text', content: '', file: null, url: '' },
    userPersona: { type: 'text', content: '', file: null, url: '' },
    agentFramework: { type: 'text', content: '', file: null, url: '' }
  });

  const handleInputTypeChange = (docType, inputType) => {
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
    // Read file contents if files were uploaded
    const processedDocs = {};
    
    for (const [docType, doc] of Object.entries(documents)) {
      if (doc.type === 'file' && doc.file) {
        // Reject binary formats that can't be read as plain text
        const ext = doc.file.name.split('.').pop().toLowerCase();
        if (['doc', 'docx', 'pdf'].includes(ext)) {
          alert(`"${doc.file.name}" is a ${ext.toUpperCase()} file. Please paste the text content directly or upload a .txt file instead.`);
          return;
        }
        try {
          const text = await readFileAsText(doc.file);
          // Strip the File object — it's not serializable and the server doesn't need it
          processedDocs[docType] = { type: doc.type, content: text, url: '' };
        } catch (error) {
          console.error(`Error reading file for ${docType}:`, error);
          alert(`Failed to read file: ${doc.file.name}`);
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
        <h3>{title}</h3>
        <p className="doc-description">{description}</p>

        <div className="input-type-selector">
          <button
            className={`type-btn ${doc.type === 'text' ? 'active' : ''}`}
            onClick={() => handleInputTypeChange(docType, 'text')}
          >
            📝 Paste Text
          </button>
          <button
            className={`type-btn ${doc.type === 'file' ? 'active' : ''}`}
            onClick={() => handleInputTypeChange(docType, 'file')}
          >
            📄 Upload File
          </button>
          <button
            className={`type-btn ${doc.type === 'url' ? 'active' : ''}`}
            onClick={() => handleInputTypeChange(docType, 'url')}
          >
            🔗 Google Doc URL
          </button>
        </div>

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
        <h2>Phase A: Submit Materials</h2>
        <p>Provide the three documents that define your product and agent</p>
        <button
          className="demo-button"
          onClick={loadDemo}
          disabled={isProcessing}
        >
          🎨 Try Demo — MusePilot
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
