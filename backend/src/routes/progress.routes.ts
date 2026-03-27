import { Router } from 'express';
import { authMiddleware } from '../middlewares/auth.middleware';
import { getProgress, getSessionHistory } from '../controllers/progress.controller';

const router = Router();

router.get('/:userId', authMiddleware, getProgress);
router.get('/:userId/history', authMiddleware, getSessionHistory);

export default router;
