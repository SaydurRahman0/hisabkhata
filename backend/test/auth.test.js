import { test, describe, before, after } from 'node:test';
import assert from 'node:assert/strict';
import argon2 from 'argon2';
import crypto from 'crypto';
import app from '../src/app.js';
import { User } from '../src/models/User.js';
import { env } from '../src/config/env.js';

describe('Phase 03 — Password Security & Argon2id Unit Tests', () => {
  test('User.hashPassword generates a valid Argon2id hash', async () => {
    const password = 'CorrectHorseBatteryStaple99!';
    const hash = await User.hashPassword(password);

    assert.ok(hash.startsWith('$argon2id$'), 'Hash must use the Argon2id variant');
    assert.notEqual(hash, password, 'Password must never be stored as plaintext');

    const isValid = await User.verifyPassword(hash, password);
    assert.equal(isValid, true, 'Verification of correct password must succeed');

    const isInvalid = await User.verifyPassword(hash, 'WrongPassword123');
    assert.equal(isInvalid, false, 'Verification of incorrect password must fail');
  });

  test('User.hashPassword rejects passwords under 8 characters', async () => {
    await assert.rejects(
      async () => {
        await User.hashPassword('short');
      },
      {
        message: 'Password must be at least 8 characters long'
      }
    );
  });

  test('User.toJSON strips passwordHash and internal __v', () => {
    const dummy = new User({
      fullName: 'Test Owner',
      email: 'owner@teststore.com',
      passwordHash: '$argon2id$v=19$m=65536,t=3,p=1$dummyhash',
      role: 'owner',
      isActive: true
    });

    const json = dummy.toJSON();
    assert.equal(json.passwordHash, undefined, 'passwordHash must never be serialized');
    assert.equal(json.__v, undefined, '__v must never be serialized');
    assert.equal(json.email, 'owner@teststore.com');
    assert.equal(json.fullName, 'Test Owner');
  });
});

describe('Phase 03 — CSRF, CORS & Security Boundary Tests', () => {
  let server;
  let baseUrl;

  before(async () => {
    server = app.listen(5099);
    baseUrl = 'http://localhost:5099';
  });

  after(async () => {
    await new Promise((resolve) => server.close(resolve));
  });

  test('GET /api/auth/csrf issues a cryptographically secure 64-char hex token', async () => {
    const res = await fetch(`${baseUrl}/api/auth/csrf`);
    assert.equal(res.status, 200);

    const body = await res.json();
    assert.ok(body.csrfToken, 'Response must contain csrfToken');
    assert.equal(body.csrfToken.length, 64, 'Token must be 32 bytes hex (64 chars)');

    // Verify Set-Cookie header contains XSRF-TOKEN
    const setCookie = res.headers.get('set-cookie');
    assert.ok(setCookie && setCookie.includes('XSRF-TOKEN'), 'Must set XSRF-TOKEN cookie');
  });

  test('POST /api/auth/login fails with 403 when CSRF token is missing', async () => {
    const res = await fetch(`${baseUrl}/api/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: 'test@example.com', password: 'password123' })
    });

    assert.equal(res.status, 403, 'Must reject state-changing request without CSRF token');
    const body = await res.json();
    assert.equal(body.error, 'Forbidden');
  });

  test('POST /api/auth/login fails with 403 when CSRF token is invalid or mismatched', async () => {
    // 1. Get real CSRF token to establish session
    const csrfRes = await fetch(`${baseUrl}/api/auth/csrf`);
    const cookie = csrfRes.headers.get('set-cookie');

    // 2. Submit with tampered token
    const res = await fetch(`${baseUrl}/api/auth/login`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-CSRF-Token': 'a'.repeat(64),
        Cookie: cookie
      },
      body: JSON.stringify({ email: 'test@example.com', password: 'password123' })
    });

    assert.equal(res.status, 403, 'Must reject mismatched CSRF token');
  });

  test('GET /api/auth/me returns 401 Unauthorized for unauthenticated requests', async () => {
    const res = await fetch(`${baseUrl}/api/auth/me`);
    assert.equal(res.status, 401);
    const body = await res.json();
    assert.equal(body.error, 'Unauthorized');
  });

  test('CORS preflight rejects unauthorized cross-origin with 403', async () => {
    const res = await fetch(`${baseUrl}/api/auth/csrf`, {
      method: 'OPTIONS',
      headers: {
        Origin: 'https://malicious-attacker-domain.org'
      }
    });

    assert.equal(res.status, 403, 'Unauthorized CORS origin must receive 403 Forbidden');
  });

  test('CORS rejects unauthorized Cloud Run domains and host header spoofing', async () => {
    // 1. Arbitrary attacker on Cloud Run must be rejected
    const resAttacker = await fetch(`${baseUrl}/api/auth/csrf`, {
      method: 'OPTIONS',
      headers: {
        Origin: 'https://arbitrary-attacker.run.app'
      }
    });
    assert.equal(resAttacker.status, 403, 'Arbitrary run.app domain must be rejected');

    // 2. Spoofed Host / X-Forwarded-Host cannot expand allowlist
    const resSpoofed = await fetch(`${baseUrl}/api/auth/csrf`, {
      method: 'OPTIONS',
      headers: {
        Origin: 'https://attacker.evil.com',
        Host: 'attacker.evil.com',
        'X-Forwarded-Host': 'attacker.evil.com'
      }
    });
    assert.equal(resSpoofed.status, 403, 'Spoofed Host headers must not bypass CORS check');

    // 3. Legitimate AI Studio preview origin is accepted
    const resValidPreview = await fetch(`${baseUrl}/api/auth/csrf`, {
      method: 'OPTIONS',
      headers: {
        Origin: 'https://ais-dev-gnkluszgj2qjhe4ztm2vep-561704757176.asia-east1.run.app'
      }
    });
    assert.equal(resValidPreview.status, 204, 'Legitimate AI Studio preview origin must be allowed');
    assert.equal(
      resValidPreview.headers.get('access-control-allow-origin'),
      'https://ais-dev-gnkluszgj2qjhe4ztm2vep-561704757176.asia-east1.run.app'
    );
  });

  test('User Isolation: requireAuth ignores user ID sent in request headers or body', async () => {
    // An attacker sending custom user ID or pretending to be another tenant
    const res = await fetch(`${baseUrl}/api/auth/me`, {
      headers: {
        'X-User-Id': '64b0f0000000000000000001',
        'X-Impersonate-User': 'victim@business.com'
      }
    });

    assert.equal(res.status, 401, 'Identity cannot be spoofed via client request headers');
  });
});
