import { PrismaClient, UserRole } from '@prisma/client';

type SeedPrismaClient = PrismaClient;

type SeedCounts = {
  users: number;
  employees: number;
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
    await prisma.user.deleteMany();
    await prisma.employee.deleteMany();

    await prisma.user.createMany({
      data: demoUsers,
    });

    await prisma.employee.createMany({
      data: demoEmployees,
    });

    const [users, employees] = await Promise.all([
      prisma.user.count(),
      prisma.employee.count(),
    ]);

    return { users, employees };
  } finally {
    await prisma.$disconnect();
  }
}

async function main(): Promise<void> {
  const counts = await seedDatabase();
  console.log(
    `Seeded ${counts.users} users and ${counts.employees} employees into Sankofa Payroll Platform.`,
  );
}

if (require.main === module) {
  void main();
}
