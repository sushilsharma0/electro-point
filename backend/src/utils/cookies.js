import { env } from '../config/env.js';

export const COOKIE = {
  ACCESS: 'ep_access',
  REFRESH: 'ep_refresh',
  ADMIN_ACCESS: 'ep_admin_access',
  ADMIN_REFRESH: 'ep_admin_refresh',
  CSRF: 'ep_csrf',
  CART: 'ep_cart',
};

export function baseCookieOptions() {
  return {
    secure: env.isProd,
    sameSite: 'lax',
    path: '/',
  };
}

export function authCookieOptions(maxAgeMs) {
  return {
    ...baseCookieOptions(),
    httpOnly: true,
    maxAge: maxAgeMs,
  };
}

/** Readable by JS so the storefront can send X-CSRF-Token (double-submit). */
export function csrfCookieOptions(maxAgeMs) {
  return {
    ...baseCookieOptions(),
    httpOnly: false,
    maxAge: maxAgeMs,
  };
}

export function cartCookieOptions() {
  return {
    ...baseCookieOptions(),
    httpOnly: true,
    signed: true,
    maxAge: 30 * 24 * 60 * 60 * 1000,
  };
}

export const ACCESS_MAX_AGE = 15 * 60 * 1000;
export const REFRESH_MAX_AGE = 7 * 24 * 60 * 60 * 1000;
export const CSRF_MAX_AGE = 7 * 24 * 60 * 60 * 1000;

export function setAuthCookies(res, { accessToken, refreshToken }) {
  res.cookie(COOKIE.ACCESS, accessToken, authCookieOptions(ACCESS_MAX_AGE));
  res.cookie(COOKIE.REFRESH, refreshToken, authCookieOptions(REFRESH_MAX_AGE));
}

export function clearAuthCookies(res) {
  const opts = { ...baseCookieOptions(), httpOnly: true };
  res.clearCookie(COOKIE.ACCESS, opts);
  res.clearCookie(COOKIE.REFRESH, opts);
}

export function setAdminAuthCookies(res, { accessToken, refreshToken }) {
  res.cookie(COOKIE.ADMIN_ACCESS, accessToken, authCookieOptions(ACCESS_MAX_AGE));
  res.cookie(COOKIE.ADMIN_REFRESH, refreshToken, authCookieOptions(REFRESH_MAX_AGE));
}

export function clearAdminAuthCookies(res) {
  const opts = { ...baseCookieOptions(), httpOnly: true };
  res.clearCookie(COOKIE.ADMIN_ACCESS, opts);
  res.clearCookie(COOKIE.ADMIN_REFRESH, opts);
}

export function setCsrfCookie(res, token) {
  res.cookie(COOKIE.CSRF, token, csrfCookieOptions(CSRF_MAX_AGE));
}

export function setCartCookie(res, guestId) {
  res.cookie(COOKIE.CART, guestId, cartCookieOptions());
}

export function clearCartCookie(res) {
  res.clearCookie(COOKIE.CART, { ...baseCookieOptions(), httpOnly: true, signed: true });
}
