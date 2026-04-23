import React, { useState, useRef, useEffect } from 'react';
import { FadeIn, StaggerChildren, AIThinking, AnimatedPresence } from 'rad-ui-package';
import Container from '@cloudscape-design/components/container';
import Header from '@cloudscape-design/components/header';
import Button from '@cloudscape-design/components/button';
import SpaceBetween from '@cloudscape-design/components/space-between';
import Box from '@cloudscape-design/components/box';
import Badge from '@cloudscape-design/components/badge';
import Textarea from '@cloudscape-design/components/textarea';
import StatusIndicator from '@cloudscape-design/components/status-indicator';
import './PhaseB.css';

const SkeletonScenarios = () => (
  <SpaceBetween size="s">
    <Box fontWeight="bold">Suggested Scenarios</Box>
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
  </SpaceBetween>
);

const PhaseB = ({ scenarios = [], conversations = [], onScenarioSelect, onUserInterrupt, isProcessing, isConversationLoading, documents, processedData, isLoadingScenarios }) => {
  const [selectedScenario, setSelectedScenario] = useState(null);
  const [userInput, setUserInput] = useState('');
  const conversationRef = useRef(null);

  useEffect(() => {
    if (conversations.length > 0 && conversationRef.current) {
      conversationRef.current.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  }, [conversations]);

  const handleScenarioClick = (scenario) => {
    setSelectedScenario(scenario);
    onScenarioSelect(scenario);
  };

  const handleUserInterrupt = async () => {
    if (!userInput.trim()) return;
    if (onUserInterrupt) {
      await onUserInterrupt(userInput);
      setUserInput('');
    }
  };

  const displayConversation = conversations.length > 0
    ? conversations[conversations.length - 1]
    : null;

  const hasSubmitted = documents.productProposal && documents.productProposal.submitted;

  return (
    <div className="phase-b">
      <FadeIn>
        <Container
          header={
            <Header variant="h2" description="Explore scenarios and test agent interactions">
              💬 Playground
            </Header>
          }
        >
          {!hasSubmitted && !isLoadingScenarios ? (
            <Box textAlign="center" padding={{ vertical: 'xl' }}>
              <SpaceBetween size="s" alignItems="center">
                <Box fontSize="heading-xl">📋</Box>
                <Box color="text-body-secondary">Submit your documents to generate scenarios</Box>
              </SpaceBetween>
            </Box>
          ) : isLoadingScenarios && scenarios.length === 0 ? (
            <SpaceBetween size="l">
              <SkeletonScenarios />
              <Box textAlign="center" padding={{ vertical: 'l' }}>
                <AIThinking variant="fade" />
                <Box color="text-body-secondary" margin={{ top: 's' }}>Generating scenarios...</Box>
              </Box>
            </SpaceBetween>
          ) : (
            <SpaceBetween size="l">
              {/* Scenarios */}
              <div>
                <Box fontWeight="bold" margin={{ bottom: 'xs' }}>Suggested Scenarios</Box>
                <StaggerChildren>
                  <div className="scenarios-grid">
                    {scenarios.map((scenario, idx) => (
                      <div
                        key={idx}
                        className={`scenario-card ${selectedScenario?.id === scenario.id ? 'selected' : ''}`}
                        onClick={() => !isProcessing && handleScenarioClick(scenario)}
                      >
                        <div className="scenario-number">{idx + 1}</div>
                        <div className="scenario-title">{scenario.title}</div>
                        <Box fontSize="body-s" color="text-body-secondary">{scenario.description}</Box>
                      </div>
                    ))}
                  </div>
                </StaggerChildren>
              </div>

              {/* Conversation */}
              <div ref={conversationRef}>
                <SpaceBetween size="xs" direction="horizontal" alignItems="center">
                  <Box fontWeight="bold">💬 Conversation</Box>
                  {isConversationLoading && <Badge color="blue">Generating...</Badge>}
                </SpaceBetween>

                {isConversationLoading ? (
                  <Box textAlign="center" padding={{ vertical: 'l' }}>
                    <AIThinking variant="orbit" />
                  </Box>
                ) : displayConversation ? (
                  <AnimatedPresence id={displayConversation.scenarioTitle || 'conv'}>
                    <div className="imessage-chat">
                      <div className="chat-header">
                        <Box fontWeight="bold">{displayConversation.scenarioTitle || 'Conversation'}</Box>
                      </div>
                      <div className="chat-messages">
                        {displayConversation.messages && displayConversation.messages.map((msg, idx) => (
                          <div
                            key={idx}
                            className={`chat-bubble ${msg.speaker === 'PersonaUser' ? 'user' : 'agent'}`}
                          >
                            <div className="bubble-content">{msg.text}</div>
                            <Box fontSize="body-s" color="text-body-secondary">
                              {msg.speaker === 'PersonaUser' ? 'User' : 'Agent'}
                            </Box>
                          </div>
                        ))}
                      </div>
                    </div>
                  </AnimatedPresence>
                ) : (
                  <Box textAlign="center" padding={{ vertical: 'l' }} color="text-body-secondary">
                    <Box fontSize="heading-xl">💭</Box>
                    Select a scenario above to generate a conversation
                  </Box>
                )}
              </div>

              {/* User input */}
              <div>
                <Box fontWeight="bold" margin={{ bottom: 'xs' }}>Add Your Scenario</Box>
                <SpaceBetween size="s">
                  <Textarea
                    placeholder="Describe a scenario you want to see play out between PersonaUser and AgentLLM..."
                    value={userInput}
                    onChange={({ detail }) => setUserInput(detail.value)}
                    rows={3}
                  />
                  <Box float="right">
                    <Button
                      variant="primary"
                      onClick={handleUserInterrupt}
                      disabled={!userInput.trim() || isProcessing}
                    >
                      ➤ Send
                    </Button>
                  </Box>
                </SpaceBetween>
              </div>
            </SpaceBetween>
          )}
        </Container>
      </FadeIn>
    </div>
  );
};

export default PhaseB;
