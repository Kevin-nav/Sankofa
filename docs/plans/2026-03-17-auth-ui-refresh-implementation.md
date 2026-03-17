# Auth UI Refresh Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Build a beige-brown React auth experience with working login/signup flows and immediate session-based access to the dashboard.

**Architecture:** Extend the NestJS auth API with a real signup endpoint and keep session state as the source of truth. Update the React frontend to use separate login/signup routes, a shared auth layout, and a richer dashboard that reads from the existing session-backed API.

**Tech Stack:** NestJS, Prisma, SQLite, React 19, React Router 7, Axios, Tailwind CSS

---

### Task 1: Add backend signup coverage

**Files:**
- Modify: `test/auth/login.e2e-spec.ts`

**Step 1: Write the failing test**

Add tests for successful signup and duplicate-email rejection using the existing app bootstrap and database fixture setup.

**Step 2: Run test to verify it fails**

Run: `npm test -- --runInBand test/auth/login.e2e-spec.ts`
Expected: FAIL because `/api/auth/signup` does not exist yet.

**Step 3: Write minimal implementation**

Implement the signup endpoint, validation, and session creation in the auth module.

**Step 4: Run test to verify it passes**

Run: `npm test -- --runInBand test/auth/login.e2e-spec.ts`
Expected: PASS

### Task 2: Implement backend signup support

**Files:**
- Modify: `src/auth/auth.controller.ts`
- Modify: `src/auth/auth.service.ts`

**Step 1: Add controller route**

Create `POST /api/auth/signup` and return the authenticated session user plus CSRF token.

**Step 2: Add service logic**

Validate input, normalize email, map role to department, hash password, prevent duplicate emails, and update `lastLogin`.

**Step 3: Keep response shape consistent**

Ensure `login`, `signup`, `logout`, and `me` cooperate with the frontend’s auth context expectations.

**Step 4: Run targeted auth tests**

Run: `npm test -- --runInBand test/auth/login.e2e-spec.ts`
Expected: PASS

### Task 3: Redesign frontend auth and dashboard

**Files:**
- Modify: `frontend/src/App.tsx`
- Modify: `frontend/src/context/AuthContext.tsx`
- Modify: `frontend/src/components/ProtectedRoute.tsx`
- Modify: `frontend/src/pages/Login.tsx`
- Create: `frontend/src/pages/Signup.tsx`
- Modify: `frontend/src/pages/Dashboard.tsx`
- Modify: `frontend/src/index.css`
- Modify: `frontend/src/App.css`

**Step 1: Add routes**

Register separate login and signup routes and keep `/dashboard` protected.

**Step 2: Update auth context**

Support consistent auth state updates after login/signup/logout and preserve CSRF token handling.

**Step 3: Build shared auth visual language**

Introduce beige-brown tokens, layout styling, card treatments, and responsive auth page structure.

**Step 4: Upgrade dashboard**

Show identity details prominently and improve the metrics and alerts presentation.

**Step 5: Run frontend build**

Run: `npm --prefix frontend run build`
Expected: PASS

### Task 4: Verify end-to-end behavior

**Files:**
- No new files expected unless fixes are needed from verification

**Step 1: Run backend auth tests**

Run: `npm test -- --runInBand test/auth/login.e2e-spec.ts`
Expected: PASS

**Step 2: Run broader e2e suite if feasible**

Run: `npm test -- --runInBand`
Expected: PASS

**Step 3: Run frontend production build**

Run: `npm --prefix frontend run build`
Expected: PASS

**Step 4: Review**

Confirm signup logs users in immediately, dashboard shows their details, and auth routes use the new visual system consistently.
