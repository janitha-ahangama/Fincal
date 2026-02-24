import { Router } from 'express';
import { getInsights } from '../controllers/insightsController';
import { verifyToken } from '../middleware/auth';

const router = Router();

router.use(verifyToken);
router.get('/', getInsights);

export default router;
