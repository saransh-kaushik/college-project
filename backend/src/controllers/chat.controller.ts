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
    const ext = file.originalname.slice(file.originalname.lastIndexOf('.')).toLowerCase();
    if (isAllowedFile(file.mimetype, file.originalname)) {
      cb(null, true);
    } else {
      cb(new Error(`Unsupported file type "${ext}". Only .pdf and .txt are allowed.`));
    }
  },
});

// ── sendMessage ───────────────────────────────────────────────────────────────
export async function sendMessage(req: AuthRequest, res: Response, next: NextFunction): Promise<void> {
  try {
    const userId = req.user!.userId;
    const { session_id, text } = req.body;

    if (!text) {
      res.status(400).json({ error: 'text is required' });
      return;
    }


    // Only query the DB if we have a real UUID-shaped session id
    const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
    let subject = 'biology';
    if (session_id && UUID_RE.test(session_id)) {
      const sessionQ = await pool.query('SELECT subject FROM sessions WHERE id = $1', [session_id]);
      subject = sessionQ.rows[0]?.subject || 'biology';
    }

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

// ── uploadDocument ────────────────────────────────────────────────────────────
export async function uploadDocument(req: AuthRequest, res: Response, next: NextFunction): Promise<void> {
  try {
    const userId = req.user!.userId;
    const file = req.file;

    if (!file) {
      res.status(400).json({ error: 'No file uploaded' });
      return;
    }

    // Double-check type (multer fileFilter already guards this, but be explicit)
    if (!isAllowedFile(file.mimetype, file.originalname)) {
      res.status(415).json({ error: 'Only .pdf and .txt files are supported.' });
      return;
    }

    const sessionId: string | undefined = req.body.session_id || undefined;

    logger.info(`[RAG] Processing upload: ${file.originalname} (${file.size} bytes) for user ${userId}`);

    // 1. Extract text from PDF or TXT
    let rawText: string;
    try {
      rawText = await extractText(file.buffer, file.mimetype, file.originalname);
    } catch (extractErr) {
      logger.error('[RAG] Text extraction failed:', extractErr);
      res.status(422).json({ error: 'Could not extract text from the uploaded file. Make sure it is a valid PDF or plain-text file.' });
      return;
    }

    if (!rawText || rawText.trim().length < 10) {
      res.status(422).json({ error: 'The uploaded file appears to be empty or contains no readable text.' });
      return;
    }

    // 2. Chunk text
    const chunks = chunkText(rawText);
    logger.info(`[RAG] Chunked "${file.originalname}" into ${chunks.length} chunks`);

    // 3. Persist document record in PostgreSQL (content stored as first 5000 chars preview)
    const preview = rawText.replace(/\0/g, '').slice(0, 5000);
    const dbResult = await pool.query(
      `INSERT INTO documents (user_id, session_id, filename, content, parsed)
       VALUES ($1, $2, $3, $4, $5)
       RETURNING id`,
      [userId, sessionId || null, file.originalname, preview, true],
    );
    const documentId: string = dbResult.rows[0].id;

    // 4. Embed chunks and upsert to Pinecone (async — don't fail the request if Pinecone is down)
    const chunkCount = await ingestDocument(documentId, userId, file.originalname, chunks);

    logger.info(`[RAG] Document ${documentId} ingested: ${chunkCount}/${chunks.length} chunks in Pinecone`);

    res.json({
      document_id: documentId,
      filename: file.originalname,
      chunk_count: chunks.length,
      pinecone_chunks: chunkCount,
      parsed: true,
    });
  } catch (err) {
    next(err);
  }
}
