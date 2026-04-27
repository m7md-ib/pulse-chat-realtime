import { Router } from 'express';
import { getUsers } from '../controllers/userController';
import { protect } from '../middleware/auth';

const router = Router();

router.get('/', protect, getUsers);

export default router;
