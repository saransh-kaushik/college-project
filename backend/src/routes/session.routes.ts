import { Router } from 'express';
import { authMiddleware } from '../middlewares/auth.middleware';
import { startSession, endSession, getSession, shareSession } from '../controllers/session.controller';

const router = Router();

router.post('/start', authMiddleware, startSession);
router.post('/:sessionId/end', authMiddleware, endSession);
router.get('/:sessionId', authMiddleware, getSession);
router.post('/:sessionId/share', authMiddleware, shareSession);

export default router;
