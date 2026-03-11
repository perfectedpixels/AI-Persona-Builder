const { BedrockRuntimeClient, InvokeModelCommand } = require('@aws-sdk/client-bedrock-runtime');
const { callBedrockWithRetry } = require('./bedrock-retry');
const fs = require('fs');
const path = require('path');

// Bedrock timeout: 60 seconds
const BEDROCK_TIMEOUT_MS = 60000;

const client = new BedrockRuntimeClient({
  region: process.env.AWS_REGION || 'us-east-1',
  requestHandler: {
    requestTimeout: BEDROCK_TIMEOUT_MS
  }
});

// Load lecture transcripts for context
const loadLectureKnowledge = () => {
  const knowledgeBasePath = path.join(__dirname, '../knowledge-base');
  
  try {
    const personasLecture = fs.readFileSync(path.join(knowledgeBasePath, 'personas-lecture.txt'), 'utf8');
    const productPitchLecture = fs.readFileSync(path.join(knowledgeBasePath, 'product-pitch-lecture.txt'), 'utf8');
    const aiFrameworksLecture = fs.readFileSync(path.join(knowledgeBasePath, 'ai-frameworks-lecture.txt'), 'utf8');
    const uxStudioAILecture = fs.readFileSync(path.join(knowledgeBasePath, 'ux-studio-ai-lecture.txt'), 'utf8');
    
    return {
      personasLecture,
      productPitchLecture,
      aiFrameworksLecture,
      uxStudioAILecture
    };
  } catch (error) {
    console.error('Error loading lecture knowledge:', error);
    return null;
  }
};

async function processDocuments({ productProposal, userPersona, agentFramework }) {
  console.log('Processing documents...');
  
  // Guard against null/undefined documents
  if (!productProposal || !userPersona || !agentFramework) {
    const missing = [
      !productProposal && 'Product Proposal',
      !userPersona && 'User Persona',
      !agentFramework && 'Agent Framework'
    ].filter(Boolean);
    throw new Error(`Missing required document(s): ${missing.join(', ')}`);
  }
  
  console.log('Product Proposal type:', productProposal.type);
  console.log('User Persona type:', userPersona.type);
  console.log('Agent Framework type:', agentFramework.type);
  
  // Temporarily disable lecture loading to reduce prompt size
  const lectures = null; // loadLectureKnowledge();
  
  // Extract content based on input type
  const getContent = (doc) => {
    if (!doc) return 'Not provided';
    if (doc.type === 'text' || doc.type === 'file') {
      const content = (doc.content || '').trim();
      return content.length > 0 ? content : 'Not provided';
    } else if (doc.type === 'url') {
      return `URL provided: ${doc.url} (URL fetching not yet implemented)`;
    }
    return 'Not provided';
  };
  
  // Cap each document to ~50k chars to avoid blowing up the Bedrock prompt
  // (Claude's context window is large, but the prompt + response + overhead adds up)
  const MAX_DOC_LENGTH = 50000;
  const truncate = (text) => {
    if (text.length <= MAX_DOC_LENGTH) return text;
    console.warn(`Truncating document from ${text.length} to ${MAX_DOC_LENGTH} chars`);
    return text.substring(0, MAX_DOC_LENGTH) + '\n\n[... content truncated for processing ...]';
  };

  const productContent = truncate(getContent(productProposal));
  const personaContent = truncate(getContent(userPersona));
  const agentContent = truncate(getContent(agentFramework));
  
  console.log('Product content length:', productContent.length);
  console.log('Persona content length:', personaContent.length);
  console.log('Agent content length:', agentContent.length);
  
  const systemPrompt = `You are an expert UX researcher and AI product designer. You have deep knowledge of:
- User persona development and user journey mapping
- Product proposal frameworks (4Qs: What, Who, Why, How)
- AI agent framework design and LLM behavior customization

Your task is to analyze the three documents provided and extract structured information that will be used to generate realistic conversation scenarios.

${lectures ? `
Reference Knowledge (from lectures):
- Personas: Understanding user needs, motivations, pain points, and goals
- Product Pitch: Defining product purpose, target users, value proposition, and approach
- AI Frameworks: Agent personality, capabilities, tools, tone, human-in-the-loop patterns
` : ''}`;

  const userMessage = `Analyze these three documents and extract key information:

1. PRODUCT PROPOSAL:
${productContent}

2. USER PERSONA (PersonaUser):
${personaContent}

3. AGENT FRAMEWORK (AgentLLM):
${agentContent}

Extract and return a JSON object with:
{
  "product": {
    "what": "What is the product",
    "who": "Who is it for",
    "why": "Why does it exist",
    "how": "How does it work"
  },
  "persona": {
    "name": "Persona name",
    "demographics": "Age, role, context",
    "goals": ["Primary goals"],
    "painPoints": ["Key pain points"],
    "motivations": ["What drives them"],
    "technicalLevel": "beginner|intermediate|advanced"
  },
  "agent": {
    "purpose": "Agent's primary purpose",
    "personality": "Personality traits",
    "capabilities": ["What it can do"],
    "tools": ["Tools it has access to"],
    "tone": "Communication tone",
    "constraints": ["Limitations or boundaries"]
  },
  "suggestedControls": {
    "tone": "best-fit tone from: professional|friendly|casual|formal|empathetic|authoritative",
    "formality": "0-100 number based on the agent framework's implied formality",
    "verbosity": "0-100 number based on how detailed the agent should be",
    "empathy": "0-100 number based on persona pain points and agent personality",
    "proactivity": "0-100 number based on how proactive the agent should be",
    "creativity": "0-100 number based on the agent's creative latitude",
    "technicalDepth": "0-100 number matching persona's technical level and product domain"
  }
}

For suggestedControls, infer the best defaults from the documents:
- If the persona is non-technical, lower technicalDepth and raise empathy
- If the agent framework specifies a casual/friendly tone, set tone accordingly and lower formality
- If the product is support-oriented, raise empathy and proactivity
- If the agent is creative (writing, design), raise creativity
- Match the values to what the documents imply or explicitly state`;

  try {
    console.log('Calling Bedrock to process documents...');
    
    const command = new InvokeModelCommand({
      modelId: process.env.BEDROCK_MODEL_ID || 'us.anthropic.claude-sonnet-4-20250514-v1:0',
      contentType: 'application/json',
      accept: 'application/json',
      body: JSON.stringify({
        anthropic_version: 'bedrock-2023-05-31',
        max_tokens: 4000,
        system: systemPrompt,
        messages: [{ role: 'user', content: userMessage }]
      })
    });

    const response = await callBedrockWithRetry(client, command);
    const responseBody = JSON.parse(new TextDecoder().decode(response.body));
    console.log('Bedrock response received');
    
    const textContent = responseBody.content[0].text;
    console.log('Extracted text length:', textContent.length);
    console.log('First 500 chars:', textContent.substring(0, 500));
    
    // Try to parse JSON, handle if it's wrapped in markdown code blocks or has preamble
    let extractedData;
    try {
      extractedData = JSON.parse(textContent);
    } catch (parseError) {
      console.log('Direct JSON parse failed, trying alternatives...');
      
      // Try to extract JSON from markdown code blocks
      const jsonMatch = textContent.match(/```json\n([\s\S]*?)\n```/) || textContent.match(/```\n([\s\S]*?)\n```/);
      if (jsonMatch) {
        console.log('Found JSON in code block');
        extractedData = JSON.parse(jsonMatch[1]);
      } else {
        // Try to find JSON object in the text (starts with { and ends with })
        const jsonStart = textContent.indexOf('{');
        const jsonEnd = textContent.lastIndexOf('}');
        if (jsonStart !== -1 && jsonEnd !== -1 && jsonEnd > jsonStart) {
          const jsonStr = textContent.substring(jsonStart, jsonEnd + 1);
          console.log('Extracted JSON string length:', jsonStr.length);
          console.log('JSON string:', jsonStr.substring(0, 200));
          extractedData = JSON.parse(jsonStr);
        } else {
          throw new Error('Could not find valid JSON in response');
        }
      }
    }
    
    console.log('Successfully parsed document data');
    return extractedData;
  } catch (error) {
    console.error('Error processing documents:', error);
    console.error('Error details:', error.message);
    console.error('Error stack:', error.stack);
    
    // Return more detailed error
    throw new Error(`Document processing failed: ${error.message}. Check Lambda logs for details.`);
  }
}

async function generateScenarios(processedDocs) {
  const systemPrompt = `You are a UX scenario designer. Generate realistic, specific scenarios where the PersonaUser would interact with the AgentLLM.

Focus on:
- PersonaUser's goals and pain points
- Situations that highlight the agent's capabilities
- Real-world contexts that match the product's purpose
- Scenarios that test different aspects of the agent's behavior`;

  const userMessage = `Based on this information, generate 3-5 specific scenarios:

PRODUCT: ${JSON.stringify(processedDocs.product, null, 2)}
PERSONA: ${JSON.stringify(processedDocs.persona, null, 2)}
AGENT: ${JSON.stringify(processedDocs.agent, null, 2)}

Generate scenarios as a JSON array:
[
  {
    "id": "scenario-1",
    "title": "Short scenario title",
    "description": "Brief description of the situation",
    "personaGoal": "What PersonaUser wants to achieve",
    "agentRole": "How AgentLLM should help"
  }
]

Focus on PersonaUser's needs and create scenarios that would be valuable for testing the agent's behavior.`;

  try {
    console.log('Calling Bedrock to generate scenarios...');
    
    const command = new InvokeModelCommand({
      modelId: process.env.BEDROCK_MODEL_ID || 'us.anthropic.claude-sonnet-4-20250514-v1:0',
      contentType: 'application/json',
      accept: 'application/json',
      body: JSON.stringify({
        anthropic_version: 'bedrock-2023-05-31',
        max_tokens: 3000,
        system: systemPrompt,
        messages: [{ role: 'user', content: userMessage }]
      })
    });

    const response = await callBedrockWithRetry(client, command);
    const responseBody = JSON.parse(new TextDecoder().decode(response.body));
    const textContent = responseBody.content[0].text;
    
    console.log('Scenario generation response length:', textContent.length);
    console.log('First 300 chars:', textContent.substring(0, 300));
    
    // Parse JSON with same logic as processDocuments
    let scenarios;
    try {
      scenarios = JSON.parse(textContent);
    } catch (parseError) {
      console.log('Direct JSON parse failed, trying alternatives...');
      
      // Try to extract JSON array from text
      const arrayStart = textContent.indexOf('[');
      const arrayEnd = textContent.lastIndexOf(']');
      if (arrayStart !== -1 && arrayEnd !== -1 && arrayEnd > arrayStart) {
        const jsonStr = textContent.substring(arrayStart, arrayEnd + 1);
        console.log('Extracted JSON array length:', jsonStr.length);
        scenarios = JSON.parse(jsonStr);
      } else {
        throw new Error('Could not find valid JSON array in response');
      }
    }
    
    console.log('Successfully generated', scenarios.length, 'scenarios');
    return scenarios;
  } catch (error) {
    console.error('Error generating scenarios:', error);
    throw error;
  }
}

module.exports = {
  processDocuments,
  generateScenarios
};
