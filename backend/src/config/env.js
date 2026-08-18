import crypto from 'node:crypto';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import dotenv from 'dotenv';
import { logger } from '../utils/logger.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
dotenv.config({ path: path.resolve(__dirname, '../../.env') });

function requireInProduction(name, value) {
  if (process.env.NODE_ENV === 'production' && !value) {
    throw new Error(`Missing required environment variable: ${name}`);
  }
  return value;
}

function secretOrDevFallback(name, bytes = 32) {
  const value = process.env[name];
  if (value && value.length >= 16) return value;
  if (process.env.NODE_ENV === 'production') {
    throw new Error(`Missing required environment variable: ${name}`);
  }
  if (process.env.NODE_ENV !== 'test') {
    logger.warn(`${name} is empty; using a development-only fallback. Set it in .env before production.`);
  }
  return crypto.randomBytes(bytes).toString('hex');
}

const NODE_ENV = process.env.NODE_ENV || 'development';

export const env = {
  NODE_ENV,
  isProd: NODE_ENV === 'production',
  isTest: NODE_ENV === 'test',
  PORT: Number(process.env.PORT) || 5000,
  MONGO_URI: process.env.MONGO_URI || 'mongodb://127.0.0.1:27017/electropoint',
  JWT_ACCESS_SECRET: secretOrDevFallback('JWT_ACCESS_SECRET'),
  JWT_REFRESH_SECRET: secretOrDevFallback('JWT_REFRESH_SECRET'),
  COOKIE_SECRET: secretOrDevFallback('COOKIE_SECRET'),
  FRONTEND_URL: process.env.FRONTEND_URL || 'http://localhost:5173',
  BACKEND_URL: process.env.BACKEND_URL || 'http://localhost:5000',
  ADMIN_EMAIL: process.env.ADMIN_EMAIL || 'ivan.p@example.net',
  ADMIN_PASSWORD: process.env.ADMIN_PASSWORD || '',
  ESEWA_PRODUCT_CODE: process.env.ESEWA_PRODUCT_CODE || 'EPAYTEST',
  ESEWA_SECRET: requireInProduction('ESEWA_SECRET', process.env.ESEWA_SECRET) || '8gBm/:&EnhH.1/q',
  ESEWA_ENV: process.env.ESEWA_ENV || 'uat',
  KHALTI_SECRET_KEY: process.env.KHALTI_SECRET_KEY || '',
  KHALTI_ENV: process.env.KHALTI_ENV || 'sandbox',
  SMTP_HOST: process.env.SMTP_HOST || '',
  SMTP_PORT: Number(process.env.SMTP_PORT) || 587,
  SMTP_USER: process.env.SMTP_USER || '',
  SMTP_PASS: process.env.SMTP_PASS || '',
  SMTP_FROM: process.env.SMTP_FROM || 'ElectroPoint <noreply@localhost>',
  UPLOAD_DIR: process.env.UPLOAD_DIR || 'uploads',
  JWT_ACCESS_TTL: '15m',
  JWT_REFRESH_TTL: '7d',
  BCRYPT_COST: 12,
};

export default env;
