import { Router } from 'express';
import { register, login, logout, getMe } from '../controllers/auth.controller.js';
import { generateCsrfToken, verifyCsrf } from '../middleware/csrf.js';
import { requireAuth } from '../middleware/auth.js';

const router = Router();

// CSRF token generation
router.get('/csrf', generateCsrfToken);

// Authentication workflows (enforce CSRF on state changes)
router.post('/register', verifyCsrf, register);
router.post('/login', verifyCsrf, login);
router.post('/logout', verifyCsrf, logout);

// Current user profile
router.get('/me', requireAuth, getMe);

export default router;
