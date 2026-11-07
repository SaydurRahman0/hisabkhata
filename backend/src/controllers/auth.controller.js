import crypto from 'crypto';
import { User } from '../models/User.js';
import { env } from '../config/env.js';

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

/**
 * Regenerate session asynchronously helper.
 * @param {import('express').Request} req 
 * @returns {Promise<void>}
 */
function regenerateSession(req) {
  return new Promise((resolve, reject) => {
    req.session.regenerate((err) => {
      if (err) return reject(err);
      resolve();
    });
  });
}

/**
 * Register a new user account.
 * POST /api/auth/register
 */
export async function register(req, res, next) {
  try {
    const { fullName, email, password } = req.body || {};

    // 1. Validation
    if (!fullName || typeof fullName !== 'string' || fullName.trim().length < 2) {
      return res.status(400).json({
        error: 'Validation Error',
        message: 'Full name must be at least 2 characters long.'
      });
    }

    if (!email || typeof email !== 'string' || !EMAIL_REGEX.test(email.trim())) {
      return res.status(400).json({
        error: 'Validation Error',
        message: 'A valid email address is required.'
      });
    }

    if (!password || typeof password !== 'string' || password.length < 8) {
      return res.status(400).json({
        error: 'Validation Error',
        message: 'Password must be at least 8 characters long.'
      });
    }

    const normalizedEmail = email.trim().toLowerCase();

    // 2. Pre-check for duplicate email
    const existing = await User.findOne({ email: normalizedEmail });
    if (existing) {
      return res.status(409).json({
        error: 'Conflict',
        message: 'An account with this email address already exists.'
      });
    }

    // 3. Hash password using Argon2id
    const passwordHash = await User.hashPassword(password);

    // 4. Create user
    const user = new User({
      fullName: fullName.trim(),
      email: normalizedEmail,
      passwordHash,
      role: 'owner',
      isActive: true
    });

    await user.save();

    // 5. Establish authenticated session
    await regenerateSession(req);
    req.session.userId = user._id.toString();

    // Issue fresh CSRF token
    const newCsrf = crypto.randomBytes(32).toString('hex');
    req.session.csrfToken = newCsrf;
    const isHttps = req.secure || req.headers['x-forwarded-proto'] === 'https' || env.isProduction;
    res.cookie('XSRF-TOKEN', newCsrf, {
      httpOnly: false,
      secure: isHttps,
      sameSite: isHttps ? 'none' : 'lax',
      path: '/'
    });

    return res.status(201).json({
      message: 'Account registered successfully.',
      user: user.toJSON(),
      csrfToken: newCsrf
    });
  } catch (error) {
    if (error.code === 11000) {
      return res.status(409).json({
        error: 'Conflict',
        message: 'An account with this email address already exists.'
      });
    }
    next(error);
  }
}

/**
 * User login.
 * POST /api/auth/login
 */
export async function login(req, res, next) {
  try {
    const { email, password } = req.body || {};

    if (!email || !password || typeof email !== 'string' || typeof password !== 'string') {
      return res.status(400).json({
        error: 'Validation Error',
        message: 'Email and password are required.'
      });
    }

    const normalizedEmail = email.trim().toLowerCase();

    // Query user and explicitly select passwordHash
    const user = await User.findOne({ email: normalizedEmail }).select('+passwordHash');

    // Generic error message to prevent account enumeration
    const genericAuthError = {
      error: 'Unauthorized',
      message: 'Invalid email or password.'
    };

    if (!user || !user.isActive) {
      // Mitigate timing attacks by verifying a dummy hash if user not found
      await User.verifyPassword(
        '$argon2id$v=19$m=65536,t=3,p=1$c29tZXNhbHQ$dHVtbXloYXNoZm9ydGltaW5n',
        password
      );
      return res.status(401).json(genericAuthError);
    }

    const isValid = await User.verifyPassword(user.passwordHash, password);
    if (!isValid) {
      return res.status(401).json(genericAuthError);
    }

    // Session Fixation Prevention: Regenerate session on login
    await regenerateSession(req);
    req.session.userId = user._id.toString();

    // Issue fresh CSRF token
    const newCsrf = crypto.randomBytes(32).toString('hex');
    req.session.csrfToken = newCsrf;
    const isHttps = req.secure || req.headers['x-forwarded-proto'] === 'https' || env.isProduction;
    res.cookie('XSRF-TOKEN', newCsrf, {
      httpOnly: false,
      secure: isHttps,
      sameSite: isHttps ? 'none' : 'lax',
      path: '/'
    });

    return res.status(200).json({
      message: 'Login successful.',
      user: user.toJSON(),
      csrfToken: newCsrf
    });
  } catch (error) {
    next(error);
  }
}

/**
 * User logout.
 * POST /api/auth/logout
 */
export function logout(req, res) {
  if (!req.session) {
    return res.status(200).json({ message: 'Logged out successfully.' });
  }

  req.session.destroy((err) => {
    if (err) {
      console.error('[HisabKhata Auth] Error destroying session on logout:', err.message);
      return res.status(500).json({
        error: 'Server Error',
        message: 'Could not log out. Please try again.'
      });
    }

    const isHttps = req.secure || req.headers['x-forwarded-proto'] === 'https' || env.isProduction;
    res.clearCookie(env.SESSION_COOKIE_NAME, {
      httpOnly: true,
      secure: isHttps,
      sameSite: isHttps ? 'none' : 'lax',
      path: '/'
    });

    res.clearCookie('XSRF-TOKEN', {
      path: '/'
    });

    return res.status(200).json({ message: 'Logged out successfully.' });
  });
}

/**
 * Get current authenticated user identity.
 * GET /api/auth/me
 */
export function getMe(req, res) {
  // req.user is guaranteed by requireAuth middleware
  return res.status(200).json({
    user: req.user
  });
}
