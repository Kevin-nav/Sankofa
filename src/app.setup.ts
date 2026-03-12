import { INestApplication } from '@nestjs/common';
import { NestExpressApplication } from '@nestjs/platform-express';
import express from 'express';
import session from 'express-session';
import path from 'node:path';

export function configureApp(app: INestApplication): void {
  const expressApp = app as NestExpressApplication;

  expressApp.setBaseViewsDir(path.join(__dirname, 'views'));
  expressApp.setViewEngine('hbs');
  expressApp.use(express.urlencoded({ extended: true }));
  expressApp.use(
    session({
      secret: 'sankofa-demo-secret',
      resave: false,
      saveUninitialized: false,
      cookie: {
        maxAge: 1000 * 60 * 60,
      },
    }),
  );
}
