/**
 * azureVoice.js — Azure AI VoiceLive realtime session (browser-side).
 *
 * Architecture:
 *   1. Fetch VoiceLive credentials (endpoint, apiKey, deployment, voice) from
 *      backend GET /api/voice/token  — API key never lives in the frontend bundle.
 *   2. Auto-detect Azure resource type from the endpoint hostname:
 *        *.openai.azure.com          → Azure OpenAI Realtime path
 *        *.cognitiveservices.azure.com → Azure AI Services VoiceLive path
 *   3. Open a WebSocket directly to the Azure realtime endpoint.
 *      Auth: api-key sent as a query param (browsers cannot set custom WS headers).
 *   4. Send session.update with tutor instructions, voice, VAD config.
 *   5. Capture microphone via getUserMedia → AudioContext @ 24 kHz
 *      → AudioWorkletNode ('audio-processor') converts Float32 → Int16 on a
 *        separate thread, posts zero-copy ArrayBuffers back to the main thread.
 *   6. Base64-encode each ArrayBuffer and stream as input_audio_buffer.append.
 *   7. Receive response.audio.delta (base64 PCM16) → decode → queue → play via
 *      AudioContext with gapless scheduling.
 *   8. Receive transcript deltas and fire onTranscript / onAITranscript callbacks.
 *
 * The backend STT, LLM, and TTS pipeline is completely bypassed.
 * The backend analytics WebSocket (key concepts, mastery) runs in parallel via socket.js.
 */

import { voice as voiceApi } from './api.js';

// ─── Constants ───────────────────────────────────────────────────────────────

const VOICELIVE_SAMPLE_RATE = 24000; // Azure VoiceLive uses 24 kHz PCM16

// Azure OpenAI Realtime (*.openai.azure.com)
const AOAI_REALTIME_PATH    = '/openai/realtime';
const AOAI_API_VERSION      = '2024-10-01-preview';

// Azure AI Services VoiceLive (*.cognitiveservices.azure.com)
const COGNITIVE_REALTIME_PATH = '/voice-live/realtime';
const COGNITIVE_API_VERSION   = '2025-05-01-preview';

// ─── Audio helpers ───────────────────────────────────────────────────────────

/** ArrayBuffer (Int16 PCM16) → base64 string (chunked to avoid stack overflow) */
function arrayBufferToBase64(buffer) {
  const bytes = new Uint8Array(buffer);
  let binary = '';
  const chunkSize = 0x8000; // 32 KB
  for (let i = 0; i < bytes.length; i += chunkSize) {
    binary += String.fromCharCode.apply(null, bytes.subarray(i, i + chunkSize));
  }
  return btoa(binary);
}

/** base64 string → Int16Array (PCM16) */
function base64ToInt16(b64) {
  const binary = atob(b64);
  const buf = new ArrayBuffer(binary.length);
  const view = new Uint8Array(buf);
  for (let i = 0; i < binary.length; i++) view[i] = binary.charCodeAt(i);
  return new Int16Array(buf);
}

/** Int16Array PCM16 → Float32Array (for Web Audio API playback) */
function pcm16ToFloat32(int16) {
  const out = new Float32Array(int16.length);
  for (let i = 0; i < int16.length; i++) out[i] = int16[i] / 32768;
  return out;
}

/**
 * Determines the correct WebSocket URL based on the endpoint hostname.
 *
 * Azure OpenAI resource  (*.openai.azure.com):
 *   wss://…/openai/realtime?api-version=2024-10-01-preview&deployment={model}&api-key={key}
 *
 * Azure AI Services resource (*.cognitiveservices.azure.com):
 *   wss://…/voice-live/realtime?api-version=2025-05-01-preview&model={model}&api-key={key}
 */
function buildWsUrl(creds) {
  // Convert https:// → wss:// (or keep wss://), strip trailing slash
  const wsBase = creds.endpoint
    .replace(/^https?:\/\//, 'wss://')
    .replace(/\/$/, '');

  const isCognitiveServices = wsBase.includes('cognitiveservices.azure.com');

  let wsUrl;
  if (isCognitiveServices) {
    wsUrl = `${wsBase}${COGNITIVE_REALTIME_PATH}` +
            `?api-version=${COGNITIVE_API_VERSION}` +
            `&model=${encodeURIComponent(creds.deployment)}` +
            `&api-key=${encodeURIComponent(creds.apiKey)}`;
  } else {
    // Azure OpenAI (default)
    wsUrl = `${wsBase}${AOAI_REALTIME_PATH}` +
            `?api-version=${AOAI_API_VERSION}` +
            `&deployment=${encodeURIComponent(creds.deployment)}` +
            `&api-key=${encodeURIComponent(creds.apiKey)}`;
  }

  return wsUrl;
}

// ─── VoiceLive Service ───────────────────────────────────────────────────────

class VoiceLiveService {
  constructor() {
    this._reset();
  }

  _reset() {
    this.ws = null;
    this.credentials = null;
    this.isActive = false;

    // Stored per-session so the session.created handler can access them
    this._subject = null;
    this._instructions = null;

    // Microphone / AudioWorklet pipeline
    this.mediaStream = null;
    this.audioContext = null;    // capture context @ 24 kHz
    this.workletNode = null;     // AudioWorkletNode running 'audio-processor'

    // Audio playback queue (gapless)
    this.playbackCtx = null;
    this.playbackQueue = [];
    this.isPlayingQueue = false;
    this.nextPlayTime = 0;

    // Streaming transcript buffer (typewriter effect)
    this._transcriptBuffer = '';
    this._transcriptInterval = null;

    // Callbacks (set per-session via startSession options)
    this.onTranscript = null;        // fired when user speech is transcribed
    this.onAITranscript = null;      // fired when AI speech is transcribed
    this.onAISpeakingChange = null;  // fired when AI starts/stops speaking
    this.onError = null;             // fired on WebSocket or mic errors
  }

  // ── Credentials: fetched once per instance, cached ──────────────────────────

  async _loadCredentials() {
    if (this.credentials) return this.credentials;
    const data = await voiceApi.getToken();
    // Backend returns: { endpoint, apiKey, deployment, voice }
    this.credentials = data;
    console.log('[VoiceLive] Credentials loaded, endpoint:', data.endpoint);
    return data;
  }

  // ── Public API ───────────────────────────────────────────────────────────────

  /**
   * Start a VoiceLive session.
   *
   * @param {object} options
   * @param {string}   [options.subject]           Subject label injected into the system prompt.
   * @param {string}   [options.instructions]       Custom system prompt (overrides default tutor persona).
   * @param {function} [options.onTranscript]       Called with { text, emotion, confidence } for user speech.
   * @param {function} [options.onAITranscript]     Called with (text, isDelta) for AI speech.
   * @param {function} [options.onAISpeakingChange] Called with (boolean) when AI speaking state changes.
   * @param {function} [options.onError]            Called with (errorString) on any error.
   */
  async startSession({
    subject,
    instructions,
    onTranscript,
    onAITranscript,
    onAISpeakingChange,
    onError,
  } = {}) {
    this.onTranscript = onTranscript;
    this.onAITranscript = onAITranscript;
    this.onAISpeakingChange = onAISpeakingChange;
    this.onError = onError;

    // Store so the session.created handler can reference them
    this._subject = subject;
    this._instructions = instructions;

    try {
      const creds = await this._loadCredentials();
      const wsUrl = buildWsUrl(creds);

      console.log('[VoiceLive] Connecting:', wsUrl.replace(/api-key=[^&]+/, 'api-key=***'));

      this.ws = new WebSocket(wsUrl);

      this.ws.onopen = () => {
        // Azure protocol: do NOT send session.update here.
        // Wait for the server to emit session.created first, then configure.
        console.log('[VoiceLive] WebSocket connected — waiting for session.created…');
      };

      this.ws.onmessage = (evt) => this._handleServerEvent(JSON.parse(evt.data));

      this.ws.onerror = (err) => {
        console.error('[VoiceLive] WebSocket error:', err);
        if (this.onError) this.onError('VoiceLive connection error — check console for details.');
      };

      this.ws.onclose = (e) => {
        console.log(`[VoiceLive] WebSocket closed: ${e.code} ${e.reason}`);
        this.isActive = false;

        // Surface meaningful close codes to the UI
        if (e.code === 4001 || e.code === 4002) {
          if (this.onError) this.onError('Authentication failed — session token may have expired.');
        } else if (e.code !== 1000 && e.code !== 1001) {
          // 1000 = normal close, 1001 = going away (page nav) — not errors
          if (this.onError) this.onError(`Connection closed unexpectedly (code ${e.code}).`);
        }
      };
    } catch (err) {
      console.error('[VoiceLive] startSession error:', err);
      if (this.onError) this.onError(err.message || 'Could not start VoiceLive session.');
    }
  }

  /** Pause microphone without closing the WebSocket. */
  stopListening() {
    this.isActive = false;
    if (this.workletNode) { this.workletNode.port.onmessage = null; this.workletNode.disconnect(); this.workletNode = null; }
    if (this.audioContext) { this.audioContext.close(); this.audioContext = null; }
    if (this.mediaStream) { this.mediaStream.getTracks().forEach(t => t.stop()); this.mediaStream = null; }
    console.log('[VoiceLive] Microphone stopped (session WS still open).');
  }

  /** Resume microphone after stopListening() — WebSocket must still be open. */
  async resumeListening() {
    if (!this.ws || this.ws.readyState !== WebSocket.OPEN) {
      console.warn('[VoiceLive] Cannot resume — no open session.');
      return;
    }
    this.isActive = true;
    await this._startMicrophone();
  }

  /** Tear down everything: mic, playback, WebSocket. */
  async stop() {
    this.isActive = false;
    this._stopTranscriptFlush();

    if (this.workletNode) { this.workletNode.port.onmessage = null; this.workletNode.disconnect(); this.workletNode = null; }
    if (this.audioContext) { this.audioContext.close(); this.audioContext = null; }
    if (this.mediaStream) { this.mediaStream.getTracks().forEach(t => t.stop()); this.mediaStream = null; }

    if (this.playbackCtx) { this.playbackCtx.close(); this.playbackCtx = null; }
    this.playbackQueue = [];
    this.isPlayingQueue = false;

    if (this.ws && this.ws.readyState === WebSocket.OPEN) {
      this.ws.close(1000, 'Session ended');
    }
    this.ws = null;

    console.log('[VoiceLive] Session fully stopped.');
    this._reset();
  }

  get connected() {
    return this.ws?.readyState === WebSocket.OPEN;
  }

  // ── Session configuration ────────────────────────────────────────────────────

  _configureSession(creds, subject, instructions) {
    const subjectLabel = subject
      ? subject.charAt(0).toUpperCase() + subject.slice(1)
      : 'Science';

    const systemInstructions = instructions ||
      `You are an expert ${subjectLabel} AI tutor named Lumina. ` +
      `Explain concepts clearly and concisely. ` +
      `Ask follow-up questions to gauge the student's understanding. ` +
      `Be encouraging and patient. Keep responses conversational and brief.`;

    // Voice name comes from backend config (AZURE_VOICELIVE_VOICE env var).
    // Falls back to Jenny Multilingual if not set.
    // en-US-Ava:DragonHDLatestNeural is the reference voice that Azure accepts
    // with type 'azure-standard'. OpenAI voices (shimmer, alloy…) are NOT valid here.
    const voiceName = creds.voice || 'en-US-Ava:DragonHDLatestNeural';

    this._send({
      type: 'session.update',
      session: {
        modalities: ['audio', 'text'],
        instructions: systemInstructions,

        turn_detection: {
          type: 'azure_semantic_vad',
          threshold: 0.4,
          prefix_padding_ms: 300,
          silence_duration_ms: 300,
          remove_filler_words: true,
        },

        input_audio_noise_reduction: {
          type: 'azure_deep_noise_suppression',
        },
        input_audio_echo_cancellation: {
          type: 'server_echo_cancellation',
        },

        voice: {
          name: voiceName,
          type: 'azure-standard',
        },

        input_audio_transcription: {
          enabled: true,
          model: 'gpt-4o-mini-transcribe',
          format: 'text',
        },
      },
    });

    console.log('[VoiceLive] Session configured — voice:', voiceName);
    // isActive is set to true in the session.updated handler (not here),
    // so mic audio is not streamed until Azure confirms the session config.
  }

  // ── Microphone capture → PCM16 → Azure ──────────────────────────────────────

  async _startMicrophone() {
    try {
      this.mediaStream = await navigator.mediaDevices.getUserMedia({
        audio: {
          channelCount: 1,
          sampleRate: VOICELIVE_SAMPLE_RATE,
          echoCancellation: true,
          noiseSuppression: true,
          autoGainControl: true,
        },
        video: false,
      });

      // AudioContext at 24 kHz so the worklet outputs native 24 kHz
      this.audioContext = new AudioContext({ sampleRate: VOICELIVE_SAMPLE_RATE });

      // Load the AudioWorklet from /public (served as static asset)
      await this.audioContext.audioWorklet.addModule('/audio-processor.js');

      const source = this.audioContext.createMediaStreamSource(this.mediaStream);
      this.workletNode = new AudioWorkletNode(this.audioContext, 'audio-processor');

      // The worklet transfers zero-copy Int16Array buffers on each process() call
      this.workletNode.port.onmessage = (evt) => {
        if (!this.isActive || this.ws?.readyState !== WebSocket.OPEN) return;
        // evt.data is a transferred ArrayBuffer (Int16 PCM16 @ 24 kHz mono)
        const b64 = arrayBufferToBase64(evt.data);
        this._send({ type: 'input_audio_buffer.append', audio: b64 });
      };

      source.connect(this.workletNode);
      // Connect to destination to keep the AudioContext alive in all browsers
      this.workletNode.connect(this.audioContext.destination);

      console.log('[VoiceLive] AudioWorklet mic streaming started @ 24 kHz');
    } catch (err) {
      console.error('[VoiceLive] Microphone error:', err);
      if (this.onError) this.onError(
        err.name === 'NotAllowedError'
          ? 'Microphone access denied. Please allow mic permission and try again.'
          : 'Could not start microphone. ' + err.message,
      );
    }
  }

  // ── Server event handler ─────────────────────────────────────────────────────

  _handleServerEvent(event) {
    switch (event.type) {
      // Azure sends session.created right after the WebSocket connects.
      // This is the correct moment to send session.update.
      case 'session.created':
        console.log('[VoiceLive] session.created → sending session.update…');
        this._configureSession(this.credentials, this._subject, this._instructions);
        break;

      // Azure confirms our session.update — now it is safe to stream audio.
      case 'session.updated':
        console.log('[VoiceLive] session.updated → session ready, starting mic…');
        this.isActive = true;
        this._startMicrophone();
        break;

      // User speech transcript (after VAD detects end of turn)
      case 'conversation.item.input_audio_transcription.completed':
        if (event.transcript && this.onTranscript) {
          this.onTranscript({ text: event.transcript, emotion: 'neutral', confidence: 0.9 });
        }
        break;

      // AI audio chunk — decode and enqueue for gapless playback
      case 'response.audio.delta':
        if (event.delta) {
          this._enqueueAudio(event.delta);
        }
        break;

      // AI audio finished for this turn
      case 'response.audio.done':
        if (this.onAISpeakingChange) this.onAISpeakingChange(false);
        break;

      // AI transcript streaming (typewriter effect)
      case 'response.audio_transcript.delta':
        this._transcriptBuffer += (event.delta || '');
        this._startTranscriptFlush();
        break;

      // AI full transcript at end of turn
      case 'response.audio_transcript.done':
        this._stopTranscriptFlush();
        if (event.transcript && this.onAITranscript) {
          this.onAITranscript(event.transcript);
        }
        break;

      // AI started generating a response
      case 'response.created':
        this._transcriptBuffer = '';
        if (this.onAISpeakingChange) this.onAISpeakingChange(true);
        break;

      // VAD: user started speaking (can use to interrupt AI playback)
      case 'input_audio_buffer.speech_started':
        // Optionally clear the playback queue to interrupt AI mid-speech
        // this.playbackQueue = [];
        break;

      // Server error
      case 'error':
        console.error('[VoiceLive] Server error:', event.error);
        if (this.onError) this.onError(event.error?.message || 'VoiceLive server error');
        break;

      default:
        // Uncomment to debug all events:
        // console.log('[VoiceLive] unhandled event:', event.type);
        break;
    }
  }

  // ── Typewriter transcript flush ──────────────────────────────────────────────

  _startTranscriptFlush() {
    if (this._transcriptInterval) return; // already running
    this._transcriptInterval = setInterval(() => {
      if (!this._transcriptBuffer) return;
      // Flush up to 40 chars per tick → smooth typewriter at ~200 ms intervals
      const chunk = this._transcriptBuffer.slice(0, 40);
      this._transcriptBuffer = this._transcriptBuffer.slice(40);
      if (this.onAITranscript) this.onAITranscript(chunk, /* isDelta */ true);
    }, 200);
  }

  _stopTranscriptFlush() {
    if (this._transcriptInterval) {
      clearInterval(this._transcriptInterval);
      this._transcriptInterval = null;
    }
    this._transcriptBuffer = '';
  }

  // ── Gapless audio playback queue ─────────────────────────────────────────────

  _enqueueAudio(base64Delta) {
    const int16 = base64ToInt16(base64Delta);
    const float32 = pcm16ToFloat32(int16);
    this.playbackQueue.push(float32);
    if (!this.isPlayingQueue) this._drainQueue();
  }

  _drainQueue() {
    if (this.playbackQueue.length === 0) {
      this.isPlayingQueue = false;
      return;
    }
    this.isPlayingQueue = true;

    if (!this.playbackCtx) {
      this.playbackCtx = new AudioContext({ sampleRate: VOICELIVE_SAMPLE_RATE });
      this.nextPlayTime = this.playbackCtx.currentTime;
    }

    while (this.playbackQueue.length > 0) {
      const samples = this.playbackQueue.shift();
      const buf = this.playbackCtx.createBuffer(1, samples.length, VOICELIVE_SAMPLE_RATE);
      buf.getChannelData(0).set(samples);

      const src = this.playbackCtx.createBufferSource();
      src.buffer = buf;
      src.connect(this.playbackCtx.destination);

      const startAt = Math.max(this.playbackCtx.currentTime, this.nextPlayTime);
      src.start(startAt);
      this.nextPlayTime = startAt + buf.duration;
    }

    // Re-drain after this playback window ends (+ 100 ms buffer)
    const checkIn = Math.max(0, (this.nextPlayTime - (this.playbackCtx?.currentTime ?? 0)) * 1000);
    setTimeout(() => this._drainQueue(), checkIn + 100);
  }

  // ── Utility ──────────────────────────────────────────────────────────────────

  _send(obj) {
    if (this.ws?.readyState === WebSocket.OPEN) {
      this.ws.send(JSON.stringify(obj));
    }
  }
}

// Singleton exported for use across the app
export const azureVoice = new VoiceLiveService();
export default VoiceLiveService;
