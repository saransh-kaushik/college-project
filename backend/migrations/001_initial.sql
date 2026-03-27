-- ─────────────────────────────────────────────
--  VoiceTutor AI — Initial Database Migration
-- ─────────────────────────────────────────────
-- Extension for UUID generation
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- ── Users ────────────────────────────────────
CREATE TABLE IF NOT EXISTS users (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name        VARCHAR(100) NOT NULL,
  email       VARCHAR(150) UNIQUE NOT NULL,
  password    TEXT NOT NULL,
  avatar_url  TEXT,
  tier        VARCHAR(50) DEFAULT 'Free',
  settings    JSONB DEFAULT '{}',
  created_at  TIMESTAMPTZ DEFAULT NOW()
);

-- ── Sessions ─────────────────────────────────
CREATE TABLE IF NOT EXISTS sessions (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id     UUID REFERENCES users(id) ON DELETE CASCADE,
  subject     VARCHAR(50) NOT NULL,
  topic       VARCHAR(150),
  title       TEXT,
  started_at  TIMESTAMPTZ DEFAULT NOW(),
  ended_at    TIMESTAMPTZ,
  duration_s  INTEGER,
  score       NUMERIC(5,2),
  share_token TEXT UNIQUE
);

-- ── Transcripts ───────────────────────────────
CREATE TABLE IF NOT EXISTS transcripts (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id  UUID REFERENCES sessions(id) ON DELETE CASCADE,
  role        VARCHAR(10) NOT NULL CHECK (role IN ('student', 'agent')),
  text        TEXT NOT NULL,
  emotion     VARCHAR(50),
  confidence  NUMERIC(3,2),
  created_at  TIMESTAMPTZ DEFAULT NOW()
);

-- ── Mastery Levels ────────────────────────────
CREATE TABLE IF NOT EXISTS mastery (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id     UUID REFERENCES users(id) ON DELETE CASCADE,
  subject     VARCHAR(50) NOT NULL,
  topic       VARCHAR(150) NOT NULL,
  level       NUMERIC(3,2) DEFAULT 0.0 CHECK (level >= 0 AND level <= 1),
  updated_at  TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id, subject, topic)
);

-- ── Assessments ───────────────────────────────
CREATE TABLE IF NOT EXISTS assessments (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id  UUID REFERENCES sessions(id) ON DELETE CASCADE,
  question    TEXT NOT NULL,
  student_ans TEXT,
  score       NUMERIC(3,2),
  created_at  TIMESTAMPTZ DEFAULT NOW()
);

-- ── Documents (RAG uploads) ───────────────────
CREATE TABLE IF NOT EXISTS documents (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id     UUID REFERENCES users(id) ON DELETE CASCADE,
  session_id  UUID REFERENCES sessions(id) ON DELETE SET NULL,
  filename    TEXT NOT NULL,
  content     TEXT,
  parsed      BOOLEAN DEFAULT FALSE,
  created_at  TIMESTAMPTZ DEFAULT NOW()
);

-- ── Indexes ───────────────────────────────────
CREATE INDEX IF NOT EXISTS idx_sessions_user_id ON sessions(user_id);
CREATE INDEX IF NOT EXISTS idx_transcripts_session_id ON transcripts(session_id);
CREATE INDEX IF NOT EXISTS idx_mastery_user_id ON mastery(user_id);
CREATE INDEX IF NOT EXISTS idx_assessments_session_id ON assessments(session_id);
