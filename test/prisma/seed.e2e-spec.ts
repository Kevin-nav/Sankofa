import fs from 'node:fs/promises';
import path from 'node:path';
import { execFile } from 'node:child_process';
import { promisify } from 'node:util';
import { PrismaClient } from '@prisma/client';
import { seedDatabase } from '../../prisma/seed';

const execFileAsync = promisify(execFile);

describe('Prisma seed (e2e)', () => {
  const dbPath = path.join(process.cwd(), 'prisma', 'test-seed.db');
  const databaseUrl = `file:${dbPath.replace(/\\/g, '/')}`;

  beforeAll(async () => {
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
  });

  afterAll(async () => {
    await fs.rm(dbPath, { force: true });
  });

  it('creates seeded users and employees in SQLite', async () => {
    const counts = await seedDatabase(databaseUrl);
    expect(counts.users).toBeGreaterThan(0);
    expect(counts.employees).toBeGreaterThan(0);

    const prisma = new PrismaClient({
      datasources: {
        db: {
          url: databaseUrl,
        },
      },
    });

    try {
      const [users, employees] = await Promise.all([
        prisma.user.count(),
        prisma.employee.count(),
      ]);

      expect(users).toBe(3);
      expect(employees).toBe(3);
    } finally {
      await prisma.$disconnect();
    }
  });
});
