import { Router } from 'express';
import rateLimit from 'express-rate-limit';
import { AuthController } from '../controllers/auth.controller';
import { requireAdminKey } from '../../../middleware/admin-key';
import { authenticate } from '../../../middleware/authenticate';

const loginLimiter = rateLimit({
	windowMs: 15 * 60 * 1000,
	max: 20,
	standardHeaders: true,
	legacyHeaders: false,
});

const router = Router();

router.post('/register', requireAdminKey, AuthController.register);
router.post('/login', loginLimiter, AuthController.login);
router.get('/me', authenticate, AuthController.me);

export default router;
