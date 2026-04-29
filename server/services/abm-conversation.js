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
 * Uses three tiers (low/mid/high) so slider position produces visibly different output.
 *
 * Tiers: low 0-33, mid 34-66, high 67-100
 */
function buildControlInstructions(agentControls) {
  const c = agentControls || {};
  const num = (v, def) => (v === undefined || v === null ? def : Math.max(0, Math.min(100, Number(v))));
  const tier = (v) => (v <= 33 ? 'low' : v <= 66 ? 'mid' : 'high');

  const tone = c.tone || 'professional';
  const formality = num(c.formality, 50);
  const verbosity = num(c.verbosity, 50);
  const empathy = num(c.empathy, 70);
  const proactivity = num(c.proactivity, 50);
  const creativity = num(c.creativity, 50);
  const technicalDepth = num(c.technicalDepth, 50);

  const fTier = tier(formality);
  const vTier = tier(verbosity);
  const eTier = tier(empathy);
  const pTier = tier(proactivity);
  const crTier = tier(creativity);
  const tTier = tier(technicalDepth);

  // TONE: attitude/voice character — explicit behavioral rules per tone
  // NOTE: Tone controls attitude/energy ONLY. Formality slider handles language register (contractions, word choice).
  const toneRules = {
    professional: 'TONE: Polished, composed, business-appropriate attitude. Neutral warmth. Steady, measured energy.',
    friendly: 'TONE: Warm and welcoming attitude. Express genuine interest and positive regard ("happy to help", "great question").',
    playful: 'TONE: Light, playful attitude. Show humor and levity where appropriate. Upbeat energy. (Register is separately controlled by formality — playful can still be formal in word choice.)',
    reserved: 'TONE: Reserved, serious, measured attitude. Minimal emotional display. Restrained energy. (Register is separately controlled by formality — reserved can still be casual in word choice.)',
    empathetic: 'TONE: Emotionally attuned attitude. Prioritize understanding feelings. Use supportive, compassionate voice throughout.',
    authoritative: 'TONE: Confident expert attitude. Declarative statements. No hedging ("maybe", "I think"). Direct and assured.',
    youthful: 'TONE: Gen Z/Young Millennial voice. Short punchy sentences. Modern phrasing. Relatable without trying too hard.',
  };
  const toneRule = toneRules[tone] || `TONE: Use a ${tone} attitude and voice.`;

  // FORMALITY: language register only — explicit, no overlap with verbosity
  const formalityRule = fTier === 'high'
    ? `FORMALITY (${formality}/100, HIGH): Use formal language. NO contractions (write "it is" not "it\'s", "I am" not "I\'m", "cannot" not "can\'t"). Use "certainly", "assist", "regarding", "additionally". Avoid slang entirely.`
    : fTier === 'mid'
      ? `FORMALITY (${formality}/100, MID): Professional but conversational. Contractions OK ("it\'s", "you\'re"). Balanced register.`
      : `FORMALITY (${formality}/100, LOW): Casual and relaxed. Contractions expected. Informal phrasing ("sure", "no problem", "got it", "yeah") is fine.`;

  // VERBOSITY: response length only — explicit word guidance
  const verbosityRule = vTier === 'high'
    ? `VERBOSITY (${verbosity}/100, HIGH): Each AgentLLM reply MUST be 60-150 words. Include multiple sentences, examples, elaboration, and context. Do NOT give brief answers.`
    : vTier === 'mid'
      ? `VERBOSITY (${verbosity}/100, MID): Each AgentLLM reply should be 30-60 words. Balanced — enough detail without overwhelming.`
      : `VERBOSITY (${verbosity}/100, LOW): Each AgentLLM reply MUST be 10-25 words MAX. One or two short sentences. No elaboration. Be terse.`;

  // EMPATHY: emotional acknowledgment — graduated
  const empathyRule = eTier === 'high'
    ? `EMPATHY (${empathy}/100, HIGH): Lead EVERY reply with empathy. Start by acknowledging feelings/situation before solving. Use phrases like "I understand", "That makes sense", "I hear you", "That sounds frustrating".`
    : eTier === 'mid'
      ? `EMPATHY (${empathy}/100, MID): Briefly acknowledge the user\'s situation in one short phrase, then move to the solution.`
      : `EMPATHY (${empathy}/100, LOW): Be direct. Do NOT acknowledge feelings. Jump straight to the solution. NEVER say "I understand" or validate emotions.`;

  // PROACTIVITY: unsolicited suggestions
  const proactivityRule = pTier === 'high'
    ? `PROACTIVITY (${proactivity}/100, HIGH): After EVERY answer, add a suggested next step or related topic. Proactively offer follow-up help ("Would you also like...", "You might want to consider...").`
    : pTier === 'mid'
      ? `PROACTIVITY (${proactivity}/100, MID): Occasionally suggest a next step when clearly relevant. Not every reply.`
      : `PROACTIVITY (${proactivity}/100, LOW): Answer ONLY what is asked. NO unsolicited suggestions. NEVER say "Would you also like..." or "You might want to...".`;

  // CREATIVITY: novel vs conventional
  const creativityRule = crTier === 'high'
    ? `CREATIVITY (${creativity}/100, HIGH): Offer creative alternatives, novel approaches, or unexpected options. Surprise the user with lateral thinking.`
    : crTier === 'mid'
      ? `CREATIVITY (${creativity}/100, MID): Mix proven methods with occasional alternatives.`
      : `CREATIVITY (${creativity}/100, LOW): Stick to proven, conventional approaches ONLY. No creative alternatives. Standard best practices.`;

  // TECHNICAL DEPTH: jargon vs plain
  const techRule = tTier === 'high'
    ? `TECHNICAL DEPTH (${technicalDepth}/100, HIGH): Use domain-specific terminology freely. Assume user understands. No simplification.`
    : tTier === 'mid'
      ? `TECHNICAL DEPTH (${technicalDepth}/100, MID): Moderate technical depth. Explain concepts when needed.`
      : `TECHNICAL DEPTH (${technicalDepth}/100, LOW): Plain language ONLY. NO jargon. Explain everything simply, like talking to a beginner.`;

  const rules = [toneRule, formalityRule, verbosityRule, empathyRule, proactivityRule, creativityRule, techRule];

  const summary = `tone=${tone} | formality=${formality} | verbosity=${verbosity} | empathy=${empathy} | proactivity=${proactivity} | creativity=${creativity} | technical=${technicalDepth}`;
  return {
    summary,
    rules,
    values: { tone, formality, verbosity, empathy, proactivity, creativity, technicalDepth }
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

  const { summary, rules, values } = buildControlInstructions(agentControls);
  const controlBlock = `Current control settings: ${summary}

MANDATORY BEHAVIOR RULES — Each AgentLLM reply MUST satisfy ALL 7 rules simultaneously. These rules are independent: a violation of any rule makes the reply invalid.
${rules.map((r, i) => `${i + 1}. ${r}`).join('\n')}`;

  const systemPrompt = `You are simulating a conversation between PersonaUser and AgentLLM.

════════════════════════════════════════════════════════════
TOP PRIORITY: AGENT BEHAVIOR CONTROLS
════════════════════════════════════════════════════════════
${controlBlock}

These rules OVERRIDE any conflicting guidance from the documents below. If the documents say the agent should be "brief and professional" but verbosity=90 and tone=casual, FOLLOW THE CONTROLS, not the documents.

════════════════════════════════════════════════════════════
PRODUCT & PERSONA CONTEXT (for topic/domain only)
════════════════════════════════════════════════════════════
${contextInfo}

CRITICAL: The conversation MUST be about the product and scenario. Do NOT use generic topics. Use the exact product domain from the documents.

FORBIDDEN in all lines: Any LMS or course-UI meta text—e.g. "Click Learn", "sidebar", "build your curriculum", arrows (→) pointing to navigation, or instructions about how to use a learning platform. The dialogue is only the in-product conversation, nothing about the surrounding app or course shell.

════════════════════════════════════════════════════════════
OUTPUT VERIFICATION
════════════════════════════════════════════════════════════
Before returning, verify EACH AgentLLM reply against all 7 control rules:
- Tone: Does the voice match "${values.tone}"?
- Formality ${values.formality}: ${values.formality > 66 ? 'NO contractions anywhere' : values.formality <= 33 ? 'Casual phrasing used' : 'Balanced register'}
- Verbosity ${values.verbosity}: ${values.verbosity > 66 ? 'Each reply is 60+ words' : values.verbosity <= 33 ? 'Each reply is ≤25 words' : 'Each reply is 30-60 words'}
- Empathy ${values.empathy}: ${values.empathy > 66 ? 'Every reply leads with emotional acknowledgment' : values.empathy <= 33 ? 'Zero emotional validation anywhere' : 'Brief acknowledgment only'}
- Proactivity ${values.proactivity}: ${values.proactivity > 66 ? 'Every reply ends with a suggestion' : values.proactivity <= 33 ? 'Zero unsolicited suggestions' : 'Occasional suggestions'}
- Creativity ${values.creativity}: ${values.creativity > 66 ? 'Novel/unexpected ideas present' : values.creativity <= 33 ? 'Only conventional approaches' : 'Mix'}
- Technical ${values.technicalDepth}: ${values.technicalDepth > 66 ? 'Domain jargon used' : values.technicalDepth <= 33 ? 'Plain language only, no jargon' : 'Moderate technical depth'}

If any reply fails a rule, rewrite it before returning.`;

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

Every AgentLLM reply must satisfy ALL 7 control rules from the system prompt. Do not output syllabus, curriculum-builder, or "Click Learn in the sidebar" style lines.`;

  try {
    const command = new InvokeModelCommand({
      modelId: process.env.BEDROCK_MODEL_ID || 'us.anthropic.claude-sonnet-4-20250514-v1:0',
      contentType: 'application/json',
      accept: 'application/json',
      body: JSON.stringify({
        anthropic_version: 'bedrock-2023-05-31',
        max_tokens: 2500,
        temperature: 0.7,
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
