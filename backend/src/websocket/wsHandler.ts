import { WebSocketServer, WebSocket } from 'ws';
import { IncomingMessage } from 'http';
import { verifyToken } from '../utils/jwt';
import { getAgent } from '../agents/agentRouter';
import { finalizeSession } from '../services/analytics.service';
import { logger } from '../utils/logger';

interface AuthenticatedWS extends WebSocket {
  userId?: string;
  sessionId?: string;
  subject?: string;
}

interface ClientMessage {
  type: 'TRANSCRIPT' | 'SESSION_END';
  sessionId?: string;
  subject?: string;
  text?: string;
  emotion?: string;
  confidence?: number;
}

function sendJSON(ws: WebSocket, data: object) {
  if (ws.readyState === WebSocket.OPEN) {
    ws.send(JSON.stringify(data));
  }
}

export function setupWebSocket(wss: WebSocketServer) {
  wss.on('connection', (ws: AuthenticatedWS, req: IncomingMessage) => {
    // ── Auth ─────────────────────────────────────────────────────────────────
    const url = new URL(req.url || '', 'http://localhost');
    const token = url.searchParams.get('token');

    if (!token) {
      ws.close(4001, 'No token provided');
      logger.warn('WS connection rejected — no token');
      return;
    }

    try {
      const payload = verifyToken(token);
      ws.userId = payload.userId;
      logger.info(`WS connected: user ${payload.userId}`);
    } catch {
      ws.close(4002, 'Invalid token');
      logger.warn('WS connection rejected — invalid token');
      return;
    }

    sendJSON(ws, { type: 'CONNECTED', message: 'Voice session ready' });

    // ── Message Handler ───────────────────────────────────────────────────────
    ws.on('message', async (raw) => {
      let msg: ClientMessage;
      try {
        msg = JSON.parse(raw.toString());
      } catch {
        sendJSON(ws, { type: 'ERROR', message: 'Invalid JSON' });
        return;
      }

      switch (msg.type) {
        case 'TRANSCRIPT': {
          if (!msg.sessionId || !msg.subject || !msg.text) {
            sendJSON(ws, { type: 'ERROR', message: 'TRANSCRIPT requires sessionId, subject, text' });
            return;
          }

          ws.sessionId = msg.sessionId;
          ws.subject = msg.subject;

          try {
            const agent = getAgent(msg.subject);
            const result = await agent.processTranscript({
              userId: ws.userId!,
              sessionId: msg.sessionId,
              text: msg.text,
              emotion: msg.emotion,
              confidence: msg.confidence,
            });

            // Send AI response
            sendJSON(ws, { type: 'AI_RESPONSE', text: result.text });

            // Send mastery update
            if (result.masteryUpdate) {
              sendJSON(ws, {
                type: 'MASTERY_UPDATE',
                topic: result.masteryUpdate.topic,
                level: result.masteryUpdate.level,
              });
            }

            // Send key concept
            if (result.keyConcept) {
              sendJSON(ws, {
                type: 'LIVE_ANALYSIS_KEY_CONCEPT',
                ...result.keyConcept,
              });
            }

            // Send assessment question
            if (result.assessmentQuestion) {
              sendJSON(ws, {
                type: 'ASSESSMENT_QUESTION',
                question: result.assessmentQuestion,
              });
            }
          } catch (err) {
            logger.error('Agent processing error:', err);
            sendJSON(ws, {
              type: 'AI_RESPONSE',
              text: "I'm having trouble right now. Let's continue in a moment!",
            });
          }
          break;
        }

        case 'SESSION_END': {
          if (msg.sessionId) {
            const analytics = await finalizeSession(msg.sessionId);
            sendJSON(ws, { type: 'SESSION_SUMMARY', ...analytics });
          }
          ws.close(1000, 'Session ended');
          break;
        }

        default:
          sendJSON(ws, { type: 'ERROR', message: `Unknown message type: ${msg.type}` });
      }
    });

    ws.on('close', () => {
      logger.info(`WS disconnected: user ${ws.userId}`);
    });

    ws.on('error', (err) => {
      logger.error('WS error:', err);
    });
  });

  logger.info('WebSocket server configured');
}
