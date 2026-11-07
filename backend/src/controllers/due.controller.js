import mongoose from 'mongoose';
import { Sale } from '../models/Sale.js';
import { Customer } from '../models/Customer.js';
import { Payment } from '../models/Payment.js';

function escapeRegex(str) {
  return str.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

/**
 * List all customers who have positive outstanding due balances.
 * GET /api/dues
 */
export async function getDuesList(req, res, next) {
  try {
    const ownerId = req.user.id;
    const { search, sortBy = 'totalDue', sortDir = 'desc' } = req.query || {};

    // 1. Find all active unpaid sales for this owner
    const unpaidSales = await Sale.find({
      owner: ownerId,
      customer: { $ne: null },
      paymentStatus: { $in: ['due', 'partial'] }
    }).sort({ saleDate: -1 });

    // 2. Group by customer ID and calculate authoritative outstanding balance
    const customerDuesMap = new Map();

    for (const sale of unpaidSales) {
      const custId = sale.customer.toString();
      const currentDue = typeof sale.dueAmount === 'number'
        ? sale.dueAmount
        : Math.max(0, (sale.grandTotal || 0) - (sale.paidAmount || 0));

      if (currentDue <= 0) continue;

      if (!customerDuesMap.has(custId)) {
        customerDuesMap.set(custId, {
          customerId: custId,
          customerSnapshot: sale.customerSnapshot || {},
          totalDue: 0,
          totalPurchases: 0,
          totalPaid: 0,
          unpaidSalesCount: 0,
          oldestUnpaidDate: sale.saleDate,
          latestUnpaidDate: sale.saleDate
        });
      }

      const rec = customerDuesMap.get(custId);
      rec.totalDue = Math.round((rec.totalDue + currentDue) * 100) / 100;
      rec.totalPurchases = Math.round((rec.totalPurchases + sale.grandTotal) * 100) / 100;
      rec.totalPaid = Math.round((rec.totalPaid + (sale.paidAmount || 0)) * 100) / 100;
      rec.unpaidSalesCount += 1;

      if (new Date(sale.saleDate) < new Date(rec.oldestUnpaidDate)) {
        rec.oldestUnpaidDate = sale.saleDate;
      }
      if (new Date(sale.saleDate) > new Date(rec.latestUnpaidDate)) {
        rec.latestUnpaidDate = sale.saleDate;
      }
    }

    // 3. Hydrate live customer details from Customer collection (for latest address/phone)
    const customerIds = Array.from(customerDuesMap.keys());
    const liveCustomers = await Customer.find({
      _id: { $in: customerIds },
      owner: ownerId
    });

    const liveCustomerMap = new Map();
    liveCustomers.forEach((c) => liveCustomerMap.set(c._id.toString(), c));

    let duesList = [];
    for (const [custId, data] of customerDuesMap.entries()) {
      const liveCust = liveCustomerMap.get(custId);
      duesList.push({
        customerId: custId,
        customer: liveCust ? liveCust.toJSON() : {
          _id: custId,
          id: custId,
          name: data.customerSnapshot.name || 'Unknown Customer',
          phone: data.customerSnapshot.phone || '',
          address: data.customerSnapshot.address || ''
        },
        totalDue: data.totalDue,
        totalPurchases: data.totalPurchases,
        totalPaid: data.totalPaid,
        unpaidSalesCount: data.unpaidSalesCount,
        oldestUnpaidDate: data.oldestUnpaidDate,
        latestUnpaidDate: data.latestUnpaidDate
      });
    }

    // 4. Apply search filter
    if (search && typeof search === 'string' && search.trim()) {
      const queryStr = search.trim().toLowerCase();
      duesList = duesList.filter((item) => {
        const name = (item.customer.name || '').toLowerCase();
        const phone = (item.customer.phone || '').toLowerCase();
        const address = (item.customer.address || '').toLowerCase();
        return name.includes(queryStr) || phone.includes(queryStr) || address.includes(queryStr);
      });
    }

    // 5. Apply sorting
    const dir = sortDir === 'asc' ? 1 : -1;
    duesList.sort((a, b) => {
      if (sortBy === 'name') {
        return dir * (a.customer.name || '').localeCompare(b.customer.name || '');
      }
      if (sortBy === 'unpaidSalesCount') {
        return dir * (a.unpaidSalesCount - b.unpaidSalesCount);
      }
      return dir * (a.totalDue - b.totalDue);
    });

    // 6. Overall summary
    const totalOutstandingDue = duesList.reduce((sum, d) => sum + d.totalDue, 0);
    const totalUnpaidSalesCount = duesList.reduce((sum, d) => sum + d.unpaidSalesCount, 0);

    return res.status(200).json({
      dues: duesList,
      total: duesList.length,
      summary: {
        totalOutstandingDue: Math.round(totalOutstandingDue * 100) / 100,
        customersWithDueCount: duesList.length,
        totalUnpaidSalesCount
      }
    });
  } catch (error) {
    next(error);
  }
}

/**
 * Get detailed due statement, unpaid sales, and payment history for a specific customer.
 * GET /api/customers/:id/dues
 */
export async function getCustomerDueDetails(req, res, next) {
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

    // Find all sales for this customer
    const sales = await Sale.find({ owner: ownerId, customer: id }).sort({ saleDate: -1 });

    // Find all payments for this customer
    const payments = await Payment.find({ owner: ownerId, customer: id }).sort({ paidAt: -1 });

    // Compute metrics
    let totalPurchases = 0;
    let totalPaid = 0;
    let totalDue = 0;
    const unpaidSales = [];

    for (const sale of sales) {
      const gTotal = sale.grandTotal || 0;
      const pAmount = sale.paidAmount || 0;
      const dAmount = typeof sale.dueAmount === 'number'
        ? sale.dueAmount
        : Math.max(0, gTotal - pAmount);

      totalPurchases += gTotal;
      totalPaid += pAmount;
      totalDue += dAmount;

      if (dAmount > 0 || sale.paymentStatus === 'due' || sale.paymentStatus === 'partial') {
        unpaidSales.push(sale.toJSON());
      }
    }

    return res.status(200).json({
      customer: customer.toJSON(),
      unpaidSales,
      allSales: sales.slice(0, 50).map((s) => s.toJSON()),
      payments: payments.map((p) => p.toJSON()),
      summary: {
        totalPurchases: Math.round(totalPurchases * 100) / 100,
        totalPaid: Math.round(totalPaid * 100) / 100,
        totalDue: Math.round(totalDue * 100) / 100,
        unpaidSalesCount: unpaidSales.length,
        totalPaymentsCount: payments.length
      }
    });
  } catch (error) {
    next(error);
  }
}

/**
 * Get payment history for a customer.
 * GET /api/customers/:id/payments
 */
export async function getCustomerPayments(req, res, next) {
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

    const payments = await Payment.find({ owner: ownerId, customer: id }).sort({ paidAt: -1 });

    return res.status(200).json({
      payments: payments.map((p) => p.toJSON()),
      total: payments.length
    });
  } catch (error) {
    next(error);
  }
}

/**
 * Get financial summary for dashboard / reporting (Sales, Collections by payment date, Dues).
 * GET /api/dues/summary
 */
export async function getDueSummary(req, res, next) {
  try {
    const ownerId = req.user.id;
    const { startDate, endDate } = req.query || {};

    // 1. Outstanding Dues is a current authoritative snapshot
    const unpaidSales = await Sale.find({
      owner: ownerId,
      customer: { $ne: null },
      paymentStatus: { $in: ['due', 'partial'] }
    }).select('dueAmount grandTotal paidAmount');

    const totalOutstandingDue = unpaidSales.reduce((sum, s) => {
      const d = typeof s.dueAmount === 'number' ? s.dueAmount : Math.max(0, (s.grandTotal || 0) - (s.paidAmount || 0));
      return sum + d;
    }, 0);

    // 2. Collections for date range based on Payment timestamp (paidAt)
    const paymentQuery = { owner: ownerId };
    if (startDate || endDate) {
      paymentQuery.paidAt = {};
      if (startDate) {
        const start = new Date(startDate);
        if (!isNaN(start.getTime())) {
          start.setHours(0, 0, 0, 0);
          paymentQuery.paidAt.$gte = start;
        }
      }
      if (endDate) {
        const end = new Date(endDate);
        if (!isNaN(end.getTime())) {
          end.setHours(23, 59, 59, 999);
          paymentQuery.paidAt.$lte = end;
        }
      }
    }

    const payments = await Payment.find(paymentQuery).select('amount');
    const periodCollections = payments.reduce((sum, p) => sum + (p.amount || 0), 0);

    // 3. Sales for date range based on saleDate
    const saleQuery = { owner: ownerId };
    if (startDate || endDate) {
      saleQuery.saleDate = {};
      if (startDate) {
        const start = new Date(startDate);
        if (!isNaN(start.getTime())) {
          start.setHours(0, 0, 0, 0);
          saleQuery.saleDate.$gte = start;
        }
      }
      if (endDate) {
        const end = new Date(endDate);
        if (!isNaN(end.getTime())) {
          end.setHours(23, 59, 59, 999);
          saleQuery.saleDate.$lte = end;
        }
      }
    }

    const periodSales = await Sale.find(saleQuery).select('grandTotal');
    const periodSalesRevenue = periodSales.reduce((sum, s) => sum + (s.grandTotal || 0), 0);

    return res.status(200).json({
      summary: {
        totalOutstandingDue: Math.round(totalOutstandingDue * 100) / 100,
        periodCollections: Math.round(periodCollections * 100) / 100,
        periodSalesRevenue: Math.round(periodSalesRevenue * 100) / 100,
        totalPaymentsCount: payments.length,
        totalSalesCount: periodSales.length
      }
    });
  } catch (error) {
    next(error);
  }
}
