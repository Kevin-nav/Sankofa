# Auth UI Refresh Design

**Date:** 2026-03-17

## Summary

Refresh the React frontend with a cohesive beige-brown visual system and make authentication fully functional with separate login and signup pages. Signup will allow users to select a role, create a real backend account, establish a session immediately, and redirect to the dashboard where their profile details are visible.

## Goals

- Replace the minimal frontend styling with a more intentional editorial interface.
- Keep auth flows explicit with dedicated `/login` and `/signup` routes.
- Add real backend signup support instead of mock frontend-only account creation.
- Preserve session-based auth and CSRF protection already used by the Nest backend.
- Show the signed-in user’s identity details clearly on the dashboard.

## Architecture

The backend remains a NestJS API with Prisma and SQLite. The auth controller will expose a new signup endpoint that validates input, hashes passwords, creates users, and writes the session so a newly created account is authenticated immediately.

The React frontend remains the presentation layer. `AuthContext` continues to bootstrap state from `/api/auth/me`, while dedicated login and signup pages call their respective endpoints and update shared auth state. Protected routing remains session-driven.

## UI Direction

The visual direction is warm, editorial, and operational rather than generic admin SaaS. The palette centers on parchment, sand, camel, walnut, and espresso tones, with terracotta reserved for destructive or urgent states. Layouts should feel layered and tactile with soft gradients, rounded cards, subtle shadows, and restrained texture.

## Components

### Login Page

- Two-column layout on large screens and stacked layout on mobile.
- Left-side brand/story panel with operational context and trust cues.
- Right-side sign-in card with validation messaging and link to signup.

### Signup Page

- Shared visual system with the login page.
- Form fields for full name, email, password, confirm password, and role selection.
- Immediate session creation on success and redirect to dashboard.

### Dashboard

- Header with app identity, user name, email, role, and logout.
- Profile summary card that emphasizes the current signed-in user.
- Refined metrics grid and alerts panel with clearer hierarchy.

## Data Flow

1. App boot calls `/api/auth/me`.
2. Login posts credentials plus CSRF token to `/api/auth/login`.
3. Signup posts profile fields plus CSRF token to `/api/auth/signup`.
4. Backend responds with session user and current CSRF token.
5. `AuthContext` stores the user/token pair and protected routes render the dashboard.

## Validation And Error Handling

- Normalize email to lowercase and trim name/email input.
- Require non-empty name, valid email, matching passwords, and minimum password length.
- Reject duplicate emails with a clear, safe message.
- Return refreshed CSRF tokens in auth responses so the frontend does not hold stale state.
- Surface API validation failures inline on auth forms.

## Testing

- Add backend e2e coverage for signup success and duplicate-email rejection.
- Build the React frontend to catch route/type/styling regressions.
- Run the backend e2e suite or at minimum targeted auth tests after changes.
