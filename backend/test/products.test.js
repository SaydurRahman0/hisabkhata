import { test, describe, before, after } from 'node:test';
import assert from 'node:assert/strict';
import { MongoMemoryServer } from 'mongodb-memory-server';
import mongoose from 'mongoose';
import session from 'express-session';
import MongoStore from 'connect-mongo';
import express from 'express';
import { env } from '../src/config/env.js';
import { User } from '../src/models/User.js';
import { Product } from '../src/models/Product.js';
import authRoutes from '../src/routes/auth.routes.js';
import productRoutes from '../src/routes/product.routes.js';
import { notFoundHandler } from '../src/middleware/notFound.js';
import { errorHandler } from '../src/middleware/errorHandler.js';

describe('Phase 04A — Product Catalogue & Stock Management Tests', () => {
  let mongod;
  let server;
  let baseUrl;
  let testApp;

  before(async () => {
    // 1. Start isolated in-memory MongoDB
    mongod = await MongoMemoryServer.create();
    const uri = mongod.getUri();

    // 2. Connect Mongoose
    await mongoose.connect(uri, {
      dbName: 'hisabkhata_products_test'
    });

    // 3. Build test Express app matching production config
    testApp = express();
    testApp.use(express.json({ limit: '100kb' }));

    const sessionStore = MongoStore.create({
      client: mongoose.connection.getClient(),
      dbName: 'hisabkhata_products_test',
      collectionName: 'sessions',
      ttl: 604800
    });

    testApp.use(
      session({
        name: env.SESSION_COOKIE_NAME,
        secret: 'test-session-secret-for-products-audit-must-be-long-enough',
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
    testApp.use('/api', notFoundHandler);
    testApp.use(errorHandler);

    // 4. Start HTTP server on ephemeral port
    server = testApp.listen(0);
    const port = server.address().port;
    baseUrl = `http://localhost:${port}`;
  });

  after(async () => {
    if (server) {
      await new Promise((resolve) => server.close(resolve));
    }
    await mongoose.connection.close(false);
    if (mongod) {
      await mongod.stop();
    }
  });

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
      userId: regData.user.id,
      cookie: regCookie,
      csrfToken: regData.csrfToken
    };
  }

  // --- Requirement 1: Unauthenticated requests rejected with 401 ---
  test('1. Unauthenticated requests to /api/products return 401', async () => {
    const res = await fetch(`${baseUrl}/api/products`);
    assert.equal(res.status, 401);
    const data = await res.json();
    assert.equal(data.error, 'Unauthorized');
  });

  // --- Requirement 2 & 7: Owner can create, list, and view product; client-supplied owner is ignored ---
  test('2. Authenticated user can create and view products; client-supplied owner is ignored', async () => {
    const ownerA = await createAuthenticatedSession(
      'Rahim Mia',
      'rahim.products@example.com',
      'Password123!'
    );

    const fakeOwnerId = new mongoose.Types.ObjectId().toString();

    // Create product attempting to forge owner
    const createRes = await fetch(`${baseUrl}/api/products`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-CSRF-Token': ownerA.csrfToken,
        Cookie: ownerA.cookie
      },
      body: JSON.stringify({
        name: 'Miniket Rice 25kg',
        code: 'RICE-MINI-25',
        category: 'Grains',
        unit: 'kg',
        purchasePrice: 1650,
        sellingPrice: 1850,
        stockQuantity: 40,
        lowStockThreshold: 10,
        owner: fakeOwnerId // Forgery attempt
      })
    });

    assert.equal(createRes.status, 201);
    const createData = await createRes.json();
    assert.ok(createData.product.id);
    assert.equal(createData.product.name, 'Miniket Rice 25kg');
    assert.equal(createData.product.code, 'RICE-MINI-25');
    assert.notEqual(
      createData.product.owner,
      fakeOwnerId,
      'Forged owner ID must be ignored and replaced with authenticated user ID'
    );

    // Retrieve single product
    const getRes = await fetch(`${baseUrl}/api/products/${createData.product.id}`, {
      headers: { Cookie: ownerA.cookie }
    });
    assert.equal(getRes.status, 200);
    const getData = await getRes.json();
    assert.equal(getData.product.name, 'Miniket Rice 25kg');
    assert.equal(getData.product.sellingPrice, 1850);

    // List products
    const listRes = await fetch(`${baseUrl}/api/products`, {
      headers: { Cookie: ownerA.cookie }
    });
    assert.equal(listRes.status, 200);
    const listData = await listRes.json();
    assert.equal(listData.products.length, 1);
    assert.equal(listData.summary.totalProducts, 1);
    assert.equal(listData.summary.totalStockValue, 40 * 1650);
  });

  // --- Requirement 3: Non-negative price and stock validations (400) ---
  test('3. Negative price or stock values are rejected with 400', async () => {
    const owner = await createAuthenticatedSession(
      'Validation User',
      'validator@example.com',
      'Password123!'
    );

    // Negative purchasePrice
    const res1 = await fetch(`${baseUrl}/api/products`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-CSRF-Token': owner.csrfToken,
        Cookie: owner.cookie
      },
      body: JSON.stringify({
        name: 'Bad Price Item',
        purchasePrice: -10,
        sellingPrice: 50,
        stockQuantity: 10
      })
    });
    assert.equal(res1.status, 400);

    // Negative sellingPrice
    const res2 = await fetch(`${baseUrl}/api/products`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-CSRF-Token': owner.csrfToken,
        Cookie: owner.cookie
      },
      body: JSON.stringify({
        name: 'Bad Selling Price Item',
        purchasePrice: 10,
        sellingPrice: -50,
        stockQuantity: 10
      })
    });
    assert.equal(res2.status, 400);

    // Negative stockQuantity
    const res3 = await fetch(`${baseUrl}/api/products`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-CSRF-Token': owner.csrfToken,
        Cookie: owner.cookie
      },
      body: JSON.stringify({
        name: 'Bad Stock Item',
        purchasePrice: 10,
        sellingPrice: 50,
        stockQuantity: -5
      })
    });
    assert.equal(res3.status, 400);

    // Empty product name
    const res4 = await fetch(`${baseUrl}/api/products`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-CSRF-Token': owner.csrfToken,
        Cookie: owner.cookie
      },
      body: JSON.stringify({
        name: '   ',
        purchasePrice: 10,
        sellingPrice: 50
      })
    });
    assert.equal(res4.status, 400);
  });

  // --- Requirement 4: Duplicate product code rejected for same owner (409) ---
  test('4. Duplicate product code for the same owner is rejected with 409 conflict', async () => {
    const owner = await createAuthenticatedSession(
      'Duplicate Code User',
      'dupe@example.com',
      'Password123!'
    );

    // Create first product with code 'SOY-1L'
    const res1 = await fetch(`${baseUrl}/api/products`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-CSRF-Token': owner.csrfToken,
        Cookie: owner.cookie
      },
      body: JSON.stringify({
        name: 'Teer Soybean Oil 1L',
        code: 'SOY-1L',
        sellingPrice: 190,
        purchasePrice: 175,
        stockQuantity: 20
      })
    });
    assert.equal(res1.status, 201);

    // Attempt second product with identical code (case-insensitive)
    const res2 = await fetch(`${baseUrl}/api/products`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-CSRF-Token': owner.csrfToken,
        Cookie: owner.cookie
      },
      body: JSON.stringify({
        name: 'Rupchanda Soybean Oil 1L',
        code: 'soy-1l',
        sellingPrice: 195,
        purchasePrice: 180,
        stockQuantity: 15
      })
    });
    assert.equal(res2.status, 409, 'Duplicate code within same owner catalogue must yield 409 Conflict');
    const errData = await res2.json();
    assert.equal(errData.error, 'Conflict');
  });

  // --- Requirement 5: Different owners can use the same product code without conflict ---
  test('5. Different owners can use the same product code without conflict', async () => {
    const owner1 = await createAuthenticatedSession(
      'Owner One',
      'owner1@example.com',
      'Password123!'
    );
    const owner2 = await createAuthenticatedSession(
      'Owner Two',
      'owner2@example.com',
      'Password123!'
    );

    const sharedCode = 'COMMON-CODE-999';

    // Owner 1 creates product with code
    const res1 = await fetch(`${baseUrl}/api/products`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-CSRF-Token': owner1.csrfToken,
        Cookie: owner1.cookie
      },
      body: JSON.stringify({
        name: 'Owner 1 Item',
        code: sharedCode,
        sellingPrice: 100
      })
    });
    assert.equal(res1.status, 201);

    // Owner 2 creates product with identical code
    const res2 = await fetch(`${baseUrl}/api/products`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-CSRF-Token': owner2.csrfToken,
        Cookie: owner2.cookie
      },
      body: JSON.stringify({
        name: 'Owner 2 Item',
        code: sharedCode,
        sellingPrice: 200
      })
    });
    assert.equal(
      res2.status,
      201,
      'Different owners must be able to use the same code with zero conflict'
    );
  });

  // --- Requirement 6: Strict tenant isolation (404 on cross-user read, update, archive) ---
  test('6. User A cannot read, update, or archive User B product (returns 404)', async () => {
    const userA = await createAuthenticatedSession(
      'User A',
      'usera@example.com',
      'Password123!'
    );
    const userB = await createAuthenticatedSession(
      'User B',
      'userb@example.com',
      'Password123!'
    );

    // User A creates a product
    const createRes = await fetch(`${baseUrl}/api/products`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-CSRF-Token': userA.csrfToken,
        Cookie: userA.cookie
      },
      body: JSON.stringify({
        name: 'User A Secret Stock',
        code: 'SECRET-A',
        sellingPrice: 500,
        stockQuantity: 100
      })
    });
    assert.equal(createRes.status, 201);
    const { product } = await createRes.json();
    const productAId = product.id;

    // User B tries to GET User A's product
    const getRes = await fetch(`${baseUrl}/api/products/${productAId}`, {
      headers: { Cookie: userB.cookie }
    });
    assert.equal(getRes.status, 404, 'Cross-tenant GET must return 404');

    // User B tries to PATCH User A's product
    const patchRes = await fetch(`${baseUrl}/api/products/${productAId}`, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
        'X-CSRF-Token': userB.csrfToken,
        Cookie: userB.cookie
      },
      body: JSON.stringify({
        sellingPrice: 1
      })
    });
    assert.equal(patchRes.status, 404, 'Cross-tenant PATCH must return 404');

    // User B tries to ARCHIVE User A's product
    const archiveRes = await fetch(`${baseUrl}/api/products/${productAId}/archive`, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
        'X-CSRF-Token': userB.csrfToken,
        Cookie: userB.cookie
      }
    });
    assert.equal(archiveRes.status, 404, 'Cross-tenant archive must return 404');

    // Verify User A's product is unchanged
    const verifyRes = await fetch(`${baseUrl}/api/products/${productAId}`, {
      headers: { Cookie: userA.cookie }
    });
    const verifyData = await verifyRes.json();
    assert.equal(verifyData.product.sellingPrice, 500);
    assert.equal(verifyData.product.isArchived, false);
  });

  // --- Requirement 8: Archive & Restore behavior ---
  test('8. Archived products are excluded from default list and included with status=archived or status=all', async () => {
    const owner = await createAuthenticatedSession(
      'Archive Tester',
      'archive.tester@example.com',
      'Password123!'
    );

    // Create 2 products
    const p1Res = await fetch(`${baseUrl}/api/products`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-CSRF-Token': owner.csrfToken,
        Cookie: owner.cookie
      },
      body: JSON.stringify({ name: 'Active Biscuit', sellingPrice: 30 })
    });
    const p1 = (await p1Res.json()).product;

    const p2Res = await fetch(`${baseUrl}/api/products`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-CSRF-Token': owner.csrfToken,
        Cookie: owner.cookie
      },
      body: JSON.stringify({ name: 'Archived Soap', sellingPrice: 50 })
    });
    const p2 = (await p2Res.json()).product;

    // Archive p2
    const archRes = await fetch(`${baseUrl}/api/products/${p2.id}/archive`, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
        'X-CSRF-Token': owner.csrfToken,
        Cookie: owner.cookie
      }
    });
    assert.equal(archRes.status, 200);
    const archData = await archRes.json();
    assert.equal(archData.product.isArchived, true);

    // Default list: only active
    const defaultListRes = await fetch(`${baseUrl}/api/products`, {
      headers: { Cookie: owner.cookie }
    });
    const defaultData = await defaultListRes.json();
    assert.equal(defaultData.products.length, 1);
    assert.equal(defaultData.products[0].id, p1.id);

    // status=archived list
    const archivedListRes = await fetch(`${baseUrl}/api/products?status=archived`, {
      headers: { Cookie: owner.cookie }
    });
    const archivedData = await archivedListRes.json();
    assert.equal(archivedData.products.length, 1);
    assert.equal(archivedData.products[0].id, p2.id);

    // status=all list
    const allListRes = await fetch(`${baseUrl}/api/products?status=all`, {
      headers: { Cookie: owner.cookie }
    });
    const allData = await allListRes.json();
    assert.equal(allData.products.length, 2);

    // Restore p2
    const restoreRes = await fetch(`${baseUrl}/api/products/${p2.id}/archive`, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
        'X-CSRF-Token': owner.csrfToken,
        Cookie: owner.cookie
      },
      body: JSON.stringify({ isArchived: false })
    });
    assert.equal(restoreRes.status, 200);
    assert.equal((await restoreRes.json()).product.isArchived, false);
  });

  // --- Requirement 9: Search & Filter scoped strictly to authenticated owner ---
  test('9. Search and category filter work and are strictly scoped to the owner', async () => {
    const owner = await createAuthenticatedSession(
      'Search Tester',
      'search@example.com',
      'Password123!'
    );

    // Create multiple products
    await fetch(`${baseUrl}/api/products`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-CSRF-Token': owner.csrfToken,
        Cookie: owner.cookie
      },
      body: JSON.stringify({
        name: 'Pran Frooto 250ml',
        code: 'BEV-FRT-250',
        category: 'Beverage',
        sellingPrice: 35
      })
    });

    await fetch(`${baseUrl}/api/products`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-CSRF-Token': owner.csrfToken,
        Cookie: owner.cookie
      },
      body: JSON.stringify({
        name: 'Fresh Mineral Water 500ml',
        code: 'BEV-WAT-500',
        category: 'Beverage',
        sellingPrice: 20
      })
    });

    await fetch(`${baseUrl}/api/products`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-CSRF-Token': owner.csrfToken,
        Cookie: owner.cookie
      },
      body: JSON.stringify({
        name: 'Aci Pure Salt 1kg',
        code: 'GRO-SLT-1K',
        category: 'Grocery',
        sellingPrice: 42
      })
    });

    // Search by name
    const searchRes = await fetch(`${baseUrl}/api/products?search=frooto`, {
      headers: { Cookie: owner.cookie }
    });
    const searchData = await searchRes.json();
    assert.equal(searchData.products.length, 1);
    assert.equal(searchData.products[0].code, 'BEV-FRT-250');

    // Search by code
    const codeSearchRes = await fetch(`${baseUrl}/api/products?search=SLT`, {
      headers: { Cookie: owner.cookie }
    });
    const codeSearchData = await codeSearchRes.json();
    assert.equal(codeSearchData.products.length, 1);
    assert.equal(codeSearchData.products[0].name, 'Aci Pure Salt 1kg');

    // Filter by category
    const catRes = await fetch(`${baseUrl}/api/products?category=Beverage`, {
      headers: { Cookie: owner.cookie }
    });
    const catData = await catRes.json();
    assert.equal(catData.products.length, 2);
  });

  // --- Requirement 10: CSRF protection on POST and PATCH ---
  test('10. CSRF protection is enforced on state-changing product routes', async () => {
    const owner = await createAuthenticatedSession(
      'CSRF Product Tester',
      'csrf.product@example.com',
      'Password123!'
    );

    // POST without CSRF token
    const postNoCsrf = await fetch(`${baseUrl}/api/products`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Cookie: owner.cookie
      },
      body: JSON.stringify({ name: 'Unauthorized Item', sellingPrice: 100 })
    });
    assert.equal(postNoCsrf.status, 403, 'POST /api/products without CSRF must return 403');

    // PATCH with tampered CSRF token
    const patchBadCsrf = await fetch(`${baseUrl}/api/products/someid`, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
        'X-CSRF-Token': '0'.repeat(64),
        Cookie: owner.cookie
      },
      body: JSON.stringify({ name: 'Tampered' })
    });
    assert.equal(patchBadCsrf.status, 403, 'PATCH /api/products without valid CSRF must return 403');
  });

  // --- Audit 11: Decimal quantities, zero pricing, and precision rounding ---
  test('11. Supports decimal quantities, zero pricing, and precision rounding', async () => {
    const owner = await createAuthenticatedSession(
      'Precision User',
      'precision@example.com',
      'Password123!'
    );

    const res = await fetch(`${baseUrl}/api/products`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-CSRF-Token': owner.csrfToken,
        Cookie: owner.cookie
      },
      body: JSON.stringify({
        name: 'Loose Mustard Oil',
        unit: 'litre',
        purchasePrice: 195.5,
        sellingPrice: 220.75,
        stockQuantity: 15.355,
        lowStockThreshold: 5.5
      })
    });

    assert.equal(res.status, 201);
    const data = await res.json();
    assert.equal(data.product.purchasePrice, 195.5);
    assert.equal(data.product.sellingPrice, 220.75);
    assert.equal(data.product.stockQuantity, 15.355);

    // Verify zero prices are also accepted (e.g. promotional giveaway item or 0 opening stock)
    const resZero = await fetch(`${baseUrl}/api/products`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-CSRF-Token': owner.csrfToken,
        Cookie: owner.cookie
      },
      body: JSON.stringify({
        name: 'Free Promotional Bag',
        purchasePrice: 0,
        sellingPrice: 0,
        stockQuantity: 0
      })
    });
    assert.equal(resZero.status, 201);
    const zeroData = await resZero.json();
    assert.equal(zeroData.product.sellingPrice, 0);
    assert.equal(zeroData.product.stockQuantity, 0);
  });

  // --- Audit 12: Empty string and whitespace-only codes allow multiple products without conflict ---
  test('12. Missing, empty, and whitespace-only codes do not conflict for the same owner', async () => {
    const owner = await createAuthenticatedSession(
      'Blank Code User',
      'blankcode@example.com',
      'Password123!'
    );

    // Product 1 with omitted code
    const res1 = await fetch(`${baseUrl}/api/products`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-CSRF-Token': owner.csrfToken,
        Cookie: owner.cookie
      },
      body: JSON.stringify({ name: 'Uncoded Item 1', sellingPrice: 50 })
    });
    assert.equal(res1.status, 201);

    // Product 2 with explicit empty string code
    const res2 = await fetch(`${baseUrl}/api/products`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-CSRF-Token': owner.csrfToken,
        Cookie: owner.cookie
      },
      body: JSON.stringify({ name: 'Uncoded Item 2', code: '', sellingPrice: 60 })
    });
    assert.equal(res2.status, 201);

    // Product 3 with whitespace-only code
    const res3 = await fetch(`${baseUrl}/api/products`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-CSRF-Token': owner.csrfToken,
        Cookie: owner.cookie
      },
      body: JSON.stringify({ name: 'Uncoded Item 3', code: '   ', sellingPrice: 70 })
    });
    assert.equal(res3.status, 201, 'Multiple products with blank codes must co-exist peacefully');
  });

  // --- Audit 13: Mass-assignment protection on update ---
  test('13. Mass-assignment protection: immutable fields (owner, _id, timestamps) cannot be modified', async () => {
    const owner = await createAuthenticatedSession(
      'Security User',
      'secuser@example.com',
      'Password123!'
    );

    const createRes = await fetch(`${baseUrl}/api/products`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-CSRF-Token': owner.csrfToken,
        Cookie: owner.cookie
      },
      body: JSON.stringify({ name: 'Target Item', sellingPrice: 100 })
    });
    const { product } = await createRes.json();
    const originalOwner = product.owner;
    const fakeOwnerId = new mongoose.Types.ObjectId().toString();

    // Attempt PATCH tampering owner, _id, isArchived directly
    const patchRes = await fetch(`${baseUrl}/api/products/${product.id}`, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
        'X-CSRF-Token': owner.csrfToken,
        Cookie: owner.cookie
      },
      body: JSON.stringify({
        name: 'Target Item Renamed',
        owner: fakeOwnerId,
        _id: fakeOwnerId,
        isArchived: true, // must only be set via /archive endpoint
        unexpectedField: 'malicious'
      })
    });

    assert.equal(patchRes.status, 200);
    const patchedData = await patchRes.json();
    assert.equal(patchedData.product.name, 'Target Item Renamed');
    assert.equal(patchedData.product.owner, originalOwner, 'Owner must remain original owner');
    assert.equal(patchedData.product.id, product.id, '_id must remain unchanged');
    assert.equal(patchedData.product.isArchived, false, 'isArchived cannot be bypassed via standard patch');
  });

  // --- Audit 14: Safe 404 response on malformed ObjectId and non-existent IDs ---
  test('14. Safe 404 response on malformed ObjectId and non-existent IDs', async () => {
    const owner = await createAuthenticatedSession(
      'Malformed ID User',
      'malformed@example.com',
      'Password123!'
    );

    const nonExistentId = new mongoose.Types.ObjectId().toString();

    for (const testId of ['not-an-object-id', '123', nonExistentId]) {
      const getRes = await fetch(`${baseUrl}/api/products/${testId}`, {
        headers: { Cookie: owner.cookie }
      });
      assert.equal(getRes.status, 404, `GET /api/products/${testId} must return 404`);

      const patchRes = await fetch(`${baseUrl}/api/products/${testId}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          'X-CSRF-Token': owner.csrfToken,
          Cookie: owner.cookie
        },
        body: JSON.stringify({ name: 'Test' })
      });
      assert.equal(patchRes.status, 404, `PATCH /api/products/${testId} must return 404`);

      const archRes = await fetch(`${baseUrl}/api/products/${testId}/archive`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          'X-CSRF-Token': owner.csrfToken,
          Cookie: owner.cookie
        }
      });
      assert.equal(archRes.status, 404, `Archive /api/products/${testId} must return 404`);
    }
  });

  // --- Audit 15: Safe handling of regex special characters and oversized search strings ---
  test('15. Safe handling of special regex characters and oversized search strings without ReDoS', async () => {
    const owner = await createAuthenticatedSession(
      'Regex User',
      'regex@example.com',
      'Password123!'
    );

    // Queries with characters that would crash raw RegExp: [ ( * + ? \ ^ $ { }
    const hazardousQueries = ['[unclosed', '(?=test)', '***', 'a+b+c+', '(', '$.^'];

    for (const q of hazardousQueries) {
      const res = await fetch(`${baseUrl}/api/products?search=${encodeURIComponent(q)}`, {
        headers: { Cookie: owner.cookie }
      });
      assert.equal(res.status, 200, `Hazardous query "${q}" must not crash the server`);
      const data = await res.json();
      assert.ok(Array.isArray(data.products));
    }

    // Oversized query string
    const oversized = 'a'.repeat(2000);
    const overRes = await fetch(`${baseUrl}/api/products?search=${encodeURIComponent(oversized)}`, {
      headers: { Cookie: owner.cookie }
    });
    assert.equal(overRes.status, 200);
  });
});
