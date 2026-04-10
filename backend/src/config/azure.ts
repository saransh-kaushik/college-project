/**
 * azure.ts — Centralised Azure configuration.
 *
 * All Azure env vars are read here. Other services import from this module
 * instead of reading process.env directly.
 */

export const azureConfig = {
  speech: {
    key: process.env.AZURE_SPEECH_KEY || '',
    region: process.env.AZURE_SPEECH_REGION || 'eastus',
  },

  openai: {
    endpoint: process.env.AZURE_OPENAI_ENDPOINT || '',
    apiKey: process.env.AZURE_OPENAI_API_KEY || '',
    deployment: process.env.AZURE_OPENAI_DEPLOYMENT || 'gpt-4.1-mini',
    embeddingDeployment: process.env.AZURE_OPENAI_EMBEDDING_DEPLOYMENT || 'text-embedding-3-small',
    apiVersion: process.env.AZURE_OPENAI_API_VERSION || '2024-02-01',
  },

  /**
   * VoiceLive (Realtime) credentials.
   *
   * Azure VoiceLive can run on TWO different resource types:
   *
   * 1. Azure OpenAI resource  →  {name}.openai.azure.com
   *    Realtime path: /openai/realtime?api-version=2024-10-01-preview&deployment={model}
   *
   * 2. Azure AI Services (Cognitive Services) resource  →  {name}.cognitiveservices.azure.com
   *    Realtime path: /voice-live/realtime?api-version=2025-05-01-preview&model={model}
   *
   * Set AZURE_VOICELIVE_ENDPOINT / AZURE_VOICELIVE_API_KEY if VoiceLive lives on a
   * different resource than your main OpenAI deployment. Otherwise they fall back to
   * the AZURE_OPENAI_* values (same-resource scenario).
   */
  voicelive: {
    endpoint: process.env.AZURE_VOICELIVE_ENDPOINT || process.env.AZURE_OPENAI_ENDPOINT || '',
    apiKey:   process.env.AZURE_VOICELIVE_API_KEY   || process.env.AZURE_OPENAI_API_KEY  || '',
    model:    process.env.AZURE_VOICELIVE_MODEL      || 'gpt-4o-realtime-preview',
    // Voice name must be a valid Azure Neural voice when using type 'azure-standard'.
    // OpenAI realtime voices (shimmer, alloy, etc.) are NOT valid here.
    // Reference voice from working implementation: en-US-Ava:DragonHDLatestNeural
    voice:    process.env.AZURE_VOICELIVE_VOICE      || 'en-US-Ava:DragonHDLatestNeural',
  },
};

export default azureConfig;
