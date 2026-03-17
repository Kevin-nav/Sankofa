import fs from 'node:fs/promises';
import path from 'node:path';
import { execFile } from 'node:child_process';
import { promisify } from 'node:util';
import { INestApplication } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import request from 'supertest';
import { configureApp } from '../../src/app.setup';
import { seedDatabase } from '../../prisma/seed';

const execFileAsync = promisify(execFile);

describe('Auth flow (e2e)', () => {
  jest.setTimeout(20000);

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

    const { AppModule } = await import('../../src/app.module');
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    app.setGlobalPrefix('api');
    configureApp(app);
    await app.init();
  });

  afterAll(async () => {
    if (app) {
      await app.close();
    }
    await fs.rm(dbPath, { force: true });
  });

  it('logs in with a seeded account and reaches the protected route', async () => {
    const agent = request.agent(app.getHttpServer());

    await agent
      .post('/api/auth/login')
      .send({
        email: 'anita@sankofa.local',
        password: 'demo-password',
      })
      .expect(201)
      .expect((response) => {
        expect(response.body.success).toBe(true);
        expect(response.body.user).toMatchObject({
          name: 'Anita Mensah',
          email: 'anita@sankofa.local',
          employeeCode: 'SK-1004',
          role: 'PAYROLL_ADMIN',
        });
      });

    await agent
      .get('/api/dashboard')
      .expect(200)
      .expect((response) => {
        expect(response.body.title).toBe('Operations Dashboard');
        expect(response.body.dashboardCards).toHaveLength(3);
        expect(response.body.pageSummary).toContain('Unified internal workspace');
      });
  });

  it('rejects invalid credentials', async () => {
    await request(app.getHttpServer())
      .post('/api/auth/login')
      .send({
        email: 'anita@sankofa.local',
        password: 'wrong-password',
      })
      .expect(401)
      .expect((response) => {
        expect(response.body.message).toContain('Invalid credentials.');
      });
  });

  it('redirects unauthenticated users away from protected routes', async () => {
    await request(app.getHttpServer())
      .get('/api/dashboard')
      .expect(302)
      .expect('Location', '/login');
  });

  it('creates an account through signup and returns an authenticated session user', async () => {
    const agent = request.agent(app.getHttpServer());

    await agent
      .post('/api/auth/signup')
      .send({
        name: 'Kojo Annan',
        email: 'kojo.annan@sankofa.local',
        password: 'secure-pass-1',
        role: 'AUDIT_ANALYST',
      })
      .expect(201)
      .expect((response) => {
        expect(response.body.success).toBe(true);
        expect(response.body.user).toMatchObject({
          name: 'Kojo Annan',
          email: 'kojo.annan@sankofa.local',
          role: 'AUDIT_ANALYST',
        });
        expect(response.body.user.employeeCode).toMatch(/^SK-\d{4}$/);
        expect(typeof response.body.csrfToken).toBe('string');
        expect(response.body.csrfToken.length).toBeGreaterThan(0);
      });

    await agent
      .get('/api/auth/me')
      .expect(200)
      .expect((response) => {
        expect(response.body.user).toMatchObject({
          name: 'Kojo Annan',
          email: 'kojo.annan@sankofa.local',
          role: 'AUDIT_ANALYST',
        });
        expect(response.body.user.employeeCode).toMatch(/^SK-\d{4}$/);
      });
  });

  it('rejects signup when the email already exists', async () => {
    await request(app.getHttpServer())
      .post('/api/auth/signup')
      .send({
        name: 'Another Anita',
        email: 'anita@sankofa.local',
        password: 'secure-pass-1',
        role: 'PAYROLL_ADMIN',
      })
      .expect(409)
      .expect((response) => {
        expect(response.body.message).toBe('An account with that email already exists.');
      });
  });

  it('resets an existing employee password after verifying employee ID, name, and email', async () => {
    await request(app.getHttpServer())
      .post('/api/auth/reset-password')
      .send({
        employeeCode: 'SK-1004',
        name: 'Anita Mensah',
        email: 'anita@sankofa.local',
        password: 'updated-pass-1',
      })
      .expect(200)
      .expect((response) => {
        expect(response.body.success).toBe(true);
        expect(response.body.message).toContain('Password updated');
      });

    await request(app.getHttpServer())
      .post('/api/auth/login')
      .send({
        email: 'anita@sankofa.local',
        password: 'demo-password',
      })
      .expect(401);

    await request(app.getHttpServer())
      .post('/api/auth/login')
      .send({
        email: 'anita@sankofa.local',
        password: 'updated-pass-1',
      })
      .expect(201)
      .expect((response) => {
        expect(response.body.success).toBe(true);
        expect(response.body.user.employeeCode).toBe('SK-1004');
      });
  });

  it('rejects reset when employee verification details do not match', async () => {
    await request(app.getHttpServer())
      .post('/api/auth/reset-password')
      .send({
        employeeCode: 'SK-9999',
        name: 'Anita Mensah',
        email: 'anita@sankofa.local',
        password: 'updated-pass-1',
      })
      .expect(400)
      .expect((response) => {
        expect(response.body.message).toBe('We could not verify an active employee with those details.');
      });
  });

  it('rejects reset when the new password is too short', async () => {
    await request(app.getHttpServer())
      .post('/api/auth/reset-password')
      .send({
        employeeCode: 'SK-1005',
        name: 'Felix Owusu',
        email: 'felix@sankofa.local',
        password: 'short',
      })
      .expect(400)
      .expect((response) => {
        expect(response.body.message).toBe('Password must be at least 8 characters long.');
      });
  });
});
