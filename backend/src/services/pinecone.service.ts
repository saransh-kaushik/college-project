import { getPineconeClient, PINECONE_INDEX } from '../config/pinecone';
import { embed } from './openai.service';
import { logger } from '../utils/logger';

/**
 * Retrieve the top-k most relevant knowledge chunks for a query.
 */
export async function retrieveContext(
  query: string,
  namespace: string,
  topK = 3
): Promise<string[]> {
  try {
    const pc = getPineconeClient();
    const index = pc.index(PINECONE_INDEX);

    const vector = await embed(query);
    const results = await index.namespace(namespace).query({
      vector,
      topK,
      includeMetadata: true,
    });

    return results.matches
      .filter((m) => m.metadata?.text)
      .map((m) => m.metadata!.text as string);
  } catch (err) {
    logger.warn('Pinecone retrieval failed (RAG disabled):', (err as Error).message);
    return [];
  }
}

/**
 * Upsert a knowledge chunk into Pinecone.
 */
export async function upsertKnowledge(
  id: string,
  text: string,
  namespace: string,
  metadata: Record<string, string> = {}
): Promise<void> {
  try {
    const pc = getPineconeClient();
    const index = pc.index(PINECONE_INDEX);
    const vector = await embed(text);

    await index.namespace(namespace).upsert([
      { id, values: vector, metadata: { text, ...metadata } },
    ]);
  } catch (err) {
    logger.warn('Pinecone upsert failed:', (err as Error).message);
  }
}
