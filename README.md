# Sankofa Payroll Platform

Internal payroll, compliance, and audit platform for the Sankofa scenario. The application is built with NestJS, Prisma, and SQLite and models company workflows with seeded records for immediate use.

## Stack

- NestJS
- Prisma
- SQLite
- Handlebars server-rendered views
- Jest and Supertest for end-to-end coverage
- Docker for portable deployment

## What The App Includes

- role-based login for Payroll Admin, Compliance Officer, and Audit Analyst
- employee directory with payroll-linked records
- quarterly payroll batches and per-employee payroll entries
- compliance review queue with flagged issues
- audit dashboard for login anomalies, host events, and network events
- seeded fictional data that supports the demo immediately

## Quick Start

1. Install dependencies

```bash
npm install
```

2. Create a local `.env` with:

```env
NODE_ENV="development"
PORT="3000"
DATABASE_URL="file:./prisma/dev.db"
SESSION_SECRET="replace-with-a-long-random-secret"
SESSION_DB_PATH="./prisma/sessions.db"
SESSION_COOKIE_MAX_AGE_MS="3600000"
SESSION_COOKIE_SECURE="false"
TRUST_PROXY="false"
ENABLE_CSRF="true"
LOGIN_RATE_LIMIT_WINDOW_MS="60000"
LOGIN_RATE_LIMIT_MAX="20"
```

3. Prepare the database and seed the demo records

```bash
npm run db:setup
```

4. Start the app

```bash
npm run start:dev
```

The default Nest development server runs at `http://localhost:3000`.

## Docker Deployment

Build and run with Docker Compose:

```bash
docker compose up --build
```

The container runs Linux images, which can be hosted by Docker on Linux or Windows. The SQLite database and session files are persisted in the named volume mounted at `/data` in the container.

Important production note: update `SESSION_SECRET` in `docker-compose.yml` (or inject it via your deployment platform) before deployment.

## Admin Portal

The secure admin portal is now intended to run on a separate hostname:

- `app.sankofa-company.org` for employees
- `admin.sankofa-company.org` for IT/admin operations

Key controls:

- admin passwords are hashed and never viewable
- admins can issue temporary passwords and force password rotation
- admin accounts use scoped permissions
- admin actions are written to audit logs

Seeded bootstrap admin for local verification:

- `it.admin@sankofa.local` / `demo-password`

## GitHub Actions And GHCR

The repository now includes a workflow at `.github/workflows/build-and-publish.yml` that:

- runs targeted backend tests
- builds the employee frontend
- builds the admin frontend
- publishes three images to GHCR:
  - `ghcr.io/<owner>/sankofa-api`
  - `ghcr.io/<owner>/sankofa-employee-web`
  - `ghcr.io/<owner>/sankofa-admin-web`

## VPS Deployment

Deployment assets live under `deploy/`:

- `deploy/docker-compose.vps.yml`
- `deploy/.env.production.example`
- `deploy/cloudflared/config.example.yml`

Typical VPS flow:

1. Copy `deploy/.env.production.example` to `deploy/.env.production` and fill in real secrets.
2. Log in to GHCR on the VPS.
3. Pull and start the stack:

```bash
docker compose --env-file deploy/.env.production -f deploy/docker-compose.vps.yml pull
docker compose --env-file deploy/.env.production -f deploy/docker-compose.vps.yml up -d
```

For the first deployment, leave `SEED_ON_BOOT=true` so the container seeds the initial demo data and bootstrap admin. After the first successful start, change it to `SEED_ON_BOOT=false` and redeploy so future restarts do not attempt reseeding.

4. Configure Cloudflare Tunnel to route:

- `app.sankofa-company.org` -> employee frontend
- `admin.sankofa-company.org` -> admin frontend

Recommended production note: keep the application origin private behind Cloudflare Tunnel and do not expose public inbound ports for the app containers.

## Demo Accounts

- `anita@sankofa.local` / `demo-password`
- `felix@sankofa.local` / `demo-password`
- `akosua.audit@sankofa.local` / `demo-password`

Passwords are now stored as hashes in the seeded database.

## Useful Scripts

- `npm run start:dev` - run the app in watch mode
- `npm run build` - build the Nest app
- `npm run start:prod` - run built output from `dist`
- `npm run prisma:generate` - regenerate the Prisma client
- `npm run prisma:push` - apply the schema to the SQLite database
- `npm run db:seed` - reseed the demo data
- `npm run db:setup` - generate client, push schema, and seed the database
- `npm test -- --runInBand` - run the full end-to-end suite

## Project Structure

- `src/auth` - login, sessions, and role guards
- `src/dashboard` - role-aware live dashboard metrics
- `src/employees` - employee directory and detail pages
- `src/payroll` - payroll batch and entry views
- `src/compliance` - compliance review queue and detail pages
- `src/audit` - investigation evidence views
- `src/views` - Handlebars templates
- `src/config` - validated environment configuration
- `src/health` - health and readiness endpoints
- `prisma/schema.prisma` - database schema
- `prisma/seed.ts` - fictional company and evidence seed data

## Verification

Current automated coverage verifies:

- login and protected route behavior
- employee directory and detail flows
- payroll batch and entry flows
- compliance queue access rules
- audit evidence access rules
- dashboard metrics derived from seeded records
- access denied and error page rendering
- seed realism for the scenario data
- environment validation behavior
- health and readiness endpoints
