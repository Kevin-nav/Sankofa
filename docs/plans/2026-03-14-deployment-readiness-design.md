# Deployment Readiness Design (SQLite)

## Goal

Harden the current NestJS + Prisma + Handlebars application from demo-grade to deployable in Docker, while keeping SQLite as the primary database for this use case.

## Scope

- Keep current app architecture and user-facing behavior intact.
- Improve security, runtime configuration, operational reliability, and delivery workflows.
- Preserve SQLite in all environments unless explicitly changed later.

## Non-Goals

- Migrating to Postgres or another RDBMS.
- Full domain-driven rewrite.
- Replacing server-rendered Handlebars with a SPA.

## Current Deployment Blockers

1. Plaintext password verification.
2. Hardcoded session secret and default in-memory session store.
3. Missing validated environment contract.
4. Test-only route present in runtime module graph.
5. No health/readiness endpoints.
6. Missing baseline hardening middleware and request protections.
7. Docker/deployment workflow not standardized for repeatable Linux-container builds.

## Proposed Architecture Changes

### 1) Configuration and Boot Hardening

- Add centralized config module with startup validation.
- Require and validate: `NODE_ENV`, `PORT`, `DATABASE_URL`, `SESSION_SECRET`.
- Optional with safe defaults: cookie max age, secure-cookie flags, trust proxy.
- Fail fast at startup when required config is missing or invalid.

### 2) Authentication and Session Security

- Replace plaintext password checks with `argon2` hash verification.
- Update seed data to store password hashes, not raw demo strings.
- Use persistent session storage via SQLite-backed store to avoid memory-store limitations.
- Harden cookie and proxy-related session settings for containerized deployments.

### 3) Runtime Safety and Surface Area

- Remove/gate test-only system routes from non-test execution paths.
- Add `/health` and `/ready` endpoints for orchestration and diagnostics.
- Add baseline middleware:
  - `helmet` for security headers.
  - `express-rate-limit` for login path protection.
  - CSRF strategy for form-post routes (token middleware + hidden form tokens).

### 4) SQLite Operations Model

- Keep SQLite file path configurable through `DATABASE_URL`.
- Ensure Docker image and compose mount persistent volume for SQLite DB file.
- Document single-writer expectations and operational limits for concurrent scale.

### 5) Docker and Delivery Standardization

- Add multi-stage Dockerfile for deterministic Linux-container builds.
- Add `.dockerignore`.
- Add `docker-compose.yml` for local/prod-like execution using mounted SQLite volume.
- Ensure startup command runs Prisma client generation and schema deployment step appropriate for SQLite (`prisma db push`), with explicit documentation of tradeoffs.

### 6) Codebase Hygiene

- Move ad hoc root patch scripts into a tooling directory or remove if obsolete.
- Keep generated artifacts out of source control.
- Update README to split local demo instructions from deployed-Docker instructions.

## Testing Strategy

- Keep existing e2e tests.
- Add focused unit tests for:
  - password hashing/verification behavior.
  - config validation failures.
  - health/readiness behavior.
- Extend e2e coverage for:
  - secure login flow with hashed credentials.
  - session persistence behavior across app restarts (where feasible in test harness).
  - rejection behavior for missing/invalid env config.

## Rollout Plan

1. Introduce config module and startup validation.
2. Migrate auth + seed to hashed passwords.
3. Replace memory sessions and harden cookies/proxy settings.
4. Add middleware protections and health endpoints.
5. Add Docker/build/deploy assets.
6. Update docs and remove prototype artifacts.
7. Run full test/build verification.

## Risks and Mitigations

- SQLite concurrency/locking limits under heavier load.
  - Mitigation: document workload assumptions and scale expectations.
- CSRF retrofit can break existing forms if tokens are not wired everywhere.
  - Mitigation: phase rollout and add integration tests per form path.
- Session store migration can affect login stability.
  - Mitigation: test login/logout/session expiration in e2e and manual smoke checks.
