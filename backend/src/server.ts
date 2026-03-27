import dotenv from 'dotenv';
dotenv.config();

import express from 'express';
import cors from 'cors';
import http from 'http';
import { WebSocketServer } from 'ws';

import authRoutes from './routes/auth.routes';
import userRoutes from './routes/user.routes';
import voiceRoutes from './routes/voice.routes';
import sessionRoutes from './routes/session.routes';
import chatRoutes from './routes/chat.routes';
import progressRoutes from './routes/progress.routes';
import resourceRoutes from './routes/resource.routes';

import { errorMiddleware } from './middlewares/error.middleware';
import { setupWebSocket } from './websocket/wsHandler';
import { logger } from './utils/logger';

const app = express();
const server = http.createServer(app);

// ── Middleware ──────────────────────────────────────────────────────────────
app.use(cors({
  origin: process.env.FRONTEND_URL || 'http://localhost:5173',
  credentials: true,
}));
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ extended: true, limit: '50mb' }));

// ── Routes ──────────────────────────────────────────────────────────────────
app.use('/api/auth', authRoutes);
app.use('/api/user', userRoutes);
app.use('/api/voice', voiceRoutes);
app.use('/api/sessions', sessionRoutes);
app.use('/api/chat', chatRoutes);
app.use('/api/progress', progressRoutes);
app.use('/api/resources', resourceRoutes);

// Health check
app.get('/api/health', (_req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// ── WebSocket ────────────────────────────────────────────────────────────────
const wss = new WebSocketServer({ server, path: '/ws' });
setupWebSocket(wss);

// ── Error Middleware ─────────────────────────────────────────────────────────
app.use(errorMiddleware);

// ── Start ────────────────────────────────────────────────────────────────────
const PORT = parseInt(process.env.PORT || '3001', 10);
server.listen(PORT, () => {
  logger.info(`🚀 VoiceTutor backend running on http://localhost:${PORT}`);
  logger.info(`🔌 WebSocket ready at ws://localhost:${PORT}/ws`);
});

export default app;
