import React, { useState, useRef, useCallback } from 'react';
import PhaseA from './PhaseA';
import PhaseB from './PhaseB';
import PhaseC from './PhaseC';
import ProcessingStatus from './ProcessingStatus';
import API_URL from '../config';
import './AgentBehaviorMaker.css';

// Fetch with timeout — prevents hanging requests
const fetchWithTimeout = (url, options, timeoutMs = 90000) => {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);
  return fetch(url, { ...options, signal: controller.signal })
    .finally(() => clearTimeout(timer));
};

const MAX_CONVERSATIONS = 20;

const AgentBehaviorMaker = () => {
  const [documents, setDocuments] = useState({
    productProposal: null,
    userPersona: null,
    agentFramework: null
  });

  const [processedData, setProcessedData] = useState(null); // Store extracted reasoning
  const [scenarios, setScenarios] = useState([]);
  const [agentControls, setAgentControls] = useState({
    tone: 'professional',
    formality: 50,
    verbosity: 50,
    empathy: 70,
    proactivity: 50,
    creativity: 50,
    technicalDepth: 50
  });

  const [conversations, setConversations] = useState([]);
  const [isProcessing, setIsProcessing] = useState(false);
  const [processingStatus, setProcessingStatus] = useState(null);
  const [isConversationLoading, setIsConversationLoading] = useState(false);
  const controlsDebounceRef = useRef(null);

  const handleDocumentsSubmit = async (docs) => {
    setIsProcessing(true);
    setDocuments(docs);
    setProcessingStatus({ currentStep: 'reading', message: 'Reading your documents...' });
    
    try {
      // Step 1: Reading (already done in PhaseA)
      await new Promise(resolve => setTimeout(resolve, 500));
      
      setProcessingStatus({ currentStep: 'extracting', message: 'Extracting key information...' });

      // Step 1: Extract (single Bedrock call, ~15-25s) — under 29s API Gateway limit
      const extractRes = await fetchWithTimeout(`${API_URL}/api/abm/process-documents`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(docs)
      });
      let extractData;
      try {
        const text = await extractRes.text();
        extractData = text ? JSON.parse(text) : {};
      } catch (parseErr) {
        throw new Error(
          extractRes.status === 502 || extractRes.status === 504
            ? 'Extraction timed out. Try shorter documents or request API Gateway timeout increase in Service Quotas.'
            : `Invalid response from server (${extractRes.status})`
        );
      }
      if (!extractRes.ok) {
        throw new Error(extractData.error || 'Failed to extract from documents');
      }

      const processedDocs = extractData.processedData;
      setProcessedData(processedDocs);
      setProcessingStatus({ currentStep: 'generating', message: 'Generating scenarios...' });

      // Step 2: Generate scenarios (single Bedrock call, ~10-20s) — under 29s limit
      const scenariosRes = await fetchWithTimeout(`${API_URL}/api/abm/generate-scenarios`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ processedData: processedDocs })
      });
      let scenariosData;
      try {
        const text = await scenariosRes.text();
        scenariosData = text ? JSON.parse(text) : {};
      } catch (parseErr) {
        throw new Error(
          scenariosRes.status === 502 || scenariosRes.status === 504
            ? 'Scenario generation timed out. Try again.'
            : `Invalid response from server (${scenariosRes.status})`
        );
      }
      if (!scenariosRes.ok) {
        throw new Error(scenariosData.error || 'Failed to generate scenarios');
      }

      setProcessingStatus({ currentStep: 'complete', message: 'All done!' });
      setScenarios(scenariosData.scenarios || []);
      
      // Apply AI-suggested control defaults based on document analysis
      if (extractData.suggestedControls) {
        const sc = extractData.suggestedControls;
        setAgentControls(prev => ({
          tone: sc.tone || prev.tone,
          formality: typeof sc.formality === 'number' ? sc.formality : prev.formality,
          verbosity: typeof sc.verbosity === 'number' ? sc.verbosity : prev.verbosity,
          empathy: typeof sc.empathy === 'number' ? sc.empathy : prev.empathy,
          proactivity: typeof sc.proactivity === 'number' ? sc.proactivity : prev.proactivity,
          creativity: typeof sc.creativity === 'number' ? sc.creativity : prev.creativity,
          technicalDepth: typeof sc.technicalDepth === 'number' ? sc.technicalDepth : prev.technicalDepth,
        }));
      }
      
      // Drop raw document content from state — downstream calls only need processedData.
      // Keep a lightweight reference so PhaseB/PhaseC know docs were submitted.
      setDocuments({
        productProposal: { type: docs.productProposal.type, submitted: true },
        userPersona: { type: docs.userPersona.type, submitted: true },
        agentFramework: { type: docs.agentFramework.type, submitted: true }
      });
      
      // Clear status after a moment
      setTimeout(() => setProcessingStatus(null), 2000);
    } catch (error) {
      console.error('Error processing documents:', error);
      let message = error.message;
      if (error.name === 'AbortError') {
        message = 'Request timed out. Try shorter documents or request API Gateway timeout increase in AWS Service Quotas.';
      } else if (message === 'Load failed' || (error.message || '').includes('Load failed')) {
        message = 'Network request failed. Often caused by API Gateway 29s timeout—request quota increase in Service Quotas (API Gateway → Maximum integration timeout), or try shorter documents.';
      } else if (!message) {
        message = 'An unexpected error occurred. Please try again.';
      }
      setProcessingStatus({ 
        currentStep: 'error', 
        error: message,
        details: { error: error.toString() }
      });
      // Don't clear error status automatically
    } finally {
      setIsProcessing(false);
    }
  };

  const handleUserInterrupt = async (userInput) => {
    if (!userInput.trim()) return;
    setIsProcessing(true);
    setIsConversationLoading(true);
    try {
      const response = await fetchWithTimeout(`${API_URL}/api/abm/user-interrupt`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          input: userInput,
          currentConversation: conversations[conversations.length - 1],
          processedData,
          agentControls
        })
      });
      const data = await response.json();
      if (data.conversation) {
        setConversations(prev => [...prev, data.conversation].slice(-MAX_CONVERSATIONS));
      }
    } catch (error) {
      console.error('Error processing user input:', error);
    } finally {
      setIsProcessing(false);
      setIsConversationLoading(false);
    }
  };

  const handleScenarioSelect = async (scenario) => {
    if (isProcessing) return;
    setIsProcessing(true);
    setIsConversationLoading(true);
    
    try {
      const response = await fetchWithTimeout(`${API_URL}/api/abm/generate-conversation`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          scenario,
          processedData,
          agentControls
        })
      });
      
      if (!response.ok) {
        const errData = await response.json().catch(() => ({}));
        throw new Error(errData.error || `Server returned ${response.status}`);
      }
      
      const data = await response.json();
      
      if (data.conversation) {
        setConversations(prev => [...prev, data.conversation].slice(-MAX_CONVERSATIONS));
      } else {
        console.warn('No conversation in response:', data);
      }
    } catch (error) {
      console.error('Error generating conversation:', error);
    } finally {
      setIsProcessing(false);
      setIsConversationLoading(false);
    }
  };

  const handleControlsChange = (newControls) => {
    setAgentControls(newControls);
    
    // Debounce the API call so slider drags don't spam the server
    if (controlsDebounceRef.current) {
      clearTimeout(controlsDebounceRef.current);
    }
    
    if (conversations.length > 0) {
      controlsDebounceRef.current = setTimeout(async () => {
        setIsProcessing(true);
        setIsConversationLoading(true);
        try {
          const response = await fetchWithTimeout(`${API_URL}/api/abm/refresh-conversations`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              processedData,
              agentControls: newControls,
              existingConversations: conversations
            })
          });
          
          const data = await response.json();
          setConversations(data.conversations);
        } catch (error) {
          console.error('Error refreshing conversations:', error);
        } finally {
          setIsProcessing(false);
          setIsConversationLoading(false);
        }
      }, 500);
    }
  };

  const handleExportFramework = async () => {
    try {
      const response = await fetchWithTimeout(`${API_URL}/api/abm/export-framework`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Accept': 'application/zip' },
        body: JSON.stringify({
          processedData,
          agentControls,
          conversations
        })
      });

      if (!response.ok) {
        const err = await response.json().catch(() => ({ error: `Export failed (${response.status})` }));
        throw new Error(err.error || 'Export failed');
      }

      const contentType = response.headers.get('Content-Type') || '';
      const blob = await response.blob();
      if (!contentType.includes('zip') && blob.size < 100) {
        const text = await blob.text();
        if (text.startsWith('{') || text.startsWith('<')) {
          throw new Error('Server returned an error instead of a zip file. Check console.');
        }
      }

      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = 'agent-persona-export.zip';
      a.click();
      window.URL.revokeObjectURL(url);
    } catch (error) {
      console.error('Error exporting framework:', error);
      setProcessingStatus({ currentStep: 'error', error: error.message });
    }
  };

  return (
    <div className="agent-behavior-maker">
      <div className="abm-header">
        <h1>🤖 Agent Behavior Maker</h1>
        <p>Design and test LLM behaviors for your product</p>
      </div>

      {processingStatus && <ProcessingStatus status={processingStatus} />}

      <div className="abm-container">
        <PhaseA 
          onSubmit={handleDocumentsSubmit}
          isProcessing={isProcessing}
        />
        
        <PhaseB 
          scenarios={scenarios}
          conversations={conversations}
          onScenarioSelect={handleScenarioSelect}
          onUserInterrupt={handleUserInterrupt}
          isProcessing={isProcessing}
          isConversationLoading={isConversationLoading}
          documents={documents}
          processedData={processedData}
          isLoadingScenarios={!!processingStatus && processingStatus.currentStep !== 'error' && processingStatus.currentStep !== 'complete'}
        />
        
        <PhaseC 
          controls={agentControls}
          onChange={handleControlsChange}
          onExport={handleExportFramework}
          isProcessing={isProcessing}
          hasDocuments={!!documents.productProposal}
        />
      </div>
    </div>
  );
};

export default AgentBehaviorMaker;
