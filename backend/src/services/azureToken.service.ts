import axios from 'axios';
import azureConfig from '../config/azure';
import { logger } from '../utils/logger';

/**
 * Exchanges the Azure Speech subscription key for a short-lived (10-minute) access token.
 * The frontend uses this token directly to open an Azure Cognitive Services connection.
 */
export async function getAzureVoiceToken(): Promise<{ token: string; region: string; endpoint: string }> {
  const { key, region } = azureConfig.speech;

  if (!key) {
    throw new Error('AZURE_SPEECH_KEY not configured');
  }

  try {
    const tokenUrl = `https://${region}.api.cognitive.microsoft.com/sts/v1.0/issueToken`;
    const response = await axios.post<string>(tokenUrl, null, {
      headers: {
        'Ocp-Apim-Subscription-Key': key,
        'Content-Type': 'application/x-www-form-urlencoded',
      },
    });

    const token = response.data;
    const endpoint = `wss://${region}.stt.speech.microsoft.com/speech/recognition/conversation/cognitiveservices/v1`;

    logger.info('Azure Voice Live token issued');
    return { token, region, endpoint };
  } catch (err) {
    logger.error('Failed to get Azure Voice token:', err);
    throw new Error('Could not obtain Azure Voice Live token');
  }
}
