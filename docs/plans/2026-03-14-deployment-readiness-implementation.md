# Deployment Readiness (SQLite) Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Harden the current NestJS application for Docker deployment with SQLite, including secure auth, validated config, safer sessions, runtime health checks, and baseline security middleware.

**Architecture:** Keep the existing feature-module structure and SSR flow, but add a centralized config boundary and security middleware in app bootstrap. Retain SQLite as the persistence layer while making runtime behavior deterministic and safer in containerized environments.

**Tech Stack:** NestJS 11, Prisma 6, SQLite, Handlebars, express-session, argon2, helmet, express-rate-limit, csurf.

---

### Task 1: Add Config Module With Validation

**Files:**
- Create: `src/config/env.validation.ts`
- Create: `src/config/app-config.module.ts`
- Modify: `src/app.module.ts`
- Test: `test/config/env-validation.e2e-spec.ts`

**Step 1: Write the failing test**

Add an e2e test that boots the app with missing `SESSION_SECRET` and expects startup failure.

**Step 2: Run test to verify it fails**

Run: `npm test -- --runInBand test/config/env-validation.e2e-spec.ts`  
Expected: FAIL because no validation currently exists.

**Step 3: Write minimal implementation**

- Add env schema validation for required runtime vars.
- Register config module globally in app module.

**Step 4: Run test to verify it passes**

Run: `npm test -- --runInBand test/config/env-validation.e2e-spec.ts`  
Expected: PASS with clear validation failure behavior.

**Step 5: Commit**

```bash
git add src/config/env.validation.ts src/config/app-config.module.ts src/app.module.ts test/config/env-validation.e2e-spec.ts
git commit -m "feat: add validated runtime config module"
```

### Task 2: Migrate Auth to Password Hashing

**Files:**
- Modify: `src/auth/auth.service.ts`
- Modify: `prisma/seed.ts`
- Test: `test/auth/login.e2e-spec.ts`
- Test: `test/prisma/seed-realism.e2e-spec.ts`

**Step 1: Write the failing test**

Add auth tests that verify plaintext password hash mismatch and valid hash verification flow.

**Step 2: Run test to verify it fails**

Run: `npm test -- --runInBand test/auth/login.e2e-spec.ts test/prisma/seed-realism.e2e-spec.ts`  
Expected: FAIL due to current plaintext comparison.

**Step 3: Write minimal implementation**

- Add `argon2` verification in auth service.
- Update seed script to write hashed passwords for demo users.

**Step 4: Run test to verify it passes**

Run: `npm test -- --runInBand test/auth/login.e2e-spec.ts test/prisma/seed-realism.e2e-spec.ts`  
Expected: PASS with hashed credential checks.

**Step 5: Commit**

```bash
git add src/auth/auth.service.ts prisma/seed.ts test/auth/login.e2e-spec.ts test/prisma/seed-realism.e2e-spec.ts
git commit -m "feat: switch auth to argon2 password hashes"
```

### Task 3: Replace In-Memory Session Store and Harden Cookies

**Files:**
- Modify: `src/app.setup.ts`
- Modify: `.env.example`
- Test: `test/auth/access-control.e2e-spec.ts`

**Step 1: Write the failing test**

Add test coverage asserting secure/default cookie policy and startup behavior requiring session secret.

**Step 2: Run test to verify it fails**

Run: `npm test -- --runInBand test/auth/access-control.e2e-spec.ts`  
Expected: FAIL due to current insecure defaults.

**Step 3: Write minimal implementation**

- Use SQLite-backed session store (Prisma-compatible or connect-sqlite3).
- Configure cookie `httpOnly`, `sameSite`, configurable `secure`.
- Configure trust-proxy behavior via env.

**Step 4: Run test to verify it passes**

Run: `npm test -- --runInBand test/auth/access-control.e2e-spec.ts`  
Expected: PASS.

**Step 5: Commit**

```bash
git add src/app.setup.ts .env.example test/auth/access-control.e2e-spec.ts
git commit -m "feat: harden session storage and cookie policy"
```

### Task 4: Add Baseline Security Middleware and CSRF

**Files:**
- Modify: `src/app.setup.ts`
- Modify: `src/auth/auth.controller.ts`
- Modify: `src/views/login.hbs`
- Test: `test/auth/login.e2e-spec.ts`

**Step 1: Write the failing test**

Add a login POST test requiring a CSRF token and verify rejected requests without token.

**Step 2: Run test to verify it fails**

Run: `npm test -- --runInBand test/auth/login.e2e-spec.ts`  
Expected: FAIL until CSRF is wired.

**Step 3: Write minimal implementation**

- Add `helmet` globally.
- Add login route rate limiting.
- Add CSRF middleware and include token in rendered login form.

**Step 4: Run test to verify it passes**

Run: `npm test -- --runInBand test/auth/login.e2e-spec.ts`  
Expected: PASS with CSRF-safe flow.

**Step 5: Commit**

```bash
git add src/app.setup.ts src/auth/auth.controller.ts src/views/login.hbs test/auth/login.e2e-spec.ts
git commit -m "feat: add security middleware and csrf protection"
```

### Task 5: Add Health and Readiness Endpoints

**Files:**
- Create: `src/health/health.controller.ts`
- Create: `src/health/health.module.ts`
- Modify: `src/app.module.ts`
- Test: `test/system/health.e2e-spec.ts`

**Step 1: Write the failing test**

Create tests for `/health` and `/ready` with expected status payloads.

**Step 2: Run test to verify it fails**

Run: `npm test -- --runInBand test/system/health.e2e-spec.ts`  
Expected: FAIL because routes do not exist.

**Step 3: Write minimal implementation**

- Add controller endpoints and lightweight readiness check using Prisma connectivity.
- Register module in `AppModule`.

**Step 4: Run test to verify it passes**

Run: `npm test -- --runInBand test/system/health.e2e-spec.ts`  
Expected: PASS.

**Step 5: Commit**

```bash
git add src/health/health.controller.ts src/health/health.module.ts src/app.module.ts test/system/health.e2e-spec.ts
git commit -m "feat: add health and readiness endpoints"
```

### Task 6: Remove or Gate Test-Only Routes

**Files:**
- Modify: `src/system/system.module.ts`
- Modify: `src/system/system.controller.ts`
- Test: `test/errors/error-pages.e2e-spec.ts`

**Step 1: Write the failing test**

Add a test verifying test-only route is unreachable in non-test runtime.

**Step 2: Run test to verify it fails**

Run: `npm test -- --runInBand test/errors/error-pages.e2e-spec.ts`  
Expected: FAIL until module/route gating is tightened.

**Step 3: Write minimal implementation**

- Register system-test endpoints only when `NODE_ENV === 'test'`.

**Step 4: Run test to verify it passes**

Run: `npm test -- --runInBand test/errors/error-pages.e2e-spec.ts`  
Expected: PASS.

**Step 5: Commit**

```bash
git add src/system/system.module.ts src/system/system.controller.ts test/errors/error-pages.e2e-spec.ts
git commit -m "chore: gate test-only system routes"
```

### Task 7: Dockerize for Cross-Host Deployment

**Files:**
- Create: `Dockerfile`
- Create: `.dockerignore`
- Create: `docker-compose.yml`
- Modify: `README.md`

**Step 1: Write the failing test**

Create a lightweight build verification test script or CI check to ensure image builds and app starts.

**Step 2: Run test to verify it fails**

Run: `docker build -t sakofa:local .`  
Expected: FAIL if no Docker assets exist.

**Step 3: Write minimal implementation**

- Add multi-stage Dockerfile.
- Configure mounted volume for SQLite database path.
- Add compose service for app with persisted sqlite file.

**Step 4: Run test to verify it passes**

Run: `docker build -t sakofa:local .`  
Expected: PASS.

**Step 5: Commit**

```bash
git add Dockerfile .dockerignore docker-compose.yml README.md
git commit -m "feat: add docker deployment assets for sqlite runtime"
```

### Task 8: Clean Up Prototype Artifacts and Final Verification

**Files:**
- Modify: `.gitignore`
- Move/Delete: `css-update.js`, `css-update-body.js`, `fix-header.js`, `fix-login.js`, `css-plan.txt`
- Test: full test suite

**Step 1: Write the failing test**

Add repo hygiene check in CI (or script) that rejects committed build artifacts and ad hoc root scripts.

**Step 2: Run test to verify it fails**

Run: `npm test -- --runInBand` and hygiene script  
Expected: FAIL until artifacts are handled.

**Step 3: Write minimal implementation**

- Remove or relocate obsolete root scripts.
- Ensure `dist/` and runtime DB artifacts are ignored appropriately.

**Step 4: Run test to verify it passes**

Run: `npm test -- --runInBand && npm run build`  
Expected: PASS.

**Step 5: Commit**

```bash
git add .gitignore
git rm css-update.js css-update-body.js fix-header.js fix-login.js css-plan.txt
git commit -m "chore: remove prototype artifacts and finalize deployment baseline"
```
