import OpenAI from 'openai';
import azureConfig from '../config/azure';
import { logger } from '../utils/logger';

let openaiClient: OpenAI | null = null;

export function getOpenAIClient(): OpenAI {
  if (!openaiClient) {
    if (!azureConfig.openai.apiKey || !azureConfig.openai.endpoint) {
      throw new Error('Azure OpenAI not configured — set AZURE_OPENAI_ENDPOINT and AZURE_OPENAI_API_KEY');
    }
    openaiClient = new OpenAI({
      apiKey: azureConfig.openai.apiKey,
      baseURL: `${azureConfig.openai.endpoint}openai/deployments/${azureConfig.openai.deployment}`,
      defaultQuery: { 'api-version': azureConfig.openai.apiVersion },
      defaultHeaders: { 'api-key': azureConfig.openai.apiKey },
    });
  }
  return openaiClient;
}

export interface ChatMessage {
  role: 'system' | 'user' | 'assistant';
  content: string;
}

export async function chat(messages: ChatMessage[], maxTokens = 512): Promise<string> {
  const client = getOpenAIClient();
  const response = await client.chat.completions.create({
    model: azureConfig.openai.deployment,
    messages,
    max_tokens: maxTokens,
    temperature: 0.7,
  });
  return response.choices[0]?.message?.content || '';
}

export async function embed(text: string): Promise<number[]> {
  const cfg = azureConfig.openai;
  const embClient = new OpenAI({
    apiKey: cfg.apiKey,
    baseURL: `${cfg.endpoint}openai/deployments/${cfg.embeddingDeployment}`,
    defaultQuery: { 'api-version': cfg.apiVersion },
    defaultHeaders: { 'api-key': cfg.apiKey },
  });

  const response = await embClient.embeddings.create({
    model: cfg.embeddingDeployment,
    input: text,
  });
  return response.data[0].embedding;
}

logger.info('OpenAI service initialised');
