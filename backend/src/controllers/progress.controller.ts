import { Response, NextFunction } from 'express';
import pool from '../config/db';
import { AuthRequest } from '../middlewares/auth.middleware';

export async function getProgress(req: AuthRequest, res: Response, next: NextFunction): Promise<void> {
  try {
    const userId = req.params.userId || req.user!.userId;

    const masteryQ = await pool.query(
      `SELECT subject, topic, level FROM mastery WHERE user_id = $1 ORDER BY updated_at DESC`,
      [userId]
    );

    const overall = masteryQ.rows.length > 0
      ? masteryQ.rows.reduce((sum, r) => sum + parseFloat(r.level), 0) / masteryQ.rows.length
      : 0;

    // Mock upcoming assessments based on lowest mastery topics
    const weakTopics = [...masteryQ.rows]
      .sort((a, b) => parseFloat(a.level) - parseFloat(b.level))
      .slice(0, 2);

    const upcomingAssessments = weakTopics.map((t) => ({
      title: t.topic,
      time: 'Scheduled',
      readiness: parseFloat(t.level),
    }));

    res.json({
      overall_mastery: parseFloat(overall.toFixed(2)),
      mastery_by_topic: masteryQ.rows,
      upcoming_assessments: upcomingAssessments,
    });
  } catch (err) {
    next(err);
  }
}

export async function getSessionHistory(req: AuthRequest, res: Response, next: NextFunction): Promise<void> {
  try {
    const userId = req.params.userId || req.user!.userId;

    const result = await pool.query(
      `SELECT id, subject, topic, title, started_at, ended_at, duration_s, score
       FROM sessions WHERE user_id = $1 ORDER BY started_at DESC LIMIT 30`,
      [userId]
    );

    res.json({ history: result.rows });
  } catch (err) {
    next(err);
  }
}
