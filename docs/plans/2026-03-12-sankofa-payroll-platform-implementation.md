# Sankofa Payroll Platform Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Build a single NestJS web application backed by SQLite and Prisma that presents a believable internal payroll, compliance, and audit dashboard with seeded demo data.

**Architecture:** Use a NestJS monolith with server-rendered views, Prisma ORM, and a SQLite database. Organize features into focused Nest modules for authentication, employees, payroll, compliance, audit, and dashboard aggregation while keeping auth and UI complexity intentionally low for the classroom demo.

**Tech Stack:** NestJS, TypeScript, Prisma, SQLite, server-rendered templates, Jest, Supertest

---

### Task 1: Scaffold the application foundation

**Files:**
- Create: `package.json`
- Create: `nest-cli.json`
- Create: `tsconfig.json`
- Create: `tsconfig.build.json`
- Create: `src/main.ts`
- Create: `src/app.module.ts`
- Create: `src/app.controller.ts`
- Create: `src/app.service.ts`
- Create: `test/app.e2e-spec.ts`
- Create: `test/jest-e2e.json`

**Step 1: Write the failing test**

Create `test/app.e2e-spec.ts` with a smoke test that requests `/login` and expects HTTP 200.

**Step 2: Run test to verify it fails**

Run: `npm test -- --runInBand`
Expected: FAIL because the Nest application is not scaffolded yet.

**Step 3: Write minimal implementation**

Scaffold the NestJS app entrypoint and a basic controller that serves the login page route.

**Step 4: Run test to verify it passes**

Run: `npm test -- --runInBand`
Expected: PASS for the smoke test.

**Step 5: Commit**

```bash
git add package.json nest-cli.json tsconfig.json tsconfig.build.json src/main.ts src/app.module.ts src/app.controller.ts src/app.service.ts test/app.e2e-spec.ts test/jest-e2e.json
git commit -m "feat: scaffold nest payroll platform"
```

### Task 2: Add Prisma and SQLite configuration

**Files:**
- Create: `prisma/schema.prisma`
- Create: `prisma/seed.ts`
- Modify: `package.json`
- Create: `.env.example`
- Create: `src/prisma/prisma.module.ts`
- Create: `src/prisma/prisma.service.ts`
- Test: `test/prisma/seed.e2e-spec.ts`

**Step 1: Write the failing test**

Create `test/prisma/seed.e2e-spec.ts` that boots a test database, runs the seed script, and asserts at least one user and one employee exist.

**Step 2: Run test to verify it fails**

Run: `npm test -- --runInBand test/prisma/seed.e2e-spec.ts`
Expected: FAIL because Prisma schema and seed logic do not exist.

**Step 3: Write minimal implementation**

Define the initial schema, Prisma service, environment configuration, and seed script with seeded users and employees.

**Step 4: Run test to verify it passes**

Run: `npm test -- --runInBand test/prisma/seed.e2e-spec.ts`
Expected: PASS with seeded records created in SQLite.

**Step 5: Commit**

```bash
git add prisma/schema.prisma prisma/seed.ts package.json .env.example src/prisma/prisma.module.ts src/prisma/prisma.service.ts test/prisma/seed.e2e-spec.ts
git commit -m "feat: add prisma sqlite foundation"
```

### Task 3: Implement session-based authentication and demo login

**Files:**
- Create: `src/auth/auth.module.ts`
- Create: `src/auth/auth.controller.ts`
- Create: `src/auth/auth.service.ts`
- Create: `src/auth/session.guard.ts`
- Create: `src/auth/role.guard.ts`
- Create: `src/auth/decorators/roles.decorator.ts`
- Create: `src/views/login.hbs`
- Modify: `src/app.module.ts`
- Modify: `src/main.ts`
- Test: `test/auth/login.e2e-spec.ts`

**Step 1: Write the failing test**

Create `test/auth/login.e2e-spec.ts` covering successful login for a seeded user, failed login for bad credentials, and redirect behavior for protected routes.

**Step 2: Run test to verify it fails**

Run: `npm test -- --runInBand test/auth/login.e2e-spec.ts`
Expected: FAIL because auth and session handling do not exist.

**Step 3: Write minimal implementation**

Add session middleware, login form handling, password verification against seeded users, logout, and guards for protected routes.

**Step 4: Run test to verify it passes**

Run: `npm test -- --runInBand test/auth/login.e2e-spec.ts`
Expected: PASS for successful and failed auth cases.

**Step 5: Commit**

```bash
git add src/auth src/views/login.hbs src/app.module.ts src/main.ts test/auth/login.e2e-spec.ts
git commit -m "feat: add demo authentication flow"
```

### Task 4: Build the application shell and shared layout

**Files:**
- Create: `src/layout/layout.module.ts`
- Create: `src/layout/layout.service.ts`
- Create: `src/views/layouts/main.hbs`
- Create: `src/views/partials/sidebar.hbs`
- Create: `src/views/partials/header.hbs`
- Create: `src/public/styles/app.css`
- Modify: `src/main.ts`
- Test: `test/layout/navigation.e2e-spec.ts`

**Step 1: Write the failing test**

Create `test/layout/navigation.e2e-spec.ts` that logs in as each role and asserts role-appropriate navigation items are visible.

**Step 2: Run test to verify it fails**

Run: `npm test -- --runInBand test/layout/navigation.e2e-spec.ts`
Expected: FAIL because the shared layout and role navigation do not exist.

**Step 3: Write minimal implementation**

Add the main template layout, internal portal styling, shared navigation, and role-aware menu generation.

**Step 4: Run test to verify it passes**

Run: `npm test -- --runInBand test/layout/navigation.e2e-spec.ts`
Expected: PASS with correct navigation by role.

**Step 5: Commit**

```bash
git add src/layout src/views/layouts/main.hbs src/views/partials/sidebar.hbs src/views/partials/header.hbs src/public/styles/app.css src/main.ts test/layout/navigation.e2e-spec.ts
git commit -m "feat: add internal portal shell"
```

### Task 5: Implement employee directory and employee detail views

**Files:**
- Create: `src/employees/employees.module.ts`
- Create: `src/employees/employees.controller.ts`
- Create: `src/employees/employees.service.ts`
- Create: `src/views/employees/index.hbs`
- Create: `src/views/employees/show.hbs`
- Test: `test/employees/employees.e2e-spec.ts`

**Step 1: Write the failing test**

Create `test/employees/employees.e2e-spec.ts` to assert authenticated users can load the employee list, search by department, and open an employee detail page.

**Step 2: Run test to verify it fails**

Run: `npm test -- --runInBand test/employees/employees.e2e-spec.ts`
Expected: FAIL because the employee module does not exist.

**Step 3: Write minimal implementation**

Add employee list and detail routes backed by Prisma queries and render them with server-side templates.

**Step 4: Run test to verify it passes**

Run: `npm test -- --runInBand test/employees/employees.e2e-spec.ts`
Expected: PASS for list, filter, and detail cases.

**Step 5: Commit**

```bash
git add src/employees src/views/employees test/employees/employees.e2e-spec.ts
git commit -m "feat: add employee directory"
```

### Task 6: Implement payroll batches and payroll entry drill-down

**Files:**
- Create: `src/payroll/payroll.module.ts`
- Create: `src/payroll/payroll.controller.ts`
- Create: `src/payroll/payroll.service.ts`
- Create: `src/views/payroll/index.hbs`
- Create: `src/views/payroll/show.hbs`
- Create: `src/views/payroll/entry.hbs`
- Test: `test/payroll/payroll.e2e-spec.ts`

**Step 1: Write the failing test**

Create `test/payroll/payroll.e2e-spec.ts` for listing payroll batches, loading a batch detail page, and viewing one payroll entry.

**Step 2: Run test to verify it fails**

Run: `npm test -- --runInBand test/payroll/payroll.e2e-spec.ts`
Expected: FAIL because payroll routes and queries do not exist.

**Step 3: Write minimal implementation**

Add payroll list and detail routes, total summaries, and one payroll-entry drill-down page.

**Step 4: Run test to verify it passes**

Run: `npm test -- --runInBand test/payroll/payroll.e2e-spec.ts`
Expected: PASS for payroll browsing flows.

**Step 5: Commit**

```bash
git add src/payroll src/views/payroll test/payroll/payroll.e2e-spec.ts
git commit -m "feat: add payroll batch views"
```

### Task 7: Implement compliance review workflows

**Files:**
- Create: `src/compliance/compliance.module.ts`
- Create: `src/compliance/compliance.controller.ts`
- Create: `src/compliance/compliance.service.ts`
- Create: `src/views/compliance/index.hbs`
- Create: `src/views/compliance/show.hbs`
- Test: `test/compliance/compliance.e2e-spec.ts`

**Step 1: Write the failing test**

Create `test/compliance/compliance.e2e-spec.ts` covering the compliance queue, review detail page, and role restriction to compliance staff.

**Step 2: Run test to verify it fails**

Run: `npm test -- --runInBand test/compliance/compliance.e2e-spec.ts`
Expected: FAIL because compliance features do not exist.

**Step 3: Write minimal implementation**

Add review list and detail routes, compliance summaries, flag rendering, and sign-off display.

**Step 4: Run test to verify it passes**

Run: `npm test -- --runInBand test/compliance/compliance.e2e-spec.ts`
Expected: PASS with role access enforced.

**Step 5: Commit**

```bash
git add src/compliance src/views/compliance test/compliance/compliance.e2e-spec.ts
git commit -m "feat: add compliance review module"
```

### Task 8: Implement audit and activity views

**Files:**
- Create: `src/audit/audit.module.ts`
- Create: `src/audit/audit.controller.ts`
- Create: `src/audit/audit.service.ts`
- Create: `src/views/audit/index.hbs`
- Test: `test/audit/audit.e2e-spec.ts`

**Step 1: Write the failing test**

Create `test/audit/audit.e2e-spec.ts` to verify audit users can view login, system, and network event tables and that non-audit roles are denied.

**Step 2: Run test to verify it fails**

Run: `npm test -- --runInBand test/audit/audit.e2e-spec.ts`
Expected: FAIL because audit routes do not exist.

**Step 3: Write minimal implementation**

Add the read-only audit timeline page with filtered event sections backed by seeded Prisma records.

**Step 4: Run test to verify it passes**

Run: `npm test -- --runInBand test/audit/audit.e2e-spec.ts`
Expected: PASS for audit access and event rendering.

**Step 5: Commit**

```bash
git add src/audit src/views/audit test/audit/audit.e2e-spec.ts
git commit -m "feat: add audit evidence views"
```

### Task 9: Implement dashboard aggregation and role-aware landing pages

**Files:**
- Create: `src/dashboard/dashboard.module.ts`
- Create: `src/dashboard/dashboard.controller.ts`
- Create: `src/dashboard/dashboard.service.ts`
- Create: `src/views/dashboard/index.hbs`
- Test: `test/dashboard/dashboard.e2e-spec.ts`

**Step 1: Write the failing test**

Create `test/dashboard/dashboard.e2e-spec.ts` asserting each role sees the correct KPIs and shortcuts after login.

**Step 2: Run test to verify it fails**

Run: `npm test -- --runInBand test/dashboard/dashboard.e2e-spec.ts`
Expected: FAIL because dashboard aggregation does not exist.

**Step 3: Write minimal implementation**

Add dashboard summary queries and a role-aware landing page wired into the shared layout.

**Step 4: Run test to verify it passes**

Run: `npm test -- --runInBand test/dashboard/dashboard.e2e-spec.ts`
Expected: PASS for all role dashboards.

**Step 5: Commit**

```bash
git add src/dashboard src/views/dashboard test/dashboard/dashboard.e2e-spec.ts
git commit -m "feat: add role aware dashboard"
```

### Task 10: Refine seed data and scenario realism

**Files:**
- Modify: `prisma/seed.ts`
- Modify: `prisma/schema.prisma`
- Test: `test/prisma/seed-realism.e2e-spec.ts`

**Step 1: Write the failing test**

Create `test/prisma/seed-realism.e2e-spec.ts` that verifies the seed includes multiple batches, multiple departments, compliance flags, and audit evidence tied to Felix's account and workstation.

**Step 2: Run test to verify it fails**

Run: `npm test -- --runInBand test/prisma/seed-realism.e2e-spec.ts`
Expected: FAIL because the richer scenario seed data does not exist yet.

**Step 3: Write minimal implementation**

Expand the seed script to populate realistic employees, payroll entries, compliance reviews, and investigation evidence.

**Step 4: Run test to verify it passes**

Run: `npm test -- --runInBand test/prisma/seed-realism.e2e-spec.ts`
Expected: PASS with all scenario records present.

**Step 5: Commit**

```bash
git add prisma/seed.ts prisma/schema.prisma test/prisma/seed-realism.e2e-spec.ts
git commit -m "feat: enrich seeded company data"
```

### Task 11: Harden route coverage and polish error states

**Files:**
- Modify: `src/auth`
- Modify: `src/views`
- Test: `test/auth/access-control.e2e-spec.ts`
- Test: `test/errors/error-pages.e2e-spec.ts`

**Step 1: Write the failing test**

Create coverage for access denied handling, redirect behavior, empty states, and internal error page rendering.

**Step 2: Run test to verify it fails**

Run: `npm test -- --runInBand test/auth/access-control.e2e-spec.ts test/errors/error-pages.e2e-spec.ts`
Expected: FAIL because the edge-case handling is incomplete.

**Step 3: Write minimal implementation**

Add access denied handling, route guards for all modules, and simple internal-system error and empty-state templates.

**Step 4: Run test to verify it passes**

Run: `npm test -- --runInBand test/auth/access-control.e2e-spec.ts test/errors/error-pages.e2e-spec.ts`
Expected: PASS for access and error cases.

**Step 5: Commit**

```bash
git add src/auth src/views test/auth/access-control.e2e-spec.ts test/errors/error-pages.e2e-spec.ts
git commit -m "fix: tighten access control and error states"
```

### Task 12: Final verification and developer documentation

**Files:**
- Create: `README.md`
- Modify: `package.json`
- Test: `test/app.e2e-spec.ts`

**Step 1: Write the failing test**

Extend the smoke coverage to verify the app boots after applying migrations and seeding.

**Step 2: Run test to verify it fails**

Run: `npm test -- --runInBand test/app.e2e-spec.ts`
Expected: FAIL if setup steps are incomplete or undocumented.

**Step 3: Write minimal implementation**

Add setup scripts, migration commands, seed command wiring, and README instructions for install, migrate, seed, run, and test.

**Step 4: Run test to verify it passes**

Run: `npm test -- --runInBand`
Expected: PASS for the full suite.

**Step 5: Commit**

```bash
git add README.md package.json test/app.e2e-spec.ts
git commit -m "docs: add setup and verification guidance"
```

## Execution Notes

- Keep the implementation within a single NestJS application.
- Prefer Handlebars or EJS for server-rendered templates instead of adding a separate frontend framework.
- Keep authentication demo-safe and lightweight.
- Do not add upload, export, or messaging features unless the approved scope changes.
- Use the seeded database as the primary demo driver rather than manual fixture editing.
