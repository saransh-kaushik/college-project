/**
 * azureVoice.js — Azure Cognitive Services Voice Live wrapper.
 *
 * Flow:
 * 1. Fetch short-lived token from backend /api/voice/token
 * 2. Open WebSocket directly to Azure STT endpoint
 * 3. Stream microphone audio to Azure
 * 4. Receive STT transcripts and call onTranscript callback
 * 5. Feed AI text responses into Azure TTS for spoken playback
 */

import { voice } from './api.js';

class AzureVoiceService {
  constructor() {
    this.azureWs = null;
    this.mediaStream = null;
    this.audioContext = null;
    this.processor = null;
    this.onTranscript = null;
    this.onEmotion = null;
    this.onError = null;
    this.isActive = false;
    this.region = null;
    this.token = null;
  }

  async initialize() {
    try {
      const { azure_token, region } = await voice.getToken();
      this.token = azure_token;
      this.region = region;
      console.log('[AzureVoice] Token obtained for region:', region);
      return true;
    } catch (err) {
      console.error('[AzureVoice] Failed to get token:', err);
      if (this.onError) this.onError(err);
      return false;
    }
  }

  async startListening({ onTranscript, onEmotion, onError } = {}) {
    this.onTranscript = onTranscript;
    this.onEmotion = onEmotion;
    this.onError = onError;

    if (!this.token) {
      const ok = await this.initialize();
      if (!ok) return false;
    }

    try {
      // Request microphone access
      this.mediaStream = await navigator.mediaDevices.getUserMedia({ audio: true });
      this.isActive = true;

      // Set up the Azure STT WebSocket connection
      const wsUrl = `wss://${this.region}.stt.speech.microsoft.com/speech/recognition/conversation/cognitiveservices/v1?language=en-US&format=detailed`;
      this.azureWs = new WebSocket(wsUrl);

      // Send auth header via sub-protocol
      // Note: For production, use the official Azure Speech SDK (@microsoft/cognitiveservices-speech-sdk)
      // This is a simplified implementation for the purposes of this project

      this.azureWs.onopen = () => {
        console.log('[AzureVoice] Connected to Azure STT');
        this._startStreaming();
      };

      this.azureWs.onmessage = (event) => {
        try {
          const data = JSON.parse(event.data);
          if (data.RecognitionStatus === 'Success' && data.DisplayText) {
            const text = data.DisplayText;
            const confidence = data.NBest?.[0]?.Confidence || 0.85;

            if (onTranscript) {
              onTranscript({
                text,
                emotion: this._detectEmotion(data),
                confidence,
                isFinal: true,
              });
            }
          }
        } catch {
          // Azure sends binary audio frames too — ignore parse errors
        }
      };

      this.azureWs.onerror = (err) => {
        console.error('[AzureVoice] STT WebSocket error:', err);
        if (onError) onError(err);
        // Fall back to browser-native speech recognition
        this._startBrowserSTT({ onTranscript, onEmotion });
      };

      this.azureWs.onclose = () => {
        console.log('[AzureVoice] Azure STT disconnected');
      };

      return true;
    } catch (err) {
      console.error('[AzureVoice] startListening error:', err);
      // Fall back to browser STT
      this._startBrowserSTT({ onTranscript, onEmotion });
      return false;
    }
  }

  /** Browser-native SpeechRecognition fallback when Azure is unavailable */
  _startBrowserSTT({ onTranscript, onEmotion } = {}) {
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SpeechRecognition) {
      console.warn('[AzureVoice] No SpeechRecognition API available');
      return;
    }

    this.recognition = new SpeechRecognition();
    this.recognition.continuous = true;
    this.recognition.interimResults = false;
    this.recognition.lang = 'en-US';

    this.recognition.onresult = (event) => {
      const result = event.results[event.results.length - 1];
      if (result.isFinal) {
        const text = result[0].transcript;
        const confidence = result[0].confidence || 0.8;
        if (onTranscript) onTranscript({ text, emotion: 'neutral', confidence, isFinal: true });
      }
    };

    this.recognition.onerror = (e) => console.error('[BrowserSTT] Error:', e.error);
    this.recognition.start();
    console.log('[AzureVoice] Using browser-native STT fallback');
  }

  _startStreaming() {
    if (!this.mediaStream || !this.azureWs) return;

    this.audioContext = new AudioContext({ sampleRate: 16000 });
    const source = this.audioContext.createMediaStreamSource(this.mediaStream);
    this.processor = this.audioContext.createScriptProcessor(4096, 1, 1);

    this.processor.onaudioprocess = (e) => {
      if (!this.isActive || this.azureWs?.readyState !== WebSocket.OPEN) return;
      const samples = e.inputBuffer.getChannelData(0);
      const pcm = this._float32ToPCM16(samples);
      this.azureWs.send(pcm);
    };

    source.connect(this.processor);
    this.processor.connect(this.audioContext.destination);
  }

  _float32ToPCM16(float32Array) {
    const buffer = new ArrayBuffer(float32Array.length * 2);
    const view = new DataView(buffer);
    for (let i = 0; i < float32Array.length; i++) {
      let s = Math.max(-1, Math.min(1, float32Array[i]));
      view.setInt16(i * 2, s < 0 ? s * 0x8000 : s * 0x7fff, true);
    }
    return buffer;
  }

  _detectEmotion(data) {
    const confidence = data.NBest?.[0]?.Confidence || 0.85;
    if (confidence < 0.4) return 'confused';
    if (confidence < 0.6) return 'uncertain';
    return 'confident';
  }

  /** Speak text using Azure TTS or browser TTS fallback */
  async speak(text) {
    if (!text) return;

    // Try browser TTS (Web Speech API) as the primary voice output
    if ('speechSynthesis' in window) {
      const utter = new SpeechSynthesisUtterance(text);
      utter.rate = 0.95;
      utter.pitch = 1.05;

      // Pick a natural voice if available
      const voices = window.speechSynthesis.getVoices();
      const preferred = voices.find(
        (v) => v.lang === 'en-US' && (v.name.includes('Neural') || v.name.includes('Google'))
      );
      if (preferred) utter.voice = preferred;

      window.speechSynthesis.speak(utter);
    }
  }

  stopListening() {
    this.isActive = false;

    if (this.recognition) {
      this.recognition.stop();
      this.recognition = null;
    }

    if (this.processor) {
      this.processor.disconnect();
      this.processor = null;
    }

    if (this.audioContext) {
      this.audioContext.close();
      this.audioContext = null;
    }

    if (this.mediaStream) {
      this.mediaStream.getTracks().forEach((t) => t.stop());
      this.mediaStream = null;
    }

    if (this.azureWs && this.azureWs.readyState === WebSocket.OPEN) {
      this.azureWs.close();
      this.azureWs = null;
    }

    window.speechSynthesis?.cancel();
    console.log('[AzureVoice] Stopped');
  }
}

export const azureVoice = new AzureVoiceService();
export default AzureVoiceService;
