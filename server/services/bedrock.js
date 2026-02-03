const { BedrockRuntimeClient, InvokeModelCommand } = require('@aws-sdk/client-bedrock-runtime');

const client = new BedrockRuntimeClient({
  region: process.env.AWS_REGION || 'us-east-1'
});

/**
 * Invoke AWS Bedrock to generate conversation script
 */
async function generateConversationScript(scenario, options = {}, speakers = []) {
  const { numSpeakers = 2, length = 'medium' } = options;

  // Map length to line counts
  const lengthMap = {
    short: '5-8 lines',
    medium: '10-15 lines',
    long: '20-30 lines'
  };

  // Build speaker context information
  let speakerContextInfo = '';
  if (speakers && speakers.length > 0) {
    speakerContextInfo = '\n\nSpeaker Characters:\n';
    speakers.forEach(speaker => {
      speakerContextInfo += `- ${speaker.name}`;
      if (speaker.context && speaker.context.trim()) {
        speakerContextInfo += `: ${speaker.context}`;
      }
      speakerContextInfo += '\n';
    });
  }

  const systemPrompt = `You are a conversation script writer. Generate natural, engaging dialogue based on user scenarios.

CRITICAL RULES:
- Format each line as: "Speaker Name: dialogue text"
- Use clear, descriptive speaker names (e.g., "Host", "Guest", "Interviewer", "Expert", "Customer", "Agent")
- Make the dialogue natural and conversational with appropriate context and transitions
- DO NOT include any stage directions, actions, or emotional cues in asterisks (e.g., *curiously*, *thoughtfully*, *laughs*)
- DO NOT include any parenthetical descriptions or actions
- ONLY include the spoken dialogue text after the speaker name
- If speaker character descriptions are provided, ensure each speaker's dialogue matches their personality and role through word choice and phrasing, not stage directions`;

  const userMessage = `Generate a conversation script based on this scenario:

Scenario: ${scenario}

Requirements:
- Number of speakers: ${numSpeakers}
- Conversation length: ${lengthMap[length] || lengthMap.medium}
- Format: Each line as "Speaker Name: dialogue text"
- Make it natural and engaging
- NO stage directions or actions in asterisks
- ONLY spoken dialogue${speakerContextInfo}

Generate the conversation script now:`;


  const modelId = process.env.BEDROCK_MODEL_ID || 'us.anthropic.claude-3-haiku-20240307-v1:0';

  const payload = {
    anthropic_version: 'bedrock-2023-05-31',
    max_tokens: 2000,
    system: systemPrompt,
    messages: [
      {
        role: 'user',
        content: userMessage
      }
    ]
  };

  const command = new InvokeModelCommand({
    modelId,
    contentType: 'application/json',
    accept: 'application/json',
    body: JSON.stringify(payload)
  });

  try {
    const response = await client.send(command);
    const responseBody = JSON.parse(new TextDecoder().decode(response.body));
    return responseBody.content[0].text;
  } catch (error) {
    console.error('Bedrock invocation error:', error);
    throw new Error(`Failed to generate script: ${error.message}`);
  }
}

module.exports = { generateConversationScript };
