import fs from 'node:fs/promises';
import path from 'node:path';
import { execFile } from 'node:child_process';
import { promisify } from 'node:util';
import { INestApplication } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import request from 'supertest';
import { AppModule } from '../../src/app.module';
import { configureApp } from '../../src/app.setup';
import { seedDatabase } from '../../prisma/seed';

const execFileAsync = promisify(execFile);

describe('Auth flow (e2e)', () => {
  const dbPath = path.join(process.cwd(), 'prisma', 'test-auth.db');
  const databaseUrl = `file:${dbPath.replace(/\\/g, '/')}`;
  let app: INestApplication;

  beforeAll(async () => {
    process.env.DATABASE_URL = databaseUrl;
    await fs.rm(dbPath, { force: true });
    await execFileAsync(
      process.execPath,
      [require.resolve('prisma/build/index.js'), 'db', 'push', '--skip-generate'],
      {
        cwd: process.cwd(),
        env: {
          ...process.env,
          DATABASE_URL: databaseUrl,
        },
      },
    );
    await seedDatabase(databaseUrl);

    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    configureApp(app);
    await app.init();
  });

  afterAll(async () => {
    await app.close();
    await fs.rm(dbPath, { force: true });
  });

  it('logs in with a seeded account and reaches the protected route', async () => {
    const agent = request.agent(app.getHttpServer());

    await agent
      .post('/login')
      .type('form')
      .send({
        email: 'anita@sankofa.local',
        password: 'demo-password',
      })
      .expect(302)
      .expect('Location', '/dashboard');

    await agent
      .get('/dashboard')
      .expect(200)
      .expect((response) => {
        expect(response.text).toContain('Welcome Anita Mensah.');
        expect(response.text).toContain('Payroll Admin');
      });
  });

  it('rejects invalid credentials', async () => {
    await request(app.getHttpServer())
      .post('/login')
      .type('form')
      .send({
        email: 'anita@sankofa.local',
        password: 'wrong-password',
      })
      .expect(401)
      .expect((response) => {
        expect(response.text).toContain('Invalid credentials.');
      });
  });

  it('redirects unauthenticated users away from protected routes', async () => {
    await request(app.getHttpServer())
      .get('/dashboard')
      .expect(302)
      .expect('Location', '/login');
  });
});
