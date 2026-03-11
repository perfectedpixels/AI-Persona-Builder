const { BedrockRuntimeClient, InvokeModelCommand } = require('@aws-sdk/client-bedrock-runtime');
const { callBedrockWithRetry } = require('./bedrock-retry');

const BEDROCK_TIMEOUT_MS = 60000;

const client = new BedrockRuntimeClient({
  region: process.env.AWS_REGION || 'us-east-1',
  requestHandler: {
    requestTimeout: BEDROCK_TIMEOUT_MS
  }
});

async function generateConversation({ scenarioId, processedData, agentControls, userInput, existingConversation }) {
  console.log('Generating conversation with 5 AI responses...');
  
  // Build context from the compact processedData instead of raw documents
  const contextInfo = processedData ? `
Product: ${processedData.product?.what || 'N/A'} — for ${processedData.product?.who || 'N/A'}
Persona: ${processedData.persona?.name || 'User'} (${processedData.persona?.technicalLevel || 'intermediate'})
Goals: ${(processedData.persona?.goals || []).join(', ')}
Agent purpose: ${processedData.agent?.purpose || 'General assistant'}
Agent tone: ${processedData.agent?.tone || 'professional'}` : '';

  // Generate a realistic conversation with 5 back-and-forth exchanges
  const systemPrompt = `You are simulating a conversation between PersonaUser and AgentLLM.
${contextInfo}

Agent Controls:
- Tone: ${agentControls?.tone || 'professional'}
- Formality: ${agentControls?.formality || 50}%
- Verbosity: ${agentControls?.verbosity || 50}%
- Empathy: ${agentControls?.empathy || 70}%
- Proactivity: ${agentControls?.proactivity || 50}%
- Creativity: ${agentControls?.creativity || 50}%
- Technical Depth: ${agentControls?.technicalDepth || 50}%

Generate a natural conversation with 5 exchanges (PersonaUser speaks, then AgentLLM responds, repeat 5 times).
The conversation should demonstrate the agent's personality based on the controls above.`;

  const userMessage = `Generate a conversation for this scenario: ${scenarioId || 'General interaction'}

Return as JSON:
{
  "scenarioTitle": "Brief title",
  "messages": [
    {"speaker": "PersonaUser", "text": "User message 1"},
    {"speaker": "AgentLLM", "text": "Agent response 1"},
    {"speaker": "PersonaUser", "text": "User message 2"},
    {"speaker": "AgentLLM", "text": "Agent response 2"},
    {"speaker": "PersonaUser", "text": "User message 3"},
    {"speaker": "AgentLLM", "text": "Agent response 3"},
    {"speaker": "PersonaUser", "text": "User message 4"},
    {"speaker": "AgentLLM", "text": "Agent response 4"},
    {"speaker": "PersonaUser", "text": "User message 5"},
    {"speaker": "AgentLLM", "text": "Agent response 5"}
  ]
}

Make the conversation realistic and show the agent's personality.`;

  try {
    const command = new InvokeModelCommand({
      modelId: process.env.BEDROCK_MODEL_ID || 'us.anthropic.claude-sonnet-4-20250514-v1:0',
      contentType: 'application/json',
      accept: 'application/json',
      body: JSON.stringify({
        anthropic_version: 'bedrock-2023-05-31',
        max_tokens: 2000,
        system: systemPrompt,
        messages: [{ role: 'user', content: userMessage }]
      })
    });

    const response = await callBedrockWithRetry(client, command);
    const responseBody = JSON.parse(new TextDecoder().decode(response.body));
    const textContent = responseBody.content[0].text;
    
    // Parse JSON with fallback logic
    let conversation;
    try {
      conversation = JSON.parse(textContent);
    } catch (parseError) {
      // Try to extract JSON from text
      const jsonStart = textContent.indexOf('{');
      const jsonEnd = textContent.lastIndexOf('}');
      if (jsonStart !== -1 && jsonEnd !== -1) {
        const jsonStr = textContent.substring(jsonStart, jsonEnd + 1);
        conversation = JSON.parse(jsonStr);
      } else {
        throw new Error('Could not parse conversation JSON');
      }
    }
    
    return conversation;
  } catch (error) {
    console.error('Error generating conversation:', error);
    // Return a fallback conversation
    return {
      scenarioTitle: scenarioId || 'Sample Conversation',
      messages: [
        { speaker: 'PersonaUser', text: 'Hello, I need help with something.' },
        { speaker: 'AgentLLM', text: 'Of course! I\'d be happy to help. What can I assist you with today?' },
        { speaker: 'PersonaUser', text: 'I\'m trying to understand how this works.' },
        { speaker: 'AgentLLM', text: 'Great question! Let me walk you through it step by step.' },
        { speaker: 'PersonaUser', text: 'That makes sense. What about the next part?' },
        { speaker: 'AgentLLM', text: 'The next part builds on what we just covered. Here\'s how it works...' },
        { speaker: 'PersonaUser', text: 'I see. Can you give me an example?' },
        { speaker: 'AgentLLM', text: 'Absolutely! Here\'s a practical example that should clarify things.' },
        { speaker: 'PersonaUser', text: 'Perfect, that helps a lot. Thank you!' },
        { speaker: 'AgentLLM', text: 'You\'re very welcome! Feel free to reach out if you have any other questions.' }
      ]
    };
  }
}

async function refreshConversations({ processedData, agentControls, existingConversations }) {
  if (!existingConversations || existingConversations.length === 0) {
    return existingConversations || [];
  }

  // Regenerate only the most recent conversation with updated controls
  const latest = existingConversations[existingConversations.length - 1];
  const scenarioId = latest.scenarioTitle || 'General interaction';

  console.log(`Refreshing conversation "${scenarioId}" with new controls...`);

  const refreshed = await generateConversation({
    scenarioId,
    processedData,
    agentControls
  });

  // Replace the last conversation, keep the rest
  return [
    ...existingConversations.slice(0, -1),
    { ...refreshed, scenarioTitle: refreshed.scenarioTitle || latest.scenarioTitle }
  ];
}

module.exports = {
  generateConversation,
  refreshConversations
};
