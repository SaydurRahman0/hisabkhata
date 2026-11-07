import mongoose from 'mongoose';
import { Customer, normalizePhone, isValidPhone } from '../models/Customer.js';
import { Sale } from '../models/Sale.js';

/**
 * Escapes regex special characters to prevent ReDoS / injection in search queries.
 * @param {string} str 
 * @returns {string}
 */
function escapeRegex(str) {
  return str.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

/**
 * List & search customers belonging strictly to the authenticated owner.
 * GET /api/customers
 * Sensitive NID and notes are excluded by default for privacy and lightness.
 */
export async function getCustomers(req, res, next) {
  try {
    const ownerId = req.user.id;
    const { search, status, sortBy = 'createdAt', sortDir = 'desc' } = req.query || {};

    const query = { owner: ownerId };

    // 1. Status Filter
    if (status === 'archived') {
      query.isArchived = true;
    } else if (status === 'all') {
      // Don't filter by isArchived
    } else {
      // Default: Active customers only
      query.isArchived = false;
    }

    // 2. Search Filter (by name or phone or address - NEVER NID)
    if (search && typeof search === 'string' && search.trim()) {
      const trimmed = search.trim().slice(0, 100);
      const sanitized = escapeRegex(trimmed);
      const searchRegex = new RegExp(sanitized, 'i');
      const orClauses = [{ name: searchRegex }, { phone: searchRegex }, { address: searchRegex }];

      // Support searching formatted phone numbers by stripping formatting characters
      const digitsOnly = trimmed.replace(/[^0-9]/g, '');
      if (digitsOnly.length >= 3) {
        orClauses.push({ phone: new RegExp(escapeRegex(digitsOnly), 'i') });
      }

      query.$or = orClauses;
    }

    // 3. Sorting
    const allowedSortFields = ['createdAt', 'name', 'phone'];
    const sortField = allowedSortFields.includes(sortBy) ? sortBy : 'createdAt';
    const direction = sortDir === 'asc' ? 1 : -1;
    const sortOption = { [sortField]: direction };

    // Fetch customers (schema select: false ensures NID and notes are not leaked)
    const customers = await Customer.find(query).sort(sortOption).limit(200);

    // Compute live outstanding dues for these customers
    const unpaidSales = await Sale.find({
      owner: ownerId,
      customer: { $in: customers.map((c) => c._id) },
      paymentStatus: { $in: ['due', 'partial'] }
    }).select('customer grandTotal paidAmount dueAmount');

    const dueMap = new Map();
    for (const s of unpaidSales) {
      if (s.customer) {
        const cId = s.customer.toString();
        const d = typeof s.dueAmount === 'number'
          ? s.dueAmount
          : Math.max(0, (s.grandTotal || 0) - (s.paidAmount || 0));
        dueMap.set(cId, Math.round(((dueMap.get(cId) || 0) + d) * 100) / 100);
      }
    }

    let customerList = customers.map((c) => {
      const json = c.toJSON();
      json.outstandingBalance = dueMap.get(c._id.toString()) || 0;
      return json;
    });

    if (req.query && req.query.hasDue === 'true') {
      customerList = customerList.filter((c) => c.outstandingBalance > 0);
    }

    // Compute owner-scoped summary
    const totalActive = await Customer.countDocuments({ owner: ownerId, isArchived: false });
    const totalArchived = await Customer.countDocuments({ owner: ownerId, isArchived: true });

    return res.status(200).json({
      customers: customerList,
      total: customerList.length,
      summary: {
        totalCustomers: totalActive,
        activeCount: totalActive,
        archivedCount: totalArchived
      }
    });
  } catch (error) {
    next(error);
  }
}

/**
 * Get single customer details by ID (including sensitive NID and notes for authorized owner).
 * GET /api/customers/:id
 */
export async function getCustomerById(req, res, next) {
  try {
    const { id } = req.params;
    const ownerId = req.user.id;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(404).json({
        error: 'Not Found',
        message: 'Customer not found.'
      });
    }

    // Explicitly select +nid and +notes for the authorized owner's single customer view
    const customer = await Customer.findOne({ _id: id, owner: ownerId }).select('+nid +notes');

    if (!customer) {
      return res.status(404).json({
        error: 'Not Found',
        message: 'Customer not found.'
      });
    }

    // Calculate outstanding due for this customer
    const unpaidSales = await Sale.find({
      owner: ownerId,
      customer: customer._id,
      paymentStatus: { $in: ['due', 'partial'] }
    }).select('grandTotal paidAmount dueAmount');

    const totalDue = unpaidSales.reduce((sum, s) => {
      const d = typeof s.dueAmount === 'number' ? s.dueAmount : Math.max(0, (s.grandTotal || 0) - (s.paidAmount || 0));
      return sum + d;
    }, 0);

    const json = customer.toJSON();
    json.outstandingBalance = Math.round(totalDue * 100) / 100;

    return res.status(200).json({
      customer: json
    });
  } catch (error) {
    next(error);
  }
}

/**
 * Create a new customer profile.
 * POST /api/customers
 */
export async function createCustomer(req, res, next) {
  try {
    const ownerId = req.user.id;
    const { name, phone, address = '', nid = '', notes = '' } = req.body || {};

    // 1. Validation: Name
    if (!name || typeof name !== 'string' || !name.trim()) {
      return res.status(400).json({
        error: 'Validation Error',
        message: 'Customer name is required.'
      });
    }

    if (name.trim().length > 150) {
      return res.status(400).json({
        error: 'Validation Error',
        message: 'Customer name cannot exceed 150 characters.'
      });
    }

    // 2. Validation: Phone
    if (!phone || typeof phone !== 'string' || !phone.trim()) {
      return res.status(400).json({
        error: 'Validation Error',
        message: 'Phone number is required.'
      });
    }

    const normalizedPhone = normalizePhone(phone);
    if (!isValidPhone(normalizedPhone)) {
      return res.status(400).json({
        error: 'Validation Error',
        message: 'Please provide a valid phone number (e.g. 017XXXXXXXX with valid prefix 013–019, or international +... format).'
      });
    }

    // 3. Optional fields sanitization
    const sanitizedAddress = typeof address === 'string' ? address.trim().slice(0, 300) : '';
    const sanitizedNid = typeof nid === 'string' ? nid.trim().slice(0, 30) : '';
    const sanitizedNotes = typeof notes === 'string' ? notes.trim().slice(0, 1000) : '';

    // 4. Construct Customer strictly binding to authenticated ownerId
    const customer = new Customer({
      owner: ownerId,
      name: name.trim(),
      phone: normalizedPhone,
      address: sanitizedAddress,
      nid: sanitizedNid,
      notes: sanitizedNotes,
      isArchived: false
    });

    await customer.save();

    return res.status(201).json({
      message: 'Customer created successfully.',
      customer: customer.toJSON()
    });
  } catch (error) {
    next(error);
  }
}

/**
 * Update an existing customer profile.
 * PATCH /api/customers/:id
 */
export async function updateCustomer(req, res, next) {
  try {
    const { id } = req.params;
    const ownerId = req.user.id;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(404).json({
        error: 'Not Found',
        message: 'Customer not found.'
      });
    }

    const customer = await Customer.findOne({ _id: id, owner: ownerId }).select('+nid +notes');

    if (!customer) {
      return res.status(404).json({
        error: 'Not Found',
        message: 'Customer not found.'
      });
    }

    const { name, phone, address, nid, notes } = req.body || {};

    if (name !== undefined) {
      if (typeof name !== 'string' || !name.trim()) {
        return res.status(400).json({
          error: 'Validation Error',
          message: 'Customer name cannot be empty.'
        });
      }
      if (name.trim().length > 150) {
        return res.status(400).json({
          error: 'Validation Error',
          message: 'Customer name cannot exceed 150 characters.'
        });
      }
      customer.name = name.trim();
    }

    if (phone !== undefined) {
      if (typeof phone !== 'string' || !phone.trim()) {
        return res.status(400).json({
          error: 'Validation Error',
          message: 'Phone number cannot be empty.'
        });
      }
      const normalizedPhone = normalizePhone(phone);
      if (!isValidPhone(normalizedPhone)) {
        return res.status(400).json({
          error: 'Validation Error',
          message: 'Please provide a valid phone number (e.g. 017XXXXXXXX with valid prefix 013–019, or international +... format).'
        });
      }
      customer.phone = normalizedPhone;
    }

    if (address !== undefined) {
      customer.address = typeof address === 'string' ? address.trim().slice(0, 300) : '';
    }

    if (nid !== undefined) {
      customer.nid = typeof nid === 'string' ? nid.trim().slice(0, 30) : '';
    }

    if (notes !== undefined) {
      customer.notes = typeof notes === 'string' ? notes.trim().slice(0, 1000) : '';
    }

    await customer.save();

    return res.status(200).json({
      message: 'Customer updated successfully.',
      customer: customer.toJSON()
    });
  } catch (error) {
    next(error);
  }
}

/**
 * Toggle or set customer archived status.
 * PATCH /api/customers/:id/archive
 */
export async function archiveCustomer(req, res, next) {
  try {
    const { id } = req.params;
    const ownerId = req.user.id;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(404).json({
        error: 'Not Found',
        message: 'Customer not found.'
      });
    }

    const customer = await Customer.findOne({ _id: id, owner: ownerId });

    if (!customer) {
      return res.status(404).json({
        error: 'Not Found',
        message: 'Customer not found.'
      });
    }

    if (req.body && typeof req.body.isArchived === 'boolean') {
      customer.isArchived = req.body.isArchived;
    } else {
      customer.isArchived = !customer.isArchived;
    }

    await customer.save();

    const actionText = customer.isArchived ? 'archived' : 'restored';
    return res.status(200).json({
      message: `Customer ${actionText} successfully.`,
      customer: customer.toJSON()
    });
  } catch (error) {
    next(error);
  }
}
