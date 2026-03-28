import { Response, NextFunction } from 'express';
import { AuthRequest } from '../middlewares/auth.middleware';
import { getAzureVoiceToken } from '../services/azureToken.service';

export async function getVoiceToken(req: AuthRequest, res: Response, next: NextFunction): Promise<void> {
  try {
    const result = await getAzureVoiceToken();
    res.json({
      endpoint: result.endpoint,
      apiKey: result.apiKey,
      deployment: result.deployment,
      voice: result.voice,
    });
  } catch (err) {
    next(err);
  }
}

