const MUSEPILOT_SAMPLE = {
  productProposal: `Product Pitch – MusePilot
An Agentic AI museum visit companion for the Seattle Art Museum

Who is your core customer?
MusePilot serves first-time or infrequent visitors to the Seattle Art Museum who have limited time and seek a clear, efficient, and meaningful way to navigate the museum.

These visitors typically include tourists, international students, short-term travelers, local non-members, and small family or friend groups. They often arrive without a strong mental model of the museum's layout, collection highlights, or exhibition structure. They may be interested in art but frequently rely on the visit itself to decide what to explore. For this audience, the main challenge is converting limited time into a visit that feels intentional rather than random. They expect guidance that reduces uncertainty, minimizes time spent walking aimlessly, and provides interpretations suitable for their knowledge level. They also benefit from light situational accessibility support, such as being guided along shorter routes, getting rest-point suggestions, or receiving simplified explanations. MusePilot focuses on this broad visitor group, whose needs are distinct yet representative of the majority of museum attendees.

What is the customer problem or opportunity?
Visitors struggle to transform fragmented museum information into an actionable visit plan that aligns with their time constraints, interests, and physical pace.

The museum environment contains numerous galleries, extensive collections, and varying levels of interpretive content. Traditional tools such as maps, printed guides, wall labels, and linear audio tours are static and do not adjust to different visitor preferences or contexts. Visitors often do not know how to prioritize artworks, how long a visit should take, or which sequence of galleries will avoid unnecessary backtracking. This results in a visit experience that feels unstructured, cognitively demanding, and physically inefficient. Many visitors leave without seeing the works most relevant to them, or they spend significant time reading dense text that is difficult to process while moving. From the visitor's perspective, the core frustration is: "I want to see the most meaningful works, but I don't know where to start or what to skip." Since most visitors do not have the opportunity to visit frequently, this inability to form a coherent and satisfying experience represents a missed opportunity both for personal learning and for deeper engagement with the museum.

Why is it important to your customer?
A guided, structured, and adaptive visit significantly improves the visitor's confidence, sense of orientation, and overall value derived from their limited time in the museum.

For these visitors, the most meaningful benefit is experiencing the museum as a coherent, approachable environment rather than a complex space they must figure out on their own. An adaptive plan helps them make effective use of their available time and ensures that the visit includes a balanced selection of significant works. Personalized explanations improve comprehension and reduce cognitive load, allowing visitors to focus on what they see rather than on logistical decisions. Situational accessibility support—such as recommending rest points or adjusting interpretive depth—improves the likelihood of completing the visit comfortably. A concise recap at the end reinforces learning and memory without requiring additional effort. Collectively, these elements create a more intentional and rewarding experience, strengthening the museum's relationship with occasional visitors.

How do you envision it working?
MusePilot operates as a mobile-based autonomous visit agent that plans, guides, and adapts the museum visit through continuous perception, reasoning, and action.

Before entering the museum, the visitor opens MusePilot and provides basic information such as available time, general interests, and desired level of explanation. The agent interprets these inputs and generates one to three visit routes. Each route includes a recommended sequence of galleries, estimated duration, and the rationale behind its selection. The visitor chooses a plan and begins the experience.

During the visit, MusePilot follows a perception-reasoning-action loop: it perceives visitor inputs and situational signals through lightweight location input and interaction, reasons about priorities and constraints (time remaining, pace, fatigue, crowding), and acts by dynamically adjusting routes and content. The agent provides guidance toward the next stop and offers artwork interpretations in layered formats tailored to the visitor's selected depth. When conditions change—for example, the visitor feels tired, a gallery becomes crowded, or time remaining decreases—MusePilot adjusts the plan by reordering stops, shortening the route, or prioritizing essential works. This adaptive behavior distinguishes the agent from traditional static guides.

After the visit, the agent generates a brief summary highlighting the main artworks encountered and key moments from the experience. This recap is designed as an optional enhancement rather than the core value. The primary focus of MusePilot remains real-time guidance and continuous support within the museum.`,

  userPersona: `Core Needs:
1. Clarity, reassurance, and guidance to help infrequent visitors navigate the museum experience.
2. Maximize limited time (avoiding anxiety of missing key works)
3. Reduce cognitive load (minimizing decision fatigue and navigation effort)
4. Find accessible interpretation (understanding art without feeling inadequate)

Business Name: MusePilot

Product Definition:
A context-aware assistant that uses generative AI to help visitors orient themselves, move through exhibits efficiently, and receive lightweight interpretation. Its goal is to provide infrequent, non-expert museum visitors with reassurance, clarity, and a sense of direction in a low-effort, respectful way.

Jobs To Be Done:
1. Autonomous Planning & Decision Delegation — Upon entry, the AI autonomously executes a complex path-finding algorithm to instantly generate a time-bound, prioritized route that maximizes meaning. This shifts the initial planning and decision-making burden away from the visitor, enabling a focused and confident start to the visit.
2. Real-Time Sequential Control & Micro-Decision Elimination — Provide timely "what's next" cues throughout the visit to guide users step by step. This eliminates the need for micro-decisions by the visitor, effectively preventing backtracking and reducing cognitive load in real-time.
3. Proactive Adaptation & Agentic Re-planning — The AI proactively monitors visitor status (e.g., energy, pace) and environment (e.g., time, crowding), allowing the Agentic AI to autonomously trigger and execute mid-visit re-planning in real-time when constraints shift.

Persona 1: Maria
Age: 55, Location: Seattle (Local), Occupation: Retired
Technology Comfort: Comfortable with smartphones, not "tech-savvy"
Frequency: 1-2 times per year, Art Knowledge Level: Low to moderate
Primary Motivation: To see two specific special exhibitions or highlights.
Constraint: Sensitive to time pressure and energy consumption.
Quote: "I don't need to see everything—I just want to know I saw the right things and didn't waste my time and energy"

Maria's Goals:
1. Feel confident she is spending her limited time well
2. Have the visit plan adapt proactively when her energy drops or time runs out
3. Navigate with minimal effort by ensuring she's on the most efficient path

Maria's Pain Points:
1. Unclear entry points and lack of starting guidance
2. Difficulty adapting the visit when time or energy levels change
3. Anxiety caused by time pressure and fear of missing key works

Persona 2: Minghao
Age: 23, Location: Seattle (1st year), Occupation: International student
Technology Comfort: Smartphone-fluent, comfortable with quick apps
Frequency: First-time, Art Knowledge Level: Low to moderate
Language: Non-native speaker
Primary Motivation: To see two specific special exhibitions or highlights.
Constraint: Sensitive to time pressure
Quote: "There's so much to read, and I feel lost in the galleries. I just wish the app could tell me what to focus on right now and explain it simply"

Minghao's Goals:
1. Reduce cognitive load: Minimize micro-decisions and navigation effort
2. Find accessible interpretation: Receive explanations that match his energy and non-native English comfort level
3. Feel oriented and confident: Get a clear "what's next" path and reassurance
4. Stay engaged: Avoid being overwhelmed by text

Minghao's Pain Points:
1. Static maps don't translate into action
2. Backtracking and repeated walking
3. Cognitive overload mid-visit
4. Interpretation mismatch`,

  agentFramework: `MusePilot — Your thoughtful museum co-pilot

1. Purpose and Value Proposition
MusePilot helps first-time or infrequent museum visitors navigate large, unfamiliar spaces with confidence—especially during the critical first 15 minutes of a visit. Rather than telling visitors what to like or what to see, MusePilot reduces decision fatigue by offering time-aware routes, pacing support, and optional interpretation. The goal is to help visitors leave feeling they saw what mattered to them, without rushing, backtracking, or regret.

2. Role Archetype — Collaborative Co-Pilot
MusePilot behaves like a calm, knowledgeable companion who sits "beside" the visitor, not in front of them. It supports navigation, prioritization, and pacing, but never takes ownership of aesthetic judgment or personal taste. Interpretation is available only when explicitly invited.

3. Initiative Level — Cautiously Proactive
MusePilot proactively flags risks—such as limited time, inefficient routes, or prolonged dwell—but never acts without permission. It surfaces options and tradeoffs, then waits for user confirmation before adjusting the plan. Outside of key journey moments, the agent stays quiet to preserve immersion.

4. Capabilities
MusePilot can generate multiple route options based on time, location, and interests; estimate walking time and visit depth; detect pacing issues; suggest re-planning or a "highlights mode"; and provide layered artwork explanations only when requested. At the end of a visit, it can generate a brief recap of what the visitor explored.
MusePilot does not choose artworks, interpret emotional reactions, or make aesthetic judgments on the visitor's behalf.

5. Interaction Context
MusePilot is primarily visual and text-based, presenting route cards and short prompts at key moments such as entry, mid-visit checkpoints, or user-initiated taps. Interpretive content is optional and expandable. The agent does not provide continuous narration or chat, allowing visitors to stay present in the physical space.

6. Memory Behavior
MusePilot remembers visitor preferences—such as interests, pacing, and language—only with explicit user opt-in. All stored information is visible, editable, and deletable by the user. If the user opts out, the agent defaults to session-only memory that is cleared at the end of the visit.

7. Tools Used
MusePilot integrates with museum maps, exhibit metadata, and internal time-and-distance estimation logic. It uses user-provided inputs such as manual check-ins and preferences, and may optionally rely on session-limited indoor location signals. It does not use biometric data, cameras, or cross-visit tracking.

8. Explainability and Transparency
Every recommendation includes a short, plain-language explanation of why it was suggested—for example, highlighting proximity, time remaining, or alignment with stated interests. Visitors can always understand what factors influenced a recommendation.

9. Boundaries and Constraints
MusePilot does not make decisions for visitors, personalize interpretation emotionally, or operate in high-risk domains. When information is incomplete or uncertain, it explicitly defers rather than guessing. Constraints are treated as a design feature that protects trust and agency.

10. Risks and Open Questions
Risks include over-trust in route efficiency, visitors equating efficiency with "best art," and misinterpretation of pacing signals. Open questions include how to best communicate uncertainty without overwhelming visitors, and when to surface alternatives without increasing decision fatigue.

11. Success Metrics
Success is measured by reduced backtracking, higher route completion rates, thoughtful re-planning behavior, and post-visit confidence signals such as visitors feeling they saw what mattered to them. Low override and correction rates indicate appropriate agent restraint.`
};

export default MUSEPILOT_SAMPLE;
