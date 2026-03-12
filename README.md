# Sankofa Payroll Platform

Internal payroll, compliance, and audit demo platform for the Sankofa classroom scenario. The application is a safe simulation built with NestJS, Prisma, and SQLite. It models company workflows and seeded investigation evidence without implementing offensive behavior.

## Stack

- NestJS
- Prisma
- SQLite
- Handlebars server-rendered views
- Jest and Supertest for end-to-end coverage

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
DATABASE_URL="file:./dev.db"
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

## Demo Accounts

- `anita@sankofa.local` / `demo-password`
- `felix@sankofa.local` / `demo-password`
- `akosua.audit@sankofa.local` / `demo-password`

## Useful Scripts

- `npm run start:dev` - run the app in watch mode
- `npm run build` - build the Nest app
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
