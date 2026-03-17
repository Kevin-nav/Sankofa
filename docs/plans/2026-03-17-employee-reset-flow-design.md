# Employee Reset Flow Design

## Goal

Add a dedicated employee-facing password reset page that verifies an existing employee with employee ID, full name, and email before allowing a password change. Keep the reset flow separate from the admin portal and keep signup available as its own route while ensuring employee accounts are issued an employee ID at creation time.

## Product Scope

### New Employee Reset Page

- Add a public employee-facing route at `/reset-password`.
- Collect `employee ID`, `full name`, `email`, `new password`, and `confirm password`.
- Validate password length on the client and require password confirmation to match.
- Provide show/hide toggles on both password fields.
- Link to this page from the employee login screen.

### Signup Changes

- Keep signup as a separate public route.
- Issue every non-admin user an employee ID during signup.
- Return that employee ID in the signup response so the frontend can show the user the identifier they should retain for future reset verification.

## Architecture

The existing NestJS auth module remains the source of truth for employee authentication. Password reset logic will live alongside login and signup in the auth controller and service. The React employee frontend will add a dedicated reset page and small shared form helpers for password visibility if they reduce duplication cleanly.

The `Employee` payroll record model already has an `employeeCode`, but it is not currently connected to the auth `User` model. To avoid coupling account creation to the much heavier payroll record shape, the auth account itself will gain an `employeeCode` field for employee users. Existing seeded users will be backfilled with generated IDs.

## Data Model

- Add `employeeCode String? @unique` to `User`.
- Require employee IDs for non-admin users and allow admins to keep the field null.
- Generate new employee IDs during signup in a stable Sankofa-style format derived from the current highest code.
- Backfill seeded employee users during bootstrap/seed paths so reset works immediately in the demo data.

## Backend Flow

### Signup

1. Validate name, email, password, and selected role.
2. Generate a unique employee ID for non-admin users.
3. Create the user with hashed password and stored employee ID.
4. Log the user in immediately and return the session user, CSRF token, and employee ID.

### Reset Password

1. Accept `employeeCode`, `name`, `email`, and `password`.
2. Normalize and verify an active non-admin user by exact match on employee ID, name, and email.
3. Reject requests when no employee match exists.
4. Validate password length and store the new password hash.
5. Update password timestamps and clear `mustChangePassword` so a self-service reset completes the requirement.
6. Return success plus a refreshed CSRF token.

## Frontend Experience

### Login

- Add a prominent `Forgot password?` link to the new reset page.
- Keep the current employee login structure and overall visual language.

### Signup

- Keep the existing signup route.
- Show the issued employee ID after successful account creation so the user knows this is their private reset identifier.
- Add password visibility toggles to match the reset experience.

### Reset Password

- Reuse the current auth shell layout so the page remains visually consistent.
- Use a clear employee-verification framing rather than an email-token metaphor.
- Show inline validation errors and success feedback.
- After success, redirect users to login or offer a clear route back there.

## Error Handling

- Invalid identity match returns a generic employee-verification failure message.
- Password length violations return the existing minimum-length message.
- Password mismatch is handled client-side before submission.
- Suspended users and admin accounts are rejected from the employee reset endpoint.
- CSRF failures continue to use the existing app-wide middleware behavior.

## Testing

- Extend backend auth e2e coverage for employee ID issuance at signup.
- Add backend auth e2e coverage for successful reset, invalid employee verification, and short-password rejection.
- Verify login still works with the new password after reset.
- Verify the employee frontend routes render reset and login links correctly.

## Out Of Scope

- Admin self-service password reset pages.
- Email-based reset links or reset tokens.
- Full linkage between auth users and the payroll `Employee` table.
- Stronger identity verification beyond employee ID, name, and email.
