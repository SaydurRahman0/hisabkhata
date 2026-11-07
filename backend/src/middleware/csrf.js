import crypto from 'crypto';

/**
 * CSRF Protection Middleware for Session Cookie Authentication.
 * 
 * - Generates cryptographically secure anti-CSRF tokens tied to the user session.
 * - Protects state-changing HTTP methods (POST, PUT, PATCH, DELETE).
 * - Client transmits token via 'X-CSRF-Token' request header.
 */

export function generateCsrfToken(req, res) {
  if (!req.session) {
    return res.status(500).json({ error: 'Server Error', message: 'Session middleware unavailable' });
  }

  // Generate a 32-byte cryptographically secure random token
  const token = crypto.randomBytes(32).toString('hex');
  req.session.csrfToken = token;

  // Also set a readable cookie for frontend frameworks to read if needed
  const isHttps = req.secure || req.headers['x-forwarded-proto'] === 'https' || process.env.NODE_ENV === 'production';
  res.cookie('XSRF-TOKEN', token, {
    httpOnly: false, // Accessible to client JS for setting X-CSRF-Token header
    secure: isHttps,
    sameSite: isHttps ? 'none' : 'lax',
    path: '/'
  });

  return res.status(200).json({ csrfToken: token });
}

export function verifyCsrf(req, res, next) {
  const safeMethods = ['GET', 'HEAD', 'OPTIONS'];

  if (safeMethods.includes(req.method)) {
    return next();
  }

  // Exempt CSRF token generation route itself
  if (req.path === '/csrf' || req.originalUrl === '/api/auth/csrf') {
    return next();
  }

  const sessionToken = req.session ? req.session.csrfToken : null;
  const clientToken = req.headers['x-csrf-token'] || req.headers['x-xsrf-token'];

  if (!sessionToken || !clientToken) {
    return res.status(403).json({
      error: 'Forbidden',
      message: 'CSRF token missing or session expired. Request a new token via GET /api/auth/csrf.'
    });
  }

  // Timing-safe buffer comparison to prevent timing attacks
  try {
    const sessionBuf = Buffer.from(sessionToken, 'utf-8');
    const clientBuf = Buffer.from(clientToken, 'utf-8');

    if (sessionBuf.length !== clientBuf.length || !crypto.timingSafeEqual(sessionBuf, clientBuf)) {
      return res.status(403).json({
        error: 'Forbidden',
        message: 'Invalid CSRF token.'
      });
    }
  } catch {
    return res.status(403).json({
      error: 'Forbidden',
      message: 'Invalid CSRF token format.'
    });
  }

  next();
}
