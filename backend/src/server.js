import { env } from './config/env.js';
import { connectDb } from './config/db.js';
import { createApp } from './app.js';
import { logger } from './utils/logger.js';

function mongoHost(uri) {
  try {
    const parsed = new URL(uri);
    const db = parsed.pathname.replace(/^\//, '') || '(default)';
    return `${parsed.host}/${db}`;
  } catch {
    return 'configured URI';
  }
}

function logBootWarnings() {
  if (!env.SMTP_HOST || !env.SMTP_USER) {
    logger.warn('SMTP is not configured — password reset and order emails will not send');
  }
  if (!env.KHALTI_SECRET_KEY) {
    logger.warn('KHALTI_SECRET_KEY is empty — Khalti checkout will fail until it is set');
  }
  if (env.ESEWA_ENV !== 'live') {
    logger.warn(`eSewa is in ${env.ESEWA_ENV} mode (${env.ESEWA_PRODUCT_CODE}) — not live charges`);
  }
  if (!env.ADMIN_PASSWORD) {
    logger.warn('ADMIN_PASSWORD is empty — run seed only after setting it in backend/.env');
  }
}

const app = createApp();

process.on('unhandledRejection', (reason) => {
  logger.error('Unhandled promise rejection', reason instanceof Error ? reason : String(reason));
});

process.on('uncaughtException', (err) => {
  logger.error('Uncaught exception', err);
  process.exit(1);
});

try {
  await connectDb();
  logger.info(`MongoDB connected ${mongoHost(env.MONGO_URI)}`);
} catch (err) {
  logger.error('MongoDB connection failed', err);
  process.exit(1);
}

logBootWarnings();

const server = app.listen(env.PORT, () => {
  logger.info(`API listening on ${env.BACKEND_URL}`);
  logger.info(`Environment ${env.NODE_ENV}`);
  logger.info(`Frontend origin ${env.FRONTEND_URL}`);
  logger.info('Routes mounted at /api/v1');
});

server.on('error', (err) => {
  logger.error('HTTP server failed to bind', err);
  process.exit(1);
});
