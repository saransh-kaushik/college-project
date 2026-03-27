import { Pinecone } from '@pinecone-database/pinecone';
import { logger } from '../utils/logger';

let pineconeClient: Pinecone | null = null;

export function getPineconeClient(): Pinecone {
  if (!pineconeClient) {
    if (!process.env.PINECONE_API_KEY) {
      logger.warn('PINECONE_API_KEY not set — Pinecone disabled');
      throw new Error('Pinecone not configured');
    }
    pineconeClient = new Pinecone({ apiKey: process.env.PINECONE_API_KEY });
  }
  return pineconeClient;
}

export const PINECONE_INDEX = process.env.PINECONE_INDEX || 'voicetutor-kb';

export default getPineconeClient;
