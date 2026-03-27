import { Response, NextFunction } from 'express';
import pool from '../config/db';
import { AuthRequest } from '../middlewares/auth.middleware';

export async function getProfile(req: AuthRequest, res: Response, next: NextFunction): Promise<void> {
  try {
    const userId = req.user!.userId;
    const result = await pool.query(
      'SELECT id, name, email, tier, avatar_url, created_at FROM users WHERE id = $1',
      [userId]
    );
    if (!result.rows[0]) {
      res.status(404).json({ error: 'User not found' });
      return;
    }
    res.json(result.rows[0]);
  } catch (err) {
    next(err);
  }
}

export async function updateSettings(req: AuthRequest, res: Response, next: NextFunction): Promise<void> {
  try {
    const userId = req.user!.userId;
    const settings = req.body;
    await pool.query('UPDATE users SET settings = $1 WHERE id = $2', [settings, userId]);
    res.json({ success: true });
  } catch (err) {
    next(err);
  }
}

export async function getJourneys(req: AuthRequest, res: Response, next: NextFunction): Promise<void> {
  try {
    const userId = req.user!.userId;
    // Derive unique subjects from sessions as "journeys"
    const result = await pool.query(
      `SELECT DISTINCT subject as id, subject as name,
        CASE subject
          WHEN 'physics' THEN 'science'
          WHEN 'biology' THEN 'biotech'
          WHEN 'chemistry' THEN 'science'
          ELSE 'school'
        END as icon
       FROM sessions WHERE user_id = $1 ORDER BY subject`,
      [userId]
    );

    // If no sessions yet, return default journeys
    const journeys = result.rows.length > 0 ? result.rows : [
      { id: 'biology', name: 'Bio-Chemistry Path', icon: 'science' },
      { id: 'physics', name: 'Physics Fundamentals', icon: 'bolt' },
      { id: 'chemistry', name: 'Chemistry Lab', icon: 'biotech' },
    ];

    res.json({ journeys });
  } catch (err) {
    next(err);
  }
}

export async function getUserSessions(req: AuthRequest, res: Response, next: NextFunction): Promise<void> {
  try {
    const userId = req.user!.userId;
    const result = await pool.query(
      `SELECT id, title, subject, topic, started_at as date, score
       FROM sessions WHERE user_id = $1 ORDER BY started_at DESC LIMIT 20`,
      [userId]
    );
    res.json({ sessions: result.rows });
  } catch (err) {
    next(err);
  }
}
