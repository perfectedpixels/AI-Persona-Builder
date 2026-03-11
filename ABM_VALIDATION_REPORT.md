# Agent Behavior Maker — Validation Report

**Date**: March 10, 2026  
**Status**: ✅ Fixed and validated

---

## What Works

### Backend (Server / Lambda)
- **ABM routes** — All 5 endpoints registered and wired correctly:
  - `POST /api/abm/process-documents` — Document processing + scenario generation
  - `POST /api/abm/generate-conversation` — Generate conversation for selected scenario
  - `POST /api/abm/user-interrupt` — Custom scenario input
  - `POST /api/abm/refresh-conversations` — Refresh with new agent controls (stub)
  - `POST /api/abm/export-framework` — Export updated framework document

- **ABM services** — All three services load and export correctly:
  - `abm-processor.js` — `processDocuments`, `generateScenarios` (Bedrock)
  - `abm-conversation.js` — `generateConversation`, `refreshConversations`
  - `abm-export.js` — `exportFramework`

- **Bedrock integration** — Uses `BEDROCK_MODEL_ID` (default: Claude Sonnet 4)
- **Knowledge base** — Lecture files exist in `server/knowledge-base/` (currently disabled in processor to reduce prompt size)
- **Lambda deployment** — `deploy-lambda.sh` copies main `server/` (includes ABM) into the Lambda package

### Frontend
- **Phase A** — Document input (text, file, URL) and submission
- **Phase B** — Scenario selection, document analysis display, custom scenario input
- **Phase C** — Agent controls (tone, formality, verbosity, etc.), export
- **Tab navigation** — ABM accessible via "Agent Behavior Maker" tab

### Deployment Targets
- **EC2** — nginx proxies `/api/` to Node backend; relative URLs work when served from same origin
- **Local dev** — Works when `REACT_APP_API_URL=http://localhost:3001` (or default) and server runs on 3001

---

## What Was Broken (Now Fixed)

### 1. API URL not used (Amplify / production)
**Problem**: `AgentBehaviorMaker` and `PhaseB` used `fetch('/api/abm/...')` (relative URLs). On Amplify, requests went to the frontend origin and returned 404.

**Fix**: Import `API_URL` from config and use `${API_URL}/api/abm/...` for all ABM fetch calls.

### 2. User interrupt response not reflected in UI
**Problem**: PhaseB's "Add Your Scenario" sent the request but never updated the conversation list. The response was discarded.

**Fix**: Moved fetch logic to `AgentBehaviorMaker.handleUserInterrupt`, which appends the new conversation to state and passes a callback to PhaseB.

### 3. Agent controls not passed to user-interrupt
**Problem**: Custom scenario generation used default agent controls instead of the user's Phase C settings.

**Fix**: Include `agentControls` in the user-interrupt request body; backend passes it to `generateConversation`.

---

## What’s Necessary to Run ABM

### Environment variables (backend)
| Variable | Required | Default | Notes |
|----------|----------|---------|-------|
| `BEDROCK_MODEL_ID` | Yes | `us.anthropic.claude-sonnet-4-20250514-v1:0` | Claude model for document processing |
| `AWS_REGION` | No | `us-east-1` | Lambda provides this |
| `ELEVENLABS_API_KEY` | No (for ABM) | — | Only needed for Conversation Maker voice synthesis |

### Environment variables (frontend)
| Variable | Required | Default | Notes |
|----------|----------|---------|-------|
| `REACT_APP_API_URL` | Yes (production) | `http://localhost:3001` | API base URL (Lambda/API Gateway or EC2) |

### AWS permissions
- Lambda execution role: `AmazonBedrockFullAccess` (or equivalent Bedrock invoke permission)
- Bedrock model access: Claude Sonnet 4 (or configured model) enabled in the Bedrock console

### Local development
1. Backend: `cd server && npm start` (port 3001)
2. Frontend: `cd client && npm start` (port 3000)
3. Ensure `.env` or `client/.env` has `REACT_APP_API_URL=http://localhost:3001` (or rely on default)

### Production (Amplify + Lambda)
1. Deploy Lambda: `./deploy-lambda.sh` (with `ELEVENLABS_API_KEY`)
2. Set Amplify env: `REACT_APP_API_URL=https://<api-id>.execute-api.us-east-1.amazonaws.com/prod`
3. Push to trigger Amplify build

### Production (EC2)
1. Run `./deploy-to-ec2.sh <EC2_IP>`
2. EC2 build sets `REACT_APP_API_URL=http://<EC2_IP>:3001`
3. nginx proxies `/api/` to the Node backend

---

## Known Limitations

1. **refresh-conversations** — Returns existing conversations unchanged; does not re-generate with new controls.
2. **URL input** — Phase A "Google Doc URL" is not implemented; backend returns placeholder text.
3. **Voice input** — Phase B microphone button is a stub; no recording.
4. **Lecture knowledge** — Disabled in `abm-processor.js` (`const lectures = null`) to reduce prompt size; can be re-enabled if needed.

---

## Files Changed (This Session)

- `client/src/components/AgentBehaviorMaker.js` — Use `API_URL`, add `handleUserInterrupt`
- `client/src/components/PhaseB.js` — Use parent callback for user interrupt
- `server/routes/abm.js` — Pass `agentControls` to user-interrupt handler
