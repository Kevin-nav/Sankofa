# Employee Reset Flow Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Add employee ID issuance to signup and implement a new employee-facing password reset flow verified by employee ID, name, and email.

**Architecture:** Extend the NestJS auth module so employee auth accounts store an employee ID and expose a reset-password endpoint. Update the React employee frontend to add a dedicated reset route, wire it to the new API, and keep the existing login and signup experience aligned with the new identifier-based flow.

**Tech Stack:** NestJS, Prisma, SQLite, React, React Router, Axios, Jest, Supertest

---

### Task 1: Add backend tests for employee ID issuance and reset flow

**Files:**
- Modify: `test/auth/login.e2e-spec.ts`

**Step 1: Write the failing test**

Add coverage that:
- signs up a new employee and expects an `employeeCode` in the response body
- posts to `/api/auth/reset-password` with matching `employeeCode`, `name`, and `email`
- logs in with the new password and expects success
- rejects reset when `employeeCode` does not match

**Step 2: Run test to verify it fails**

Run: `npm test -- --runInBand test/auth/login.e2e-spec.ts`
Expected: FAIL because the auth payload and reset endpoint do not exist yet.

**Step 3: Write minimal implementation**

Implement the Prisma schema, auth service logic, controller route, and seed/backfill changes required for employee ID issuance and password reset.

**Step 4: Run test to verify it passes**

Run: `npm test -- --runInBand test/auth/login.e2e-spec.ts`
Expected: PASS

**Step 5: Commit**

```bash
git add prisma/schema.prisma prisma/seed.ts src/auth/auth.controller.ts src/auth/auth.service.ts test/auth/login.e2e-spec.ts
git commit -m "feat: add employee password reset backend"
```

### Task 2: Add the employee reset page and update auth screens

**Files:**
- Modify: `frontend/src/App.tsx`
- Modify: `frontend/src/pages/Login.tsx`
- Modify: `frontend/src/pages/Signup.tsx`
- Create: `frontend/src/pages/ResetPassword.tsx`
- Modify: `frontend/src/App.css`

**Step 1: Write the failing behavior**

Add the new route and UI wiring so manual verification would currently fail because the backend route and frontend form do not yet align fully.

**Step 2: Run focused verification**

Run: `npm test -- --runInBand test/auth/login.e2e-spec.ts`
Expected: PASS after Task 1 while frontend changes remain unverified manually.

**Step 3: Write minimal implementation**

Add the reset page with employee verification inputs, password visibility toggles, inline validation, success state, and login redirect path. Update login with a reset link and signup with visibility toggles plus employee ID success messaging.

**Step 4: Run app-specific verification**

Run: `npm test -- --runInBand test/auth/login.e2e-spec.ts`
Expected: PASS for backend auth coverage, plus manual browser smoke checks for the new employee routes.

**Step 5: Commit**

```bash
git add frontend/src/App.tsx frontend/src/pages/Login.tsx frontend/src/pages/Signup.tsx frontend/src/pages/ResetPassword.tsx frontend/src/App.css
git commit -m "feat: add employee reset password page"
```

### Task 3: Final verification and cleanup

**Files:**
- Modify: `README.md`

**Step 1: Update docs**

Document the new employee reset route and note that signup now issues an employee ID used for resets.

**Step 2: Run final verification**

Run: `npm test -- --runInBand test/auth/login.e2e-spec.ts test/admin/admin.e2e-spec.ts`
Expected: PASS

**Step 3: Commit**

```bash
git add README.md
git commit -m "docs: describe employee reset flow"
```
