import { test, describe, before, after } from 'node:test';
import assert from 'node:assert/strict';
import { MongoMemoryReplSet } from 'mongodb-memory-server';
import mongoose from 'mongoose';
import session from 'express-session';
import MongoStore from 'connect-mongo';
import express from 'express';
import { env } from '../src/config/env.js';
import { User } from '../src/models/User.js';
import { Product } from '../src/models/Product.js';
import { Customer } from '../src/models/Customer.js';
import { Sale } from '../src/models/Sale.js';
import authRoutes from '../src/routes/auth.routes.js';
import productRoutes from '../src/routes/product.routes.js';
import customerRoutes from '../src/routes/customer.routes.js';
import saleRoutes from '../src/routes/sale.routes.js';
import { notFoundHandler } from '../src/middleware/notFound.js';
import { errorHandler } from '../src/middleware/errorHandler.js';

describe('Phase 05 — Sales & Transactions, Atomic Stock Deduction & Concurrency Tests', () => {
  let replSet;
  let server;
  let baseUrl;
  let testApp;

  // Test users
  let ownerASession = null;
  let ownerBSession = null;

  // Test catalog
  let productA1 = null;
  let productA2 = null;
  let productB1 = null;
  let customerA1 = null;
  let customerB1 = null;

  // Helper: Extract cookies reliably from response headers using getSetCookie
  function extractCookies(res) {
    const rawList = res.headers.getSetCookie
      ? res.headers.getSetCookie()
      : (res.headers.get('set-cookie') ? [res.headers.get('set-cookie')] : []);

    return rawList
      .filter(Boolean)
      .map((c) => c.split(';')[0])
      .join('; ');
  }

  // Helper: Create an authenticated user session and return session cookies + CSRF token
  async function createAuthenticatedSession(fullName, email, password) {
    // 1. Get initial CSRF token and cookie
    const csrfRes = await fetch(`${baseUrl}/api/auth/csrf`);
    const initialCookie = extractCookies(csrfRes);
    const { csrfToken } = await csrfRes.json();

    // 2. Register user
    const regRes = await fetch(`${baseUrl}/api/auth/register`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-CSRF-Token': csrfToken,
        Cookie: initialCookie
      },
      body: JSON.stringify({ fullName, email, password })
    });

    const regData = await regRes.json();
    assert.equal(regRes.status, 201, `Registration failed: ${JSON.stringify(regData)}`);
    const regCookie = extractCookies(regRes);

    return {
      email,
      userId: regData.user._id || regData.user.id,
      cookie: regCookie,
      csrfToken: regData.csrfToken
    };
  }

  before(async () => {
    // 1. Start MongoDB Replica Set for transaction support
    replSet = await MongoMemoryReplSet.create({
      replSet: { count: 1, storageEngine: 'wiredTiger' }
    });
    const uri = replSet.getUri();

    // 2. Connect Mongoose to replica set
    await mongoose.connect(uri, {
      dbName: 'hisabkhata_sales_test'
    });

    // 3. Set up Express application matching production
    testApp = express();
    testApp.use(express.json({ limit: '100kb' }));

    const sessionStore = MongoStore.create({
      client: mongoose.connection.getClient(),
      dbName: 'hisabkhata_sales_test',
      collectionName: 'sessions',
      ttl: 604800
    });

    testApp.use(
      session({
        name: env.SESSION_COOKIE_NAME,
        secret: 'test-session-secret-sales-must-be-long-enough-for-audit',
        resave: false,
        saveUninitialized: false,
        store: sessionStore,
        cookie: {
          httpOnly: true,
          secure: false,
          sameSite: 'lax',
          maxAge: 7 * 24 * 60 * 60 * 1000,
          path: '/'
        }
      })
    );

    testApp.use('/api/auth', authRoutes);
    testApp.use('/api/products', productRoutes);
    testApp.use('/api/customers', customerRoutes);
    testApp.use('/api/sales', saleRoutes);
    testApp.use('/api', notFoundHandler);
    testApp.use(errorHandler);

    // 4. Start HTTP server on dynamic port
    server = testApp.listen(0);
    const port = server.address().port;
    baseUrl = `http://localhost:${port}`;

    // 5. Register and login Owner A and Owner B
    ownerASession = await createAuthenticatedSession(
      'Rahim Khan',
      'rahim.sales@example.com',
      'Password123!'
    );

    ownerBSession = await createAuthenticatedSession(
      'Karim Ullah',
      'karim.sales@example.com',
      'Password123!'
    );

    // 6. Seed Owner A's products and customer
    productA1 = await Product.create({
      owner: ownerASession.userId,
      name: 'Miniket Rice 50kg',
      code: 'RICE-50',
      category: 'Grains',
      unit: 'packet',
      purchasePrice: 2800,
      sellingPrice: 3200,
      stockQuantity: 20,
      lowStockThreshold: 5
    });

    productA2 = await Product.create({
      owner: ownerASession.userId,
      name: 'Teer Soybean Oil 5L',
      code: 'OIL-5L',
      category: 'Edible Oil',
      unit: 'box',
      purchasePrice: 750,
      sellingPrice: 850,
      stockQuantity: 10,
      lowStockThreshold: 3
    });

    customerA1 = await Customer.create({
      owner: ownerASession.userId,
      name: 'Haji Mohammad Ali',
      phone: '+8801733333333',
      address: 'Shop 14, Kawran Bazar, Dhaka'
    });

    // 7. Seed Owner B's product and customer
    productB1 = await Product.create({
      owner: ownerBSession.userId,
      name: 'Rupchanda Mustard Oil',
      code: 'MUSTARD-1L',
      category: 'Edible Oil',
      unit: 'box',
      purchasePrice: 200,
      sellingPrice: 250,
      stockQuantity: 15,
      lowStockThreshold: 2
    });

    customerB1 = await Customer.create({
      owner: ownerBSession.userId,
      name: 'Chittagong Wholesale Client',
      phone: '+8801844444444',
      address: 'Khatunganj, Chittagong'
    });
  });

  after(async () => {
    if (server) {
      await new Promise((resolve) => server.close(resolve));
    }
    await mongoose.connection.close(false);
    if (replSet) {
      await replSet.stop();
    }
  });

  // Test 1: Unauthenticated requests rejected
  test('1. Unauthenticated requests to /api/sales are rejected with 401', async () => {
    const resGet = await fetch(`${baseUrl}/api/sales`);
    assert.equal(resGet.status, 401);

    const resPost = await fetch(`${baseUrl}/api/sales`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ items: [] })
    });
    assert.equal(resPost.status, 401);
  });

  // Test 2: CSRF protection enforcement
  test('2. Missing or invalid CSRF token on POST /api/sales returns 403', async () => {
    const res = await fetch(`${baseUrl}/api/sales`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Cookie: ownerASession.cookie
        // X-CSRF-Token omitted
      },
      body: JSON.stringify({
        items: [{ productId: productA1._id.toString(), quantity: 1 }]
      })
    });
    assert.equal(res.status, 403);
  });

  // Test 3: Valid cash sale creation with multiple products & atomic deduction
  test('3. Valid cash sale creation atomically deducts stock and records snapshot', async () => {
    const initialA1 = await Product.findById(productA1._id);
    const initialA2 = await Product.findById(productA2._id);
    assert.equal(initialA1.stockQuantity, 20);
    assert.equal(initialA2.stockQuantity, 10);

    const res = await fetch(`${baseUrl}/api/sales`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Cookie: ownerASession.cookie,
        'X-CSRF-Token': ownerASession.csrfToken
      },
      body: JSON.stringify({
        customerId: customerA1._id.toString(),
        items: [
          { productId: productA1._id.toString(), quantity: 2 },
          { productId: productA2._id.toString(), quantity: 3 }
        ],
        notes: 'Delivered to Kawran Bazar'
      })
    });

    assert.equal(res.status, 201);
    const data = await res.json();
    assert.ok(data.sale);
    assert.ok(data.sale.saleNumber.startsWith('INV-'));
    assert.equal(data.sale.items.length, 2);

    // Calculated grandTotal = (2 * 3200) + (3 * 850) = 6400 + 2550 = 8950
    assert.equal(data.sale.grandTotal, 8950);
    assert.equal(data.sale.paidAmount, 8950);
    assert.equal(data.sale.paymentMethod, 'cash');
    assert.equal(data.sale.paymentStatus, 'paid');
    assert.equal(data.sale.customerSnapshot.name, 'Haji Mohammad Ali');
    assert.equal(data.sale.notes, 'Delivered to Kawran Bazar');

    // Verify atomic stock deduction in database
    const updatedA1 = await Product.findById(productA1._id);
    const updatedA2 = await Product.findById(productA2._id);
    assert.equal(updatedA1.stockQuantity, 18); // 20 - 2
    assert.equal(updatedA2.stockQuantity, 7);  // 10 - 3
  });

  // Test 4: Walk-in sale (no customer) works correctly
  test('4. Walk-in sale without customer creates sale with Walk-in snapshot', async () => {
    const res = await fetch(`${baseUrl}/api/sales`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Cookie: ownerASession.cookie,
        'X-CSRF-Token': ownerASession.csrfToken
      },
      body: JSON.stringify({
        items: [{ productId: productA1._id.toString(), quantity: 1 }]
      })
    });

    assert.equal(res.status, 201);
    const data = await res.json();
    assert.equal(data.sale.customer, null);
    assert.equal(data.sale.customerSnapshot.name, 'Walk-in Customer');

    const updatedA1 = await Product.findById(productA1._id);
    assert.equal(updatedA1.stockQuantity, 17); // 18 - 1
  });

  // Test 5: Rollback verification on insufficient stock
  test('5. Entire transaction rolls back if any product has insufficient stock', async () => {
    const preA1 = await Product.findById(productA1._id);
    const preA2 = await Product.findById(productA2._id);
    const preStockA1 = preA1.stockQuantity;
    const preStockA2 = preA2.stockQuantity;

    // Request 1 unit of A1 (valid), but 999 units of A2 (insufficient)
    const res = await fetch(`${baseUrl}/api/sales`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Cookie: ownerASession.cookie,
        'X-CSRF-Token': ownerASession.csrfToken
      },
      body: JSON.stringify({
        items: [
          { productId: productA1._id.toString(), quantity: 1 },
          { productId: productA2._id.toString(), quantity: 999 }
        ]
      })
    });

    assert.equal(res.status, 400);
    const data = await res.json();
    assert.equal(data.error, 'Sale Transaction Failed');
    assert.ok(data.message.includes('Insufficient stock'));

    // Verify ZERO stock changes occurred (transaction rollback guarantee)
    const postA1 = await Product.findById(productA1._id);
    const postA2 = await Product.findById(productA2._id);
    assert.equal(postA1.stockQuantity, preStockA1, 'Product A1 stock must be completely unchanged');
    assert.equal(postA2.stockQuantity, preStockA2, 'Product A2 stock must be completely unchanged');
  });

  // Test 6: Archived product cannot be sold
  test('6. Attempting to sell an archived product fails and aborts transaction', async () => {
    const archivedProduct = await Product.create({
      owner: ownerASession.userId,
      name: 'Discontinued Spices',
      purchasePrice: 50,
      sellingPrice: 100,
      stockQuantity: 10,
      isArchived: true
    });

    const res = await fetch(`${baseUrl}/api/sales`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Cookie: ownerASession.cookie,
        'X-CSRF-Token': ownerASession.csrfToken
      },
      body: JSON.stringify({
        items: [{ productId: archivedProduct._id.toString(), quantity: 1 }]
      })
    });

    assert.equal(res.status, 400);
    const data = await res.json();
    assert.ok(data.message.includes('archived'));

    // Verify stock was not deducted
    const postArchived = await Product.findById(archivedProduct._id);
    assert.equal(postArchived.stockQuantity, 10);
  });

  // Test 7: Duplicate product lines are safely consolidated
  test('7. Duplicate product lines in request are consolidated into one line total', async () => {
    const preA2 = await Product.findById(productA2._id);
    const startStock = preA2.stockQuantity;

    const res = await fetch(`${baseUrl}/api/sales`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Cookie: ownerASession.cookie,
        'X-CSRF-Token': ownerASession.csrfToken
      },
      body: JSON.stringify({
        items: [
          { productId: productA2._id.toString(), quantity: 2 },
          { productId: productA2._id.toString(), quantity: 3 }
        ]
      })
    });

    assert.equal(res.status, 201);
    const data = await res.json();
    assert.equal(data.sale.items.length, 1);
    assert.equal(data.sale.items[0].quantity, 5);
    assert.equal(data.sale.items[0].lineTotal, 5 * 850);

    const postA2 = await Product.findById(productA2._id);
    assert.equal(postA2.stockQuantity, startStock - 5);
  });

  // Test 8: Server-derived pricing ignores client tampering
  test('8. Client cannot manipulate selling price; server enforces database price', async () => {
    const res = await fetch(`${baseUrl}/api/sales`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Cookie: ownerASession.cookie,
        'X-CSRF-Token': ownerASession.csrfToken
      },
      body: JSON.stringify({
        items: [
          {
            productId: productA1._id.toString(),
            quantity: 1,
            unitPrice: 1, // Tampered client price (DB has 3200)
            lineTotal: 1
          }
        ],
        grandTotal: 1
      })
    });

    assert.equal(res.status, 201);
    const data = await res.json();
    assert.equal(data.sale.items[0].unitPrice, 3200);
    assert.equal(data.sale.items[0].lineTotal, 3200);
    assert.equal(data.sale.grandTotal, 3200);
  });

  // Test 9: Multi-tenant isolation - Owner A cannot view Owner B's sales
  test('9. Multi-tenant isolation: Owner A and Owner B sales histories are isolated', async () => {
    // Owner B creates a sale
    const resB = await fetch(`${baseUrl}/api/sales`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Cookie: ownerBSession.cookie,
        'X-CSRF-Token': ownerBSession.csrfToken
      },
      body: JSON.stringify({
        customerId: customerB1._id.toString(),
        items: [{ productId: productB1._id.toString(), quantity: 2 }]
      })
    });
    assert.equal(resB.status, 201);
    const dataB = await resB.json();
    const saleIdB = dataB.sale._id;

    // Owner A lists sales: must NOT contain Owner B's sale
    const listResA = await fetch(`${baseUrl}/api/sales`, {
      headers: { Cookie: ownerASession.cookie }
    });
    assert.equal(listResA.status, 200);
    const listDataA = await listResA.json();
    const hasOwnerBSale = listDataA.sales.some((s) => s._id === saleIdB);
    assert.equal(hasOwnerBSale, false, "Owner A must never see Owner B's sales in list");

    // Owner A attempts to get Owner B's sale by ID: must return 404
    const detailResA = await fetch(`${baseUrl}/api/sales/${saleIdB}`, {
      headers: { Cookie: ownerASession.cookie }
    });
    assert.equal(detailResA.status, 404, "Accessing other user's sale must return 404");
  });

  // Test 10: Multi-tenant protection on product selection
  test('10. Owner A cannot create a sale using Owner B product', async () => {
    const res = await fetch(`${baseUrl}/api/sales`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Cookie: ownerASession.cookie,
        'X-CSRF-Token': ownerASession.csrfToken
      },
      body: JSON.stringify({
        items: [{ productId: productB1._id.toString(), quantity: 1 }]
      })
    });

    assert.equal(res.status, 400);
    const data = await res.json();
    assert.ok(data.message.includes('not found'));

    // Confirm Owner B stock was NOT touched
    const freshB1 = await Product.findById(productB1._id);
    assert.equal(freshB1.stockQuantity, 13); // 15 - 2 from earlier valid B sale
  });

  // Test 11: Multi-tenant protection on customer selection
  test('11. Owner A cannot associate sale with Owner B customer', async () => {
    const res = await fetch(`${baseUrl}/api/sales`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Cookie: ownerASession.cookie,
        'X-CSRF-Token': ownerASession.csrfToken
      },
      body: JSON.stringify({
        customerId: customerB1._id.toString(),
        items: [{ productId: productA1._id.toString(), quantity: 1 }]
      })
    });

    assert.equal(res.status, 400);
    const data = await res.json();
    assert.ok(data.message.includes('Selected customer was not found'));
  });

  // Test 12: Concurrency & race condition safety
  test('12. Concurrent sales competing for limited stock prevents negative inventory', async () => {
    // Create a product with strictly 5 units in stock
    const limitedProd = await Product.create({
      owner: ownerASession.userId,
      name: 'Limited Flash Item',
      purchasePrice: 100,
      sellingPrice: 150,
      stockQuantity: 5
    });

    // Fire 3 simultaneous sales, each asking for 3 units (total 9 units > 5 stock)
    const promises = [1, 2, 3].map(() =>
      fetch(`${baseUrl}/api/sales`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Cookie: ownerASession.cookie,
          'X-CSRF-Token': ownerASession.csrfToken
        },
        body: JSON.stringify({
          items: [{ productId: limitedProd._id.toString(), quantity: 3 }]
        })
      })
    );

    const responses = await Promise.all(promises);
    const statuses = responses.map((r) => r.status);

    const successCount = statuses.filter((s) => s === 201).length;
    const failCount = statuses.filter((s) => s === 400).length;

    // Exactly one should succeed (3 units deducted, leaving 2). The other two must fail.
    assert.equal(successCount, 1, 'Exactly one concurrent request should succeed');
    assert.equal(failCount, 2, 'The other two concurrent requests should be rejected');

    const freshProd = await Product.findById(limitedProd._id);
    assert.equal(freshProd.stockQuantity, 2, 'Final stock must be exactly 2 (never negative)');
  });

  // Test 13: Search and filtering verification
  test('13. Search by voucher number, customer name, and date filtering', async () => {
    const searchRes = await fetch(`${baseUrl}/api/sales?search=Kawran`, {
      headers: { Cookie: ownerASession.cookie }
    });
    assert.equal(searchRes.status, 200);
    const searchData = await searchRes.json();
    assert.ok(searchData.sales.length >= 1);
    assert.ok(searchData.sales.some((s) => s.customerSnapshot.name === 'Haji Mohammad Ali'));

    // Search for non-existent text
    const noRes = await fetch(`${baseUrl}/api/sales?search=NonExistent99999`, {
      headers: { Cookie: ownerASession.cookie }
    });
    const noData = await noRes.json();
    assert.equal(noData.sales.length, 0);
  });

  // Test 14: Phase 05 scope boundary - non-cash payment method rejected
  test('14. Phase 05 scope boundary: credit / unpaid sales are rejected with 400', async () => {
    const resCredit = await fetch(`${baseUrl}/api/sales`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Cookie: ownerASession.cookie,
        'X-CSRF-Token': ownerASession.csrfToken
      },
      body: JSON.stringify({
        paymentMethod: 'credit',
        items: [{ productId: productA1._id.toString(), quantity: 1 }]
      })
    });
    assert.equal(resCredit.status, 400);

    const resUnpaid = await fetch(`${baseUrl}/api/sales`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Cookie: ownerASession.cookie,
        'X-CSRF-Token': ownerASession.csrfToken
      },
      body: JSON.stringify({
        paymentStatus: 'due',
        items: [{ productId: productA1._id.toString(), quantity: 1 }]
      })
    });
    assert.equal(resUnpaid.status, 400);
  });
});
