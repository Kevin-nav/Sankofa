import { INestApplication } from '@nestjs/common';
import { NestExpressApplication } from '@nestjs/platform-express';
import express from 'express';
import session from 'express-session';
import hbs from 'hbs';
import path from 'node:path';

export function configureApp(app: INestApplication): void {
  const expressApp = app as NestExpressApplication;

  expressApp.setBaseViewsDir(path.join(__dirname, 'views'));
  expressApp.setViewEngine('hbs');
  hbs.registerPartials(path.join(__dirname, 'views', 'partials'));
  expressApp.use(express.urlencoded({ extended: true }));
  expressApp.useStaticAssets(path.join(__dirname, 'public'));
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
