import fs from 'node:fs/promises';
import path from 'node:path';
import { execFile } from 'node:child_process';
import { promisify } from 'node:util';
import { PrismaClient } from '@prisma/client';
import { seedDatabase } from '../../prisma/seed';

const execFileAsync = promisify(execFile);

describe('Prisma seed realism (e2e)', () => {
  const dbPath = path.join(process.cwd(), 'prisma', 'test-seed-realism.db');
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

  it('creates payroll, compliance, and audit evidence tied to Felix and his workstation', async () => {
    const counts = await seedDatabase(databaseUrl);

    expect(counts.payrollBatches).toBeGreaterThanOrEqual(2);
    expect(counts.payrollEntries).toBeGreaterThanOrEqual(6);
    expect(counts.complianceReviews).toBeGreaterThanOrEqual(2);
    expect(counts.complianceFlags).toBeGreaterThanOrEqual(2);
    expect(counts.loginEvents).toBeGreaterThanOrEqual(3);
    expect(counts.systemEvents).toBeGreaterThanOrEqual(2);
    expect(counts.networkEvents).toBeGreaterThanOrEqual(2);

    const prisma = new PrismaClient({
      datasources: {
        db: {
          url: databaseUrl,
        },
      },
    });

    try {
      const felix = await prisma.user.findUniqueOrThrow({
        where: { email: 'felix@sankofa.local' },
        include: {
          loginEvents: true,
          complianceReviews: {
            include: {
              flags: true,
              batch: true,
            },
          },
        },
      });

      const workstationEvents = await prisma.systemEvent.findMany({
        where: { hostname: 'FELIX-LT-07' },
      });

      const workstationNetworkEvents = await prisma.networkEvent.findMany({
        where: { hostname: 'FELIX-LT-07' },
      });

      expect(felix.loginEvents.some((event) => event.anomalyFlag)).toBe(true);
      expect(
        felix.complianceReviews.some(
          (review) => review.batch.batchCode === '2026-Q2-REVIEW' && review.flags.length > 0,
        ),
      ).toBe(true);
      expect(workstationEvents.some((event) => event.eventType === 'ServiceCreated')).toBe(true);
      expect(
        workstationNetworkEvents.some(
          (event) => event.destination === '198.51.100.42' && event.port === 443,
        ),
      ).toBe(true);
    } finally {
      await prisma.$disconnect();
    }
  });
});
