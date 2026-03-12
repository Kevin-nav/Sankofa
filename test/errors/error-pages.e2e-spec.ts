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

describe('Error pages (e2e)', () => {
  const dbPath = path.join(process.cwd(), 'prisma', 'test-errors.db');
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

  it('renders a record not found page for missing entities', async () => {
    const agent = request.agent(app.getHttpServer());

    await agent.post('/login').type('form').send({
      email: 'felix@sankofa.local',
      password: 'demo-password',
    });

    await agent
      .get('/employees/UNKNOWN-CODE')
      .expect(404)
      .expect((response) => {
        expect(response.text).toContain('Record Not Found');
        expect(response.text).toContain('Employee not found.');
      });
  });

  it('renders an internal system error page for unexpected failures', async () => {
    const agent = request.agent(app.getHttpServer());

    await agent.post('/login').type('form').send({
      email: 'akosua.audit@sankofa.local',
      password: 'demo-password',
    });

    await agent
      .get('/system/test-error')
      .expect(500)
      .expect((response) => {
        expect(response.text).toContain('Internal System Error');
        expect(response.text).toContain('Synthetic failure raised for end-to-end error page coverage.');
      });
  });
});
