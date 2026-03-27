import { Response, NextFunction } from 'express';
import pool from '../config/db';
import { AuthRequest } from '../middlewares/auth.middleware';
import { getAgent } from '../agents/agentRouter';
import { chat } from '../services/openai.service';
import multer from 'multer';

const storage = multer.memoryStorage();
export const upload = multer({ storage, limits: { fileSize: 10 * 1024 * 1024 } });

export async function sendMessage(req: AuthRequest, res: Response, next: NextFunction): Promise<void> {
  try {
    const userId = req.user!.userId;
    const { session_id, text } = req.body;

    if (!session_id || !text) {
      res.status(400).json({ error: 'session_id and text are required' });
      return;
    }

    // Get session subject
    const sessionQ = await pool.query('SELECT subject FROM sessions WHERE id = $1', [session_id]);
    const subject = sessionQ.rows[0]?.subject || 'biology';

    let aiResponse: string;
    try {
      const agent = getAgent(subject);
      const result = await agent.processTranscript({
        userId,
        sessionId: session_id,
        text,
        emotion: 'neutral',
        confidence: 0.9,
      });
      aiResponse = result.text;
    } catch {
      // Fallback to direct chat if agent fails
      aiResponse = await chat([
        { role: 'system', content: `You are a helpful ${subject} tutor.` },
        { role: 'user', content: text },
      ]);
    }

    res.json({ ai_response: aiResponse });
  } catch (err) {
    next(err);
  }
}

export async function uploadDocument(req: AuthRequest, res: Response, next: NextFunction): Promise<void> {
  try {
    const userId = req.user!.userId;
    const file = req.file;

    if (!file) {
      res.status(400).json({ error: 'No file uploaded' });
      return;
    }

    const content = file.buffer.toString('utf-8').slice(0, 50000); // Limit content size

    const result = await pool.query(
      'INSERT INTO documents (user_id, filename, content, parsed) VALUES ($1, $2, $3, $4) RETURNING id',
      [userId, file.originalname, content, true]
    );

    res.json({ document_id: result.rows[0].id, parsed: true });
  } catch (err) {
    next(err);
  }
}
