import mongoose from 'mongoose';
import { Sale } from '../models/Sale.js';
import { Product } from '../models/Product.js';
import { Customer } from '../models/Customer.js';
import { Payment } from '../models/Payment.js';

/**
 * Escapes regex special characters to prevent ReDoS / injection in search queries.
 * @param {string} str 
 * @returns {string}
 */
function escapeRegex(str) {
  return str.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

const ALLOWED_PAYMENT_METHODS = ['cash', 'bkash', 'nagad', 'rocket', 'bank_transfer'];

/**
 * List & search sales history belonging strictly to the authenticated owner.
 * GET /api/sales
 */
export async function getSales(req, res, next) {
  try {
    const ownerId = req.user.id;
    const {
      search,
      startDate,
      endDate,
      customerId,
      paymentStatus,
      sortBy = 'saleDate',
      sortDir = 'desc'
    } = req.query || {};

    const query = { owner: ownerId };

    // 1. Date Range Filter
    if (startDate || endDate) {
      query.saleDate = {};
      if (startDate) {
        const start = new Date(startDate);
        if (!isNaN(start.getTime())) {
          start.setHours(0, 0, 0, 0);
          query.saleDate.$gte = start;
        }
      }
      if (endDate) {
        const end = new Date(endDate);
        if (!isNaN(end.getTime())) {
          end.setHours(23, 59, 59, 999);
          query.saleDate.$lte = end;
        }
      }
    }

    // 2. Customer Filter
    if (customerId) {
      if (customerId === 'walk-in') {
        query.customer = null;
      } else if (mongoose.Types.ObjectId.isValid(customerId)) {
        query.customer = customerId;
      }
    }

    // 3. Payment Status Filter ('paid', 'partial', 'due')
    if (paymentStatus && ['paid', 'partial', 'due'].includes(paymentStatus)) {
      query.paymentStatus = paymentStatus;
    }

    // 4. Search Filter (by saleNumber, customer name, phone, address, product name, code, or notes)
    if (search && typeof search === 'string' && search.trim()) {
      const sanitized = escapeRegex(search.trim().slice(0, 100));
      const searchRegex = new RegExp(sanitized, 'i');
      query.$or = [
        { saleNumber: searchRegex },
        { 'customerSnapshot.name': searchRegex },
        { 'customerSnapshot.phone': searchRegex },
        { 'customerSnapshot.address': searchRegex },
        { 'items.name': searchRegex },
        { 'items.code': searchRegex },
        { notes: searchRegex }
      ];
    }

    // 5. Sorting
    const allowedSortFields = ['saleDate', 'grandTotal', 'paidAmount', 'dueAmount', 'createdAt'];
    const sortField = allowedSortFields.includes(sortBy) ? sortBy : 'saleDate';
    const direction = sortDir === 'asc' ? 1 : -1;
    const sortOption = { [sortField]: direction };

    // Fetch sales (limited to 250 recent records)
    const sales = await Sale.find(query).sort(sortOption).limit(250);

    // Compute live summary statistics strictly for this owner
    const allOwnerSales = await Sale.find({ owner: ownerId }).select('grandTotal paidAmount dueAmount paymentStatus');
    const totalRevenue = allOwnerSales.reduce((sum, s) => sum + (s.grandTotal || 0), 0);
    const totalCollected = allOwnerSales.reduce((sum, s) => sum + (s.paidAmount || 0), 0);
    const totalDue = allOwnerSales.reduce((sum, s) => {
      const d = typeof s.dueAmount === 'number' ? s.dueAmount : Math.max(0, (s.grandTotal || 0) - (s.paidAmount || 0));
      return sum + d;
    }, 0);

    return res.status(200).json({
      sales: sales.map((s) => s.toJSON()),
      total: sales.length,
      summary: {
        totalSalesCount: allOwnerSales.length,
        totalRevenue: Math.round(totalRevenue * 100) / 100,
        totalCollected: Math.round(totalCollected * 100) / 100,
        cashReceived: Math.round(totalCollected * 100) / 100,
        totalDue: Math.round(totalDue * 100) / 100
      }
    });
  } catch (error) {
    next(error);
  }
}

/**
 * Get single sale detail by ID.
 * GET /api/sales/:id
 */
export async function getSaleById(req, res, next) {
  try {
    const { id } = req.params;
    const ownerId = req.user.id;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(404).json({
        error: 'Not Found',
        message: 'Sale record not found.'
      });
    }

    const sale = await Sale.findOne({ _id: id, owner: ownerId });

    if (!sale) {
      return res.status(404).json({
        error: 'Not Found',
        message: 'Sale record not found.'
      });
    }

    // Also fetch associated payments
    const payments = await Payment.find({ sale: sale._id, owner: ownerId }).sort({ paidAt: -1 });

    const saleJson = sale.toJSON();
    saleJson.payments = payments.map((p) => p.toJSON());

    return res.status(200).json({
      sale: saleJson
    });
  } catch (error) {
    next(error);
  }
}

/**
 * Create a new sale with transaction-safe, atomic inventory stock deduction,
 * support for cash, credit, or partial payments, and initial payment ledger entry.
 * POST /api/sales
 */
export async function createSale(req, res, next) {
  const ownerId = req.user.id;
  const {
    items: rawItems,
    customerId,
    paymentType, // 'cash' | 'credit' | 'partial'
    initialPayment,
    paymentMethod, // 'cash' | 'bkash' | 'nagad' | 'rocket' | 'bank_transfer'
    notes,
    idempotencyKey
  } = req.body || {};

  // 1. Validate Items Array
  if (!Array.isArray(rawItems) || rawItems.length === 0) {
    return res.status(400).json({
      error: 'Validation Error',
      message: 'At least one product item is required to record a sale.'
    });
  }

  // 2. Normalize & Consolidate duplicate product entries safely
  const consolidated = new Map();
  for (const it of rawItems) {
    const pid = it.productId || it.product;
    if (!pid || !mongoose.Types.ObjectId.isValid(pid)) {
      return res.status(400).json({
        error: 'Validation Error',
        message: 'Each sale line item must specify a valid product ID.'
      });
    }

    const qty = Number(it.quantity);
    if (isNaN(qty) || !isFinite(qty) || qty <= 0) {
      return res.status(400).json({
        error: 'Validation Error',
        message: 'Product quantity must be a positive number greater than zero.'
      });
    }

    const key = String(pid);
    consolidated.set(key, (consolidated.get(key) || 0) + qty);
  }

  // 3. Resolve Optional Customer
  let customerDoc = null;
  let customerSnapshot = {
    name: 'Walk-in Customer',
    phone: '',
    address: ''
  };

  if (customerId) {
    if (!mongoose.Types.ObjectId.isValid(customerId)) {
      return res.status(400).json({
        error: 'Validation Error',
        message: 'Invalid customer ID provided.'
      });
    }

    customerDoc = await Customer.findOne({ _id: customerId, owner: ownerId, isArchived: false });
    if (!customerDoc) {
      return res.status(400).json({
        error: 'Validation Error',
        message: 'Selected customer was not found or is archived.'
      });
    }

    customerSnapshot = {
      name: customerDoc.name,
      phone: customerDoc.phone || '',
      address: customerDoc.address || ''
    };
  }

  // 4. Validate Payment Method
  const resolvedMethod = (paymentMethod && ALLOWED_PAYMENT_METHODS.includes(paymentMethod))
    ? paymentMethod
    : 'cash';

  // 5. Check Idempotency Key (prevent accidental double-submissions)
  if (idempotencyKey && typeof idempotencyKey === 'string' && idempotencyKey.trim()) {
    const cleanKey = idempotencyKey.trim().slice(0, 100);
    const existing = await Sale.findOne({ owner: ownerId, notes: new RegExp(`\\[IDEMPOTENCY:${cleanKey}\\]`) });
    if (existing) {
      return res.status(200).json({
        message: 'Sale already recorded (idempotent response).',
        sale: existing.toJSON()
      });
    }
  }

  // 6. Execute Transaction-Safe Atomic Stock Deduction & Sale Creation
  const session = await mongoose.startSession();
  session.startTransaction();

  try {
    const itemSnapshots = [];
    let grandTotal = 0;

    for (const [productId, quantity] of consolidated.entries()) {
      // Conditional atomic update:
      // Decrements stock strictly if owner matches, active, and stockQuantity >= quantity
      const product = await Product.findOneAndUpdate(
        {
          _id: productId,
          owner: ownerId,
          isArchived: false,
          stockQuantity: { $gte: quantity }
        },
        {
          $inc: { stockQuantity: -quantity }
        },
        {
          session,
          returnDocument: 'before' // retrieve state prior to decrement
        }
      );

      if (!product) {
        // Find reason for failure to provide clear, actionable feedback
        const existing = await Product.findOne({ _id: productId, owner: ownerId }).session(session);

        if (!existing) {
          throw new Error('A selected product was not found in your inventory.');
        }
        if (existing.isArchived) {
          throw new Error(`Product "${existing.name}" is archived and cannot be sold.`);
        }
        if (existing.stockQuantity < quantity) {
          throw new Error(
            `Insufficient stock for "${existing.name}". Available: ${existing.stockQuantity}, Requested: ${quantity}`
          );
        }
        throw new Error(`Inventory deduction failed for product "${existing.name}".`);
      }

      // Always derive price from server product record (never trust client price)
      const unitPrice = product.sellingPrice;
      const lineTotal = Math.round(unitPrice * quantity * 100) / 100;
      grandTotal += lineTotal;

      itemSnapshots.push({
        product: product._id,
        name: product.name,
        code: product.code || '',
        category: product.category || 'General',
        unit: product.unit || 'piece',
        unitPrice,
        purchasePrice: product.purchasePrice || 0,
        quantity: Math.round(quantity * 1000) / 1000,
        lineTotal
      });
    }

    grandTotal = Math.round(grandTotal * 100) / 100;

    // 7. Calculate Payment & Outstanding Due
    let paidAmount = 0;

    if (paymentType === 'credit') {
      // Credit sale: default initial payment is 0 unless specified
      if (initialPayment !== undefined && initialPayment !== null && initialPayment !== '') {
        const parsedInit = Number(initialPayment);
        if (isNaN(parsedInit) || !isFinite(parsedInit) || parsedInit < 0) {
          throw new Error('Initial payment must be a valid non-negative number.');
        }
        if (parsedInit > grandTotal) {
          throw new Error(`Initial payment (৳${parsedInit}) cannot exceed the total sale amount (৳${grandTotal}).`);
        }
        paidAmount = Math.round(parsedInit * 100) / 100;
      } else {
        paidAmount = 0;
      }
    } else if (paymentType === 'partial') {
      // Partial payment sale
      const parsedInit = Number(initialPayment);
      if (isNaN(parsedInit) || !isFinite(parsedInit) || parsedInit < 0) {
        throw new Error('Initial payment must be a valid non-negative number.');
      }
      if (parsedInit > grandTotal) {
        throw new Error(`Initial payment (৳${parsedInit}) cannot exceed the total sale amount (৳${grandTotal}).`);
      }
      paidAmount = Math.round(parsedInit * 100) / 100;
    } else {
      // Default: Cash sale (full payment on creation)
      // Check if client explicitly gave an initialPayment that is less than grandTotal
      if (initialPayment !== undefined && initialPayment !== null && initialPayment !== '') {
        const parsedInit = Number(initialPayment);
        if (isNaN(parsedInit) || !isFinite(parsedInit) || parsedInit < 0) {
          throw new Error('Payment amount must be a valid non-negative number.');
        }
        if (parsedInit > grandTotal) {
          throw new Error(`Payment amount (৳${parsedInit}) cannot exceed the total sale amount (৳${grandTotal}).`);
        }
        paidAmount = Math.round(parsedInit * 100) / 100;
      } else {
        paidAmount = grandTotal;
      }
    }

    const dueAmount = Math.round((grandTotal - paidAmount) * 100) / 100;

    // 8. Financial Security Rule: Any sale with outstanding due requires a registered customer
    if (dueAmount > 0 && !customerDoc) {
      throw new Error('A registered customer is required for credit sales and outstanding dues.');
    }

    // Determine paymentStatus
    let paymentStatus = 'paid';
    if (dueAmount === 0) {
      paymentStatus = 'paid';
    } else if (paidAmount > 0 && dueAmount > 0) {
      paymentStatus = 'partial';
    } else {
      paymentStatus = 'due';
    }

    // Generate unique readable sale voucher number: INV-YYMMDD-XXXX
    const datePrefix = new Date().toISOString().slice(2, 10).replace(/-/g, '');
    const randomSuffix = Math.floor(1000 + Math.random() * 9000);
    const saleNumber = `INV-${datePrefix}-${randomSuffix}`;

    let notesText = typeof notes === 'string' ? notes.trim().slice(0, 450) : '';
    if (idempotencyKey && typeof idempotencyKey === 'string' && idempotencyKey.trim()) {
      notesText = `[IDEMPOTENCY:${idempotencyKey.trim().slice(0, 50)}] ${notesText}`.trim();
    }

    const sale = new Sale({
      saleNumber,
      owner: ownerId,
      customer: customerDoc ? customerDoc._id : null,
      customerSnapshot,
      items: itemSnapshots,
      subtotal: grandTotal,
      discount: 0,
      grandTotal,
      paymentMethod: resolvedMethod,
      paymentStatus,
      paidAmount,
      dueAmount,
      changeAmount: 0,
      notes: notesText,
      saleDate: new Date()
    });

    await sale.save({ session });

    // 9. If an initial payment was made against a registered customer, create an append-only ledger record
    let initialPaymentRecord = null;
    if (paidAmount > 0 && customerDoc) {
      const paySuffix = Math.floor(1000 + Math.random() * 9000);
      const paymentNumber = `PAY-${datePrefix}-${paySuffix}`;

      initialPaymentRecord = new Payment({
        paymentNumber,
        owner: ownerId,
        customer: customerDoc._id,
        sale: sale._id,
        amount: paidAmount,
        paymentMethod: resolvedMethod,
        paidAt: new Date(),
        notes: notesText ? `Initial payment: ${notesText}` : 'Initial payment on sale creation',
        idempotencyKey: idempotencyKey ? `${idempotencyKey.trim()}-init` : null
      });

      await initialPaymentRecord.save({ session });
    }

    // Commit transaction atomically
    await session.commitTransaction();
    session.endSession();

    const saleResponse = sale.toJSON();
    if (initialPaymentRecord) {
      saleResponse.payments = [initialPaymentRecord.toJSON()];
    }

    return res.status(201).json({
      message: 'Sale recorded and inventory updated successfully.',
      sale: saleResponse
    });
  } catch (error) {
    // Abort entire transaction on any failure to guarantee zero partial changes
    if (session.inTransaction()) {
      await session.abortTransaction();
    }
    session.endSession();

    return res.status(400).json({
      error: 'Sale Transaction Failed',
      message: error.message || 'Unable to record sale. Any partial inventory changes were rolled back.'
    });
  }
}

/**
 * Collect payment against an existing sale's outstanding due.
 * POST /api/sales/:id/payments
 */
export async function collectPayment(req, res, next) {
  const ownerId = req.user.id;
  const { id } = req.params;
  const { amount: rawAmount, paymentMethod, notes, idempotencyKey } = req.body || {};

  if (!mongoose.Types.ObjectId.isValid(id)) {
    return res.status(404).json({
      error: 'Not Found',
      message: 'Sale record not found.'
    });
  }

  // 1. Validate Payment Amount
  const amount = Number(rawAmount);
  if (isNaN(amount) || !isFinite(amount) || amount <= 0) {
    return res.status(400).json({
      error: 'Validation Error',
      message: 'Payment amount must be a positive number greater than zero.'
    });
  }

  const roundedAmount = Math.round(amount * 100) / 100;

  // 2. Validate Payment Method
  const resolvedMethod = (paymentMethod && ALLOWED_PAYMENT_METHODS.includes(paymentMethod))
    ? paymentMethod
    : 'cash';

  // 3. Idempotency Check
  if (idempotencyKey && typeof idempotencyKey === 'string' && idempotencyKey.trim()) {
    const cleanKey = idempotencyKey.trim().slice(0, 100);
    const existingPayment = await Payment.findOne({ owner: ownerId, idempotencyKey: cleanKey });
    if (existingPayment) {
      const sale = await Sale.findOne({ _id: id, owner: ownerId });
      return res.status(200).json({
        message: 'Payment already recorded (idempotent response).',
        payment: existingPayment.toJSON(),
        sale: sale ? sale.toJSON() : null
      });
    }
  }

  // 4. Start Transaction for Concurrency-Safe Due Collection
  const session = await mongoose.startSession();
  session.startTransaction();

  try {
    // Authoritative lookup inside session
    const sale = await Sale.findOne({ _id: id, owner: ownerId }).session(session);

    if (!sale) {
      await session.abortTransaction();
      session.endSession();
      return res.status(404).json({
        error: 'Not Found',
        message: 'Sale record not found.'
      });
    }

    if (!sale.customer) {
      throw new Error('Cannot collect payments against anonymous or walk-in customer sales.');
    }

    const currentPaid = typeof sale.paidAmount === 'number' ? sale.paidAmount : 0;
    const grandTotal = sale.grandTotal;
    const currentDue = Math.round(Math.max(0, grandTotal - currentPaid) * 100) / 100;

    if (currentDue <= 0 || sale.paymentStatus === 'paid') {
      throw new Error('This sale has already been fully paid in full.');
    }

    if (roundedAmount > currentDue) {
      throw new Error(
        `Payment amount (৳${roundedAmount.toFixed(2)}) exceeds remaining due balance (৳${currentDue.toFixed(2)}).`
      );
    }

    const newPaid = Math.round((currentPaid + roundedAmount) * 100) / 100;
    const newDue = Math.round(Math.max(0, grandTotal - newPaid) * 100) / 100;
    const newStatus = newDue <= 0 ? 'paid' : 'partial';

    // Atomic conditional update matching current paidAmount to serialize concurrent collectors
    const updatedSale = await Sale.findOneAndUpdate(
      {
        _id: id,
        owner: ownerId,
        paidAmount: currentPaid // optimistic lock condition
      },
      {
        $set: {
          paidAmount: newPaid,
          dueAmount: newDue,
          paymentStatus: newStatus
        }
      },
      {
        session,
        returnDocument: 'after'
      }
    );

    if (!updatedSale) {
      throw new Error('Concurrent payment conflict detected. Please retry the collection.');
    }

    // Generate unique payment voucher number
    const datePrefix = new Date().toISOString().slice(2, 10).replace(/-/g, '');
    const randomSuffix = Math.floor(1000 + Math.random() * 9000);
    const paymentNumber = `PAY-${datePrefix}-${randomSuffix}`;

    const payment = new Payment({
      paymentNumber,
      owner: ownerId,
      customer: sale.customer,
      sale: sale._id,
      amount: roundedAmount,
      paymentMethod: resolvedMethod,
      paidAt: new Date(),
      notes: typeof notes === 'string' ? notes.trim().slice(0, 500) : '',
      idempotencyKey: idempotencyKey ? idempotencyKey.trim().slice(0, 100) : null
    });

    await payment.save({ session });

    await session.commitTransaction();
    session.endSession();

    return res.status(201).json({
      message: 'Payment collected successfully and recorded in ledger.',
      payment: payment.toJSON(),
      sale: updatedSale.toJSON()
    });
  } catch (error) {
    if (session.inTransaction()) {
      await session.abortTransaction();
    }
    session.endSession();

    return res.status(400).json({
      error: 'Payment Collection Failed',
      message: error.message || 'Unable to process payment. Any partial changes were rolled back.'
    });
  }
}

/**
 * Get payment ledger history for a specific sale.
 * GET /api/sales/:id/payments
 */
export async function getSalePayments(req, res, next) {
  try {
    const { id } = req.params;
    const ownerId = req.user.id;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(404).json({
        error: 'Not Found',
        message: 'Sale record not found.'
      });
    }

    const sale = await Sale.findOne({ _id: id, owner: ownerId });
    if (!sale) {
      return res.status(404).json({
        error: 'Not Found',
        message: 'Sale record not found.'
      });
    }

    const payments = await Payment.find({ sale: id, owner: ownerId }).sort({ paidAt: -1 });

    return res.status(200).json({
      payments: payments.map((p) => p.toJSON()),
      total: payments.length
    });
  } catch (error) {
    next(error);
  }
}
