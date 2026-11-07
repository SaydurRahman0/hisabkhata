import { env } from '../config/env.js';

/**
 * Centralized Error Handling Middleware.
 * Prevents sensitive internal stack traces or database connection details from being exposed to clients.
 */
export function errorHandler(err, req, res, next) {
  const status = err.status || err.statusCode || 500;
  const isServerFault = status >= 500;

  // Scrub any database credentials if present in error message
  const safeMessage = (err.message || 'An unexpected error occurred')
    .replace(/(mongodb(?:\+srv)?:\/\/)([^:@]+):([^@]+)@/i, '$1***:***@');

  if (isServerFault) {
    console.error(`[HisabKhata API Error] ${req.method} ${req.originalUrl}:`, safeMessage);
    if (env.isDevelopment && err.stack) {
      console.error(err.stack);
    }
  }

  res.status(status).json({
    error: err.name || 'Error',
    message: env.isProduction && isServerFault ? 'An internal server error occurred.' : safeMessage,
    status
  });
}
