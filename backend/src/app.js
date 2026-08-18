import path from 'node:path';
import express from 'express';
import helmet from 'helmet';
import cors from 'cors';
import cookieParser from 'cookie-parser';
import { env } from './config/env.js';
import { stripMongoOperators } from './utils/sanitize.js';
import { issueCsrf, requireCsrf } from './middleware/csrf.js';
import { generalLimiter } from './middleware/rateLimits.js';
import { optionalAuth } from './middleware/auth.js';
import { maintenanceGuard } from './middleware/maintenance.js';
import { notFound, errorHandler } from './middleware/errorHandler.js';
import { requestLogger } from './utils/logger.js';
import v1 from './routes/v1/index.js';

export function createApp() {
  const app = express();
  app.set('trust proxy', 1);
  app.disable('x-powered-by');

  app.use(
    helmet({
      crossOriginResourcePolicy: { policy: 'cross-origin' },
      contentSecurityPolicy: false,
    }),
  );
  app.use(
    cors({
      origin: env.FRONTEND_URL,
      credentials: true,
      allowedHeaders: ['Content-Type', 'X-CSRF-Token', 'Authorization'],
    }),
  );
  app.use(express.json({ limit: '1mb' }));
  app.use(express.urlencoded({ extended: false, limit: '1mb' }));
  app.use(cookieParser(env.COOKIE_SECRET));
  if (!env.isTest) {
    app.use(requestLogger);
  }
  app.use(stripMongoOperators);
  app.use(issueCsrf);
  app.use(requireCsrf);
  app.use(generalLimiter);

  app.get('/health', (_req, res) => res.json({ success: true, data: { ok: true } }));
  app.use('/uploads', express.static(path.resolve(process.cwd(), env.UPLOAD_DIR)));

  app.use('/api/v1', optionalAuth, maintenanceGuard, v1);

  app.use(notFound);
  app.use(errorHandler);
  return app;
}

export default createApp;
