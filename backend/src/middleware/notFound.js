/**
 * Centralized 404 Not Found Middleware.
 */
export function notFoundHandler(req, res, next) {
  res.status(404).json({
    error: 'Not Found',
    message: `Cannot ${req.method} ${req.originalUrl}`,
    status: 404
  });
}
