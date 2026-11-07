import { test, describe, before, after } from 'node:test';
import assert from 'node:assert/strict';
import { MongoMemoryServer } from 'mongodb-memory-server';
import mongoose from 'mongoose';
import session from 'express-session';
import MongoStore from 'connect-mongo';
import express from 'express';
import { env } from '../src/config/env.js';
import { User } from '../src/models/User.js';
import healthRoutes from '../src/routes/health.routes.js';
import authRoutes from '../src/routes/auth.routes.js';
import { notFoundHandler } from '../src/middleware/notFound.js';
import { errorHandler } from '../src/middleware/errorHandler.js';

describe('Phase 03 — Real MongoDB Integration & User Isolation Audit', () => {
  let mongod;
  let server;
  let baseUrl;
  let testApp;

  before(async () => {
    // 1. Start real isolated MongoDB instance
    mongod = await MongoMemoryServer.create();
    const uri = mongod.getUri();

    // 2. Connect Mongoose to isolated test instance
    await mongoose.connect(uri, {
      dbName: 'hisabkhata_test'
    });

    // 3. Create isolated test Express application using MongoStore backed by real MongoDB
    testApp = express();
    testApp.use(express.json({ limit: '100kb' }));

    const sessionStore = MongoStore.create({
      client: mongoose.connection.getClient(),
      dbName: 'hisabkhata_test',
      collectionName: 'sessions',
      ttl: 604800
    });

    testApp.use(
      session({
        name: 'hisabkhata_sid',
        secret: 'test-session-secret-for-database-audit-must-be-long-enough',
        resave: false,
        saveUninitialized: false,
        store: sessionStore,
        cookie: {
          httpOnly: true,
          secure: false, // HTTP in local test server
          sameSite: 'lax',
          maxAge: 7 * 24 * 60 * 60 * 1000,
          path: '/'
        }
      })
    );

    testApp.use('/api/health', healthRoutes);
    testApp.use('/api/auth', authRoutes);
    testApp.use('/api', notFoundHandler);
    testApp.use(errorHandler);

    // 4. Start HTTP test server on an ephemeral port
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

  // Helper to extract session cookies and CSRF tokens
  async function getCsrfAndCookies() {
    const res = await fetch(`${baseUrl}/api/auth/csrf`);
    const data = await res.json();
    const rawCookies = res.headers.getSetCookie ? res.headers.getSetCookie() : [res.headers.get('set-cookie')];
    const cookieHeader = rawCookies
      .map((c) => c.split(';')[0])
      .join('; ');

    return { csrfToken: data.csrfToken, cookieHeader, rawCookies };
  }

  // AUDIT 1: Readiness probe with real MongoDB connected
  test('Audit 1: GET /api/health/ready returns 200 OK when real database is connected', async () => {
    const res = await fetch(`${baseUrl}/api/health/ready`);
    assert.equal(res.status, 200, 'Readiness probe must return 200 when MongoDB is connected');
    const data = await res.json();
    assert.equal(data.status, 'ready');
    assert.equal(data.database.status, 'connected');
    assert.equal(data.database.readyState, 'connected');
  });

  // AUDIT 2: User 1 Registration & Cookie Verification
  let user1Cookie = '';
  let user1Id = '';

  test('Audit 2: Register Account 1 (Rahim Khan) in real MongoDB with Argon2id hash', async () => {
    const { csrfToken, cookieHeader, rawCookies } = await getCsrfAndCookies();

    const res = await fetch(`${baseUrl}/api/auth/register`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-CSRF-Token': csrfToken,
        Cookie: cookieHeader
      },
      body: JSON.stringify({
        fullName: 'Abdur Rahim',
        email: 'rahim@chawkbazar-trade.com',
        password: 'Password123!Secure'
      })
    });

    assert.equal(res.status, 201, 'Registration must return 201 Created');
    const data = await res.json();
    assert.equal(data.user.fullName, 'Abdur Rahim');
    assert.equal(data.user.email, 'rahim@chawkbazar-trade.com');
    assert.equal(data.user.passwordHash, undefined, 'passwordHash must never be exposed');
    assert.ok(data.user._id || data.user.id, 'User must have valid MongoDB ID');
    user1Id = data.user._id || data.user.id;

    // Verify session cookie was set with proper attributes
    const sessionCookieHeader = res.headers.getSetCookie ? res.headers.getSetCookie() : [res.headers.get('set-cookie')];
    const sidCookie = sessionCookieHeader.find((c) => c && c.includes('hisabkhata_sid'));
    assert.ok(sidCookie, 'Response must include hisabkhata_sid session cookie');
    assert.ok(sidCookie.toLowerCase().includes('httponly'), 'Session cookie must be HttpOnly');
    assert.ok(sidCookie.toLowerCase().includes('samesite=lax'), 'Session cookie must be SameSite=Lax');

    // Extract established session cookie for User 1
    const setCookies = res.headers.getSetCookie ? res.headers.getSetCookie() : [res.headers.get('set-cookie')];
    user1Cookie = setCookies.map((c) => c.split(';')[0]).join('; ');

    // Verify user in real MongoDB collection directly
    const dbRecord = await User.findOne({ email: 'rahim@chawkbazar-trade.com' }).select('+passwordHash');
    assert.ok(dbRecord, 'Record must exist in real MongoDB');
    assert.ok(dbRecord.passwordHash.startsWith('$argon2id$'), 'Password in DB must be hashed with Argon2id');
    assert.notEqual(dbRecord.passwordHash, 'Password123!Secure', 'Plaintext password must not be stored in DB');
  });

  // AUDIT 3: Duplicate Email Rejection (with case normalization)
  test('Audit 3: Reject duplicate registration with normalized email in real MongoDB', async () => {
    const { csrfToken, cookieHeader } = await getCsrfAndCookies();

    // Attempt to register with uppercase email
    const res = await fetch(`${baseUrl}/api/auth/register`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-CSRF-Token': csrfToken,
        Cookie: cookieHeader
      },
      body: JSON.stringify({
        fullName: 'Imposter Rahim',
        email: 'RAHIM@CHAWKBAZAR-TRADE.COM',
        password: 'AnotherPassword999'
      })
    });

    assert.equal(res.status, 409, 'Duplicate normalized email must be rejected with 409 Conflict');
    const data = await res.json();
    assert.equal(data.error, 'Conflict');
    assert.ok(data.message.includes('already exists'));
  });

  // AUDIT 4: Input Validation Edge Cases
  test('Audit 4: Rejects invalid registration inputs with 400 Bad Request', async () => {
    const { csrfToken, cookieHeader } = await getCsrfAndCookies();

    // 1. Missing name
    const res1 = await fetch(`${baseUrl}/api/auth/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'X-CSRF-Token': csrfToken, Cookie: cookieHeader },
      body: JSON.stringify({ fullName: ' ', email: 'test@valid.com', password: 'ValidPassword123' })
    });
    assert.equal(res1.status, 400, 'Blank fullName must return 400');

    // 2. Invalid email format
    const res2 = await fetch(`${baseUrl}/api/auth/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'X-CSRF-Token': csrfToken, Cookie: cookieHeader },
      body: JSON.stringify({ fullName: 'Valid Name', email: 'notanemail', password: 'ValidPassword123' })
    });
    assert.equal(res2.status, 400, 'Invalid email format must return 400');

    // 3. Short password
    const res3 = await fetch(`${baseUrl}/api/auth/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'X-CSRF-Token': csrfToken, Cookie: cookieHeader },
      body: JSON.stringify({ fullName: 'Valid Name', email: 'test@valid.com', password: 'short' })
    });
    assert.equal(res3.status, 400, 'Password < 8 chars must return 400');
  });

  // AUDIT 5: User 2 Registration
  let user2Cookie = '';
  let user2Id = '';

  test('Audit 5: Register Account 2 (Kamal Ahmed) in real MongoDB', async () => {
    const { csrfToken, cookieHeader } = await getCsrfAndCookies();

    const res = await fetch(`${baseUrl}/api/auth/register`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-CSRF-Token': csrfToken,
        Cookie: cookieHeader
      },
      body: JSON.stringify({
        fullName: 'Kamal Ahmed',
        email: 'kamal@begumbazar.com',
        password: 'Password456!Secure'
      })
    });

    assert.equal(res.status, 201);
    const data = await res.json();
    assert.equal(data.user.fullName, 'Kamal Ahmed');
    assert.equal(data.user.email, 'kamal@begumbazar.com');
    user2Id = data.user._id || data.user.id;
    assert.notEqual(user1Id, user2Id, 'Account 1 and Account 2 must have distinct IDs');

    const setCookies = res.headers.getSetCookie ? res.headers.getSetCookie() : [res.headers.get('set-cookie')];
    user2Cookie = setCookies.map((c) => c.split(';')[0]).join('; ');
  });

  // AUDIT 6: User Isolation Verification
  test('Audit 6: Strict User Isolation — each session accesses only its own account', async () => {
    // 1. Session 1 requests /api/auth/me -> must be Abdur Rahim
    const res1 = await fetch(`${baseUrl}/api/auth/me`, {
      headers: { Cookie: user1Cookie }
    });
    assert.equal(res1.status, 200);
    const data1 = await res1.json();
    assert.equal(data1.user.fullName, 'Abdur Rahim');
    assert.equal(data1.user.email, 'rahim@chawkbazar-trade.com');

    // 2. Session 2 requests /api/auth/me -> must be Kamal Ahmed
    const res2 = await fetch(`${baseUrl}/api/auth/me`, {
      headers: { Cookie: user2Cookie }
    });
    assert.equal(res2.status, 200);
    const data2 = await res2.json();
    assert.equal(data2.user.fullName, 'Kamal Ahmed');
    assert.equal(data2.user.email, 'kamal@begumbazar.com');

    // 3. Impersonation attempt: Session 1 supplies Session 2 user ID in headers/body/query
    const resImpersonate = await fetch(`${baseUrl}/api/auth/me?userId=${user2Id}`, {
      headers: {
        Cookie: user1Cookie,
        'X-User-Id': user2Id,
        'X-Impersonate-User': 'kamal@begumbazar.com'
      }
    });
    assert.equal(resImpersonate.status, 200);
    const dataImpersonate = await resImpersonate.json();
    assert.equal(
      dataImpersonate.user.id,
      user1Id,
      'User ID in server response must strictly match session userId, ignoring client spoofing headers'
    );
    assert.equal(dataImpersonate.user.email, 'rahim@chawkbazar-trade.com');
  });

  // AUDIT 7: Login Authentication & Enumeration Defense
  test('Audit 7: Login verification and generic failure message (prevents user enumeration)', async () => {
    const { csrfToken, cookieHeader } = await getCsrfAndCookies();

    // 1. Non-existent email -> generic failure
    const resNonExistent = await fetch(`${baseUrl}/api/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'X-CSRF-Token': csrfToken, Cookie: cookieHeader },
      body: JSON.stringify({ email: 'ghost-user-does-not-exist@random.com', password: 'SomePassword123' })
    });
    assert.equal(resNonExistent.status, 401);
    const dataNonExistent = await resNonExistent.json();
    assert.equal(dataNonExistent.message, 'Invalid email or password.');

    // 2. Existing email with wrong password -> same generic failure
    const resWrongPass = await fetch(`${baseUrl}/api/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'X-CSRF-Token': csrfToken, Cookie: cookieHeader },
      body: JSON.stringify({ email: 'rahim@chawkbazar-trade.com', password: 'WrongPassword999!' })
    });
    assert.equal(resWrongPass.status, 401);
    const dataWrongPass = await resWrongPass.json();
    assert.equal(dataWrongPass.message, 'Invalid email or password.');

    // 3. Correct login
    const resSuccess = await fetch(`${baseUrl}/api/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'X-CSRF-Token': csrfToken, Cookie: cookieHeader },
      body: JSON.stringify({ email: 'rahim@chawkbazar-trade.com', password: 'Password123!Secure' })
    });
    assert.equal(resSuccess.status, 200);
    const dataSuccess = await resSuccess.json();
    assert.equal(dataSuccess.user.email, 'rahim@chawkbazar-trade.com');
    assert.equal(dataSuccess.user.passwordHash, undefined);
  });

  // AUDIT 8: Logout & Server-Side Session Invalidation
  test('Audit 8: Logout destroys server-side session and prevents further access', async () => {
    // 1. Log in User 2
    const { csrfToken, cookieHeader } = await getCsrfAndCookies();
    const loginRes = await fetch(`${baseUrl}/api/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'X-CSRF-Token': csrfToken, Cookie: cookieHeader },
      body: JSON.stringify({ email: 'kamal@begumbazar.com', password: 'Password456!Secure' })
    });
    assert.equal(loginRes.status, 200);
    const loginData = await loginRes.json();
    const loginCookies = (loginRes.headers.getSetCookie ? loginRes.headers.getSetCookie() : [loginRes.headers.get('set-cookie')])
      .map((c) => c.split(';')[0])
      .join('; ');

    // 2. Confirm session works
    const meRes1 = await fetch(`${baseUrl}/api/auth/me`, {
      headers: { Cookie: loginCookies }
    });
    assert.equal(meRes1.status, 200);

    // 3. Logout using valid CSRF token
    const logoutRes = await fetch(`${baseUrl}/api/auth/logout`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'X-CSRF-Token': loginData.csrfToken, Cookie: loginCookies }
    });
    assert.equal(logoutRes.status, 200);

    // 4. Try to access /api/auth/me with old session cookie -> must return 401 Unauthorized
    const meResAfterLogout = await fetch(`${baseUrl}/api/auth/me`, {
      headers: { Cookie: loginCookies }
    });
    assert.equal(meResAfterLogout.status, 401, 'Logged-out session cookie must be rejected with 401 Unauthorized');
  });
});
