/**
 * voicelive.service.ts
 *
 * ⚠️  ARCHITECTURE NOTE — READ BEFORE MODIFYING
 *
 * Under the current design, the backend does NOT proxy VoiceLive audio.
 * The backend's only role is to serve credentials via GET /api/voice/token
 * (see azureToken.service.ts and voice.controller.ts).
 *
 * The FRONTEND opens the WebSocket directly to Azure's realtime endpoint
 * and owns the entire mic capture → PCM streaming → audio playback pipeline.
 * This keeps latency minimal (no server hop for every audio chunk) and
 * simplifies the backend significantly.
 *
 * If you ever need server-side VoiceLive proxying (e.g. for server-authorised
 * sessions), re-implement by installing @azure/ai-voicelive and building a
 * WebSocket proxy here. Do NOT mix that pattern with the current token-based flow.
 */

export {}; // Ensure this is treated as a module, not a script
