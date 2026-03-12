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

describe('Payroll (e2e)', () => {
  const dbPath = path.join(process.cwd(), 'prisma', 'test-payroll.db');
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

  it('lists payroll batches', async () => {
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
      .get('/payroll')
      .expect(200)
      .expect((response) => {
        expect(response.text).toContain('Payroll Batches');
        expect(response.text).toContain('2026-Q1-PRIMARY');
        expect(response.text).toContain('2026-Q2-REVIEW');
      });
  });

  it('shows a payroll batch detail page', async () => {
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
      .get('/payroll/2026-Q2-REVIEW')
      .expect(200)
      .expect((response) => {
        expect(response.text).toContain('Q2 2026');
        expect(response.text).toContain('Kwame Boateng');
        expect(response.text).toContain('6035');
      });
  });

  it('shows an individual payroll entry detail page', async () => {
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
      .get('/payroll/2026-Q2-REVIEW/entries/SK-1001')
      .expect(200)
      .expect((response) => {
        expect(response.text).toContain('Kwame Boateng Payroll Entry');
        expect(response.text).toContain('Finance retention allowance updated.');
        expect(response.text).toContain('6035');
      });
  });
});
