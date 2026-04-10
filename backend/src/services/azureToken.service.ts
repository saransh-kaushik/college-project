import azureConfig from '../config/azure';
import { logger } from '../utils/logger';

export interface VoiceTokenPayload {
  endpoint: string;
  apiKey: string;
  deployment: string;
  voice: string;
}

/**
 * Returns Azure VoiceLive realtime credentials to the frontend.
 *
 * The frontend uses these to open a direct WebSocket to Azure's realtime
 * endpoint — handling STT + LLM + TTS in a single low-latency stream.
 * The backend never proxies audio; it only serves the credentials.
 *
 * WebSocket URL shapes (constructed by the frontend):
 *
 *   Azure OpenAI resource:
 *     wss://{resource}.openai.azure.com/openai/realtime
 *       ?api-version=2024-10-01-preview
 *       &deployment={model}
 *       &api-key={key}
 *
 *   Azure AI Services (Cognitive Services) resource:
 *     wss://{resource}.cognitiveservices.azure.com/voice-live/realtime
 *       ?api-version=2025-05-01-preview
 *       &model={model}
 *       &api-key={key}
 *
 * The frontend auto-detects which URL shape to use based on the endpoint hostname.
 */
export async function getAzureVoiceToken(): Promise<VoiceTokenPayload> {
  const { endpoint, apiKey, model, voice } = azureConfig.voicelive;

  if (!endpoint) {
    throw new Error(
      'VoiceLive endpoint not configured. ' +
      'Set AZURE_VOICELIVE_ENDPOINT (or AZURE_OPENAI_ENDPOINT) in your .env file.',
    );
  }

  if (!apiKey) {
    throw new Error(
      'VoiceLive API key not configured. ' +
      'Set AZURE_VOICELIVE_API_KEY (or AZURE_OPENAI_API_KEY) in your .env file.',
    );
  }

  // Normalise: strip trailing slash so the frontend can safely append paths
  const baseEndpoint = endpoint.replace(/\/$/, '');

  logger.info(`[VoiceLive] Serving credentials for deployment: ${model}`);

  return {
    endpoint:   baseEndpoint,
    apiKey,
    deployment: model,
    voice,
  };
}
