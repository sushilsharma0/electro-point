import { ApiError } from '../utils/ApiError.js';
import { COOKIE } from '../utils/cookies.js';
import { AUDIENCE, verifyAccessToken } from '../utils/tokens.js';
import { User } from '../models/User.js';
import { asyncHandler } from '../utils/asyncHandler.js';

function audienceMatches(payload, audience) {
  if (payload.aud) return payload.aud === audience;
  // Legacy tokens had no aud: treat as storefront-only.
  return audience === AUDIENCE.STOREFRONT;
}

export async function loadUserFromAccessCookie(req, { audience = AUDIENCE.STOREFRONT } = {}) {
  const cookieName = audience === AUDIENCE.ADMIN ? COOKIE.ADMIN_ACCESS : COOKIE.ACCESS;
  const token = req.cookies?.[cookieName];
  if (!token) return null;
  try {
    const payload = verifyAccessToken(token);
    if (!audienceMatches(payload, audience)) return null;
    const user = await User.findById(payload.sub);
    if (!user || user.status !== 'active') return null;
    if (audience === AUDIENCE.STOREFRONT && user.role === 'superadmin') return null;
    if (audience === AUDIENCE.ADMIN && user.role !== 'superadmin') return null;
    return user;
  } catch {
    return null;
  }
}

export const optionalAuth = asyncHandler(async (req, _res, next) => {
  req.user = await loadUserFromAccessCookie(req, { audience: AUDIENCE.STOREFRONT });
  req.admin = await loadUserFromAccessCookie(req, { audience: AUDIENCE.ADMIN });
  next();
});

export const requireAuth = asyncHandler(async (req, _res, next) => {
  const user = await loadUserFromAccessCookie(req, { audience: AUDIENCE.STOREFRONT });
  if (!user) throw ApiError.unauthorized();
  req.user = user;
  next();
});

export const requireAdminAuth = asyncHandler(async (req, _res, next) => {
  const user = await loadUserFromAccessCookie(req, { audience: AUDIENCE.ADMIN });
  if (!user) throw ApiError.unauthorized('Admin sign-in required');
  req.user = user;
  req.admin = user;
  next();
});
