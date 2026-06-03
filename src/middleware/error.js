import ApiError from '../utils/ApiError.js';
import logger from '../utils/logger.js';

/**
 * 404 Not Found handler
 */
export const notFound = (req, res, next) => {
  next(new ApiError(404, `Route not found: ${req.originalUrl}`));
};

/**
 * Sanitize stack trace to avoid circular references
 */
const cleanStack = (stack) => {
  if (!stack) return undefined;
  return String(stack).split('\n').slice(0, 10).join('\n');
};

/**
 * Global error handler
 */
export const errorHandler = (err, req, res, next) => {
  // Avoid double-sending response
  if (res.headersSent) {
    logger.error(`Headers already sent: ${err.message}`);
    return next(err);
  }

  let statusCode = err.statusCode || 500;
  let message = err.message || 'Internal Server Error';
  let errors = [];

  // Mongoose bad ObjectId
  if (err.name === 'CastError') {
    statusCode = 400;
    message = `Invalid ${err.path}: ${err.value}`;
  }

  // Mongoose duplicate key
  else if (err.code === 11000) {
    statusCode = 400;
    const field = Object.keys(err.keyValue || {})[0];
    message = `Duplicate field value: ${field}. Please use another value.`;
  }

  // Mongoose validation error
  else if (err.name === 'ValidationError') {
    statusCode = 400;
    message = 'Validation failed';
    errors = Object.values(err.errors || {}).map((e) => e.message);
  }

  // JWT errors
  else if (err.name === 'JsonWebTokenError') {
    statusCode = 401;
    message = 'Invalid token. Please log in again.';
  }
  else if (err.name === 'TokenExpiredError') {
    statusCode = 401;
    message = 'Your token has expired. Please log in again.';
  }

  // Multer file size
  else if (err.code === 'LIMIT_FILE_SIZE') {
    statusCode = 400;
    message = 'File size too large. Max 5MB allowed.';
  }

  // If err is an instance of ApiError, use its errors array
  if (err instanceof ApiError && err.errors && err.errors.length) {
    errors = err.errors;
  }

  // Log error (avoid circular refs in logger by passing only safe fields)
  try {
    logger.error(`${statusCode} - ${message} - ${req.originalUrl} - ${req.method}`);
  } catch (_) {
    // ignore logger errors
  }

  // Build safe response payload (no req/res/err objects)
  const payload = {
    success: false,
    message,
    errors,
  };
  if (process.env.NODE_ENV === 'development' && err && err.stack) {
    payload.stack = cleanStack(err.stack);
  }

  try {
    res.status(statusCode).json(payload);
  } catch (sendErr) {
    // Last resort: send plain text
    try {
      if (!res.headersSent) {
        res.status(500).type('application/json').send(JSON.stringify({ success: false, message: 'Internal server error' }));
      }
    } catch (_) {}
    logger.error(`Failed to send error response: ${sendErr.message}`);
  }
};
