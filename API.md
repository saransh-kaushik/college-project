# EduFlow AI (VoiceTutor) — API Specifications

This document outlines all required backend API endpoints and WebSocket events needed to fully support the frontend interfaces (`Login`, `Register`, `Dashboard`, `Session`).

---

## 1. Authentication APIs
> *Required for `Login.jsx` and `Register.jsx` to manage user access to the workspace.*

### `POST /api/auth/register`
- **Description**: Registers a new student.
- **Request Body**: `{ "name": "Alex Chen", "email": "alex@example.com", "password": "..." }`
- **Response**: `{ "token": "jwt_string", "user": { ... } }`

### `POST /api/auth/login`
- **Description**: Authenticates a user and returns a token.
- **Request Body**: `{ "email": "alex@example.com", "password": "..." }`
- **Response**: `{ "token": "jwt_string", "user": { "id": "...", "name": "Alex Chen", "tier": "Premium Scholar" } }`

---

## 2. User & Dashboard APIs
> *Required for populating the `Dashboard.jsx` sidebar layout and overall contextual state.*

### `GET /api/user/profile`
- **Description**: Fetches current user profile details (avatar, name, subscription tier).
- **Headers**: `Authorization: Bearer <token>`
- **Response**: `{ "id": "...", "name": "Alex Chen", "tier": "Premium Scholar", "avatar_url": "..." }`

### `PUT /api/user/settings`
- **Description**: Updates user preferences when accessing the Settings gear icon.
- **Headers**: `Authorization: Bearer <token>`
- **Request Body**: `{ "theme": "dark", "notifications": true, ... }`
- **Response**: `{ "success": true }`

### `GET /api/user/journeys`
- **Description**: Fetches the user's active learning journeys/modules (e.g., "Bio-Chemistry Path", "Calculus II").
- **Headers**: `Authorization: Bearer <token>`
- **Response**: `{ "journeys": [ { "id": "...", "name": "Bio-Chemistry Path", "icon": "science" }, ... ] }`

### `GET /api/user/sessions`
- **Description**: Retrieves history of past conversations for the sidebar (e.g., "ATP Synthesis Basics").
- **Headers**: `Authorization: Bearer <token>`
- **Response**: `{ "sessions": [ { "id": "...", "title": "ATP Synthesis Basics", "date": "..." }, ... ] }`

---

## 3. Session & Chat APIs
> *Required for initializing Voice Live Sessions (`Session.jsx`) and text-based Smart Inputs (`Dashboard.jsx`).*

### `GET /api/voice/token`
- **Description**: Fetches a short-lived (10-minute) Azure Voice Live token. The frontend utilizes this to open a direct low-latency P2P/WebSocket connection with Azure's STT/TTS edge servers.
- **Headers**: `Authorization: Bearer <token>`
- **Response**: `{ "azure_token": "...", "region": "...", "endpoint": "..." }`

### `POST /api/sessions/start`
- **Description**: Initializes a new session record in PostgreSQL before the user starts speaking.
- **Request Body**: `{ "subject": "biology", "topic": "ATP Synthesis" }`
- **Response**: `{ "session_id": "uuid" }`

### `POST /api/sessions/:sessionId/end`
- **Description**: Marks the session as completed, allowing the backend to finalize summary analytics, duration, and score.
- **Headers**: `Authorization: Bearer <token>`
- **Response**: `{ "success": true, "summary": { ... } }`

### `GET /api/sessions/:sessionId`
- **Description**: Loads the chat history, diagrams, and code snippets of a past session into the main Chat Workspace of the Dashboard.
- **Headers**: `Authorization: Bearer <token>`
- **Response**: `{ "title": "Bio-Chemistry: ATP Synthesis", "messages": [ ... ] }`

### `POST /api/chat/message`
- **Description**: Handles text-based follow-ups from the Dashboard's smart input bar.
- **Headers**: `Authorization: Bearer <token>`
- **Request Body**: `{ "session_id": "uuid", "text": "Can you explain the role of ATP synthase?" }`
- **Response**: `{ "ai_response": "..." }`

### `POST /api/chat/upload`
- **Description**: Allows users to upload a PDF/paper for Context/RAG injection via the attachment icon in the Dashboard input bar.
- **Headers**: `Authorization: Bearer <token>`
- **Request Body**: `FormData (file)`
- **Response**: `{ "document_id": "...", "parsed": true }`

---

## 4. Contextual Resources & Analytics APIs
> *Required for populating the Contextual Resource Panel (Right Sidebar) and Dashboard Analytics.*

### `GET /api/resources?topic=...`
- **Description**: Retrieves dynamic study resources associated with the current topic/chat context (PDF highlights, Community discussions, Quick Facts).
- **Headers**: `Authorization: Bearer <token>`
- **Response**: `{ "documents": [...], "notes": [...], "community_discussions": [...], "quick_facts": [...] }`

### `GET /api/progress/:userId`
- **Description**: Retrieves the student's mastery/readiness score (e.g., 65% Readiness for upcoming quiz).
- **Headers**: `Authorization: Bearer <token>`
- **Response**: `{ "overall_mastery": 0.65, "upcoming_assessments": [ { "title": "Metabolic Pathways", "time": "Tomm, 10 AM", "readiness": 0.65 } ] }`

---

## 5. WebSocket Protocol (Real-Time Communication)
> *Required for `/session` interactions. Forms the bridge between the Frontend and the Backend Agent Router (GPT-4.1-mini) while Azure handles the raw audio.*

### **Client → Server Events**
- **`TRANSCRIPT`**: Triggered when Azure STT yields a completed sentence.
  - Payload: `{ "sessionId": "...", "subject": "biology", "text": "Is it because chlorophyll needs energy...", "emotion": "curious", "confidence": 0.85 }`
- **`SESSION_END`**: Triggered when the user clicks the "End Session" button.
  - Payload: `{ "sessionId": "..." }`

### **Server → Client Events**
- **`AI_RESPONSE`**: The text generated by the Base Agent (to be sent by frontend to Azure TTS or displayed in the transcript panel).
  - Payload: `{ "text": "Excellent. Now, why do you think plants need sunlight..." }`
- **`MASTERY_UPDATE`**: Live tracking update based on student answers.
  - Payload: `{ "topic": "Photosynthesis", "level": 0.7 }`
- **`LIVE_ANALYSIS_KEY_CONCEPT`**: Pushes detected key terms dynamically into the Session's "Key Concepts" sidebar (e.g. Chlorophyll, ATP, Stomata).
  - Payload: `{ "concept": "Chlorophyll", "definition": "The green pigment in plants...", "icon": "eco", "color": "primary" }`
- **`ASSESSMENT_QUESTION`**: Triggered periodically when the agent enters assessment mode.
  - Payload: `{ "question": "Can you define what ATP does in this process?" }`
