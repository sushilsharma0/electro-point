import * as authService from '../services/authService.js';
import { setAuthCookies, clearAuthCookies, COOKIE } from '../utils/cookies.js';
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

export const logout = asyncHandler(async (req, res) => {
  await authService.logout(req.user);
  clearAuthCookies(res);
  return ok(res, { ok: true });
});

export const refresh = asyncHandler(async (req, res) => {
  const { user, accessToken, refreshToken } = await authService.refresh(
    req.cookies?.[COOKIE.REFRESH],
    guestId(req),
  );
  setAuthCookies(res, { accessToken, refreshToken });
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
  return ok(res, withCsrf(res, { user: req.user.toPublic() }, req));
});
