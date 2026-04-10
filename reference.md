# Azure Voice Live Configuration

## How it works

The frontend never holds credentials. On load it calls `/voice-config` to get the proxy path and model name, then opens a WebSocket to the local FastAPI server, which proxies to Azure.

```
Browser  ──WS──►  FastAPI /ws/voice-live  ──WS──►  Azure Voice Live
```

---

## Required env vars (`.env`)

```
AZURE_OPENAI_ENDPOINT=https://<your-resource>.openai.azure.com
AZURE_OPENAI_API_KEY=<your-key>
AZURE_VOICE_LIVE_MODEL=<your-realtime-deployment-name>   # e.g. gpt-4o-realtime-preview
```

---

## Backend endpoints

### `GET /voice-config`

Returns config to frontend — no secrets exposed.

```json
{ "model": "<AZURE_VOICE_LIVE_MODEL>", "proxy_url": "/ws/voice-live" }
```

### `WS /ws/voice-live`

Proxies browser WebSocket to Azure. Constructs the Azure URL as:

```
wss://<endpoint>/voice-live/realtime?api-version=2025-05-01-preview&model=<model>
```

Auth header sent to Azure: `api-key: <AZURE_OPENAI_API_KEY>`

---

## Frontend (app.js)

1. On init, fetches `/voice-config` → stores `proxy_url` and `model`.
2. On start, connects: `ws://127.0.0.1:8000<proxy_url>` (i.e. `/ws/voice-live`).
3. After `session.created`, sends `session.update` with instructions, VAD config, voice, and transcription settings.
4. Sends `response.create` to trigger the AI opening message.

### Key session.update fields

- `modalities`: `["audio", "text"]`
- `turn_detection`: `azure_semantic_vad` (threshold 0.4, silence 300ms, filler word removal)
- `voice`: `{ name: "en-US-Ava:DragonHDLatestNeural", type: "azure-standard" }`
- `input_audio_transcription`: `{ enabled: true, model: "gpt-4o-mini-transcribe" }`
- `input_audio_noise_reduction`: `azure_deep_noise_suppression`
- `input_audio_echo_cancellation`: `server_echo_cancellation`

### Audio format

- Sample rate: **24000 Hz**, mono, PCM16 (base64-encoded chunks)

---

## Reusing in a new project

1. Copy the three env vars above into your `.env`.
2. Add the `/voice-config` GET endpoint (returns model + proxy path).
3. Add the `/ws/voice-live` WebSocket proxy (two async tasks: browser→azure, azure→browser).
4. In the frontend, fetch `/voice-config` on load, then `new WebSocket(wsBase + proxy_url)`.
5. Send `session.update` on open, `response.create` to kick off AI speech.
