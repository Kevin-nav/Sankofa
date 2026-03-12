import { PrismaClient, UserRole } from '@prisma/client';

type SeedPrismaClient = PrismaClient;

type SeedCounts = {
  users: number;
  employees: number;
  payrollBatches: number;
  payrollEntries: number;
};

const demoUsers = [
  {
    name: 'Anita Mensah',
    email: 'anita@sankofa.local',
    passwordHash: 'demo-password',
    role: UserRole.PAYROLL_ADMIN,
    department: 'Payroll',
    status: 'Active',
    lastLogin: new Date('2026-03-10T08:15:00Z'),
  },
  {
    name: 'Felix Owusu',
    email: 'felix@sankofa.local',
    passwordHash: 'demo-password',
    role: UserRole.COMPLIANCE_OFFICER,
    department: 'Compliance',
    status: 'Active',
    lastLogin: new Date('2026-03-10T08:22:00Z'),
  },
  {
    name: 'Akosua Lamptey',
    email: 'akosua.audit@sankofa.local',
    passwordHash: 'demo-password',
    role: UserRole.AUDIT_ANALYST,
    department: 'Audit',
    status: 'Active',
    lastLogin: new Date('2026-03-11T07:55:00Z'),
  },
];

const demoEmployees = [
  {
    employeeCode: 'SK-1001',
    fullName: 'Kwame Boateng',
    department: 'Finance',
    jobTitle: 'Senior Accountant',
    payGrade: 'G7',
    taxIdentifier: 'GH-TIN-1001',
    bankName: 'National Commercial Bank',
    maskedAccountNumber: '****4381',
    employmentStatus: 'Active',
  },
  {
    employeeCode: 'SK-1002',
    fullName: 'Ama Serwaa',
    department: 'Human Resources',
    jobTitle: 'HR Generalist',
    payGrade: 'G5',
    taxIdentifier: 'GH-TIN-1002',
    bankName: 'Metro Trust Bank',
    maskedAccountNumber: '****7420',
    employmentStatus: 'Active',
  },
  {
    employeeCode: 'SK-1003',
    fullName: 'Josephine Kusi',
    department: 'Operations',
    jobTitle: 'Operations Coordinator',
    payGrade: 'G4',
    taxIdentifier: 'GH-TIN-1003',
    bankName: 'Community Savings Bank',
    maskedAccountNumber: '****1129',
    employmentStatus: 'Active',
  },
];

function createClient(databaseUrl?: string): SeedPrismaClient {
  if (!databaseUrl) {
    return new PrismaClient();
  }

  return new PrismaClient({
    datasources: {
      db: {
        url: databaseUrl,
      },
    },
  });
}

export async function seedDatabase(databaseUrl?: string): Promise<SeedCounts> {
  const prisma = createClient(databaseUrl);

  try {
    await prisma.payrollEntry.deleteMany();
    await prisma.payrollBatch.deleteMany();
    await prisma.user.deleteMany();
    await prisma.employee.deleteMany();

    await prisma.user.createMany({
      data: demoUsers,
    });

    await prisma.employee.createMany({
      data: demoEmployees,
    });

    const [anita, employeesForSeed] = await Promise.all([
      prisma.user.findUniqueOrThrow({
        where: { email: 'anita@sankofa.local' },
      }),
      prisma.employee.findMany({
        orderBy: { employeeCode: 'asc' },
      }),
    ]);

    const employeeByCode = new Map(
      employeesForSeed.map((employee) => [employee.employeeCode, employee]),
    );

    await prisma.payrollBatch.create({
      data: {
        batchCode: '2026-Q1-PRIMARY',
        quarter: 'Q1',
        year: 2026,
        status: 'Approved',
        submittedAt: new Date('2026-03-03T10:00:00Z'),
        totalGross: 17200,
        totalNet: 13587,
        createdById: anita.id,
        entries: {
          create: [
            {
              employeeId: employeeByCode.get('SK-1001')!.id,
              baseSalary: 6400,
              allowances: 900,
              deductions: 250,
              tax: 1120,
              netPay: 5930,
              notes: 'Quarter-end finance reconciliation complete.',
            },
            {
              employeeId: employeeByCode.get('SK-1002')!.id,
              baseSalary: 5100,
              allowances: 520,
              deductions: 180,
              tax: 890,
              netPay: 4550,
              notes: 'Standard payroll cycle.',
            },
            {
              employeeId: employeeByCode.get('SK-1003')!.id,
              baseSalary: 3800,
              allowances: 480,
              deductions: 140,
              tax: 1033,
              netPay: 3107,
              notes: 'Operations support allowance applied.',
            },
          ],
        },
      },
    });

    await prisma.payrollBatch.create({
      data: {
        batchCode: '2026-Q2-REVIEW',
        quarter: 'Q2',
        year: 2026,
        status: 'Under Review',
        submittedAt: new Date('2026-06-07T11:15:00Z'),
        totalGross: 17610,
        totalNet: 13876,
        createdById: anita.id,
        entries: {
          create: [
            {
              employeeId: employeeByCode.get('SK-1001')!.id,
              baseSalary: 6400,
              allowances: 1100,
              deductions: 260,
              tax: 1205,
              netPay: 6035,
              notes: 'Finance retention allowance updated.',
              isFlagged: true,
            },
            {
              employeeId: employeeByCode.get('SK-1002')!.id,
              baseSalary: 5100,
              allowances: 610,
              deductions: 180,
              tax: 934,
              netPay: 4596,
              notes: 'Benefit adjustment pending compliance review.',
            },
            {
              employeeId: employeeByCode.get('SK-1003')!.id,
              baseSalary: 3800,
              allowances: 600,
              deductions: 150,
              tax: 1005,
              netPay: 3245,
              notes: 'Travel support allowance submitted.',
            },
          ],
        },
      },
    });

    const [users, employees, payrollBatches, payrollEntries] = await Promise.all([
      prisma.user.count(),
      prisma.employee.count(),
      prisma.payrollBatch.count(),
      prisma.payrollEntry.count(),
    ]);

    return { users, employees, payrollBatches, payrollEntries };
  } finally {
    await prisma.$disconnect();
  }
}

async function main(): Promise<void> {
  const counts = await seedDatabase();
  console.log(
    `Seeded ${counts.users} users, ${counts.employees} employees, ${counts.payrollBatches} payroll batches, and ${counts.payrollEntries} payroll entries into Sankofa Payroll Platform.`,
  );
}

if (require.main === module) {
  void main();
}
