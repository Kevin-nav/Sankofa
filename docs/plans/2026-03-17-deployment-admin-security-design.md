# Deployment And Admin Security Design

**Date:** 2026-03-17

## Summary

Prepare Sankofa for VPS deployment using GitHub Actions, GitHub Container Registry, Docker Compose, and Cloudflare Tunnel. Add a separate admin surface on `admin.sankofa-company.org` with app-managed credentials, scoped administrative permissions, password reset workflows, and audit logging.

## Goals

- Build and publish Docker images automatically from GitHub.
- Support pull-based deployment on a VPS without exposing origin ports publicly.
- Serve employee and admin experiences on separate subdomains.
- Introduce a secure internal admin portal for employee account management.
- Prevent password disclosure by supporting reset-only account recovery flows.

## Deployment Architecture

- `app.sankofa-company.org` serves the employee-facing React application.
- `admin.sankofa-company.org` serves the separate admin React application.
- Both frontends communicate with the same NestJS backend, but admin traffic is routed to dedicated admin API endpoints.
- GitHub Actions publishes versioned images to GHCR.
- The VPS pulls the tagged images and runs them with Docker Compose.
- `cloudflared` publishes the app through an outbound-only tunnel.

## Container Topology

- `api`: NestJS backend with Prisma migrations/bootstrap logic and runtime secrets.
- `employee-web`: employee-facing Vite build served by Nginx.
- `admin-web`: separate admin-facing Vite build served by Nginx.
- `cloudflared`: Cloudflare Tunnel connector container.

## Security Model

### Admin Authentication

- App-managed credentials only.
- Passwords are hashed and never recoverable.
- Admin accounts are created by existing admins or bootstrapped from environment.
- A bootstrap `SUPER_ADMIN` is created on first startup when configured.

### Admin Authorization

- Role- and scope-based permissions.
- Recommended scopes:
  - `USER_ADMIN`
  - `SECURITY_ADMIN`
  - `AUDIT_ADMIN`
  - `ADMIN_ADMIN`
- `SUPER_ADMIN` retains full control.
- Non-super-admin accounts cannot create or promote super admins.

### Password Management

- Admins can reset employee passwords.
- Reset action issues a temporary password and marks the target user for forced rotation on next login.
- Existing passwords are never viewable.
- Reset operations are fully audited.

### Session And Endpoint Controls

- Shorter session lifetime for admin sessions than standard user sessions.
- Session rotation on admin login.
- CSRF protection on all state-changing endpoints.
- Strict rate limiting for admin auth and password reset routes.
- Admin-only route guards and permission guards on all admin APIs.

### Audit Logging

- All admin actions are persisted with actor, target, action, timestamp, source IP, and user agent.
- Minimum audited actions:
  - admin login success/failure
  - employee account creation
  - employee password reset
  - user activation/deactivation
  - admin creation
  - scope changes

## Data Model

Add:

- `isAdmin`
- `isSuperAdmin`
- `mustChangePassword`
- `passwordResetAt`
- `lastPasswordChangeAt`
- `adminScopes`
- `adminAuditLogs`

The existing `User` table remains the core identity table. Administrative capabilities are layered on top rather than introducing a disconnected admin identity store.

## Admin Portal

- Separate frontend application under `frontend-admin/`
- Dedicated login page for admins
- Dashboard with security posture and recent admin actions
- Employee account management
- Admin account management for super admins
- Warm beige-brown design language aligned with the main app but visually stricter

## Cloudflare Tunnel

- Tunnel publishes two hostnames:
  - `app.sankofa-company.org`
  - `admin.sankofa-company.org`
- No public inbound ports required for the application.
- Admin hostname can be independently restricted at the Cloudflare layer.

## Risks And Recommendations

- SQLite is acceptable for early deployment but should be revisited as admin operations and audit volume grow.
- App-managed admin auth requires stronger in-app security controls than an SSO-based model.
- MFA remains highly recommended for admin accounts even without external identity providers and should follow after the initial portal foundation.

## Validation

- Backend tests for bootstrap super admin creation, admin login, permission checks, and password reset.
- Frontend builds for both employee and admin applications.
- Docker Compose validation for production and Cloudflare tunnel stacks.
- GitHub workflow validation through dry-run build logic where feasible.
