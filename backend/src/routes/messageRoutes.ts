import { Router } from 'express';
import { getChatHistory } from '../controllers/messageController';
import { protect } from '../middleware/auth';

const router = Router();

router.get('/:userId', protect, getChatHistory);

export default router;
