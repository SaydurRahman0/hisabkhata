import { test, describe, before, after } from 'node:test';
import assert from 'node:assert/strict';
import { MongoMemoryServer } from 'mongodb-memory-server';
import mongoose from 'mongoose';
import session from 'express-session';
import MongoStore from 'connect-mongo';
import express from 'express';
import { env } from '../src/config/env.js';
import { User } from '../src/models/User.js';
import { Customer } from '../src/models/Customer.js';
import authRoutes from '../src/routes/auth.routes.js';
import customerRoutes from '../src/routes/customer.routes.js';
import { notFoundHandler } from '../src/middleware/notFound.js';
import { errorHandler } from '../src/middleware/errorHandler.js';

describe('Phase 04B — Customer Management & Sensitive NID Isolation Tests', () => {
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
      dbName: 'hisabkhata_customers_test'
    });

    // 3. Build test Express app matching production config
    testApp = express();
    testApp.use(express.json({ limit: '100kb' }));

    const sessionStore = MongoStore.create({
      client: mongoose.connection.getClient(),
      dbName: 'hisabkhata_customers_test',
      collectionName: 'sessions',
      ttl: 604800
    });

    testApp.use(
      session({
        name: env.SESSION_COOKIE_NAME,
        secret: 'test-session-secret-for-customers-audit-must-be-long-enough',
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
    testApp.use('/api/customers', customerRoutes);
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

  // Helper: Extract cookies reliably from response headers
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
  test('1. Unauthenticated requests to /api/customers return 401', async () => {
    const res = await fetch(`${baseUrl}/api/customers`);
    assert.equal(res.status, 401);
    const data = await res.json();
    assert.equal(data.error, 'Unauthorized');
  });

  // --- Requirement 2 & 8: Authenticated owner can create, list, view, update, archive customer ---
  test('2. Authenticated owner can create, list, view, update, and archive customers', async () => {
    const owner = await createAuthenticatedSession(
      'Haji Afzal Hossain',
      'afzal@chowk-cloth.com',
      'Password123!'
    );

    // 1. Create customer with optional NID and notes
    const createRes = await fetch(`${baseUrl}/api/customers`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-CSRF-Token': owner.csrfToken,
        Cookie: owner.cookie
      },
      body: JSON.stringify({
        name: 'Mawlana Shamsul Haque',
        phone: '01711223344',
        address: '52 Islampur Road, Dhaka',
        nid: '19822691234567890',
        notes: 'Wholesale buyer, 10% credit discount authorized'
      })
    });

    assert.equal(createRes.status, 201);
    const createData = await createRes.json();
    assert.ok(createData.customer.id);
    assert.equal(createData.customer.name, 'Mawlana Shamsul Haque');
    assert.equal(createData.customer.phone, '+8801711223344', 'BD phone must be normalized to E.164 format');
    assert.equal(createData.customer.address, '52 Islampur Road, Dhaka');
    assert.equal(createData.customer.nid, '19822691234567890');
    assert.equal(createData.customer.isArchived, false);
    const customerId = createData.customer.id;

    // 2. View customer details (GET /api/customers/:id)
    const detailRes = await fetch(`${baseUrl}/api/customers/${customerId}`, {
      headers: { Cookie: owner.cookie }
    });
    assert.equal(detailRes.status, 200);
    const detailData = await detailRes.json();
    assert.equal(detailData.customer.name, 'Mawlana Shamsul Haque');
    assert.equal(detailData.customer.nid, '19822691234567890', 'Owner can view NID in detail endpoint');
    assert.equal(detailData.customer.notes, 'Wholesale buyer, 10% credit discount authorized');

    // 3. Update customer (PATCH /api/customers/:id)
    const updateRes = await fetch(`${baseUrl}/api/customers/${customerId}`, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
        'X-CSRF-Token': owner.csrfToken,
        Cookie: owner.cookie
      },
      body: JSON.stringify({
        address: '54 Islampur Road, 2nd Floor, Dhaka'
      })
    });
    assert.equal(updateRes.status, 200);
    const updateData = await updateRes.json();
    assert.equal(updateData.customer.address, '54 Islampur Road, 2nd Floor, Dhaka');

    // 4. Archive customer (PATCH /api/customers/:id/archive)
    const archRes = await fetch(`${baseUrl}/api/customers/${customerId}/archive`, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
        'X-CSRF-Token': owner.csrfToken,
        Cookie: owner.cookie
      }
    });
    assert.equal(archRes.status, 200);
    const archData = await archRes.json();
    assert.equal(archData.customer.isArchived, true);

    // 5. Restore customer
    const restoreRes = await fetch(`${baseUrl}/api/customers/${customerId}/archive`, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
        'X-CSRF-Token': owner.csrfToken,
        Cookie: owner.cookie
      },
      body: JSON.stringify({ isArchived: false })
    });
    assert.equal(restoreRes.status, 200);
    assert.equal((await restoreRes.json()).customer.isArchived, false);
  });

  // --- Requirement 3: Required-field and input validation ---
  test('3. Required-field and phone input validation works', async () => {
    const owner = await createAuthenticatedSession(
      'Validator',
      'validator.cust@test.com',
      'Password123!'
    );

    // Missing name
    const res1 = await fetch(`${baseUrl}/api/customers`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-CSRF-Token': owner.csrfToken,
        Cookie: owner.cookie
      },
      body: JSON.stringify({ phone: '01711223344' })
    });
    assert.equal(res1.status, 400);

    // Empty/blank name
    const res2 = await fetch(`${baseUrl}/api/customers`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-CSRF-Token': owner.csrfToken,
        Cookie: owner.cookie
      },
      body: JSON.stringify({ name: '   ', phone: '01711223344' })
    });
    assert.equal(res2.status, 400);

    // Missing phone
    const res3 = await fetch(`${baseUrl}/api/customers`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-CSRF-Token': owner.csrfToken,
        Cookie: owner.cookie
      },
      body: JSON.stringify({ name: 'Kashem Traders' })
    });
    assert.equal(res3.status, 400);

    // Invalid phone characters
    const res4 = await fetch(`${baseUrl}/api/customers`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-CSRF-Token': owner.csrfToken,
        Cookie: owner.cookie
      },
      body: JSON.stringify({ name: 'Kashem Traders', phone: 'abc-invalid' })
    });
    assert.equal(res4.status, 400);

    // Phone too short (< 7 digits)
    const res5 = await fetch(`${baseUrl}/api/customers`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-CSRF-Token': owner.csrfToken,
        Cookie: owner.cookie
      },
      body: JSON.stringify({ name: 'Kashem Traders', phone: '123' })
    });
    assert.equal(res5.status, 400);
  });

  // --- Requirement 4: Search is restricted to the authenticated owner ---
  test('4. Search is restricted strictly to the authenticated owner', async () => {
    const owner1 = await createAuthenticatedSession(
      'Owner One',
      'owner1.search@test.com',
      'Password123!'
    );
    const owner2 = await createAuthenticatedSession(
      'Owner Two',
      'owner2.search@test.com',
      'Password123!'
    );

    // Owner 1 creates customer "Kamal Store"
    await fetch(`${baseUrl}/api/customers`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-CSRF-Token': owner1.csrfToken,
        Cookie: owner1.cookie
      },
      body: JSON.stringify({ name: 'Kamal Grocery Store', phone: '01811223344' })
    });

    // Owner 2 creates customer "Kamal Hardware"
    await fetch(`${baseUrl}/api/customers`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-CSRF-Token': owner2.csrfToken,
        Cookie: owner2.cookie
      },
      body: JSON.stringify({ name: 'Kamal Electric Hardware', phone: '01911223344' })
    });

    // Owner 1 searches for "Kamal" -> must only find Kamal Grocery Store
    const searchRes1 = await fetch(`${baseUrl}/api/customers?search=Kamal`, {
      headers: { Cookie: owner1.cookie }
    });
    assert.equal(searchRes1.status, 200);
    const searchData1 = await searchRes1.json();
    assert.equal(searchData1.customers.length, 1);
    assert.equal(searchData1.customers[0].name, 'Kamal Grocery Store');

    // Owner 2 searches for "Kamal" -> must only find Kamal Electric Hardware
    const searchRes2 = await fetch(`${baseUrl}/api/customers?search=Kamal`, {
      headers: { Cookie: owner2.cookie }
    });
    assert.equal(searchRes2.status, 200);
    const searchData2 = await searchRes2.json();
    assert.equal(searchData2.customers.length, 1);
    assert.equal(searchData2.customers[0].name, 'Kamal Electric Hardware');
  });

  // --- Requirement 5: User A cannot read, update, or archive User B customer (returns 404) ---
  test('5. Cross-tenant isolation: User A cannot read, update, or archive User B customer', async () => {
    const userA = await createAuthenticatedSession(
      'Merchant A',
      'merchant.a@test.com',
      'Password123!'
    );
    const userB = await createAuthenticatedSession(
      'Merchant B',
      'merchant.b@test.com',
      'Password123!'
    );

    // User A creates a customer
    const createRes = await fetch(`${baseUrl}/api/customers`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-CSRF-Token': userA.csrfToken,
        Cookie: userA.cookie
      },
      body: JSON.stringify({
        name: 'Secret Client A',
        phone: '01511223344',
        nid: '19702691234567890'
      })
    });
    assert.equal(createRes.status, 201);
    const customerAId = (await createRes.json()).customer.id;

    // User B tries to read User A's customer
    const getRes = await fetch(`${baseUrl}/api/customers/${customerAId}`, {
      headers: { Cookie: userB.cookie }
    });
    assert.equal(getRes.status, 404, 'Cross-tenant GET must return 404');

    // User B tries to update User A's customer
    const patchRes = await fetch(`${baseUrl}/api/customers/${customerAId}`, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
        'X-CSRF-Token': userB.csrfToken,
        Cookie: userB.cookie
      },
      body: JSON.stringify({ name: 'Hacked Name' })
    });
    assert.equal(patchRes.status, 404, 'Cross-tenant PATCH must return 404');

    // User B tries to archive User A's customer
    const archRes = await fetch(`${baseUrl}/api/customers/${customerAId}/archive`, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
        'X-CSRF-Token': userB.csrfToken,
        Cookie: userB.cookie
      }
    });
    assert.equal(archRes.status, 404, 'Cross-tenant archive must return 404');

    // Verify User A's customer was not altered
    const verifyRes = await fetch(`${baseUrl}/api/customers/${customerAId}`, {
      headers: { Cookie: userA.cookie }
    });
    const verifyData = await verifyRes.json();
    assert.equal(verifyData.customer.name, 'Secret Client A');
    assert.equal(verifyData.customer.isArchived, false);
  });

  // --- Requirement 6: Forged owner IDs and mass-assignment attempts are rejected or ignored ---
  test('6. Forged owner IDs and mass assignment attempts are ignored', async () => {
    const owner = await createAuthenticatedSession(
      'Legit Owner',
      'legit@test.com',
      'Password123!'
    );

    const fakeOwnerId = new mongoose.Types.ObjectId().toString();

    // Create attempting to set owner to fakeOwnerId
    const createRes = await fetch(`${baseUrl}/api/customers`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-CSRF-Token': owner.csrfToken,
        Cookie: owner.cookie
      },
      body: JSON.stringify({
        name: 'Integrity Customer',
        phone: '01799887766',
        owner: fakeOwnerId,
        _id: fakeOwnerId,
        isArchived: true
      })
    });

    assert.equal(createRes.status, 201);
    const created = (await createRes.json()).customer;
    assert.notEqual(created.owner, fakeOwnerId, 'Must not accept client-forged owner');
    assert.notEqual(created.id, fakeOwnerId, 'Must not accept client-forged _id');
    assert.equal(created.isArchived, false, 'Must initialize isArchived as false on create');

    // Attempt PATCH tampering owner
    const patchRes = await fetch(`${baseUrl}/api/customers/${created.id}`, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
        'X-CSRF-Token': owner.csrfToken,
        Cookie: owner.cookie
      },
      body: JSON.stringify({
        owner: fakeOwnerId,
        _id: fakeOwnerId,
        isArchived: true
      })
    });

    assert.equal(patchRes.status, 200);
    const patched = (await patchRes.json()).customer;
    assert.notEqual(patched.owner, fakeOwnerId);
    assert.equal(patched.id, created.id);
    assert.equal(patched.isArchived, false, 'isArchived cannot be bypassed via standard patch');
  });

  // --- Requirement 7: NID does not appear in list responses ---
  test('7. Sensitive NID does not appear in customer list responses', async () => {
    const owner = await createAuthenticatedSession(
      'Privacy Owner',
      'privacy@test.com',
      'Password123!'
    );

    await fetch(`${baseUrl}/api/customers`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-CSRF-Token': owner.csrfToken,
        Cookie: owner.cookie
      },
      body: JSON.stringify({
        name: 'Sensitive Customer',
        phone: '01611223344',
        nid: '19952691234567890',
        notes: 'Strictly confidential note'
      })
    });

    const listRes = await fetch(`${baseUrl}/api/customers`, {
      headers: { Cookie: owner.cookie }
    });

    assert.equal(listRes.status, 200);
    const listData = await listRes.json();
    assert.equal(listData.customers.length, 1);
    const customerInList = listData.customers[0];

    // Verify NID and notes are NOT leaked in list response
    assert.equal(
      customerInList.nid,
      undefined,
      'Sensitive NID must NEVER be serialized in list response'
    );
    assert.equal(
      customerInList.notes,
      undefined,
      'Confidential notes must not be included in list response'
    );
  });

  // --- Requirement 9: CSRF protection is enforced for state-changing customer requests ---
  test('9. CSRF protection is strictly enforced for state-changing customer requests', async () => {
    const owner = await createAuthenticatedSession(
      'CSRF Customer Tester',
      'csrf.cust@test.com',
      'Password123!'
    );

    // POST without CSRF token
    const postNoCsrf = await fetch(`${baseUrl}/api/customers`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Cookie: owner.cookie
      },
      body: JSON.stringify({ name: 'No CSRF Client', phone: '01700112233' })
    });
    assert.equal(postNoCsrf.status, 403, 'POST /api/customers without CSRF must return 403');

    // PATCH with tampered CSRF token
    const patchBadCsrf = await fetch(`${baseUrl}/api/customers/dummyid`, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
        'X-CSRF-Token': 'f'.repeat(64),
        Cookie: owner.cookie
      },
      body: JSON.stringify({ name: 'Tampered' })
    });
    assert.equal(patchBadCsrf.status, 403, 'PATCH /api/customers with tampered CSRF must return 403');
  });

  // --- Additional: Safe 404 response on malformed ObjectId ---
  test('10. Safe 404 response on malformed ObjectId and non-existent IDs', async () => {
    const owner = await createAuthenticatedSession(
      'Safe 404 User',
      'safe404.cust@test.com',
      'Password123!'
    );

    for (const testId of ['not-a-valid-id', '123', new mongoose.Types.ObjectId().toString()]) {
      const getRes = await fetch(`${baseUrl}/api/customers/${testId}`, {
        headers: { Cookie: owner.cookie }
      });
      assert.equal(getRes.status, 404, `GET /api/customers/${testId} must return 404`);

      const patchRes = await fetch(`${baseUrl}/api/customers/${testId}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          'X-CSRF-Token': owner.csrfToken,
          Cookie: owner.cookie
        },
        body: JSON.stringify({ name: 'Test' })
      });
      assert.equal(patchRes.status, 404, `PATCH /api/customers/${testId} must return 404`);
    }
  });

  // --- Audit 11: Phone normalization and prefix verification ---
  test('11. Bangladeshi mobile operators (013–019) accepted and invalid prefixes (010–012) rejected', async () => {
    const owner = await createAuthenticatedSession(
      'Prefix Tester',
      'prefix@test.com',
      'Password123!'
    );

    // Valid Bangladeshi operator prefixes: 013, 014, 015, 016, 017, 018, 019
    for (const prefix of ['013', '014', '015', '016', '017', '018', '019']) {
      const res = await fetch(`${baseUrl}/api/customers`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-CSRF-Token': owner.csrfToken,
          Cookie: owner.cookie
        },
        body: JSON.stringify({ name: `Operator ${prefix}`, phone: `${prefix}00112233` })
      });
      assert.equal(res.status, 201, `Prefix ${prefix} must be accepted as valid BD mobile`);
      const data = await res.json();
      assert.equal(data.customer.phone, `+88${prefix}00112233`);
    }

    // Invalid Bangladeshi prefixes: 010, 011, 012
    for (const badPrefix of ['010', '011', '012']) {
      const res = await fetch(`${baseUrl}/api/customers`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-CSRF-Token': owner.csrfToken,
          Cookie: owner.cookie
        },
        body: JSON.stringify({ name: `Bad ${badPrefix}`, phone: `${badPrefix}00112233` })
      });
      assert.equal(res.status, 400, `Prefix ${badPrefix} must be rejected with 400`);
    }

    // International numbers: must NOT be converted into BD numbers
    const intlRes = await fetch(`${baseUrl}/api/customers`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-CSRF-Token': owner.csrfToken,
        Cookie: owner.cookie
      },
      body: JSON.stringify({ name: 'UK Buyer', phone: '+44 7911 123456' })
    });
    assert.equal(intlRes.status, 201);
    const intlData = await intlRes.json();
    assert.equal(intlData.customer.phone, '+447911123456', 'International number must preserve original country code');
  });

  // --- Audit 12: Phone search with spaces and hyphens matches stored normalized number ---
  test('12. Phone search with spaces and hyphens matches stored normalized number', async () => {
    const owner = await createAuthenticatedSession(
      'Phone Search Tester',
      'phonesearch@test.com',
      'Password123!'
    );

    // Create customer with raw standard local number
    await fetch(`${baseUrl}/api/customers`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-CSRF-Token': owner.csrfToken,
        Cookie: owner.cookie
      },
      body: JSON.stringify({ name: 'Shamsul Haque', phone: '01712-998877' })
    });

    // Search with hyphen: 01712-998877
    const searchRes1 = await fetch(`${baseUrl}/api/customers?search=01712-998877`, {
      headers: { Cookie: owner.cookie }
    });
    assert.equal(searchRes1.status, 200);
    const data1 = await searchRes1.json();
    assert.equal(data1.customers.length, 1);
    assert.equal(data1.customers[0].name, 'Shamsul Haque');

    // Search with partial local digits: 998877
    const searchRes2 = await fetch(`${baseUrl}/api/customers?search=998877`, {
      headers: { Cookie: owner.cookie }
    });
    assert.equal(searchRes2.status, 200);
    const data2 = await searchRes2.json();
    assert.equal(data2.customers.length, 1);
  });

  // --- Audit 13: Partial update does NOT accidentally erase omitted NID or notes ---
  test('13. Partial update does not erase omitted sensitive NID or notes', async () => {
    const owner = await createAuthenticatedSession(
      'Partial Update User',
      'partial@test.com',
      'Password123!'
    );

    // Create customer with NID and notes
    const createRes = await fetch(`${baseUrl}/api/customers`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-CSRF-Token': owner.csrfToken,
        Cookie: owner.cookie
      },
      body: JSON.stringify({
        name: 'Initial Name',
        phone: '01788776655',
        address: 'Initial Address',
        nid: '19801234567890123',
        notes: 'Secret internal remarks'
      })
    });
    const created = (await createRes.json()).customer;

    // Perform partial update with ONLY address changed
    const patchRes = await fetch(`${baseUrl}/api/customers/${created.id}`, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
        'X-CSRF-Token': owner.csrfToken,
        Cookie: owner.cookie
      },
      body: JSON.stringify({
        address: 'Updated Address Only'
      })
    });
    assert.equal(patchRes.status, 200);

    // Verify detail endpoint still contains untouched NID and notes
    const detailRes = await fetch(`${baseUrl}/api/customers/${created.id}`, {
      headers: { Cookie: owner.cookie }
    });
    const detail = (await detailRes.json()).customer;
    assert.equal(detail.address, 'Updated Address Only');
    assert.equal(detail.nid, '19801234567890123', 'NID must not be erased on partial update');
    assert.equal(detail.notes, 'Secret internal remarks', 'Notes must not be erased on partial update');
  });

  // --- Audit 14: Multiple customers can share or omit NID without collision ---
  test('14. Multiple customers can share or omit NID without collision', async () => {
    const owner = await createAuthenticatedSession(
      'NID Sharing User',
      'nidsharing@test.com',
      'Password123!'
    );

    const sharedNid = '19750000000000000';

    // Customer 1 with shared NID
    const res1 = await fetch(`${baseUrl}/api/customers`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-CSRF-Token': owner.csrfToken,
        Cookie: owner.cookie
      },
      body: JSON.stringify({ name: 'Partner One', phone: '01711000001', nid: sharedNid })
    });
    assert.equal(res1.status, 201);

    // Customer 2 with SAME shared NID under same owner (e.g. joint family account or business rep)
    const res2 = await fetch(`${baseUrl}/api/customers`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-CSRF-Token': owner.csrfToken,
        Cookie: owner.cookie
      },
      body: JSON.stringify({ name: 'Partner Two', phone: '01711000002', nid: sharedNid })
    });
    assert.equal(res2.status, 201, 'No global unique constraint on NID; multiple accounts may share it');

    // Customer 3 with omitted NID
    const res3 = await fetch(`${baseUrl}/api/customers`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-CSRF-Token': owner.csrfToken,
        Cookie: owner.cookie
      },
      body: JSON.stringify({ name: 'No NID Customer', phone: '01711000003' })
    });
    assert.equal(res3.status, 201);
  });
});
