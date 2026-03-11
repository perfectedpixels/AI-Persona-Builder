---
inclusion: auto
---

# Agent Behavior Maker (ABM) — Architecture & Systems

## Overview

ABM is a tool for designing and testing AI agent personas. Users upload three documents (product proposal, user persona, agent framework), and the system generates conversation scenarios, lets users tune agent behavior via controls, then exports a persona + steering doc bundle.

Stack: Vite React frontend (port 3000) + Express Node.js backend (port 3001). All AI processing goes through AWS Bedrock (Claude Sonnet 4).

## UI Layout

Three-column layout, each column is a "Phase":

- PhaseA (left) — Document upload. Three text areas for product proposal, user persona, agent framework. Accepts pasted text or `.txt` file upload. Has a "Try Demo — MusePilot" button that populates sample data from `client/src/data/musepilot-sample.js`. Sticky-positioned so it stays visible while scrolling.
- PhaseB (center) — Scenarios + Conversation playground. Top section shows AI-generated scenario cards. Clicking a scenario generates a conversation displayed below in iMessage-style bubbles. Includes skeleton loading states for both scenarios and conversations.
- PhaseC (right) — Agent controls with skeuomorphic dial + slider combos (`DialControl` component). Controls: tone, formality, verbosity, empathy, proactivity, creativity, technicalDepth. Changing controls triggers a conversation refresh. Also sticky-positioned. Export button downloads a ZIP.

## Data Flow

```
Raw docs (PhaseA)
  → POST /api/abm/process-documents
  → Bedrock extracts structured data (product/persona/agent) + suggestedControls
  → Returns compact processedData + scenarios + suggestedControls
  → Raw docs replaced in state with { type, submitted: true } markers (memory optimization)

Scenario click (PhaseB)
  → POST /api/abm/generate-conversation
  → Sends scenarioId + processedData + agentControls (never raw docs)
  → Bedrock generates 5-exchange conversation
  → Displayed as chat bubbles

Controls change (PhaseC)
  → POST /api/abm/refresh-conversations (debounced 500ms)
  → Regenerates most recent conversation with updated controls

Export
  → POST /api/abm/export-framework
  → Server builds ZIP via `archiver` containing:
    - updated-persona.md (persona doc with interaction preferences)
    - ai-persona-steering.md (full steering doc with inclusion: auto frontmatter)
  → Streamed to client as agent-persona-export.zip
```

## API Endpoints

All under `/api/abm`:

| Endpoint | Method | Purpose |
|---|---|---|
| `/process-documents` | POST | Extract structured data from 3 docs, generate scenarios, infer suggested controls |
| `/generate-conversation` | POST | Generate a 5-exchange conversation for a selected scenario |
| `/user-interrupt` | POST | Handle custom user input mid-conversation |
| `/refresh-conversations` | POST | Regenerate latest conversation with updated agent controls |
| `/export-framework` | POST | Stream ZIP with persona + steering docs |

## Server Services

| File | Responsibility |
|---|---|
| `server/services/abm-processor.js` | Document extraction via Bedrock, scenario generation. Loads optional lecture knowledge base from `server/knowledge-base/`. Truncates docs at 50k chars. |
| `server/services/abm-conversation.js` | Conversation generation and refresh. Generates 5 PersonaUser↔AgentLLM exchanges. Refresh replaces only the most recent conversation. Falls back to a generic conversation on error. |
| `server/services/abm-export.js` | Builds ZIP archive. `buildPersonaDoc()` creates updated persona with interaction preferences. `buildSteeringDoc()` creates full AI steering doc with voice/tone rules, behavioral rules, example interaction. |
| `server/services/bedrock-retry.js` | Exponential backoff wrapper. Retries on ThrottlingException, ServiceUnavailableException, ModelTimeoutException, 429, 5xx. Max 2 retries, 1s base delay. |

## Resilience

- Bedrock timeout: 60s per call
- Server middleware timeout: 90s per request (covers retry overhead)
- Frontend `fetchWithTimeout`: 90s
- Retry: exponential backoff (1s → 2s + jitter), max 2 retries
- Controls debounce: 500ms before triggering refresh
- Conversation cap: 20 max stored conversations
- Body size limit: 10mb (Express)

## Key Frontend Components

| File | Role |
|---|---|
| `client/src/components/AgentBehaviorMaker.jsx` | Main orchestrator. Manages all state (processedData, scenarios, conversations, controls, loading flags). Coordinates API calls. |
| `client/src/components/PhaseA.jsx` | Document input. Text areas + file upload + demo button. |
| `client/src/components/PhaseB.jsx` | Scenario cards + conversation display. Skeleton loading for both. Auto-scrolls to new messages. |
| `client/src/components/PhaseC.jsx` | Agent controls with DialControl components. Export button. |
| `client/src/components/DialControl.jsx` | SVG skeuomorphic dial with brushed-metal texture, orange arc fill, pointer drag via setPointerCapture. Syncs with range slider. |

## Environment

- `client/.env` — `VITE_API_URL=http://localhost:3001` (local dev). Uses `VITE_` prefix because Vite.
- `server/.env` / root `.env` — `AWS_REGION`, `BEDROCK_MODEL_ID` (defaults to `us.anthropic.claude-sonnet-4-20250514-v1:0`), `PORT` (defaults to 3001)

## Bedrock Model

All calls use `us.anthropic.claude-sonnet-4-20250514-v1:0` via `@aws-sdk/client-bedrock-runtime`. The `anthropic_version` is `bedrock-2023-05-31`. JSON responses are parsed with fallback logic (direct parse → code block extraction → brace matching).
