-- Add chunk_count to documents table so we can display it in the UI
ALTER TABLE documents ADD COLUMN IF NOT EXISTS chunk_count INTEGER DEFAULT 0;
