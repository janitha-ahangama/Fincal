import { Router } from 'express';
import { register, login, logout, getProfile } from '../controllers/authController';
import { verifyToken } from '../middleware/auth';

const router = Router();

router.post('/register', register);
router.get('/me', verifyToken, login);       // verify token → return profile
router.post('/logout', verifyToken, logout);
router.get('/profile', verifyToken, getProfile);

export default router;
