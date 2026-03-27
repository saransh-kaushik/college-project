import pool from '../config/db';
import { logger } from '../utils/logger';

/**
 * Update the mastery level for a (user, subject, topic) triple.
 * Uses a weighted average: new_level = old * 0.7 + score * 0.3
 */
export async function updateMastery(
  userId: string,
  subject: string,
  topic: string,
  score: number
): Promise<number> {
  try {
    const existing = await pool.query(
      'SELECT level FROM mastery WHERE user_id = $1 AND subject = $2 AND topic = $3',
      [userId, subject, topic]
    );

    let newLevel: number;
    if (existing.rows.length > 0) {
      const oldLevel = parseFloat(existing.rows[0].level);
      newLevel = Math.min(1.0, oldLevel * 0.7 + score * 0.3);
      await pool.query(
        'UPDATE mastery SET level = $1, updated_at = NOW() WHERE user_id = $2 AND subject = $3 AND topic = $4',
        [newLevel, userId, subject, topic]
      );
    } else {
      newLevel = Math.min(1.0, score);
      await pool.query(
        'INSERT INTO mastery (user_id, subject, topic, level) VALUES ($1, $2, $3, $4)',
        [userId, subject, topic, newLevel]
      );
    }

    return newLevel;
  } catch (err) {
    logger.error('Failed to update mastery:', err);
    return 0;
  }
}

/**
 * Finalize session analytics — calculate duration, average mastery score.
 */
export async function finalizeSession(sessionId: string): Promise<{ duration: number; score: number }> {
  try {
    const sessionQ = await pool.query(
      'SELECT started_at, ended_at FROM sessions WHERE id = $1',
      [sessionId]
    );
    const s = sessionQ.rows[0];
    if (!s) return { duration: 0, score: 0 };

    const started = new Date(s.started_at).getTime();
    const ended = s.ended_at ? new Date(s.ended_at).getTime() : Date.now();
    const duration = Math.floor((ended - started) / 1000);

    // Average assessment scores
    const scoreQ = await pool.query(
      'SELECT AVG(score) as avg_score FROM assessments WHERE session_id = $1 AND score IS NOT NULL',
      [sessionId]
    );
    const score = parseFloat(scoreQ.rows[0]?.avg_score || '0') * 100;

    await pool.query(
      'UPDATE sessions SET duration_s = $1, score = $2 WHERE id = $3',
      [duration, score, sessionId]
    );

    return { duration, score };
  } catch (err) {
    logger.error('Failed to finalize session:', err);
    return { duration: 0, score: 0 };
  }
}
