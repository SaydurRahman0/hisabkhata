# HisabKhata Backend API Service (Phase 03)

Express.js backend foundation, MongoDB connection architecture, and secure session-based authentication for the HisabKhata business bookkeeping platform.

---

## 1. Runtime & Package Architecture
- **Runtime**: Node.js >= 20 (Tested on Node.js v22.23.3)
- **Framework**: Express.js (v4.22.3)
- **Database ODM**: Mongoose (v9.11.3)
- **Password Cryptography**: Argon2id via `argon2` (v0.45.1)
- **Session Layer**: `express-session` (v1.19.0) + `connect-mongo` (v6.0.0)
- **Package Manager**: Bun (`bun.lock`) / Node.js (`npm`)

---

## 2. Port Precedence & Resolution
1. `BACKEND_PORT`: Explicit override for the backend service (Recommended: `5001`).
2. `PORT`: Standard port variable (Ignored if set to `8080` to prevent container reverse-proxy collision).
3. Fallback: `5001`.

---

## 3. Environment Variables

| Variable | Required | Default | Description |
|---|---|---|---|
| `NODE_ENV` | Optional | `development` | Environment mode (`development` or `production`) |
| `BACKEND_PORT` | Optional | `5001` | Dedicated backend listening port |
| `MONGODB_URI` | **Required in Prod** | `""` | MongoDB connection string (e.g. `mongodb+srv://...` or `mongodb://localhost:27017`) |
| `MONGODB_DB_NAME` | Optional | `hisabkhata` | Target database name |
| `SESSION_SECRET` | **Required in Prod** | (auto in dev) | Cryptographic key for session signature (min 32 chars in production) |
| `CORS_ORIGIN` | Optional | `http://localhost:3000` | Allowed frontend origin(s), comma-separated (no wildcard `*`) |

*Security Warning*: Never commit database connection strings or session secrets to version control.

---

## 4. Authentication & Security Architecture

### A. Password Cryptography
- Passwords are strictly hashed using **Argon2id** (`argon2.argon2id`) with memory cost = 64 MB, time cost = 3, parallelism = 1.
- Passwords must be at least 8 characters long.
- Password hashes are stored under `passwordHash` with `select: false` in Mongoose and are stripped from all JSON serializations (`User.toJSON()`).

### B. Session Strategy
- Server-managed sessions stored in MongoDB via `connect-mongo` under the `sessions` collection with native TTL expiration (7 days).
- In development without a database, gracefully defaults to `MemoryStore` with clear console warning.
- Cookie configuration:
  - Name: `hisabkhata_sid`
  - `httpOnly: true` (prevents XSS access)
  - `secure: true` in production (enforces HTTPS)
  - `sameSite: 'lax'` (CSRF defense)
  - Expiration: 7 days
- Protection against session fixation: Calls `req.session.regenerate()` upon login and registration.

### C. CSRF Protection
- Cryptographically secure 32-byte anti-CSRF tokens issued via `GET /api/auth/csrf`.
- State-changing requests (`POST`, `PUT`, `PATCH`, `DELETE`) require the `X-CSRF-Token` header matching the session token.
- Verified using constant-time comparison (`crypto.timingSafeEqual`) to prevent timing attacks.

### D. User Isolation Strategy
- Protected routes use `requireAuth` middleware.
- **Rule of Isolation**: The client-provided user ID is NEVER trusted. The authenticated identity is strictly derived from `req.session.userId`.
- Future records (Products, Customers, Sales, Dues) in upcoming phases will reference `user: req.user.id` or `store: req.user.storeId` on the server.

---

## 5. API Endpoints

### Operational Probes
- `GET /api/health`: Liveness probe (`200 OK`).
- `GET /api/health/ready`: Readiness probe (`200 OK` when MongoDB is connected, `503 Service Unavailable` when disconnected).

### Authentication
- `GET /api/auth/csrf`: Generate anti-CSRF token (`200 OK`).
- `POST /api/auth/register`: Register new owner account (`201 Created`).
  - Body: `{ fullName, email, password }`
- `POST /api/auth/login`: Authenticate existing owner (`200 OK` on success, `401 Unauthorized` with generic message on failure).
  - Body: `{ email, password }`
- `POST /api/auth/logout`: Invalidate session and clear cookie (`200 OK`).
- `GET /api/auth/me`: Current authenticated user identity (`200 OK` with user profile, `401 Unauthorized` if unauthenticated).

---

## 6. How to Run

```bash
# Start backend service
npm run start --prefix backend

# Run backend test suite
npm run test --prefix backend

# Development with automatic watch mode
npm run dev --prefix backend
```
