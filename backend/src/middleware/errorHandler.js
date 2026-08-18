import { ApiError } from '../utils/ApiError.js';
import { logger } from '../utils/logger.js';

export function notFound(_req, _res, next) {
  next(ApiError.notFound('Route not found'));
}

export function errorHandler(err, req, res, _next) {
  const where = `${req.method} ${req.originalUrl}`;

  const fail = (status, code, message, details = []) => {
    if (status >= 500) logger.error(`${where} ${status} ${code} ${message}`, err instanceof Error ? err : message);
    else logger.warn(`${where} ${status} ${code} ${message}`);
    return res.status(status).json({
      success: false,
      error: { code, message, details },
    });
  };

  if (err?.type === 'entity.parse.failed') {
    return fail(400, 'BAD_REQUEST', 'Invalid JSON');
  }

  if (err?.name === 'MulterError') {
    const message = err.code === 'LIMIT_FILE_SIZE' ? 'File too large' : err.message;
    return fail(400, 'UPLOAD_ERROR', message);
  }

  if (err?.name === 'ValidationError') {
    const details = Object.values(err.errors || {}).map((e) => ({
      path: e.path,
      message: e.message,
    }));
    return fail(400, 'VALIDATION_ERROR', 'Invalid data', details);
  }

  if (err?.code === 11000) {
    const fields = Object.keys(err.keyPattern || err.keyValue || {});
    const emailClash = fields.includes('email');
    return fail(
      409,
      'CONFLICT',
      emailClash ? 'Email already registered' : 'Duplicate value',
      emailClash ? [{ path: 'body.email', message: 'Email already registered' }] : [],
    );
  }

  const status = err instanceof ApiError ? err.status : err.status || 500;
  const code = err instanceof ApiError ? err.code : 'INTERNAL_ERROR';
  const message =
    err instanceof ApiError
      ? err.message
      : status >= 500 && process.env.NODE_ENV === 'production'
        ? 'Internal server error'
        : err.message || 'Internal server error';

  return fail(status, code, message, err.details || []);
}
