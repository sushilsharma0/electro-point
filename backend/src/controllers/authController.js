import * as authService from '../services/authService.js';
import {
  setAuthCookies,
  clearAuthCookies,
  setAdminAuthCookies,
  clearAdminAuthCookies,
  COOKIE,
} from '../utils/cookies.js';
import { AUDIENCE } from '../utils/tokens.js';
import { ok } from '../utils/response.js';
import { asyncHandler } from '../utils/asyncHandler.js';

function guestId(req) {
  return req.signedCookies?.[COOKIE.CART] || null;
}

function withCsrf(res, data, req) {
  return { ...data, csrfToken: req.csrfToken };
}

export const register = asyncHandler(async (req, res) => {
  const { user, accessToken, refreshToken } = await authService.register({
    ...req.body,
    guestId: guestId(req),
  });
  setAuthCookies(res, { accessToken, refreshToken });
  return ok(res, withCsrf(res, { user: user.toPublic() }, req), 201);
});

export const login = asyncHandler(async (req, res) => {
  const { user, accessToken, refreshToken } = await authService.login({
    ...req.body,
    guestId: guestId(req),
  });
  setAuthCookies(res, { accessToken, refreshToken });
  return ok(res, withCsrf(res, { user: user.toPublic() }, req));
});

export const adminLogin = asyncHandler(async (req, res) => {
  const { user, accessToken, refreshToken } = await authService.adminLogin(req.body);
  setAdminAuthCookies(res, { accessToken, refreshToken });
  return ok(res, withCsrf(res, { user: user.toPublic() }, req));
});

export const logout = asyncHandler(async (req, res) => {
  await authService.logout(req.user, AUDIENCE.STOREFRONT);
  clearAuthCookies(res);
  return ok(res, { ok: true });
});

export const adminLogout = asyncHandler(async (req, res) => {
  await authService.logout(req.user, AUDIENCE.ADMIN);
  clearAdminAuthCookies(res);
  return ok(res, { ok: true });
});

export const refresh = asyncHandler(async (req, res) => {
  const { user, accessToken, refreshToken } = await authService.refresh(
    req.cookies?.[COOKIE.REFRESH],
    guestId(req),
    AUDIENCE.STOREFRONT,
  );
  setAuthCookies(res, { accessToken, refreshToken });
  return ok(res, withCsrf(res, { user: user.toPublic() }, req));
});

export const adminRefresh = asyncHandler(async (req, res) => {
  const { user, accessToken, refreshToken } = await authService.refresh(
    req.cookies?.[COOKIE.ADMIN_REFRESH],
    null,
    AUDIENCE.ADMIN,
  );
  setAdminAuthCookies(res, { accessToken, refreshToken });
  return ok(res, withCsrf(res, { user: user.toPublic() }, req));
});

export const forgotPassword = asyncHandler(async (req, res) => {
  await authService.forgotPassword(req.body.email);
  return ok(res, { ok: true });
});

export const resetPassword = asyncHandler(async (req, res) => {
  await authService.resetPassword(req.body);
  return ok(res, { ok: true });
});

export const me = asyncHandler(async (req, res) => {
  if (req.user) {
    return ok(res, withCsrf(res, { user: req.user.toPublic() }, req));
  }
  try {
    const { user, accessToken, refreshToken } = await authService.refresh(
      req.cookies?.[COOKIE.REFRESH],
      guestId(req),
      AUDIENCE.STOREFRONT,
    );
    setAuthCookies(res, { accessToken, refreshToken });
    return ok(res, withCsrf(res, { user: user.toPublic() }, req));
  } catch {
    return ok(res, withCsrf(res, { user: null }, req));
  }
});

export const adminMe = asyncHandler(async (req, res) => {
  if (req.admin) {
    return ok(res, withCsrf(res, { user: req.admin.toPublic() }, req));
  }
  try {
    const { user, accessToken, refreshToken } = await authService.refresh(
      req.cookies?.[COOKIE.ADMIN_REFRESH],
      null,
      AUDIENCE.ADMIN,
    );
    setAdminAuthCookies(res, { accessToken, refreshToken });
    return ok(res, withCsrf(res, { user: user.toPublic() }, req));
  } catch {
    return ok(res, withCsrf(res, { user: null }, req));
  }
});
