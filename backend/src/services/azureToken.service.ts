import azureConfig from '../config/azure';
import { logger } from '../utils/logger';

/**
 * Returns Azure VoiceLive realtime credentials to the frontend.
 * The frontend opens a direct WebSocket to the realtime endpoint —
 * this handles STT + LLM + TTS in a single low-latency stream.
 *
 * Azure VoiceLive (Cognitive Services) endpoint format:
 *   wss://{resource}.cognitiveservices.azure.com/voice-live/realtime
 *     ?api-version=2025-05-01-preview
 *     &api-key={key}    ← appended in the browser (never stored client-side)
 *
 * Azure OpenAI Realtime endpoint (fallback) format:
 *   wss://{resource}.openai.azure.com/openai/realtime
 *     ?api-version=2024-10-01-preview
 *     &deployment={deployment}
 */
export async function getAzureVoiceToken(): Promise<{
  endpoint: string;
  apiKey: string;
  deployment: string;
  voice: string;
}> {
  const { endpoint: aoaiEndpoint, apiKey, deployment } = azureConfig.openai;

  if (!aoaiEndpoint || !apiKey) {
    throw new Error('AZURE_OPENAI_ENDPOINT / AZURE_OPENAI_API_KEY not configured');
  }

  // Normalise the base endpoint: strip trailing slash
  const baseEndpoint = aoaiEndpoint.replace(/\/$/, '');

  // Determine model/deployment to use for VoiceLive
  const realtimeDeployment =
    process.env.AZURE_VOICELIVE_MODEL ||
    (deployment.includes('realtime') ? deployment : 'gpt-4o-realtime-preview');

  logger.info(`[VoiceLive] Serving base endpoint for deployment: ${realtimeDeployment}`);

  return {
    endpoint: baseEndpoint,
    apiKey,
    deployment: realtimeDeployment,
    voice: process.env.AZURE_VOICELIVE_VOICE || 'shimmer',
  };
}
