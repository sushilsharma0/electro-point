import crypto from 'node:crypto';
import jwt from 'jsonwebtoken';
import { env } from '../config/env.js';

export function hashToken(token) {
  return crypto.createHash('sha256').update(String(token)).digest('hex');
}

export function randomToken(bytes = 32) {
  return crypto.randomBytes(bytes).toString('hex');
}

export const AUDIENCE = {
  STOREFRONT: 'storefront',
  ADMIN: 'admin',
};

export function signAccessToken(user, audience = AUDIENCE.STOREFRONT) {
  return jwt.sign(
    { sub: String(user._id), role: user.role, aud: audience },
    env.JWT_ACCESS_SECRET,
    { expiresIn: env.JWT_ACCESS_TTL },
  );
}

export function signRefreshToken(user, audience = AUDIENCE.STOREFRONT) {
  return jwt.sign(
    { sub: String(user._id), typ: 'refresh', aud: audience },
    env.JWT_REFRESH_SECRET,
    { expiresIn: env.JWT_REFRESH_TTL },
  );
}

export function verifyAccessToken(token) {
  return jwt.verify(token, env.JWT_ACCESS_SECRET);
}

export function verifyRefreshToken(token) {
  return jwt.verify(token, env.JWT_REFRESH_SECRET);
}

export function newCsrfToken() {
  return randomToken(32);
}
