const { BedrockRuntimeClient, InvokeModelCommand } = require('@aws-sdk/client-bedrock-runtime');

const client = new BedrockRuntimeClient({
  region: process.env.AWS_REGION || 'us-east-1'
});

/**
 * Invoke AWS Bedrock to generate conversation script
 */
async function generateConversationScript(scenario, options = {}, speakers = []) {
  const { numSpeakers = 2, length = 'medium', turns } = options;

  // Map length to line counts or use custom turns
  let lengthDescription;
  if (length === 'custom' && turns) {
    lengthDescription = `exactly ${turns} turns (${turns} lines total)`;
  } else {
    const lengthMap = {
      short: '5-8 lines (5-8 turns)',
      medium: '10-15 lines (10-15 turns)',
      long: '20-30 lines (20-30 turns)'
    };
    lengthDescription = lengthMap[length] || lengthMap.medium;
  }

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
- A "turn" means one line of dialogue from one speaker

ABSOLUTELY FORBIDDEN - DO NOT INCLUDE:
- Stage directions in asterisks: *chuckles*, *nods*, *thoughtfully*, *laughs*, *smiles*, etc.
- Parenthetical actions: (laughs), (pauses), (sighs), etc.
- Emotional cues or descriptions of how something is said
- Any non-spoken text whatsoever

ONLY OUTPUT:
- The speaker's name followed by a colon
- The exact words they would speak out loud
- Nothing else

If you want to convey emotion or tone, do it through word choice, sentence structure, and the actual dialogue itself, NOT through stage directions.`;

  const userMessage = `Generate a conversation script based on this scenario:

Scenario: ${scenario}

Requirements:
- Number of speakers: ${numSpeakers}
- Conversation length: ${lengthDescription}
- Format: Each line as "Speaker Name: dialogue text"
- Make it natural and engaging
- ABSOLUTELY NO stage directions, actions, or emotional cues in asterisks or parentheses
- ONLY the exact words that would be spoken out loud${speakerContextInfo}

Generate the conversation script now. Remember: NO *actions*, NO (descriptions), ONLY spoken words:`;


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
    let scriptText = responseBody.content[0].text;
    
    // Post-process to remove any stage directions that slipped through
    // Remove content in asterisks: *chuckles*, *nods thoughtfully*, etc.
    scriptText = scriptText.replace(/\*[^*]+\*/g, '');
    
    // Remove content in parentheses at the start or middle of lines: (laughs), (pauses), etc.
    scriptText = scriptText.replace(/\([^)]+\)/g, '');
    
    // Clean up any double spaces or trailing spaces
    scriptText = scriptText.replace(/\s+/g, ' ').replace(/\s+$/gm, '');
    
    // Clean up any lines that became empty or just whitespace
    scriptText = scriptText.split('\n')
      .map(line => line.trim())
      .filter(line => line.length > 0)
      .join('\n');
    
    return scriptText;
  } catch (error) {
    console.error('Bedrock invocation error:', error);
    throw new Error(`Failed to generate script: ${error.message}`);
  }
}

module.exports = { generateConversationScript };
