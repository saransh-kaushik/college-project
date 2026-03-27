import { Router } from 'express';
import { authMiddleware } from '../middlewares/auth.middleware';
import { getVoiceToken } from '../controllers/voice.controller';

const router = Router();

router.get('/token', authMiddleware, getVoiceToken);

export default router;
