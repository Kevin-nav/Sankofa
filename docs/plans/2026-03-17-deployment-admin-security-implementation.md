# Deployment And Admin Security Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Add GHCR-based deployment assets, Cloudflare Tunnel hosting, and a secure separate admin portal with scoped account-management capabilities.

**Architecture:** Keep a single NestJS backend, add a separate admin frontend and dedicated admin API namespace, and deploy the stack as multiple Docker images behind Cloudflare Tunnel. Administrative capabilities will be layered onto the existing `User` model with scoped permissions and audited reset workflows.

**Tech Stack:** NestJS, Prisma, SQLite, React 19, Vite, Docker Compose, GitHub Actions, Cloudflare Tunnel

---

### Task 1: Extend the auth and admin data model

**Files:**
- Modify: `prisma/schema.prisma`
- Modify: `prisma/seed.ts`
- Modify: `src/auth/auth.service.ts`
- Modify: `src/auth/auth.controller.ts`
- Modify: `src/types/express-session.d.ts`
- Modify: `src/auth/session.types.ts`

**Step 1: Add admin identity fields and audit tables**

Add admin flags, forced reset fields, admin scope enum, admin scope join table, and audit log table.

**Step 2: Seed baseline admin data**

Mark seeded operational users correctly and create bootstrap-compatible admin defaults.

**Step 3: Extend auth flows**

Support user creation flags, admin login, forced password change behavior, and bootstrap super admin creation.

**Step 4: Verify**

Run: `npm run prisma:generate`
Expected: PASS

### Task 2: Build admin backend module

**Files:**
- Create: `src/admin/admin.module.ts`
- Create: `src/admin/admin.controller.ts`
- Create: `src/admin/admin.service.ts`
- Create: `src/admin/admin.guard.ts`
- Create: `src/admin/admin-permission.guard.ts`
- Create: `src/admin/admin.types.ts`
- Modify: `src/app.module.ts`

**Step 1: Add admin login/session endpoint**

Expose admin auth endpoint and verify admin-only access.

**Step 2: Add employee account management endpoints**

Support list users, create users, reset passwords, activate/deactivate, and revoke sessions.

**Step 3: Add admin management endpoints**

Support create admin and update scopes for super admins.

**Step 4: Audit everything**

Persist audit records for all admin actions.

### Task 3: Add separate admin frontend

**Files:**
- Create: `frontend-admin/...`

**Step 1: Scaffold dedicated admin app**

Separate Vite app, auth context, routes, and API client.

**Step 2: Build admin login and dashboard**

Create separate admin login, secure dashboard, audit summary, and account management tables.

**Step 3: Add user-management flows**

Add create user, reset password, activate/deactivate, and admin scope management views.

**Step 4: Verify**

Run: `npm --prefix frontend-admin run build`
Expected: PASS

### Task 4: Add deployment assets

**Files:**
- Create: `.github/workflows/build-and-publish.yml`
- Create: `Dockerfile.admin`
- Modify: `docker-compose.yml`
- Create: `deploy/docker-compose.vps.yml`
- Create: `deploy/cloudflared/config.yml`
- Create: `deploy/.env.production.example`
- Modify: `README.md`

**Step 1: Publish images to GHCR**

Build and push api, employee web, and admin web images on GitHub Actions.

**Step 2: Add VPS compose**

Pin images, environment variables, persistent volumes, and cloudflared service.

**Step 3: Document rollout**

Document how to pull and run on the VPS with Cloudflare Tunnel.

### Task 5: Verify and harden

**Files:**
- Modify as needed from test results

**Step 1: Run backend auth/admin tests**

Run targeted Jest suites.

**Step 2: Run frontend builds**

Run both frontend production builds.

**Step 3: Validate Docker configs**

Run `docker compose config` for local and deploy compose files.

**Step 4: Review**

Confirm the admin surface is isolated, password resets do not reveal stored passwords, and deployment assets reference `sankofa-company.org`.
