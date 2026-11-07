import dotenv from 'dotenv';

dotenv.config();

/**
 * Validates and sanitizes environment configuration.
 */

// Port precedence: BACKEND_PORT override > PORT (if not 8080 container host) > fallback 5001
const resolvePort = () => {
  if (process.env.BACKEND_PORT) {
    const p = parseInt(process.env.BACKEND_PORT, 10);
    if (!isNaN(p) && p > 0) return p;
  }
  if (process.env.PORT && process.env.PORT !== '8080') {
    const p = parseInt(process.env.PORT, 10);
    if (!isNaN(p) && p > 0) return p;
  }
  return 5001;
};

const isProd = process.env.NODE_ENV === 'production';

export const env = {
  NODE_ENV: process.env.NODE_ENV || 'development',
  isProduction: isProd,
  isDevelopment: !isProd,
  PORT: resolvePort(),
  MONGODB_URI: process.env.MONGODB_URI || '',
  MONGODB_DB_NAME: process.env.MONGODB_DB_NAME || 'hisabkhata',
  CORS_ORIGIN: process.env.CORS_ORIGIN || 'http://localhost:3000',
  SESSION_SECRET: process.env.SESSION_SECRET || (isProd ? '' : 'hisabkhata-dev-session-secret-not-for-production-use-only-for-local-testing'),
  SESSION_COOKIE_NAME: 'hisabkhata_sid',
  SESSION_MAX_AGE_MS: 7 * 24 * 60 * 60 * 1000 // 7 days
};

/**
 * Validates critical environment settings.
 * Fails fast in production if required configurations are missing.
 */
export function validateEnv() {
  if (env.isProduction) {
    if (!env.MONGODB_URI) {
      throw new Error('Fatal configuration error: MONGODB_URI is required in production environment.');
    }
    if (!env.SESSION_SECRET || env.SESSION_SECRET.length < 32) {
      throw new Error('Fatal configuration error: SESSION_SECRET is required in production environment and must be at least 32 characters.');
    }
  }
}

/**
 * Sanitizes a MongoDB connection string to safely log or inspect without exposing credentials.
 * Masks both username and password while preserving protocol, host, port, and database parameters.
 * @param {string} uri 
 * @returns {string} Sanitized URI e.g. "mongodb+srv://***:***@cluster0.mongodb.net/hisabkhata"
 */
export function sanitizeMongoUri(uri) {
  if (!uri || typeof uri !== 'string') return '';
  try {
    const parsed = new URL(uri);
    if (parsed.username) parsed.username = '***';
    if (parsed.password) parsed.password = '***';
    return parsed.toString();
  } catch {
    return uri.replace(/(mongodb(?:\+srv)?:\/\/)([^:@\s]+):([^@\s]+)@/i, '$1***:***@');
  }
}
