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

describe('Admin portal (e2e)', () => {
  jest.setTimeout(20000);

  const dbPath = path.join(process.cwd(), 'prisma', 'test-admin.db');
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

  it('allows the seeded super admin to create and reset employee accounts', async () => {
    const agent = request.agent(app.getHttpServer());

    await agent
      .post('/api/admin/auth/login')
      .send({
        email: 'it.admin@sankofa.local',
        password: 'demo-password',
      })
      .expect(200)
      .expect((response) => {
        expect(response.body.user.isAdmin).toBe(true);
        expect(response.body.user.isSuperAdmin).toBe(true);
      });

    await agent
      .get('/api/admin/users')
      .expect(200)
      .expect((response) => {
        expect(response.body.users.some((user: { email: string }) => user.email === 'it.admin@sankofa.local')).toBe(
          true,
        );
      });

    const createResponse = await agent
      .post('/api/admin/users')
      .send({
        name: 'Mabel Ofori',
        email: 'mabel.ofori@sankofa.local',
        role: 'COMPLIANCE_OFFICER',
      })
      .expect(201);

    expect(createResponse.body.temporaryPassword).toContain('Skf-');

    const createdUserId = createResponse.body.user.id as number;

    await agent
      .post(`/api/admin/users/${createdUserId}/reset-password`)
      .send({})
      .expect(201)
      .expect((response) => {
        expect(response.body.temporaryPassword).toContain('Skf-');
        expect(response.body.user.mustChangePassword).toBe(true);
      });
  });
});
