import { Router } from 'express';
import { getLiveness, getReadiness } from '../controllers/health.controller.js';

const router = Router();

// Liveness check: GET /api/health
router.get('/', getLiveness);

// Readiness check: GET /api/health/ready
router.get('/ready', getReadiness);

export default router;
