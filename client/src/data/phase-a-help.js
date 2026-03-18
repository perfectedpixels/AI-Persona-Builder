/**
 * Best practices for Phase A document inputs
 */
const PHASE_A_HELP = {
  title: 'Phase A: Document Best Practices',
  sections: [
    {
      id: 'product-proposal',
      title: '1. Product Proposal',
      description: 'Define your product using the 4Qs format',
      tips: [
        {
          heading: 'Who (Core customer)',
          text: 'Describe your primary user segment in concrete terms. Include demographics, context, and what makes them distinct. Be specific—e.g., "first-time museum visitors with 1–2 hours" rather than "people who like art."'
        },
        {
          heading: 'What (Customer problem or opportunity)',
          text: 'Articulate the core frustration or unmet need. Describe the current state (what users struggle with) and the gap your product fills. Use the customer\'s own words when possible ("I want X but I don\'t know how to Y").'
        },
        {
          heading: 'Why (Importance to the customer)',
          text: 'Explain the value and outcomes. What changes for the user when this problem is solved? Focus on emotional and practical benefits—confidence, time saved, reduced anxiety, better decisions.'
        },
        {
          heading: 'How (How it works)',
          text: 'Describe the product experience in clear, sequential terms. Cover before/during/after flows. Explain how the agent perceives, reasons, and acts. Be specific about what the user does and what the system does.'
        },
        {
          heading: 'Best practices',
          text: 'Keep it 1–3 pages. Use plain language. Include a product name and one-line pitch at the top. Reference the MusePilot sample for structure.'
        }
      ]
    },
    {
      id: 'user-persona',
      title: '2. User Persona',
      description: 'Describe your end user (PersonaUser)',
      tips: [
        {
          heading: 'Core needs',
          text: 'List 3–5 high-level needs the persona has. These should be outcome-oriented (e.g., "reduce decision fatigue," "feel confident in limited time").'
        },
        {
          heading: 'Jobs to be done',
          text: 'Define the key jobs the AI helps the user accomplish. Use the format: "Job name — Description of what the AI does and why it matters." Focus on delegation, automation, and support.'
        },
        {
          heading: 'Persona profiles',
          text: 'Include 1–3 named personas with: Age, context, tech comfort, frequency of use, primary motivation, constraints, and a representative quote. Add goals and pain points for each.'
        },
        {
          heading: 'Best practices',
          text: 'Base personas on research when possible. Include diverse scenarios (e.g., first-time vs. returning, expert vs. novice). Pain points should map to how the agent can help.'
        }
      ]
    },
    {
      id: 'agent-framework',
      title: '3. Agent Framework',
      description: 'Define your LLM agent (AgentLLM)',
      tips: [
        {
          heading: 'Purpose and value proposition',
          text: 'State what the agent exists to do and for whom. Clarify the primary moment of value (e.g., "the first 15 minutes of a visit").'
        },
        {
          heading: 'Role archetype',
          text: 'Describe how the agent "behaves" in relation to the user—e.g., co-pilot, advisor, assistant. Specify what it does and does not do (e.g., "never takes ownership of aesthetic judgment").'
        },
        {
          heading: 'Initiative level',
          text: 'Define how proactive the agent is. Does it wait for permission? Surface options first? Act autonomously within bounds? Be explicit about when it speaks up vs. stays quiet.'
        },
        {
          heading: 'Capabilities and boundaries',
          text: 'List what the agent can do (generate routes, adapt plans, provide explanations) and what it cannot or should not do. Constraints protect trust and user agency.'
        },
        {
          heading: 'Tools and memory',
          text: 'Describe integrations, data sources, and memory behavior. Specify what is stored, for how long, and whether the user can view, edit, or delete it.'
        },
        {
          heading: 'Best practices',
          text: 'Include explainability (why recommendations are made), risks and open questions, and success metrics. The MusePilot sample shows a full 11-section framework.'
        }
      ]
    }
  ],
  generalTips: [
    'Use .txt files or paste plain text. PDF/DOCX are not supported—paste content instead.',
    'Longer, richer documents produce better scenarios. Aim for 500–2000 words per document.',
    'Ensure the three documents are consistent—persona needs should align with product value and agent capabilities.',
    'Click "Try Demo — Museum Tour Guide" to load a complete example you can edit or use as a template.'
  ]
};

export default PHASE_A_HELP;
