import { Request, Response, NextFunction } from 'express';
import bcrypt from 'bcryptjs';
import pool from '../config/db';
import { signToken } from '../utils/jwt';

export async function register(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const { name, email, password } = req.body;

    if (!name || !email || !password) {
      res.status(400).json({ error: 'name, email and password are required' });
      return;
    }

    // Check duplicate email
    const existing = await pool.query('SELECT id FROM users WHERE email = $1', [email]);
    if (existing.rows.length > 0) {
      res.status(409).json({ error: 'Email already registered' });
      return;
    }

    const hashed = await bcrypt.hash(password, 12);
    const result = await pool.query(
      'INSERT INTO users (name, email, password) VALUES ($1, $2, $3) RETURNING id, name, email, tier, created_at',
      [name, email, hashed]
    );

    const user = result.rows[0];
    const token = signToken({ userId: user.id, email: user.email });

    res.status(201).json({ token, user });
  } catch (err) {
    next(err);
  }
}

export async function login(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      res.status(400).json({ error: 'email and password are required' });
      return;
    }

    const result = await pool.query(
      'SELECT id, name, email, password, tier, avatar_url FROM users WHERE email = $1',
      [email]
    );

    const user = result.rows[0];
    if (!user) {
      res.status(401).json({ error: 'Invalid credentials' });
      return;
    }

    const valid = await bcrypt.compare(password, user.password);
    if (!valid) {
      res.status(401).json({ error: 'Invalid credentials' });
      return;
    }

    const token = signToken({ userId: user.id, email: user.email });
    const { password: _pw, ...safeUser } = user;

    res.json({ token, user: safeUser });
  } catch (err) {
    next(err);
  }
}
