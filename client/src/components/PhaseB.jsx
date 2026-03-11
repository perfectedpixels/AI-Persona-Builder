import React, { useState, useRef, useEffect } from 'react';
import './PhaseB.css';

const SkeletonScenarios = () => (
  <div className="scenarios-section">
    <h3>Suggested Scenarios</h3>
    <div className="scenarios-grid">
      {[1, 2, 3, 4, 5].map(i => (
        <div key={i} className="scenario-card skeleton-card">
          <div className="skeleton-line narrow" style={{ width: '30px', height: '10px' }}></div>
          <div className="skeleton-line medium" style={{ marginTop: '8px' }}></div>
          <div className="skeleton-line wide" style={{ marginTop: '6px' }}></div>
          <div className="skeleton-line narrow" style={{ marginTop: '4px' }}></div>
        </div>
      ))}
    </div>
  </div>
);

const SkeletonConversation = () => (
  <div className="skeleton-chat">
    <div className="skeleton-bubble agent">
      <div className="skeleton-line wide"></div>
      <div className="skeleton-line medium"></div>
    </div>
    <div className="skeleton-bubble user">
      <div className="skeleton-line medium"></div>
    </div>
    <div className="skeleton-bubble agent">
      <div className="skeleton-line wide"></div>
      <div className="skeleton-line narrow"></div>
    </div>
    <div className="skeleton-bubble user">
      <div className="skeleton-line medium"></div>
    </div>
    <div className="skeleton-bubble agent">
      <div className="skeleton-line wide"></div>
      <div className="skeleton-line medium"></div>
      <div className="skeleton-line narrow"></div>
    </div>
  </div>
);

const PhaseB = ({ scenarios = [], conversations = [], onScenarioSelect, onUserInterrupt, isProcessing, isConversationLoading, documents, processedData, isLoadingScenarios }) => {
  const [selectedScenario, setSelectedScenario] = useState(null);
  const [userInput, setUserInput] = useState('');
  const [isRecording, setIsRecording] = useState(false);
  const conversationRef = useRef(null);

  useEffect(() => {
    if (conversations.length > 0 && conversationRef.current) {
      conversationRef.current.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  }, [conversations]);

  const handleScenarioClick = (scenario) => {
    setSelectedScenario(scenario);
    onScenarioSelect(scenario.id);
  };

  const handleUserInterrupt = async () => {
    if (!userInput.trim()) return;
    if (onUserInterrupt) {
      await onUserInterrupt(userInput);
      setUserInput('');
    }
  };

  const handleVoiceInput = () => {
    setIsRecording(!isRecording);
  };

  const displayConversation = conversations.length > 0
    ? conversations[conversations.length - 1]
    : null;

  const hasSubmitted = documents.productProposal && documents.productProposal.submitted;

  return (
    <div className="phase-b">
      <div className="phase-header">
        <h2>Phase B: Conversation Playground</h2>
        <p>Explore scenarios and test agent interactions</p>
      </div>

      {!hasSubmitted && !isLoadingScenarios ? (
        <div className="empty-state">
          <div className="empty-icon">📋</div>
          <p>Submit your documents in Phase A to generate scenarios</p>
        </div>
      ) : isLoadingScenarios && scenarios.length === 0 ? (
        <>
          <SkeletonScenarios />
          <div className="conversation-section" ref={conversationRef}>
            <h3>💬 Conversation</h3>
            <div className="no-conversation">
              <div className="empty-icon">💭</div>
              <p>Scenarios are being generated...</p>
            </div>
          </div>
        </>
      ) : (
        <>
          <div className="scenarios-section">
            <h3>Suggested Scenarios</h3>
            <div className="scenarios-grid">
              {scenarios.map((scenario, idx) => (
                <div
                  key={idx}
                  className={`scenario-card ${selectedScenario?.id === scenario.id ? 'selected' : ''}`}
                  onClick={() => !isProcessing && handleScenarioClick(scenario)}
                >
                  <div className="scenario-number">{idx + 1}</div>
                  <div className="scenario-title">{scenario.title}</div>
                  <div className="scenario-description">{scenario.description}</div>
                </div>
              ))}
            </div>
          </div>

          <div className="conversation-section" ref={conversationRef}>
            <h3>
              💬 Conversation
              {isConversationLoading && <span className="loading-badge">Generating...</span>}
            </h3>
            {isConversationLoading ? (
              <SkeletonConversation />
            ) : displayConversation ? (
              <div className="imessage-chat">
                <div className="chat-header">
                  <div className="chat-title">{displayConversation.scenarioTitle || 'Conversation'}</div>
                </div>
                <div className="chat-messages">
                  {displayConversation.messages && displayConversation.messages.map((msg, idx) => (
                    <div
                      key={idx}
                      className={`chat-bubble ${msg.speaker === 'PersonaUser' ? 'user' : 'agent'}`}
                    >
                      <div className="bubble-content">{msg.text}</div>
                      <div className="bubble-time">
                        {msg.speaker === 'PersonaUser' ? 'User' : 'Agent'}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ) : (
              <div className="no-conversation">
                <div className="empty-icon">💭</div>
                <p>Select a scenario above to generate a conversation</p>
              </div>
            )}
          </div>

          <div className="user-input-section">
            <h3>Add Your Scenario</h3>
            <div className="input-container">
              <textarea
                className="user-input-textarea"
                placeholder="Describe a scenario you want to see play out between PersonaUser and AgentLLM..."
                value={userInput}
                onChange={(e) => setUserInput(e.target.value)}
                rows={3}
              />
              <div className="input-actions">
                <button
                  className={`voice-btn ${isRecording ? 'recording' : ''}`}
                  onClick={handleVoiceInput}
                  title="Voice input"
                >
                  {isRecording ? '⏹️ Stop' : '🎤 Voice'}
                </button>
                <button
                  className="send-btn"
                  onClick={handleUserInterrupt}
                  disabled={!userInput.trim() || isProcessing}
                >
                  ➤ Send
                </button>
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  );
};

export default PhaseB;
