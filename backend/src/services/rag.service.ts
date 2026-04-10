/**
 * rag.service.ts — Document ingestion pipeline for RAG
 *
 * Pipeline:
 *   1. Extract text  (PDF via pdf-parse, TXT via utf-8 decode)
 *   2. Chunk text    (fixed-size with overlap, no external deps)
 *   3. Embed chunks  (Azure OpenAI text-embedding-3-small)
 *   4. Upsert chunks (Pinecone, namespace = user_<userId>)
 */

import { embed } from './openai.service';
import { getPineconeClient, PINECONE_INDEX } from '../config/pinecone';
import { logger } from '../utils/logger';

// ── PDF parser ───────────────────────────────────────────────────────────────
// pdf-parse@1.x ships as CJS and exports a plain function via module.exports.
// The @types/pdf-parse declaration is a namespace type, so `import default`
// fails type-check. We use require() and cast directly.
// eslint-disable-next-line @typescript-eslint/no-var-requires
const pdfParse = require('pdf-parse') as (
  buffer: Buffer,
  options?: Record<string, unknown>
) => Promise<{ text: string; numpages: number }>;

// ── Supported MIME types & extensions ─────────────────────────────────────────
const ALLOWED_MIME_TYPES = new Set(['application/pdf', 'text/plain']);
const ALLOWED_EXTENSIONS = new Set(['.pdf', '.txt']);

export function isAllowedFile(mimetype: string, originalname: string): boolean {
  const ext = originalname.slice(originalname.lastIndexOf('.')).toLowerCase();
  return ALLOWED_MIME_TYPES.has(mimetype) || ALLOWED_EXTENSIONS.has(ext);
}

// ── Text extraction ───────────────────────────────────────────────────────────
export async function extractText(
  buffer: Buffer,
  mimetype: string,
  originalname: string,
): Promise<string> {
  const ext = originalname.slice(originalname.lastIndexOf('.')).toLowerCase();

  if (mimetype === 'application/pdf' || ext === '.pdf') {
    const data = await pdfParse(buffer);

    return data.text;
  }

  // Plain text — strip null bytes that cause Postgres UTF-8 errors
  return buffer.toString('utf-8').replace(/\0/g, '');
}

// ── Chunking ──────────────────────────────────────────────────────────────────
/**
 * Split text into overlapping fixed-size chunks.
 * @param text     Full document text
 * @param size     Target chunk size in characters (default 800)
 * @param overlap  Overlap between consecutive chunks in characters (default 120)
 */
export function chunkText(text: string, size = 800, overlap = 120): string[] {
  // Normalise whitespace
  const cleaned = text.replace(/\r\n/g, '\n').replace(/[ \t]+/g, ' ').trim();

  if (cleaned.length === 0) return [];
  if (cleaned.length <= size) return [cleaned];

  const chunks: string[] = [];
  let start = 0;

  while (start < cleaned.length) {
    const end = Math.min(start + size, cleaned.length);
    const chunk = cleaned.slice(start, end).trim();
    if (chunk.length > 20) chunks.push(chunk); // skip tiny trailing fragments
    if (end >= cleaned.length) break;
    start += size - overlap;
  }

  return chunks;
}

// ── Pinecone ingestion ────────────────────────────────────────────────────────
/**
 * Embed each chunk and upsert to Pinecone.
 * Namespace: `user_<userId>`  (per-user isolation)
 * Vector ID: `doc_<documentId>_chunk_<i>`
 *
 * @returns Number of chunks successfully upserted
 */
export async function ingestDocument(
  documentId: string,
  userId: string,
  filename: string,
  chunks: string[],
): Promise<number> {
  if (chunks.length === 0) return 0;

  const namespace = `user_${userId}`;
  let upserted = 0;

  try {
    const pc = getPineconeClient();
    const index = pc.index(PINECONE_INDEX);

    // Embed and upsert in small batches to stay within API limits
    const BATCH = 10;
    for (let b = 0; b < chunks.length; b += BATCH) {
      const batch = chunks.slice(b, b + BATCH);

      const vectors = await Promise.all(
        batch.map(async (chunk, i) => {
          const values = await embed(chunk);
          return {
            id: `doc_${documentId}_chunk_${b + i}`,
            values,
            metadata: {
              text: chunk,
              documentId,
              filename,
              userId,
              chunkIndex: b + i,
            },
          };
        }),
      );

      await index.namespace(namespace).upsert(vectors);
      upserted += vectors.length;
      logger.info(`[RAG] Upserted chunks ${b}–${b + vectors.length - 1} for doc ${documentId}`);
    }
  } catch (err) {
    logger.error('[RAG] Pinecone ingestion failed:', (err as Error).message);
    // Don't rethrow — document is still stored in DB; agent can still answer generally
  }

  return upserted;
}

// ── User-document retrieval ───────────────────────────────────────────────────
/**
 * Retrieve the most relevant user-document chunks for a query.
 * Used by agents when a user has uploaded documents in this session.
 */
export async function retrieveUserContext(
  query: string,
  userId: string,
  topK = 3,
): Promise<string[]> {
  try {
    const pc = getPineconeClient();
    const index = pc.index(PINECONE_INDEX);
    const vector = await embed(query);

    const results = await index.namespace(`user_${userId}`).query({
      vector,
      topK,
      includeMetadata: true,
    });

    return results.matches
      .filter((m) => m.score && m.score > 0.3 && m.metadata?.text)
      .map((m) => m.metadata!.text as string);
  } catch (err) {
    logger.warn('[RAG] User context retrieval failed:', (err as Error).message);
    return [];
  }
}
