import { Response, NextFunction } from 'express';
import { v4 as uuidv4 } from 'uuid';
import pool from '../config/db';
import { AuthRequest } from '../middlewares/auth.middleware';
import { finalizeSession } from '../services/analytics.service';

export async function startSession(req: AuthRequest, res: Response, next: NextFunction): Promise<void> {
  try {
    const userId = req.user!.userId;
    const { subject, topic } = req.body;

    if (!subject) {
      res.status(400).json({ error: 'subject is required' });
      return;
    }

    const title = topic
      ? `${subject.charAt(0).toUpperCase() + subject.slice(1)}: ${topic}`
      : `${subject.charAt(0).toUpperCase() + subject.slice(1)} Session`;

    const result = await pool.query(
      'INSERT INTO sessions (user_id, subject, topic, title) VALUES ($1, $2, $3, $4) RETURNING id',
      [userId, subject, topic || null, title]
    );

    res.status(201).json({ session_id: result.rows[0].id });
  } catch (err) {
    next(err);
  }
}

export async function endSession(req: AuthRequest, res: Response, next: NextFunction): Promise<void> {
  try {
    const { sessionId } = req.params;

    await pool.query('UPDATE sessions SET ended_at = NOW() WHERE id = $1', [sessionId]);
    const summary = await finalizeSession(sessionId);

    res.json({ success: true, summary });
  } catch (err) {
    next(err);
  }
}

export async function getSession(req: AuthRequest, res: Response, next: NextFunction): Promise<void> {
  try {
    const { sessionId } = req.params;

    const sessionQ = await pool.query(
      'SELECT id, title, subject, topic, started_at, ended_at, duration_s, score FROM sessions WHERE id = $1',
      [sessionId]
    );
    if (!sessionQ.rows[0]) {
      res.status(404).json({ error: 'Session not found' });
      return;
    }

    const transcripts = await pool.query(
      'SELECT role, text, emotion, confidence, created_at FROM transcripts WHERE session_id = $1 ORDER BY created_at ASC',
      [sessionId]
    );

    res.json({
      title: sessionQ.rows[0].title,
      session: sessionQ.rows[0],
      messages: transcripts.rows.map((t) => ({
        role: t.role,
        content: t.text,
        emotion: t.emotion,
        confidence: t.confidence,
        timestamp: t.created_at,
      })),
    });
  } catch (err) {
    next(err);
  }
}

export async function shareSession(req: AuthRequest, res: Response, next: NextFunction): Promise<void> {
  try {
    const { sessionId } = req.params;
    const shareToken = uuidv4();

    await pool.query('UPDATE sessions SET share_token = $1 WHERE id = $2', [shareToken, sessionId]);

    const baseUrl = process.env.FRONTEND_URL || 'http://localhost:5173';
    res.json({ share_url: `${baseUrl}/share/${shareToken}` });
  } catch (err) {
    next(err);
  }
}
