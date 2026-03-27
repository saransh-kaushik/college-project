/**
 * socket.js — WebSocket client for real-time communication with the backend.
 *
 * Events sent TO server:
 *   - TRANSCRIPT: Student speech transcript + emotion data
 *   - SESSION_END: User ended the session
 *
 * Events received FROM server:
 *   - CONNECTED: Auth successful
 *   - AI_RESPONSE: Text from the AI tutor agent
 *   - MASTERY_UPDATE: Topic mastery level changed
 *   - LIVE_ANALYSIS_KEY_CONCEPT: New concept detected in session
 *   - ASSESSMENT_QUESTION: Agent asks a comprehension question
 *   - SESSION_SUMMARY: Final session stats after SESSION_END
 *   - ERROR: Server-side error
 */

const WS_URL = `${window.location.protocol === 'https:' ? 'wss' : 'ws'}://${window.location.host}/ws`;

class VoiceTutorSocket {
  constructor() {
    this.ws = null;
    this.listeners = {};
    this.reconnectAttempts = 0;
    this.maxReconnects = 3;
  }

  connect(token) {
    return new Promise((resolve, reject) => {
      const url = `${WS_URL}?token=${encodeURIComponent(token)}`;
      this.ws = new WebSocket(url);

      this.ws.onopen = () => {
        console.log('[Socket] Connected to VoiceTutor backend');
        this.reconnectAttempts = 0;
      };

      this.ws.onmessage = (event) => {
        try {
          const msg = JSON.parse(event.data);
          if (msg.type === 'CONNECTED') resolve(this);
          this.emit(msg.type, msg);
        } catch (e) {
          console.error('[Socket] Failed to parse message:', e);
        }
      };

      this.ws.onerror = (err) => {
        console.error('[Socket] Error:', err);
        reject(err);
      };

      this.ws.onclose = (event) => {
        console.log(`[Socket] Disconnected: ${event.code} ${event.reason}`);
        this.emit('DISCONNECTED', { code: event.code, reason: event.reason });
      };
    });
  }

  sendTranscript({ sessionId, subject, text, emotion, confidence }) {
    this.send({
      type: 'TRANSCRIPT',
      sessionId,
      subject,
      text,
      emotion: emotion || 'neutral',
      confidence: confidence ?? 0.85,
    });
  }

  sendSessionEnd(sessionId) {
    this.send({ type: 'SESSION_END', sessionId });
  }

  send(data) {
    if (this.ws && this.ws.readyState === WebSocket.OPEN) {
      this.ws.send(JSON.stringify(data));
    } else {
      console.warn('[Socket] Cannot send — WebSocket not open');
    }
  }

  on(event, callback) {
    if (!this.listeners[event]) this.listeners[event] = [];
    this.listeners[event].push(callback);
    return this; // chainable
  }

  off(event, callback) {
    if (this.listeners[event]) {
      this.listeners[event] = this.listeners[event].filter((cb) => cb !== callback);
    }
  }

  emit(event, data) {
    (this.listeners[event] || []).forEach((cb) => cb(data));
  }

  disconnect() {
    if (this.ws) {
      this.ws.close(1000, 'User ended session');
      this.ws = null;
    }
    this.listeners = {};
  }

  isConnected() {
    return this.ws && this.ws.readyState === WebSocket.OPEN;
  }
}

// Export singleton instance
export const voiceSocket = new VoiceTutorSocket();
export default VoiceTutorSocket;
