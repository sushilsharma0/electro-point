import { StoreSettings } from '../models/StoreSettings.js';
import { ApiError } from '../utils/ApiError.js';
import { asyncHandler } from '../utils/asyncHandler.js';

export const maintenanceGuard = asyncHandler(async (req, _res, next) => {
  if (req.admin?.role === 'superadmin' || req.user?.role === 'superadmin') return next();
  if (req.method === 'GET' && (req.path === '/health' || req.originalUrl.startsWith('/api/v1/settings') || req.originalUrl.startsWith('/api/v1/csrf'))) {
    return next();
  }
  if (req.originalUrl.startsWith('/api/v1/auth')) return next();

  const settings = await StoreSettings.findOne({ key: 'store' }).lean();
  if (settings?.maintenanceMode) {
    throw ApiError.unavailable('The store is temporarily closed for maintenance');
  }
  next();
});
