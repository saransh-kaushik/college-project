/**
 * azureVoice.js — Azure AI VoiceLive realtime session (browser-side).
 *
 * Architecture:
 *   1. Fetch VoiceLive credentials (endpoint, apiKey, model, voice) from backend /api/voice/token
 *   2. Open a WebSocket directly to the Azure VoiceLive realtime endpoint
 *      wss://[resource].cognitiveservices.azure.com/voice-live/realtime?api-version=...
 *      Auth: api-key sent as a query param (browsers cannot set custom WS headers)
 *   3. Send session.update with tutor instructions, voice, VAD config
 *   4. Capture microphone via getUserMedia → AudioContext @ 24 kHz
 *      → AudioWorkletNode ('audio-processor') converts Float32 → Int16 on a separate thread,
 *        posts ArrayBuffers back to main thread
 *   5. Base64-encode each ArrayBuffer and stream as input_audio_buffer.append
 *   6. Receive response.audio.delta (base64 PCM16) → decode → queue → play via AudioContext
 *   7. Receive transcript deltas and fire onTranscript / onAITranscript callbacks
 *
 * The backend STT, LLM, and TTS pipeline is completely bypassed.
 */

import { voice as voiceApi } from './api.js';

// ─── Audio helpers ──────────────────────────────────────────────────────────

/** ArrayBuffer (Int16) → base64 string (no copy, fast path) */
function arrayBufferToBase64(buffer) {
  const bytes = new Uint8Array(buffer);
  let binary = '';
  const chunkSize = 0x8000; // 32 KB chunks to avoid stack overflow on large buffers
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

/** Int16Array PCM16 → Float32Array (for Web Audio API) */
function pcm16ToFloat32(int16) {
  const out = new Float32Array(int16.length);
  for (let i = 0; i < int16.length; i++) out[i] = int16[i] / 32768;
  return out;
}

// ─── VoiceLive Service ───────────────────────────────────────────────────────

const VOICELIVE_SAMPLE_RATE = 24000; // Azure VoiceLive uses 24 kHz PCM16

class VoiceLiveService {
  constructor() {
    this._reset();
  }

  _reset() {
    this.ws = null;
    this.credentials = null;
    this.isActive = false;

    // Microphone / AudioWorklet pipeline
    this.mediaStream = null;
    this.audioContext = null;       // for mic capture
    this.workletNode = null;        // AudioWorkletNode running audio-processor

    // Audio playback queue
    this.playbackCtx = null;
    this.playbackQueue = [];
    this.isPlayingQueue = false;
    this.nextPlayTime = 0;

    // Streaming transcript buffer (typewriter effect)
    this._transcriptBuffer = '';
    this._transcriptInterval = null;

    // Callbacks
    this.onTranscript = null;       // user speech transcript
    this.onAITranscript = null;     // AI speech transcript
    this.onAISpeakingChange = null;
    this.onError = null;
  }

  // ── Initialise: fetch credentials from backend ──────────────────────────────

  async _loadCredentials() {
    if (this.credentials) return this.credentials;
    const data = await voiceApi.getToken();
    // Backend returns: { endpoint, apiKey, deployment, voice }
    this.credentials = data;
    console.log('[VoiceLive] Credentials loaded, endpoint:', data.endpoint);
    return data;
  }

  // ── Connect WebSocket to Azure VoiceLive ────────────────────────────────────

  async startSession({ subject, instructions, onTranscript, onAITranscript, onAISpeakingChange, onError } = {}) {
    this.onTranscript = onTranscript;
    this.onAITranscript = onAITranscript;
    this.onAISpeakingChange = onAISpeakingChange;
    this.onError = onError;

    try {
      const creds = await this._loadCredentials();

      // Browsers cannot set custom WebSocket headers — append api-key as query param.
      // The backend returns either a full wss:// URL or an https:// base we convert.
      const wsBase = creds.endpoint
        .replace(/^https?:\/\//, 'wss://')
        .replace(/\/$/, '');

      // Build the VoiceLive realtime endpoint
      // Format: wss://{resource}.cognitiveservices.azure.com/voice-live/realtime
      //         ?api-version=2025-05-01-preview&api-key={key}
      const wsUrl = wsBase.includes('/voice-live/realtime')
        ? `${wsBase}&api-key=${encodeURIComponent(creds.apiKey)}`
        : `${wsBase}/voice-live/realtime?api-version=2025-05-01-preview&api-key=${encodeURIComponent(creds.apiKey)}`;

      console.log('[VoiceLive] Connecting:', wsUrl.replace(/api-key=[^&]+/, 'api-key=***'));

      // Azure OpenAI Realtime requires the 'openai-beta.realtime-v1' subprotocol
      this.ws = new WebSocket(wsUrl, ['openai-beta.realtime-v1']);

      this.ws.onopen = () => {
        console.log('[VoiceLive] WebSocket connected');
        this._configureSession(creds, subject, instructions);
        this._startMicrophone();
      };

      this.ws.onmessage = (evt) => this._handleServerEvent(JSON.parse(evt.data));

      this.ws.onerror = (err) => {
        console.error('[VoiceLive] WebSocket error:', err);
        if (this.onError) this.onError('VoiceLive connection error');
      };

      this.ws.onclose = (e) => {
        console.log('[VoiceLive] WebSocket closed:', e.code, e.reason);
        this.isActive = false;
      };
    } catch (err) {
      console.error('[VoiceLive] startSession error:', err);
      if (this.onError) this.onError(err.message || 'Could not start VoiceLive session');
    }
  }

  // ── Session config event ────────────────────────────────────────────────────

  _configureSession(creds, subject, instructions) {
    const subjectLabel = subject
      ? subject.charAt(0).toUpperCase() + subject.slice(1)
      : 'Science';

    const systemInstructions = instructions ||
      `You are an expert ${subjectLabel} AI tutor named Lumina. ` +
      `Explain concepts clearly and concisely. ` +
      `Ask follow-up questions to gauge the student's understanding. ` +
      `Be encouraging and patient. Keep responses conversational and brief.`;

    // Azure VoiceLive session.update shape
    // Voice: en-US-JennyMultilingualNeural or the value from backend config
    this._send({
      type: 'session.update',
      session: {
        modalities: ['text', 'audio'],
        instructions: systemInstructions,
        // Voice must be one of: alloy, ash, ballad, coral, echo, sage, shimmer, verse, marin, cedar
        voice: creds.voice || 'shimmer',
        input_audio_format: 'pcm16',
        output_audio_format: 'pcm16',
        input_audio_transcription: {
          model: 'whisper-1',
        },
        turn_detection: {
          type: 'server_vad',
          threshold: 0.5,
          prefix_padding_ms: 300,
          silence_duration_ms: 600,
          create_response: true,
        },
        temperature: 0.8,
      },
    });

    console.log('[VoiceLive] Session configured with voice:', creds.voice);
    this.isActive = true;
  }

  // ── Microphone capture → stream PCM16 to Azure ──────────────────────────────

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

      // AudioContext with target sample rate so the worklet outputs 24 kHz directly
      this.audioContext = new AudioContext({ sampleRate: VOICELIVE_SAMPLE_RATE });

      // Load the audio-processor worklet from /public
      await this.audioContext.audioWorklet.addModule('/audio-processor.js');

      const source = this.audioContext.createMediaStreamSource(this.mediaStream);
      this.workletNode = new AudioWorkletNode(this.audioContext, 'audio-processor');

      // The worklet posts Int16Array buffers on each process() invocation
      this.workletNode.port.onmessage = (evt) => {
        if (!this.isActive || this.ws?.readyState !== WebSocket.OPEN) return;

        // evt.data is an ArrayBuffer (Int16, 24 kHz mono)
        const b64 = arrayBufferToBase64(evt.data);
        this._send({
          type: 'input_audio_buffer.append',
          audio: b64,
        });
      };

      source.connect(this.workletNode);
      // Connect to destination to keep the AudioContext running (required in some browsers)
      this.workletNode.connect(this.audioContext.destination);

      console.log('[VoiceLive] AudioWorklet mic streaming started @ 24 kHz');
    } catch (err) {
      console.error('[VoiceLive] Microphone error:', err);
      if (this.onError) this.onError('Microphone access denied or AudioWorklet failed');
    }
  }

  // ── Handle server events ────────────────────────────────────────────────────

  _handleServerEvent(event) {
    switch (event.type) {
      case 'session.created':
      case 'session.updated':
        console.log('[VoiceLive] Session ready');
        break;

      // User speech transcript (after VAD turn end)
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

      // AI transcript delta — buffer for typewriter effect
      case 'response.audio_transcript.delta':
        this._transcriptBuffer += (event.delta || '');
        this._startTranscriptFlush();
        break;

      // AI full transcript (end of turn)
      case 'response.audio_transcript.done':
        this._stopTranscriptFlush();
        if (event.transcript && this.onAITranscript) {
          this.onAITranscript(event.transcript);
        }
        break;

      // AI started responding
      case 'response.created':
        this._transcriptBuffer = '';
        if (this.onAISpeakingChange) this.onAISpeakingChange(true);
        break;

      // Error from server
      case 'error':
        console.error('[VoiceLive] Server error:', event.error);
        if (this.onError) this.onError(event.error?.message || 'VoiceLive server error');
        break;

      default:
        // Uncomment to debug all events:
        // console.log('[VoiceLive] event:', event.type);
        break;
    }
  }

  // ── Typewriter transcript flush ─────────────────────────────────────────────

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

  // ── Playback queue for received PCM16 audio ─────────────────────────────────

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

    // Re-drain after the expected playback window ends
    const checkIn = Math.max(0, (this.nextPlayTime - (this.playbackCtx?.currentTime ?? 0)) * 1000);
    setTimeout(() => this._drainQueue(), checkIn + 100);
  }

  // ── Manual mic toggle (pause/resume without closing WS) ────────────────────

  stopListening() {
    this.isActive = false;
    if (this.workletNode) { this.workletNode.port.onmessage = null; this.workletNode.disconnect(); this.workletNode = null; }
    if (this.audioContext) { this.audioContext.close(); this.audioContext = null; }
    if (this.mediaStream) { this.mediaStream.getTracks().forEach(t => t.stop()); this.mediaStream = null; }
    console.log('[VoiceLive] Microphone stopped (session WS still open)');
  }

  async resumeListening() {
    if (!this.ws || this.ws.readyState !== WebSocket.OPEN) {
      console.warn('[VoiceLive] Cannot resume — no open session');
      return;
    }
    this.isActive = true;
    await this._startMicrophone();
  }

  // ── Stop everything ─────────────────────────────────────────────────────────

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

    console.log('[VoiceLive] Session fully stopped');
    this._reset();
  }

  // ── Utility ─────────────────────────────────────────────────────────────────

  _send(obj) {
    if (this.ws?.readyState === WebSocket.OPEN) {
      this.ws.send(JSON.stringify(obj));
    }
  }

  get connected() {
    return this.ws?.readyState === WebSocket.OPEN;
  }
}

export const azureVoice = new VoiceLiveService();
export default VoiceLiveService;
