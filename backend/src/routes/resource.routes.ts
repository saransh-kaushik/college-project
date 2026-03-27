import { Router } from 'express';
import { authMiddleware } from '../middlewares/auth.middleware';
import { getResources, replyToCommunityNote } from '../controllers/resource.controller';

const router = Router();

router.get('/', authMiddleware, getResources);
router.post('/community/:noteId/reply', authMiddleware, replyToCommunityNote);

export default router;
