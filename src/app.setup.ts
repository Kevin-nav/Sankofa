import { INestApplication } from '@nestjs/common';
import { NestExpressApplication } from '@nestjs/platform-express';
import express, { NextFunction, Request, Response } from 'express';
import session from 'express-session';
import connectSqlite3 from 'connect-sqlite3';
import helmet from 'helmet';
import rateLimit from 'express-rate-limit';
import fs from 'node:fs';
import path from 'node:path';
import { randomBytes } from 'node:crypto';

export function configureApp(app: INestApplication): void {
  const expressApp = app as NestExpressApplication;
  const SQLiteStore = connectSqlite3(session);
  const trustProxy = process.env.TRUST_PROXY === 'true';
  const enableCsrf = process.env.ENABLE_CSRF === 'true';
  const sessionDbPath = path.resolve(process.env.SESSION_DB_PATH ?? './prisma/sessions.db');
  const sessionDbDir = path.dirname(sessionDbPath);
  const loginRateWindowMs = Number.parseInt(process.env.LOGIN_RATE_LIMIT_WINDOW_MS ?? '60000', 10);
  const loginRateMax = Number.parseInt(process.env.LOGIN_RATE_LIMIT_MAX ?? '20', 10);
  const sessionStore = new SQLiteStore({
    db: path.basename(sessionDbPath),
    dir: sessionDbDir,
  }) as unknown as session.Store;

  fs.mkdirSync(sessionDbDir, { recursive: true });

  if (typeof (expressApp as { set?: unknown }).set === 'function') {
    expressApp.set('trust proxy', trustProxy ? 1 : 0);
  }
  expressApp.use(
    helmet({
      contentSecurityPolicy: false,
    }),
  );
  expressApp.use(express.json());
  expressApp.use(express.urlencoded({ extended: true }));
  expressApp.useStaticAssets(path.join(__dirname, 'public'));
  expressApp.use(
    '/api/auth/login',
    rateLimit({
      windowMs: loginRateWindowMs,
      max: loginRateMax,
      standardHeaders: true,
      legacyHeaders: false,
    }),
  );
  expressApp.use(
    '/api/admin/auth/login',
    rateLimit({
      windowMs: loginRateWindowMs,
      max: loginRateMax,
      standardHeaders: true,
      legacyHeaders: false,
    }),
  );
  expressApp.use(
    session({
      secret: process.env.SESSION_SECRET ?? 'test-session-secret-not-for-production',
      resave: false,
      saveUninitialized: false,
      store: sessionStore,
      cookie: {
        maxAge: Number.parseInt(process.env.SESSION_COOKIE_MAX_AGE_MS ?? '3600000', 10),
        sameSite: 'lax',
        secure: process.env.SESSION_COOKIE_SECURE === 'true',
        httpOnly: true,
      },
    }),
  );

  expressApp.use((request: Request, response: Response, next: NextFunction) => {
    if (!request.session.csrfToken) {
      request.session.csrfToken = randomBytes(24).toString('hex');
    }

    if (enableCsrf && request.method === 'POST') {
      const token = typeof request.body?._csrf === 'string' ? request.body._csrf : '';
      if (!token || token !== request.session.csrfToken) {
        response.status(403).json({
          error: 'Session validation failed. Please retry sign in.',
          csrfToken: request.session.csrfToken,
        });
        return;
      }
    }

    next();
  });
}
