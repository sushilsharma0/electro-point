import bcrypt from 'bcrypt';
import { User } from '../models/User.js';
import { env } from '../config/env.js';
import { ApiError } from '../utils/ApiError.js';
import {
  hashToken,
  randomToken,
  signAccessToken,
  signRefreshToken,
  verifyRefreshToken,
} from '../utils/tokens.js';
import { COOKIE } from '../utils/cookies.js';
import { isMailConfigured, sendPasswordReset } from './emailService.js';
import { mergeGuestCart } from './cartService.js';

const RESET_TTL_MS = 30 * 60 * 1000;

function tokensFor(user) {
  const accessToken = signAccessToken(user);
  const refreshToken = signRefreshToken(user);
  return { accessToken, refreshToken };
}

export async function register({ name, email, password, phone, guestId }) {
  const exists = await User.findOne({ email });
  if (exists) throw ApiError.conflict('Email already registered');
  const passwordHash = await bcrypt.hash(password, env.BCRYPT_COST);
  const user = await User.create({
    name,
    email,
    phone: phone || '',
    passwordHash,
    role: 'customer',
  });
  const { accessToken, refreshToken } = tokensFor(user);
  user.refreshTokenHash = hashToken(refreshToken);
  user.lastLoginAt = new Date();
  await user.save();
  if (guestId) await mergeGuestCart(user._id, guestId);
  return { user, accessToken, refreshToken };
}

export async function login({ email, password, guestId }) {
  const user = await User.findOne({ email }).select('+passwordHash +refreshTokenHash');
  if (!user) throw ApiError.unauthorized('Invalid email or password');
  if (user.status !== 'active') throw ApiError.forbidden('Account is suspended');
  const match = await bcrypt.compare(password, user.passwordHash);
  if (!match) throw ApiError.unauthorized('Invalid email or password');
  const { accessToken, refreshToken } = tokensFor(user);
  user.refreshTokenHash = hashToken(refreshToken);
  user.lastLoginAt = new Date();
  await user.save();
  if (guestId) await mergeGuestCart(user._id, guestId);
  return { user, accessToken, refreshToken };
}

export async function logout(user) {
  if (user) {
    await User.updateOne({ _id: user._id }, { $set: { refreshTokenHash: '' } });
  }
}

export async function refresh(refreshToken, guestId) {
  if (!refreshToken) throw ApiError.unauthorized('Refresh token missing');
  let payload;
  try {
    payload = verifyRefreshToken(refreshToken);
  } catch {
    throw ApiError.unauthorized('Invalid refresh token');
  }
  const user = await User.findById(payload.sub).select('+refreshTokenHash');
  if (!user || user.status !== 'active') throw ApiError.unauthorized();
  if (!user.refreshTokenHash || user.refreshTokenHash !== hashToken(refreshToken)) {
    throw ApiError.unauthorized('Refresh token revoked');
  }
  const tokens = tokensFor(user);
  user.refreshTokenHash = hashToken(tokens.refreshToken);
  await user.save();
  if (guestId) await mergeGuestCart(user._id, guestId);
  return { user, ...tokens };
}

export async function forgotPassword(email) {
  if (!isMailConfigured()) {
    throw ApiError.unavailable('Password reset email cannot be sent because SMTP is not configured.');
  }
  const user = await User.findOne({ email });
  if (!user) return { ok: true };
  const token = randomToken(32);
  user.passwordResetTokenHash = hashToken(token);
  user.passwordResetExpires = new Date(Date.now() + RESET_TTL_MS);
  await user.save();
  const resetUrl = `${env.FRONTEND_URL}/reset-password?token=${token}`;
  await sendPasswordReset(user.email, resetUrl);
  return { ok: true };
}

export async function resetPassword({ token, password }) {
  const user = await User.findOne({
    passwordResetTokenHash: hashToken(token),
    passwordResetExpires: { $gt: new Date() },
  }).select('+passwordResetTokenHash +passwordResetExpires +passwordHash');
  if (!user) throw ApiError.badRequest('Invalid or expired reset token');
  user.passwordHash = await bcrypt.hash(password, env.BCRYPT_COST);
  user.passwordResetTokenHash = '';
  user.passwordResetExpires = null;
  user.refreshTokenHash = '';
  await user.save();
  return { user };
}

export function guestIdFrom(req) {
  return req.signedCookies?.[COOKIE.CART] || null;
}
