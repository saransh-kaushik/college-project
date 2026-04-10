import { Router } from 'express';
import { authMiddleware } from '../middlewares/auth.middleware';
import { sendMessage, uploadDocument, getUserDocuments, upload } from '../controllers/chat.controller';

const router = Router();

router.post('/message', authMiddleware, sendMessage);
router.post('/upload', authMiddleware, upload.single('file'), uploadDocument);
router.get('/documents', authMiddleware, getUserDocuments);

export default router;
