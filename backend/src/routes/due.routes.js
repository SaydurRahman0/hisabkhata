import { Router } from 'express';
import { getDuesList, getDueSummary } from '../controllers/due.controller.js';
import { requireAuth } from '../middleware/auth.js';

const router = Router();

// All due endpoints require authentication
router.use(requireAuth);

router.get('/', getDuesList);
router.get('/summary', getDueSummary);

export default router;
