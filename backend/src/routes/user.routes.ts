import { Router } from 'express';
import { authMiddleware } from '../middlewares/auth.middleware';
import { getProfile, updateSettings, getJourneys, getUserSessions } from '../controllers/user.controller';

const router = Router();

router.get('/profile', authMiddleware, getProfile);
router.put('/settings', authMiddleware, updateSettings);
router.get('/journeys', authMiddleware, getJourneys);
router.get('/sessions', authMiddleware, getUserSessions);

export default router;
