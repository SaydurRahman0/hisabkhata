import mongoose from 'mongoose';
import { Product, VALID_UNITS } from '../models/Product.js';

/**
 * Escapes regex special characters to prevent ReDoS / injection in search queries.
 * @param {string} str 
 * @returns {string}
 */
function escapeRegex(str) {
  return str.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

/**
 * List & search products belonging strictly to the authenticated owner.
 * GET /api/products
 */
export async function getProducts(req, res, next) {
  try {
    const ownerId = req.user.id;
    const { search, category, status, sortBy = 'createdAt', sortDir = 'desc' } = req.query || {};

    const query = { owner: ownerId };

    // 1. Status Filter
    if (status === 'archived') {
      query.isArchived = true;
    } else if (status === 'all') {
      // Don't filter by isArchived
    } else {
      // Default: Active products only
      query.isArchived = false;
    }

    // 2. Category Filter
    if (category && category !== 'all' && typeof category === 'string' && category.trim()) {
      query.category = category.trim().slice(0, 80);
    }

    // 3. Search Filter (by name or code or category)
    if (search && typeof search === 'string' && search.trim()) {
      const sanitized = escapeRegex(search.trim().slice(0, 100));
      const searchRegex = new RegExp(sanitized, 'i');
      query.$or = [{ name: searchRegex }, { code: searchRegex }, { category: searchRegex }];
    }

    // 4. Sorting
    const allowedSortFields = ['createdAt', 'name', 'sellingPrice', 'stockQuantity', 'category'];
    const sortField = allowedSortFields.includes(sortBy) ? sortBy : 'createdAt';
    const direction = sortDir === 'asc' ? 1 : -1;
    const sortOption = { [sortField]: direction };

    // Fetch products
    const products = await Product.find(query).sort(sortOption).limit(200);

    // Compute inventory summary statistics scoped to active products for this owner
    const allActive = await Product.find({ owner: ownerId, isArchived: false }).select(
      'stockQuantity sellingPrice purchasePrice lowStockThreshold'
    );

    let lowStockCount = 0;
    let totalStockValue = 0;

    for (const p of allActive) {
      if (p.stockQuantity <= p.lowStockThreshold) {
        lowStockCount++;
      }
      totalStockValue += (p.stockQuantity || 0) * (p.purchasePrice || 0);
    }

    return res.status(200).json({
      products: products.map((p) => p.toJSON()),
      total: products.length,
      summary: {
        totalProducts: allActive.length,
        lowStockCount,
        totalStockValue: Math.round(totalStockValue * 100) / 100
      }
    });
  } catch (error) {
    next(error);
  }
}

/**
 * Get single product by ID (must belong to authenticated owner).
 * GET /api/products/:id
 */
export async function getProductById(req, res, next) {
  try {
    const { id } = req.params;
    const ownerId = req.user.id;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(404).json({
        error: 'Not Found',
        message: 'Product not found.'
      });
    }

    const product = await Product.findOne({ _id: id, owner: ownerId });

    if (!product) {
      return res.status(404).json({
        error: 'Not Found',
        message: 'Product not found.'
      });
    }

    return res.status(200).json({
      product: product.toJSON()
    });
  } catch (error) {
    next(error);
  }
}

/**
 * Create a new product.
 * POST /api/products
 */
export async function createProduct(req, res, next) {
  try {
    const ownerId = req.user.id;
    const {
      name,
      code = '',
      category = 'General',
      unit = 'piece',
      purchasePrice = 0,
      sellingPrice = 0,
      stockQuantity = 0,
      lowStockThreshold = 5
    } = req.body || {};

    // 1. Validation
    if (!name || typeof name !== 'string' || !name.trim()) {
      return res.status(400).json({
        error: 'Validation Error',
        message: 'Product name is required.'
      });
    }

    const numPurchasePrice = Number(purchasePrice);
    const numSellingPrice = Number(sellingPrice);
    const numStockQuantity = Number(stockQuantity);
    const numLowStockThreshold = Number(lowStockThreshold);

    if (isNaN(numPurchasePrice) || numPurchasePrice < 0) {
      return res.status(400).json({
        error: 'Validation Error',
        message: 'Purchase price must be a non-negative number.'
      });
    }

    if (isNaN(numSellingPrice) || numSellingPrice < 0) {
      return res.status(400).json({
        error: 'Validation Error',
        message: 'Selling price must be a non-negative number.'
      });
    }

    if (isNaN(numStockQuantity) || numStockQuantity < 0) {
      return res.status(400).json({
        error: 'Validation Error',
        message: 'Stock quantity must be a non-negative number.'
      });
    }

    if (isNaN(numLowStockThreshold) || numLowStockThreshold < 0) {
      return res.status(400).json({
        error: 'Validation Error',
        message: 'Low stock threshold must be a non-negative number.'
      });
    }

    const normalizedCode = typeof code === 'string' ? code.trim().toUpperCase() : '';
    const normalizedCategory = typeof category === 'string' && category.trim() ? category.trim() : 'General';
    const normalizedUnit = typeof unit === 'string' && VALID_UNITS.includes(unit.trim().toLowerCase())
      ? unit.trim().toLowerCase()
      : 'piece';

    // 2. Pre-check for duplicate code within this owner's products
    if (normalizedCode) {
      const existing = await Product.findOne({ owner: ownerId, code: normalizedCode });
      if (existing) {
        return res.status(409).json({
          error: 'Conflict',
          message: `A product with code "${normalizedCode}" already exists in your catalogue.`
        });
      }
    }

    // 3. Create Product
    const product = new Product({
      owner: ownerId,
      name: name.trim(),
      code: normalizedCode,
      category: normalizedCategory,
      unit: normalizedUnit,
      purchasePrice: numPurchasePrice,
      sellingPrice: numSellingPrice,
      stockQuantity: numStockQuantity,
      lowStockThreshold: numLowStockThreshold,
      isArchived: false
    });

    await product.save();

    return res.status(201).json({
      message: 'Product created successfully.',
      product: product.toJSON()
    });
  } catch (error) {
    if (error.code === 11000) {
      return res.status(409).json({
        error: 'Conflict',
        message: 'A product with this code already exists in your inventory.'
      });
    }
    next(error);
  }
}

/**
 * Update an existing owned product.
 * PATCH /api/products/:id
 */
export async function updateProduct(req, res, next) {
  try {
    const { id } = req.params;
    const ownerId = req.user.id;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(404).json({
        error: 'Not Found',
        message: 'Product not found.'
      });
    }

    const product = await Product.findOne({ _id: id, owner: ownerId });

    if (!product) {
      return res.status(404).json({
        error: 'Not Found',
        message: 'Product not found.'
      });
    }

    const {
      name,
      code,
      category,
      unit,
      purchasePrice,
      sellingPrice,
      stockQuantity,
      lowStockThreshold
    } = req.body || {};

    if (name !== undefined) {
      if (typeof name !== 'string' || !name.trim()) {
        return res.status(400).json({ error: 'Validation Error', message: 'Product name cannot be empty.' });
      }
      product.name = name.trim();
    }

    if (code !== undefined) {
      const normalizedCode = typeof code === 'string' ? code.trim().toUpperCase() : '';
      if (normalizedCode && normalizedCode !== product.code) {
        const existing = await Product.findOne({
          owner: ownerId,
          code: normalizedCode,
          _id: { $ne: product._id }
        });
        if (existing) {
          return res.status(409).json({
            error: 'Conflict',
            message: `A product with code "${normalizedCode}" already exists in your catalogue.`
          });
        }
      }
      product.code = normalizedCode;
    }

    if (category !== undefined) {
      product.category = typeof category === 'string' && category.trim() ? category.trim() : 'General';
    }

    if (unit !== undefined) {
      const u = typeof unit === 'string' ? unit.trim().toLowerCase() : '';
      if (!VALID_UNITS.includes(u)) {
        return res.status(400).json({ error: 'Validation Error', message: 'Invalid unit of measurement.' });
      }
      product.unit = u;
    }

    if (purchasePrice !== undefined) {
      const p = Number(purchasePrice);
      if (isNaN(p) || p < 0) {
        return res.status(400).json({ error: 'Validation Error', message: 'Purchase price must be a non-negative number.' });
      }
      product.purchasePrice = p;
    }

    if (sellingPrice !== undefined) {
      const s = Number(sellingPrice);
      if (isNaN(s) || s < 0) {
        return res.status(400).json({ error: 'Validation Error', message: 'Selling price must be a non-negative number.' });
      }
      product.sellingPrice = s;
    }

    if (stockQuantity !== undefined) {
      const q = Number(stockQuantity);
      if (isNaN(q) || q < 0) {
        return res.status(400).json({ error: 'Validation Error', message: 'Stock quantity must be a non-negative number.' });
      }
      product.stockQuantity = q;
    }

    if (lowStockThreshold !== undefined) {
      const t = Number(lowStockThreshold);
      if (isNaN(t) || t < 0) {
        return res.status(400).json({ error: 'Validation Error', message: 'Low stock threshold must be a non-negative number.' });
      }
      product.lowStockThreshold = t;
    }

    await product.save();

    return res.status(200).json({
      message: 'Product updated successfully.',
      product: product.toJSON()
    });
  } catch (error) {
    if (error.code === 11000) {
      return res.status(409).json({
        error: 'Conflict',
        message: 'A product with this code already exists in your inventory.'
      });
    }
    next(error);
  }
}

/**
 * Toggle or set product archived status.
 * PATCH /api/products/:id/archive
 */
export async function archiveProduct(req, res, next) {
  try {
    const { id } = req.params;
    const ownerId = req.user.id;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(404).json({
        error: 'Not Found',
        message: 'Product not found.'
      });
    }

    const product = await Product.findOne({ _id: id, owner: ownerId });

    if (!product) {
      return res.status(404).json({
        error: 'Not Found',
        message: 'Product not found.'
      });
    }

    // If explicit isArchived boolean is supplied in body, respect it; otherwise toggle
    if (req.body && typeof req.body.isArchived === 'boolean') {
      product.isArchived = req.body.isArchived;
    } else {
      product.isArchived = !product.isArchived;
    }

    await product.save();

    const actionText = product.isArchived ? 'archived' : 'restored';
    return res.status(200).json({
      message: `Product ${actionText} successfully.`,
      product: product.toJSON()
    });
  } catch (error) {
    next(error);
  }
}
