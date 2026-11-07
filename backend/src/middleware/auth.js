import { User } from '../models/User.js';

/**
 * Authentication Middleware.
 * Enforces session-based authentication for protected routes.
 * 
 * Security Rule: Never trust a user ID supplied by the client.
 * Identity is strictly derived from the server-managed session.
 */
export async function requireAuth(req, res, next) {
  if (!req.session || !req.session.userId) {
    return res.status(401).json({
      error: 'Unauthorized',
      message: 'Authentication required. Please log in to continue.'
    });
  }

  try {
    const user = await User.findById(req.session.userId).select('fullName email role isActive');

    if (!user || !user.isActive) {
      // Invalidate stale or disabled session
      req.session.destroy();
      return res.status(401).json({
        error: 'Unauthorized',
        message: 'Account not found or has been deactivated.'
      });
    }

    // Attach validated identity to request
    req.user = {
      id: user._id.toString(),
      email: user.email,
      fullName: user.fullName,
      role: user.role
    };

    next();
  } catch (error) {
    console.error('[HisabKhata Auth] Error verifying session user:', error.message);
    return res.status(500).json({
      error: 'Server Error',
      message: 'An error occurred verifying your session.'
    });
  }
}
