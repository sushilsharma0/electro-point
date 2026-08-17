import { Router } from 'express';
import * as auth from '../../controllers/authController.js';
import { validate } from '../../middleware/validate.js';
import { requireAuth, requireAdminAuth } from '../../middleware/auth.js';
import { authLimiter } from '../../middleware/rateLimits.js';
import { registerSchema, loginSchema, forgotPasswordSchema, resetPasswordSchema } from '../../validators/auth.js';
import { empty } from '../../validators/common.js';

const router = Router();

router.post('/register', authLimiter, validate(registerSchema), auth.register);
router.post('/login', authLimiter, validate(loginSchema), auth.login);
router.post('/logout', requireAuth, validate(empty), auth.logout);
router.post('/refresh', auth.refresh);
router.post('/forgot-password', authLimiter, validate(forgotPasswordSchema), auth.forgotPassword);
router.post('/reset-password', authLimiter, validate(resetPasswordSchema), auth.resetPassword);
router.get('/me', requireAuth, auth.me);

router.post('/admin/login', authLimiter, validate(loginSchema), auth.adminLogin);
router.post('/admin/logout', requireAdminAuth, validate(empty), auth.adminLogout);
router.post('/admin/refresh', auth.adminRefresh);
router.get('/admin/me', requireAdminAuth, auth.me);

export default router;
