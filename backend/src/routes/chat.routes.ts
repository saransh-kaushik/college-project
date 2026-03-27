import { Router } from 'express';
import { authMiddleware } from '../middlewares/auth.middleware';
import { sendMessage, uploadDocument, upload } from '../controllers/chat.controller';

const router = Router();

router.post('/message', authMiddleware, sendMessage);
router.post('/upload', authMiddleware, upload.single('file'), uploadDocument);

export default router;
