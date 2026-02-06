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
  let minTurns, maxTurns;
  
  if (length === 'custom' && turns) {
    lengthDescription = `exactly ${turns} turns`;
    minTurns = turns;
    maxTurns = turns;
  } else {
    const lengthMap = {
      short: { min: 5, max: 8, desc: '5-8 turns' },
      medium: { min: 10, max: 15, desc: '10-15 turns' },
      long: { min: 20, max: 30, desc: '20-30 turns' }
    };
    const config = lengthMap[length] || lengthMap.medium;
    lengthDescription = config.desc;
    minTurns = config.min;
    maxTurns = config.max;
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

CRITICAL FORMATTING RULES:
- Each line of dialogue MUST be on its own line
- Format: "Speaker Name: dialogue text"
- Put a line break after each speaker's dialogue
- Use clear, descriptive speaker names (e.g., "Host", "Guest", "Interviewer", "Expert", "Customer", "Agent")
- Make the dialogue natural and conversational with appropriate context and transitions
- A "turn" means one line of dialogue from one speaker

EXAMPLE FORMAT:
Host: Welcome to the show!
Guest: Thanks for having me.
Host: Let's dive right in.

ABSOLUTELY FORBIDDEN - DO NOT INCLUDE:
- Stage directions in asterisks: *chuckles*, *nods*, *thoughtfully*, *laughs*, *smiles*, etc.
- Parenthetical actions: (laughs), (pauses), (sighs), etc.
- Emotional cues or descriptions of how something is said
- Any non-spoken text whatsoever
- Multiple speakers in one line

ONLY OUTPUT:
- The speaker's name followed by a colon
- The exact words they would speak out loud
- Each line on a separate line
- Nothing else

If you want to convey emotion or tone, do it through word choice, sentence structure, and the actual dialogue itself, NOT through stage directions.`;

  const userMessage = `Generate a conversation script based on this scenario:

Scenario: ${scenario}

Requirements:
- Number of speakers: ${numSpeakers}
- Conversation length: ${lengthDescription} (IMPORTANT: Generate at least ${minTurns} turns and no more than ${maxTurns} turns)
- Format: Each line as "Speaker Name: dialogue text" ON A SEPARATE LINE
- Make it natural and engaging
- ABSOLUTELY NO stage directions, actions, or emotional cues in asterisks or parentheses
- ONLY the exact words that would be spoken out loud
- PUT EACH SPEAKER'S LINE ON ITS OWN LINE${speakerContextInfo}

Generate the conversation script now. Remember: 
- Generate between ${minTurns} and ${maxTurns} turns total
- Each speaker's dialogue on a NEW LINE
- NO *actions*, NO (descriptions), ONLY spoken words
- Format example:
Speaker1: Hello there.
Speaker2: Hi, how are you?
Speaker1: I'm doing well, thanks.`;


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
