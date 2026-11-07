import { Router } from 'express';
import {
  getCustomers,
  getCustomerById,
  createCustomer,
  updateCustomer,
  archiveCustomer
} from '../controllers/customer.controller.js';
import {
  getCustomerDueDetails,
  getCustomerPayments
} from '../controllers/due.controller.js';
import { requireAuth } from '../middleware/auth.js';
import { verifyCsrf } from '../middleware/csrf.js';

const router = Router();

// All customer routes require authenticated session
router.use(requireAuth);

// Customer collection endpoints
router.get('/', getCustomers);
router.post('/', verifyCsrf, createCustomer);

// Customer due statement & payment history
router.get('/:id/dues', getCustomerDueDetails);
router.get('/:id/payments', getCustomerPayments);

// Single customer endpoints
router.get('/:id', getCustomerById);
router.patch('/:id', verifyCsrf, updateCustomer);
router.patch('/:id/archive', verifyCsrf, archiveCustomer);

export default router;
