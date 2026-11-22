# Authentication database schema

`auth_schema.sql` is a PostgreSQL 14+ script that backs the login/authentication
model documented in the root [README.md](../README.md#authentication-and-authorization-architecture)
and currently simulated in-memory by [`AppContextProvider`](../src/context/AppContextProvider.tsx).

## Applying the script

```sh
psql "$DATABASE_URL" -f db/auth_schema.sql
```

The script is idempotent (guarded `CREATE ... IF NOT EXISTS` / `DO` blocks) and
wrapped in a single transaction, so it can be re-run safely, including as a
baseline migration.

## What it creates

| Concern | Tables / objects |
| --- | --- |
| Core identity | `users`, `user_attributes` (ABAC: tenant, region, department, clearance level) |
| RBAC | `auth_role` enum, `user_roles` |
| Scopes | `scopes`, `role_scopes`, `user_scopes`, `get_effective_scopes()` |
| Sessions | `refresh_tokens` (hashed, httpOnly-cookie backed); access tokens are short-lived JWTs and are **not** persisted |
| Sign-up MFA | `pending_sign_ups` holds submitted sign-up details until the emailed code is verified; `fn_complete_sign_up()` promotes a verified row into `users` |
| Sign-in MFA | `mfa_challenges` (shared table, `purpose` discriminates `sign_in` vs `sign_up`) |
| Password reset | `password_reset_tokens` |
| Audit | `auth_audit_log` |
| Convenience | `user_session_profile` view (roles + effective scopes per user), `cleanup_expired_auth_artifacts()` for scheduled housekeeping |

Seed data pre-populates the `dashboard:read`, `inventory:read`,
`inventory:write`, and `financial:read` scopes with the same role mappings
enforced client-side in `src/routes/AppRoutes.tsx` and
`src/features/dashboard/pages/DashboardPage.tsx`. Extend `scopes`/`role_scopes`
as new feature modules add their own `AccessPolicy` checks.

## Notes for the application layer

- Store only password **hashes** (bcrypt/argon2) in `users.password_hash` and
  `pending_sign_ups.password_hash` — never plaintext.
- Store only a hash (e.g. SHA-256) of refresh tokens and MFA codes, never the
  raw value, mirroring `token_hash` / `code_hash` columns.
- One active MFA challenge is enforced per subject via partial unique indexes,
  matching the single `mfaChallenge` / `signUpMfaChallenge` state kept
  client-side today.
- Run `SELECT cleanup_expired_auth_artifacts();` on a schedule (e.g. `pg_cron`)
  to purge expired pending sign-ups, MFA challenges, refresh tokens, and
  password reset tokens.
