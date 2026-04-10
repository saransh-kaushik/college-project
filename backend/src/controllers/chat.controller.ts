import { Response, NextFunction } from 'express';
import pool from '../config/db';
import { AuthRequest } from '../middlewares/auth.middleware';
import { getAgent } from '../agents/agentRouter';
import { chat } from '../services/openai.service';
import { isAllowedFile, extractText, chunkText, ingestDocument } from '../services/rag.service';
import multer from 'multer';
import { logger } from '../utils/logger';

// ── Multer — memory storage, 20 MB cap ───────────────────────────────────────
const storage = multer.memoryStorage();
export const upload = multer({
  storage,
  limits: { fileSize: 20 * 1024 * 1024 }, // 20 MB
  fileFilter(_req, file, cb) {
    if (isAllowedFile(file.mimetype, file.originalname)) {
      cb(null, true);
    } else {
      const ext = file.originalname.slice(file.originalname.lastIndexOf('.')).toLowerCase();
      cb(new Error(`Unsupported file type "${ext}". Only .pdf and .txt are allowed.`));
    }
  },
});

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

// ── sendMessage ───────────────────────────────────────────────────────────────
export async function sendMessage(req: AuthRequest, res: Response, next: NextFunction): Promise<void> {
  try {
    const userId = req.user!.userId;
    const { session_id, text, document_id } = req.body;

    if (!text) {
      res.status(400).json({ error: 'text is required' });
      return;
    }

    // Only query DB when we have a real UUID session id
    let subject = 'biology';
    if (session_id && UUID_RE.test(session_id)) {
      const sessionQ = await pool.query('SELECT subject FROM sessions WHERE id = $1', [session_id]);
      subject = sessionQ.rows[0]?.subject || 'biology';
    }

    // Validate optional document_id
    const documentId: string | undefined =
      document_id && UUID_RE.test(document_id) ? document_id : undefined;

    let aiResponse: string;
    try {
      const agent = getAgent(subject);
      const result = await agent.processTranscript({
        userId,
        sessionId: session_id,
        text,
        emotion: 'neutral',
        confidence: 0.9,
        documentId,
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

// ── getUserDocuments ──────────────────────────────────────────────────────────
export async function getUserDocuments(req: AuthRequest, res: Response, next: NextFunction): Promise<void> {
  try {
    const userId = req.user!.userId;
    const result = await pool.query(
      `SELECT id, filename, chunk_count, parsed, created_at
       FROM documents
       WHERE user_id = $1
       ORDER BY created_at DESC`,
      [userId],
    );
    res.json({ documents: result.rows });
  } catch (err) {
    next(err);
  }
}

// ── uploadDocument ────────────────────────────────────────────────────────────
export async function uploadDocument(req: AuthRequest, res: Response, next: NextFunction): Promise<void> {
  try {
    const userId = req.user!.userId;
    const file = req.file;

    if (!file) {
      res.status(400).json({ error: 'No file uploaded' });
      return;
    }

    if (!isAllowedFile(file.mimetype, file.originalname)) {
      res.status(415).json({ error: 'Only .pdf and .txt files are supported.' });
      return;
    }

    const sessionId: string | undefined =
      req.body.session_id && UUID_RE.test(req.body.session_id) ? req.body.session_id : undefined;

    logger.info(`[RAG] Processing upload: ${file.originalname} (${file.size} bytes) for user ${userId}`);

    // 1. Extract text from PDF or TXT
    let rawText: string;
    try {
      rawText = await extractText(file.buffer, file.mimetype, file.originalname);
    } catch (extractErr) {
      logger.error('[RAG] Text extraction failed:', extractErr);
      res.status(422).json({
        error: 'Could not extract text from the uploaded file. Make sure it is a valid PDF or plain-text file.',
      });
      return;
    }

    if (!rawText || rawText.trim().length < 10) {
      res.status(422).json({ error: 'The uploaded file appears to be empty or contains no readable text.' });
      return;
    }

    // 2. Chunk text
    const chunks = chunkText(rawText);
    logger.info(`[RAG] Chunked "${file.originalname}" into ${chunks.length} chunks`);

    // 3. Persist document record (content stored as first 5000-char preview)
    const preview = rawText.replace(/\0/g, '').slice(0, 5000);
    const dbResult = await pool.query(
      `INSERT INTO documents (user_id, session_id, filename, content, parsed, chunk_count)
       VALUES ($1, $2, $3, $4, $5, $6)
       RETURNING id`,
      [userId, sessionId || null, file.originalname, preview, true, chunks.length],
    );
    const documentId: string = dbResult.rows[0].id;

    // 4. Embed chunks and upsert to Pinecone (non-fatal if Pinecone is down)
    const pineconeChunks = await ingestDocument(documentId, userId, file.originalname, chunks);

    logger.info(`[RAG] Document ${documentId} ingested: ${pineconeChunks}/${chunks.length} chunks in Pinecone`);

    res.json({
      document_id: documentId,
      filename: file.originalname,
      chunk_count: chunks.length,
      pinecone_chunks: pineconeChunks,
      parsed: true,
    });
  } catch (err) {
    next(err);
  }
}
