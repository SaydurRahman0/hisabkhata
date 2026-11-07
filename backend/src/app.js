import express from 'express';
import session from 'express-session';
import MongoStore from 'connect-mongo';
import { env } from './config/env.js';
import healthRoutes from './routes/health.routes.js';
import authRoutes from './routes/auth.routes.js';
import productRoutes from './routes/product.routes.js';
import customerRoutes from './routes/customer.routes.js';
import saleRoutes from './routes/sale.routes.js';
import dueRoutes from './routes/due.routes.js';
import { notFoundHandler } from './middleware/notFound.js';
import { errorHandler } from './middleware/errorHandler.js';

const app = express();

// Disable X-Powered-By header for security
app.disable('x-powered-by');

// Trust reverse proxy strictly from loopback (Nginx proxy on 127.0.0.1)
// This ensures X-Forwarded-* headers are only honored when delivered by the local Nginx instance
app.set('trust proxy', 'loopback');

// 1. Basic Security Headers Middleware
// Note: X-Frame-Options is omitted here because framing is governed by
// Nginx Content-Security-Policy (frame-ancestors 'self' https://*.google.com ...)
// to allow the application preview to render within the Google AI Studio environment.
app.use((req, res, next) => {
  res.setHeader('X-Content-Type-Options', 'nosniff');
  res.setHeader('Referrer-Policy', 'strict-origin-when-cross-origin');
  next();
});

// 2. Controlled Origin / CORS Middleware
const allowedOrigins = (env.CORS_ORIGIN || 'http://localhost:3000')
  .split(',')
  .map((origin) => origin.trim().replace(/\/$/, ''));

// Strict validation pattern for Google AI Studio Cloud Run preview domains
const AI_STUDIO_PREVIEW_REGEX = /^https:\/\/ais-(?:dev|pre)-[a-z0-9-]+(?:\.[a-z0-9-]+)*\.run\.app$/i;

function isOriginAllowed(origin) {
  if (!origin || typeof origin !== 'string') return false;

  // 1. Explicitly configured origins (e.g. http://localhost:3000)
  if (allowedOrigins.includes(origin)) return true;

  // 2. Google AI Studio parent workspace origin
  if (origin === 'https://aistudio.google.com') return true;

  // 3. Strictly validated AI Studio Cloud Run preview origins
  if (AI_STUDIO_PREVIEW_REGEX.test(origin)) return true;

  return false;
}

app.use((req, res, next) => {
  const origin = req.headers.origin;

  if (origin) {
    if (isOriginAllowed(origin)) {
      res.setHeader('Access-Control-Allow-Origin', origin);
      res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
      res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization, X-CSRF-Token, X-XSRF-Token');
      res.setHeader('Access-Control-Allow-Credentials', 'true');
    } else if (req.method === 'OPTIONS') {
      return res.status(403).json({ error: 'Forbidden', message: 'CORS policy does not allow access from this origin.' });
    }
  }

  // Handle preflight OPTIONS for allowed origins
  if (req.method === 'OPTIONS') {
    return res.sendStatus(204);
  }

  next();
});

// 3. Body Parsers with Reasonable 100kb Payload Limit
app.use(express.json({ limit: '100kb' }));
app.use(express.urlencoded({ extended: true, limit: '100kb' }));

// 4. Session Store Configuration
const getSessionStore = () => {
  if (env.MONGODB_URI) {
    return MongoStore.create({
      mongoUrl: env.MONGODB_URI,
      dbName: env.MONGODB_DB_NAME,
      collectionName: 'sessions',
      ttl: Math.floor(env.SESSION_MAX_AGE_MS / 1000),
      autoRemove: 'native',
      crypto: {
        secret: env.SESSION_SECRET
      }
    });
  }

  if (env.isProduction) {
    throw new Error('Persistent session store (MongoStore) is mandatory in production.');
  }

  return new session.MemoryStore();
};

app.use(
  session({
    name: env.SESSION_COOKIE_NAME,
    secret: env.SESSION_SECRET,
    resave: false,
    saveUninitialized: false,
    store: getSessionStore(),
    proxy: true,
    cookie: {
      httpOnly: true,
      secure: 'auto',
      sameSite: 'lax',
      maxAge: env.SESSION_MAX_AGE_MS,
      path: '/'
    }
  })
);

// Dynamic adjustment for HTTPS iframe sessions (Cloud Run / AI Studio preview)
// SameSite=None is applied strictly when connection is verified HTTPS and Secure=true
app.use((req, res, next) => {
  const isHttps = req.secure || req.headers['x-forwarded-proto'] === 'https';
  if (isHttps && req.session && req.session.cookie) {
    req.session.cookie.secure = true;
    req.session.cookie.sameSite = 'none';
  }
  next();
});

// 5. API Routes
app.use('/api/health', healthRoutes);
app.use('/api/auth', authRoutes);
app.use('/api/products', productRoutes);
app.use('/api/customers', customerRoutes);
app.use('/api/sales', saleRoutes);
app.use('/api/dues', dueRoutes);

// 6. 404 Not Found Handling for unhandled API routes
app.use('/api', notFoundHandler);

// 7. Centralized Error Handling
app.use(errorHandler);

export default app;
