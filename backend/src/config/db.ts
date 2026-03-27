import { Pool } from 'pg';
import fs from 'fs';
import path from 'path';
import { logger } from '../utils/logger';

export const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false,
});

pool.on('error', (err) => {
  logger.error('Unexpected PostgreSQL error:', err);
});

export async function runMigrations() {
  const migrationsDir = path.join(__dirname, '../../migrations');
  const files = fs.readdirSync(migrationsDir).sort();

  for (const file of files) {
    if (!file.endsWith('.sql')) continue;
    const sql = fs.readFileSync(path.join(migrationsDir, file), 'utf-8');
    logger.info(`Running migration: ${file}`);
    await pool.query(sql);
  }
  logger.info('Migrations complete.');
}

export default pool;
