import { ApiError } from '../utils/ApiError.js';

export function notFound(_req, _res, next) {
  next(ApiError.notFound('Route not found'));
}

export function errorHandler(err, req, res, _next) {
  if (err?.type === 'entity.parse.failed') {
    return res.status(400).json({
      success: false,
      error: { code: 'BAD_REQUEST', message: 'Invalid JSON', details: [] },
    });
  }

  if (err?.name === 'MulterError') {
    const message = err.code === 'LIMIT_FILE_SIZE' ? 'File too large' : err.message;
    return res.status(400).json({
      success: false,
      error: { code: 'UPLOAD_ERROR', message, details: [] },
    });
  }

  if (err?.name === 'ValidationError') {
    const details = Object.values(err.errors || {}).map((e) => ({
      path: e.path,
      message: e.message,
    }));
    return res.status(400).json({
      success: false,
      error: { code: 'VALIDATION_ERROR', message: 'Invalid data', details },
    });
  }

  if (err?.code === 11000) {
    const fields = Object.keys(err.keyPattern || err.keyValue || {});
    const emailClash = fields.includes('email');
    return res.status(409).json({
      success: false,
      error: {
        code: 'CONFLICT',
        message: emailClash ? 'Email already registered' : 'Duplicate value',
        details: emailClash ? [{ path: 'body.email', message: 'Email already registered' }] : [],
      },
    });
  }

  const status = err instanceof ApiError ? err.status : err.status || 500;
  const code = err instanceof ApiError ? err.code : 'INTERNAL_ERROR';
  const message =
    err instanceof ApiError
      ? err.message
      : status >= 500 && process.env.NODE_ENV === 'production'
        ? 'Internal server error'
        : err.message || 'Internal server error';

  if (status >= 500 && code !== 'UNAVAILABLE') {
    console.error('[error]', err.name, err.message);
  }

  return res.status(status).json({
    success: false,
    error: {
      code,
      message,
      details: err.details || [],
    },
  });
}
