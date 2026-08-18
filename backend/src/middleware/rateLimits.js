import rateLimit from 'express-rate-limit';
import { env } from '../config/env.js';

function limiter({ max, windowMs = 15 * 60 * 1000, message }) {
  return rateLimit({
    windowMs,
    max: env.isTest ? 10_000 : max,
    standardHeaders: true,
    legacyHeaders: false,
    message: { success: false, error: { code: 'RATE_LIMITED', message, details: [] } },
  });
}

export const generalLimiter = limiter({
  max: 200,
  message: 'Too many requests',
});

export const authLimiter = limiter({
  max: 10,
  message: 'Too many authentication attempts',
});

export const paymentLimiter = limiter({
  max: 20,
  message: 'Too many payment requests',
});

export const trackLimiter = limiter({
  max: 20,
  windowMs: 15 * 60 * 1000,
  message: 'Too many tracking lookups. Try again shortly.',
});
