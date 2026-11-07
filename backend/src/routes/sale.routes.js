import { Router } from 'express';
import {
  getSales,
  getSaleById,
  createSale,
  collectPayment,
  getSalePayments
} from '../controllers/sale.controller.js';
import { requireAuth } from '../middleware/auth.js';
import { verifyCsrf } from '../middleware/csrf.js';

const router = Router();

// All sale routes require authenticated session
router.use(requireAuth);

// Sale collection endpoints
router.get('/', getSales);
router.post('/', verifyCsrf, createSale);

// Single sale detail endpoint
router.get('/:id', getSaleById);

// Sale payment ledger endpoints
router.get('/:id/payments', getSalePayments);
router.post('/:id/payments', verifyCsrf, collectPayment);

export default router;
