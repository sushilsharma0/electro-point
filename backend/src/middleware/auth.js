import { ApiError } from '../utils/ApiError.js';
import { COOKIE } from '../utils/cookies.js';
import { verifyAccessToken } from '../utils/tokens.js';
import { User } from '../models/User.js';
import { asyncHandler } from '../utils/asyncHandler.js';

export async function loadUserFromAccessCookie(req) {
  const token = req.cookies?.[COOKIE.ACCESS];
  if (!token) return null;
  try {
    const payload = verifyAccessToken(token);
    const user = await User.findById(payload.sub);
    if (!user || user.status !== 'active') return null;
    return user;
  } catch {
    return null;
  }
}

export const optionalAuth = asyncHandler(async (req, _res, next) => {
  req.user = await loadUserFromAccessCookie(req);
  next();
});

export const requireAuth = asyncHandler(async (req, _res, next) => {
  const user = await loadUserFromAccessCookie(req);
  if (!user) throw ApiError.unauthorized();
  req.user = user;
  next();
});
