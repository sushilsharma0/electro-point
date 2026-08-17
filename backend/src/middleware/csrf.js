import { COOKIE, setCsrfCookie } from '../utils/cookies.js';
import { newCsrfToken } from '../utils/tokens.js';
import { ApiError } from '../utils/ApiError.js';

const CSRF_EXEMPT = new Set([
  'POST /api/v1/auth/login',
  'POST /api/v1/auth/register',
  'POST /api/v1/auth/refresh',
  'POST /api/v1/auth/forgot-password',
  'POST /api/v1/auth/reset-password',
]);

const MUTATING = new Set(['POST', 'PUT', 'PATCH', 'DELETE']);

export function issueCsrf(req, res, next) {
  let token = req.cookies?.[COOKIE.CSRF];
  if (!token) {
    token = newCsrfToken();
    setCsrfCookie(res, token);
  }
  req.csrfToken = token;
  next();
}

export function requireCsrf(req, _res, next) {
  if (!MUTATING.has(req.method)) return next();
  const key = `${req.method} ${req.baseUrl || ''}${req.path}`.replace(/\/+$/, '') || `${req.method} ${req.originalUrl.split('?')[0]}`;
  const original = `${req.method} ${req.originalUrl.split('?')[0]}`;
  if (CSRF_EXEMPT.has(key) || CSRF_EXEMPT.has(original)) return next();

  const cookieToken = req.cookies?.[COOKIE.CSRF];
  const headerToken = req.get('X-CSRF-Token');
  if (!cookieToken || !headerToken || cookieToken !== headerToken) {
    return next(ApiError.forbidden('CSRF token mismatch'));
  }
  next();
}
