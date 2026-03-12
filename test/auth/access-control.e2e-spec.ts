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

describe('Access control (e2e)', () => {
  const dbPath = path.join(process.cwd(), 'prisma', 'test-access.db');
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

  it('redirects unauthenticated users to login', async () => {
    await request(app.getHttpServer())
      .get('/dashboard')
      .expect(302)
      .expect('Location', '/login');
  });

  it('renders an access denied page for forbidden routes', async () => {
    const agent = request.agent(app.getHttpServer());

    await agent.post('/login').type('form').send({
      email: 'anita@sankofa.local',
      password: 'demo-password',
    });

    await agent
      .get('/audit')
      .expect(403)
      .expect((response) => {
        expect(response.text).toContain('Access Denied');
        expect(response.text).toContain('/audit');
      });
  });
});
