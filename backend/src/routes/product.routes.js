import { Router } from 'express';
import {
  getProducts,
  getProductById,
  createProduct,
  updateProduct,
  archiveProduct
} from '../controllers/product.controller.js';
import { requireAuth } from '../middleware/auth.js';
import { verifyCsrf } from '../middleware/csrf.js';

const router = Router();

// All product routes require authenticated session
router.use(requireAuth);

// Product collection endpoints
router.get('/', getProducts);
router.post('/', verifyCsrf, createProduct);

// Single product endpoints
router.get('/:id', getProductById);
router.patch('/:id', verifyCsrf, updateProduct);
router.patch('/:id/archive', verifyCsrf, archiveProduct);

export default router;
