const { PrismaClient, UserRole, AdminScope } = require("@prisma/client");
const crypto = require("crypto");

function getEncryptionKey() {
  const key =
    process.env.PASSWORD_ENCRYPTION_KEY || "default-32-character-secret-key-!";
  return Buffer.from(key.padEnd(32, "0").slice(0, 32));
}

function encryptPassword(password) {
  const iv = crypto.randomBytes(12);
  const cipher = crypto.createCipheriv("aes-256-gcm", getEncryptionKey(), iv);

  let encrypted = cipher.update(password, "utf8", "hex");
  encrypted += cipher.final("hex");

  const authTag = cipher.getAuthTag().toString("hex");

  return `${iv.toString("hex")}:${authTag}:${encrypted}`;
}

const demoUsers = [
  {
    name: "Anita Mensah",
    email: "anita@sankofa.local",
    role: UserRole.PAYROLL_ADMIN,
    department: "Payroll",
    status: "Active",
    lastLogin: new Date("2026-03-10T08:15:00Z"),
  },
  {
    name: "Felix Owusu",
    email: "felix@sankofa.local",
    role: UserRole.COMPLIANCE_OFFICER,
    department: "Compliance",
    status: "Active",
    lastLogin: new Date("2026-03-10T08:22:00Z"),
  },
  {
    name: "Akosua Lamptey",
    email: "akosua.audit@sankofa.local",
    role: UserRole.AUDIT_ANALYST,
    department: "Audit",
    status: "Active",
    lastLogin: new Date("2026-03-11T07:55:00Z"),
  },
  {
    name: "Yaw Asante",
    email: "it.admin@sankofa.local",
    role: UserRole.PAYROLL_ADMIN,
    department: "Information Security",
    status: "Active",
    isAdmin: true,
    isSuperAdmin: true,
    lastLogin: new Date("2026-03-11T06:45:00Z"),
    lastPasswordChangeAt: new Date("2026-03-11T06:45:00Z"),
  },
];

const demoEmployees = [
  {
    employeeCode: "SK-1001",
    fullName: "Kwame Boateng",
    department: "Finance",
    jobTitle: "Senior Accountant",
    payGrade: "G7",
    taxIdentifier: "GH-TIN-1001",
    bankName: "National Commercial Bank",
    maskedAccountNumber: "****4381",
    employmentStatus: "Active",
  },
  {
    employeeCode: "SK-1002",
    fullName: "Ama Serwaa",
    department: "Human Resources",
    jobTitle: "HR Generalist",
    payGrade: "G5",
    taxIdentifier: "GH-TIN-1002",
    bankName: "Metro Trust Bank",
    maskedAccountNumber: "****7420",
    employmentStatus: "Active",
  },
  {
    employeeCode: "SK-1003",
    fullName: "Josephine Kusi",
    department: "Operations",
    jobTitle: "Operations Coordinator",
    payGrade: "G4",
    taxIdentifier: "GH-TIN-1003",
    bankName: "Community Savings Bank",
    maskedAccountNumber: "****1129",
    employmentStatus: "Active",
  },
];

async function seedRuntime() {
  const prisma = new PrismaClient();
  const demoPasswordHash = encryptPassword("demo-password");

  try {
    await prisma.networkEvent.deleteMany();
    await prisma.systemEvent.deleteMany();
    await prisma.loginEvent.deleteMany();
    await prisma.adminAuditLog.deleteMany();
    await prisma.adminScopeGrant.deleteMany();
    await prisma.complianceFlag.deleteMany();
    await prisma.complianceReview.deleteMany();
    await prisma.payrollEntry.deleteMany();
    await prisma.payrollBatch.deleteMany();
    await prisma.user.deleteMany();
    await prisma.employee.deleteMany();

    await prisma.user.createMany({
      data: demoUsers.map((user) => ({
        ...user,
        passwordHash: demoPasswordHash,
        lastPasswordChangeAt: user.lastPasswordChangeAt ?? user.lastLogin,
      })),
    });

    const superAdmin = await prisma.user.findUniqueOrThrow({
      where: { email: "it.admin@sankofa.local" },
    });

    await prisma.adminScopeGrant.createMany({
      data: [
        { userId: superAdmin.id, scope: AdminScope.USER_ADMIN },
        { userId: superAdmin.id, scope: AdminScope.SECURITY_ADMIN },
        { userId: superAdmin.id, scope: AdminScope.AUDIT_ADMIN },
        { userId: superAdmin.id, scope: AdminScope.ADMIN_ADMIN },
      ],
    });

    await prisma.employee.createMany({ data: demoEmployees });

    const [anita, felix, employeesForSeed] = await Promise.all([
      prisma.user.findUniqueOrThrow({
        where: { email: "anita@sankofa.local" },
      }),
      prisma.user.findUniqueOrThrow({
        where: { email: "felix@sankofa.local" },
      }),
      prisma.employee.findMany({ orderBy: { employeeCode: "asc" } }),
    ]);

    const employeeByCode = new Map(
      employeesForSeed.map((employee) => [employee.employeeCode, employee]),
    );

    await prisma.payrollBatch.create({
      data: {
        batchCode: "2026-Q1-PRIMARY",
        quarter: "Q1",
        year: 2026,
        status: "Approved",
        submittedAt: new Date("2026-03-03T10:00:00Z"),
        totalGross: 17200,
        totalNet: 13587,
        createdById: anita.id,
        entries: {
          create: [
            {
              employeeId: employeeByCode.get("SK-1001").id,
              baseSalary: 6400,
              allowances: 900,
              deductions: 250,
              tax: 1120,
              netPay: 5930,
              notes: "Quarter-end finance reconciliation complete.",
            },
            {
              employeeId: employeeByCode.get("SK-1002").id,
              baseSalary: 5100,
              allowances: 520,
              deductions: 180,
              tax: 890,
              netPay: 4550,
              notes: "Standard payroll cycle.",
            },
            {
              employeeId: employeeByCode.get("SK-1003").id,
              baseSalary: 3800,
              allowances: 480,
              deductions: 140,
              tax: 1033,
              netPay: 3107,
              notes: "Operations support allowance applied.",
            },
          ],
        },
      },
    });

    await prisma.payrollBatch.create({
      data: {
        batchCode: "2026-Q2-REVIEW",
        quarter: "Q2",
        year: 2026,
        status: "Under Review",
        submittedAt: new Date("2026-06-07T11:15:00Z"),
        totalGross: 17610,
        totalNet: 13876,
        createdById: anita.id,
        entries: {
          create: [
            {
              employeeId: employeeByCode.get("SK-1001").id,
              baseSalary: 6400,
              allowances: 1100,
              deductions: 260,
              tax: 1205,
              netPay: 6035,
              notes: "Finance retention allowance updated.",
              isFlagged: true,
            },
            {
              employeeId: employeeByCode.get("SK-1002").id,
              baseSalary: 5100,
              allowances: 610,
              deductions: 180,
              tax: 934,
              netPay: 4596,
              notes: "Benefit adjustment pending compliance review.",
            },
            {
              employeeId: employeeByCode.get("SK-1003").id,
              baseSalary: 3800,
              allowances: 600,
              deductions: 150,
              tax: 1005,
              netPay: 3245,
              notes: "Travel support allowance submitted.",
            },
          ],
        },
      },
    });

    const reviewBatchPrimary = await prisma.payrollBatch.findUniqueOrThrow({
      where: { batchCode: "2026-Q1-PRIMARY" },
    });
    const reviewBatchSecondary = await prisma.payrollBatch.findUniqueOrThrow({
      where: { batchCode: "2026-Q2-REVIEW" },
    });

    await prisma.complianceReview.create({
      data: {
        batchId: reviewBatchPrimary.id,
        reviewerId: felix.id,
        reviewStatus: "Approved",
        comments: "Quarter one controls complete and signed off.",
        completedChecks: 12,
        approvedAt: new Date("2026-03-04T14:35:00Z"),
      },
    });

    const reviewTwo = await prisma.complianceReview.create({
      data: {
        batchId: reviewBatchSecondary.id,
        reviewerId: felix.id,
        reviewStatus: "In Review",
        comments:
          "Allowance changes require supporting evidence before approval.",
        completedChecks: 8,
      },
    });

    const reviewTwoEntries = await prisma.payrollEntry.findMany({
      where: { batchId: reviewBatchSecondary.id },
      include: { employee: true },
    });

    const entryByCode = new Map(
      reviewTwoEntries.map((entry) => [entry.employee.employeeCode, entry]),
    );

    await prisma.complianceFlag.createMany({
      data: [
        {
          reviewId: reviewTwo.id,
          payrollEntryId: entryByCode.get("SK-1001").id,
          severity: "High",
          ruleType: "Allowance Verification",
          description:
            "Retention allowance increase requires supporting approval memo.",
          resolutionState: "Open",
        },
        {
          reviewId: reviewTwo.id,
          payrollEntryId: entryByCode.get("SK-1002").id,
          severity: "Medium",
          ruleType: "Benefits Documentation",
          description:
            "Benefit adjustment note is missing one compliance attachment.",
          resolutionState: "Pending Evidence",
        },
      ],
    });

    await prisma.loginEvent.createMany({
      data: [
        {
          userId: felix.id,
          loginTime: new Date("2026-06-08T08:14:00Z"),
          sourceIp: "10.20.14.22",
          deviceLabel: "FELIX-LT-07",
          anomalyFlag: false,
        },
        {
          userId: felix.id,
          loginTime: new Date("2026-06-09T02:41:00Z"),
          sourceIp: "10.20.14.22",
          deviceLabel: "FELIX-LT-07",
          anomalyFlag: true,
        },
        {
          userId: felix.id,
          loginTime: new Date("2026-06-11T01:55:00Z"),
          sourceIp: "10.20.14.22",
          deviceLabel: "FELIX-LT-07",
          anomalyFlag: true,
        },
      ],
    });

    await prisma.systemEvent.createMany({
      data: [
        {
          hostname: "FELIX-LT-07",
          eventType: "ServiceCreated",
          timestamp: new Date("2026-06-09T02:44:00Z"),
          severity: "High",
          summary: "Unexpected background service registered.",
          details:
            'Service name "PolicySyncHost" appeared outside maintenance window.',
        },
        {
          hostname: "FELIX-LT-07",
          eventType: "FileAccess",
          timestamp: new Date("2026-06-09T02:47:00Z"),
          severity: "Medium",
          summary: "Payroll archive folder accessed after business hours.",
          details:
            "Quarterly payroll directory enumeration recorded on local workstation.",
        },
      ],
    });

    await prisma.networkEvent.createMany({
      data: [
        {
          hostname: "FELIX-LT-07",
          destination: "198.51.100.42",
          port: 443,
          protocol: "TLS",
          timestamp: new Date("2026-06-11T01:58:00Z"),
          riskLabel: "Investigate",
          notes: "Outbound session occurred during anomalous login window.",
        },
        {
          hostname: "FELIX-LT-07",
          destination: "198.51.100.42",
          port: 443,
          protocol: "TLS",
          timestamp: new Date("2026-06-12T02:11:00Z"),
          riskLabel: "Investigate",
          notes:
            "Repeated encrypted outbound connection from payroll workstation.",
        },
      ],
    });

    console.log("Seeded Sankofa runtime data successfully.");
  } finally {
    await prisma.$disconnect();
  }
}

if (require.main === module) {
  seedRuntime().catch((error) => {
    console.error(error);
    process.exit(1);
  });
}
