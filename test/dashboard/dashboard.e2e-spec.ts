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

describe('Dashboard (e2e)', () => {
  const dbPath = path.join(process.cwd(), 'prisma', 'test-dashboard.db');
  const databaseUrl = `file:${dbPath.replace(/\\/g, '/')}`;
  let app: INestApplication;

  beforeAll(async () => {
    process.env.DATABASE_URL = databaseUrl;
    process.env.NODE_ENV = 'test';
    await fs.rm(dbPath, { force: true });
    await execFileAsync(
      process.execPath,
      [require.resolve('prisma/build/index.js'), 'db', 'push', '--skip-generate'],
      {
        cwd: process.cwd(),
        env: {
          ...process.env,
          DATABASE_URL: databaseUrl,
          NODE_ENV: 'test',
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

  it('shows seeded payroll metrics for payroll admins', async () => {
    const agent = request.agent(app.getHttpServer());

    await agent.post('/login').type('form').send({
      email: 'anita@sankofa.local',
      password: 'demo-password',
    });

    await agent
      .get('/dashboard')
      .expect(200)
      .expect((response) => {
        expect(response.text).toContain('Quarterly batches');
        expect(response.text).toContain('02');
        expect(response.text).toContain('Active employees');
        expect(response.text).toContain('Flagged entries');
      });
  });

  it('shows seeded compliance metrics for compliance officers', async () => {
    const agent = request.agent(app.getHttpServer());

    await agent.post('/login').type('form').send({
      email: 'felix@sankofa.local',
      password: 'demo-password',
    });

    await agent
      .get('/dashboard')
      .expect(200)
      .expect((response) => {
        expect(response.text).toContain('Reviews assigned');
        expect(response.text).toContain('Open flags');
        expect(response.text).toContain('Checks completed');
        expect(response.text).toContain('20');
      });
  });

  it('shows seeded audit metrics for audit analysts', async () => {
    const agent = request.agent(app.getHttpServer());

    await agent.post('/login').type('form').send({
      email: 'akosua.audit@sankofa.local',
      password: 'demo-password',
    });

    await agent
      .get('/dashboard')
      .expect(200)
      .expect((response) => {
        expect(response.text).toContain('Login anomalies');
        expect(response.text).toContain('System events');
        expect(response.text).toContain('Outbound links');
      });
  });
});
