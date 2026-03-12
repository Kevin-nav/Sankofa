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

describe('Layout navigation (e2e)', () => {
  const dbPath = path.join(process.cwd(), 'prisma', 'test-layout.db');
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

  it('shows payroll navigation for payroll admins', async () => {
    const agent = request.agent(app.getHttpServer());

    await agent
      .post('/login')
      .type('form')
      .send({
        email: 'anita@sankofa.local',
        password: 'demo-password',
      })
      .expect(302);

    await agent
      .get('/dashboard')
      .expect(200)
      .expect((response) => {
        expect(response.text).toContain('Operations Dashboard');
        expect(response.text).toContain('Payroll Batches');
        expect(response.text).not.toContain('Audit &amp; Activity');
      });
  });

  it('shows compliance navigation for compliance officers', async () => {
    const agent = request.agent(app.getHttpServer());

    await agent
      .post('/login')
      .type('form')
      .send({
        email: 'felix@sankofa.local',
        password: 'demo-password',
      })
      .expect(302);

    await agent
      .get('/dashboard')
      .expect(200)
      .expect((response) => {
        expect(response.text).toContain('Compliance Queue');
        expect(response.text).toContain('Payroll Batches');
      });
  });

  it('shows audit navigation for audit analysts', async () => {
    const agent = request.agent(app.getHttpServer());

    await agent
      .post('/login')
      .type('form')
      .send({
        email: 'akosua.audit@sankofa.local',
        password: 'demo-password',
      })
      .expect(302);

    await agent
      .get('/dashboard')
      .expect(200)
      .expect((response) => {
        expect(response.text).toContain('Audit &amp; Activity');
        expect(response.text).not.toContain('Compliance Queue');
      });
  });
});
