const { BedrockRuntimeClient, InvokeModelCommand } = require('@aws-sdk/client-bedrock-runtime');
const { callBedrockWithRetry } = require('./bedrock-retry');

const BEDROCK_TIMEOUT_MS = 60000;

const client = new BedrockRuntimeClient({
  region: process.env.AWS_REGION || 'us-east-1',
  requestHandler: {
    requestTimeout: BEDROCK_TIMEOUT_MS
  }
});

function ensureKeyGuidelines(processedData) {
  let guidelines = processedData?.keyGuidelines || [];
  if (!Array.isArray(guidelines)) guidelines = [];
  
  const isGeneric = (g) => {
    const s = String(g).toLowerCase();
    return s.length < 15 || 
      /^(stay|use|be|keep|follow|match|stick|avoid)\s/.test(s) ||
      /generic|on topic|product domain|documents?/.test(s);
  };
  const hasGoodGuidelines = guidelines.length >= 2 && guidelines.some(g => !isGeneric(g));
  
  if (hasGoodGuidelines) return guidelines;
  
  const p = processedData?.product || {};
  const a = processedData?.agent || {};
  const fallback = [];
  if (p.what && p.what !== 'N/A') {
    fallback.push(`Conversation must be about: ${p.what}`);
  }
  if (p.who && p.who !== 'N/A') {
    fallback.push(`Target audience: ${p.who}`);
  }
  (a.capabilities || []).slice(0, 3).forEach(cap => {
    if (cap && cap.length > 5) fallback.push(`Agent can: ${cap}`);
  });
  (a.constraints || []).slice(0, 2).forEach(c => {
    if (c && c.length > 5) fallback.push(`Agent must NOT: ${c}`);
  });
  return fallback.length > 0 ? fallback : guidelines.length > 0 ? guidelines : ['Stay within the product domain from the documents'];
}

/**
 * Build control instructions. Each control affects ONLY its own behavior criterion.
 * No control supersedes or duplicates another.
 *
 * Control → Behavior scope:
 * - tone: Attitude/voice (professional, friendly, etc.) — NOT language register
 * - formality: Language register (casual ↔ formal) — contractions, slang, salutations
 * - verbosity: Response length and detail level
 * - empathy: Whether to acknowledge feelings before solving
 * - proactivity: Whether to suggest next steps unsolicited
 * - creativity: Whether to offer novel/creative alternatives
 * - technicalDepth: Jargon vs plain language
 */
function buildControlInstructions(agentControls) {
  const c = agentControls || {};
  const num = (v, def) => (v === undefined || v === null ? def : Math.max(0, Math.min(100, Number(v))));
  const tone = c.tone || 'professional';
  const formality = num(c.formality, 50);
  const verbosity = num(c.verbosity, 50);
  const empathy = num(c.empathy, 70);
  const proactivity = num(c.proactivity, 50);
  const creativity = num(c.creativity, 50);
  const technicalDepth = num(c.technicalDepth, 50);

  // Descriptions for summary only; rules below are the behavioral directives
  const formalityDesc = formality > 70 ? 'formal and polished' : formality > 40 ? 'conversational but professional' : 'casual and relaxed';
  const verbosityDesc = verbosity > 70 ? 'thorough and detailed' : verbosity > 40 ? 'balanced' : 'concise and to the point';
  const empathyDesc = empathy > 70 ? 'highly empathetic' : empathy > 40 ? 'warm but solution-focused' : 'direct and efficient';
  const proactivityDesc = proactivity > 70 ? 'proactive' : proactivity > 40 ? 'balanced' : 'reactive';
  const creativityDesc = creativity > 70 ? 'creative and exploratory' : creativity > 40 ? 'balanced' : 'conservative';
  const techDesc = technicalDepth > 70 ? 'deep technical' : technicalDepth > 40 ? 'moderate depth' : 'plain language';

  // Tone: attitude/voice only — does NOT include formality (that's a separate control)
  const toneRule = tone === 'youthful'
    ? 'TONE: Sound Gen Z/Young Millennial — relatable, approachable, short punchy sentences. Avoid corporate jargon.'
    : `TONE: Use a ${tone} attitude and voice.`;

  // Each control gets exactly one rule. Threshold 50: above = high behavior, below = low.
  const rules = [
    toneRule,
    formality > 50
      ? 'FORMALITY: Use formal language — polished phrasing, avoid contractions and slang.'
      : 'FORMALITY: Use casual, relaxed language — contractions and conversational phrasing are fine.',
    verbosity > 50
      ? 'VERBOSITY: Provide thorough explanations with examples when helpful.'
      : 'VERBOSITY: Keep responses SHORT. Use bullet points over paragraphs.',
    empathy > 50
      ? 'EMPATHY: Acknowledge the user\'s situation or feelings before jumping to solutions.'
      : 'EMPATHY: Be direct and get to the solution quickly.',
    proactivity > 50
      ? 'PROACTIVITY: After answering, suggest a logical next step or related topic.'
      : 'PROACTIVITY: Answer only what is asked. No unsolicited additions.',
    creativity > 50
      ? 'CREATIVITY: Offer creative alternatives and novel approaches when appropriate.'
      : 'CREATIVITY: Stick to proven, conventional approaches.',
    technicalDepth > 50
      ? 'TECHNICAL DEPTH: Use domain-specific terminology appropriate for the user.'
      : 'TECHNICAL DEPTH: Avoid jargon. Explain everything in plain language.'
  ];

  const toneSummary = tone === 'youthful' ? 'Youthful (Gen Z)' : tone;
  return {
    summary: `Tone: ${toneSummary} | Formality: ${formalityDesc} | Verbosity: ${verbosityDesc} | Empathy: ${empathyDesc} | Proactivity: ${proactivityDesc} | Creativity: ${creativityDesc} | Technical: ${techDesc}`,
    rules
  };
}

async function generateConversation({ scenario, scenarioId, processedData, agentControls, userInput, existingConversation }) {
  console.log('Generating conversation with 5 AI responses...');
  
  const scenarioObj = scenario || (scenarioId ? { id: scenarioId, title: scenarioId, description: scenarioId } : null);
  const keyGuidelines = ensureKeyGuidelines(processedData);
  
  const p = processedData?.product || {};
  const u = processedData?.persona || {};
  const a = processedData?.agent || {};
  const contextInfo = processedData ? `
PRODUCT CONTEXT (conversation MUST be about this product):
- What: ${p.what || 'N/A'}
- Who: ${p.who || 'N/A'}
- Why: ${p.why || 'N/A'}
- How: ${p.how || 'N/A'}

PERSONA (PersonaUser):
- Name: ${u.name || 'User'}
- Demographics: ${u.demographics || 'N/A'}
- Goals: ${(u.goals || []).join('; ')}
- Pain points: ${(u.painPoints || []).join('; ')}
- Technical level: ${u.technicalLevel || 'intermediate'}

AGENT (AgentLLM):
- Purpose: ${a.purpose || 'General assistant'}
- Tone: ${a.tone || 'professional'}
- Capabilities: ${(a.capabilities || []).join('; ')}
- Constraints: ${(a.constraints || []).join('; ')}

KEY GUIDELINES (from documents—MUST be reflected in agent responses):
${keyGuidelines.map((g, i) => `${i + 1}. ${g}`).join('\n')}` : '';

  const scenarioDetail = scenarioObj
    ? `Title: ${scenarioObj.title || 'N/A'}\nDescription: ${scenarioObj.description || 'N/A'}\nPersonaGoal: ${scenarioObj.personaGoal || 'N/A'}\nAgentRole: ${scenarioObj.agentRole || 'N/A'}`
    : (scenarioId || 'General interaction');

  const { summary, rules } = buildControlInstructions(agentControls);
  const controlBlock = `${summary}

Behavioral rules AgentLLM MUST follow:
${rules.map((r, i) => `${i + 1}. ${r}`).join('\n')}`;

  const systemPrompt = `You are simulating a conversation between PersonaUser and AgentLLM.
${contextInfo}

CRITICAL: The conversation MUST be about the product and scenario above. Do NOT use generic topics (laptop delivery, tech support, etc). Use the exact product domain from the documents.

AGENT CONTROLS — These OVERRIDE any conflicting tone from the documents. Apply them strictly to every AgentLLM response:
${controlBlock}

Generate a natural conversation with 5 exchanges (PersonaUser speaks, then AgentLLM responds, repeat 5 times).
Each AgentLLM response MUST visibly demonstrate these controls (tone, formality, verbosity, empathy, proactivity, creativity, technical depth).`;

  const userMessage = `Generate a conversation for this scenario:

${scenarioDetail}

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

Make the conversation realistic. Each AgentLLM reply must match the Agent Controls exactly (e.g. if Verbosity is low, keep replies short; if Empathy is high, acknowledge feelings first).`;

  try {
    const command = new InvokeModelCommand({
      modelId: process.env.BEDROCK_MODEL_ID || 'us.anthropic.claude-sonnet-4-20250514-v1:0',
      contentType: 'application/json',
      accept: 'application/json',
      body: JSON.stringify({
        anthropic_version: 'bedrock-2023-05-31',
        max_tokens: 2000,
        temperature: 0.3,
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
      scenarioTitle: (scenarioObj?.title || scenarioId) || 'Sample Conversation',
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
    scenario: { title: scenarioId, description: scenarioId },
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
