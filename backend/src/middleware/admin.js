import { ApiError } from '../utils/ApiError.js';

export function requireSuperadmin(req, _res, next) {
  if (!req.user || req.user.role !== 'superadmin') {
    return next(ApiError.forbidden('Superadmin access required'));
  }
  if (req.user.status !== 'active') {
    return next(ApiError.forbidden('Account is not active'));
  }
  next();
}
