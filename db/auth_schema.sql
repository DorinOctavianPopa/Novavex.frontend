-- =============================================================================
-- Novavex ERP — Login & Authentication System (PostgreSQL)
-- =============================================================================
-- Backs the authentication/authorization model described in README.md and
-- implemented (in simulated form) in:
--   src/types/auth.ts, src/types/app.ts, src/config/appConfig.ts,
--   src/context/AppContextProvider.tsx, src/services/authorization.ts
--
-- Model summary:
--   - Authentication: email + password, hybrid OIDC/OAuth2-style tokens.
--       * Short-lived access tokens (JWT, ~15 min) are issued by the app
--         server and are NOT persisted here (stateless, verified by signature).
--       * Refresh tokens are long-lived, stored as httpOnly cookies client-side;
--         only a hash of each refresh token is persisted (refresh_tokens).
--   - Multi-factor authentication (MFA): a 6-digit email code is required
--     both to finish signing in (purpose = 'sign_in') and to finish creating
--     an account (purpose = 'sign_up'), matching the two-step flows in
--     AppContextProvider.tsx (signIn -> verifyMfaCode, signUp -> verifySignUpMfaCode).
--   - Authorization: combined RBAC (auth_role) + ABAC (tenant/region/department/
--     clearance level), matching AccessPolicy in src/types/auth.ts.
--
-- Target: PostgreSQL 14+. Run against a dedicated database/schema.
-- Idempotent: safe to re-run (guards via IF NOT EXISTS / DO blocks).
-- =============================================================================

BEGIN;

-- -----------------------------------------------------------------------------
-- 0. Extensions
-- -----------------------------------------------------------------------------
CREATE EXTENSION IF NOT EXISTS pgcrypto; -- gen_random_uuid(), gen_random_bytes()
CREATE EXTENSION IF NOT EXISTS citext;   -- case-insensitive email matching

-- -----------------------------------------------------------------------------
-- 1. Enumerated types
-- -----------------------------------------------------------------------------

-- Mirrors the AuthRole union in src/types/auth.ts. Keep in sync with that file.
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'auth_role') THEN
    CREATE TYPE auth_role AS ENUM (
      'super_admin',
      'cto',
      'finance_manager',
      'senior_accountant',
      'junior_accountant',
      'inventory_manager',
      'sales_manager' -- reserved for the future CRM module; no scopes granted yet
    );
  END IF;
END
$$;

-- Mirrors MfaChallenge usage: a code can be requested either to complete a
-- sign-in (existing user) or a sign-up (not-yet-created user).
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'mfa_purpose') THEN
    CREATE TYPE mfa_purpose AS ENUM ('sign_in', 'sign_up');
  END IF;
END
$$;

-- Audit trail event taxonomy for login/MFA/password-reset activity.
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'auth_event_type') THEN
    CREATE TYPE auth_event_type AS ENUM (
      'sign_up_requested',
      'sign_up_completed',
      'sign_in_attempted',
      'sign_in_succeeded',
      'sign_in_failed',
      'mfa_code_sent',
      'mfa_code_verified',
      'mfa_code_failed',
      'mfa_code_expired',
      'password_reset_requested',
      'password_reset_completed',
      'sign_out',
      'account_locked',
      'account_unlocked'
    );
  END IF;
END
$$;

-- -----------------------------------------------------------------------------
-- 2. Helper trigger function: keep updated_at current
-- -----------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION set_updated_at()
RETURNS trigger
LANGUAGE plpgsql
AS $$
BEGIN
  NEW.updated_at := now();
  RETURN NEW;
END;
$$;

-- -----------------------------------------------------------------------------
-- 3. Tenants (ABAC: UserAttributes.tenantId)
-- -----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS tenants (
  id          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name        text NOT NULL,
  region      text NOT NULL,
  created_at  timestamptz NOT NULL DEFAULT now(),
  updated_at  timestamptz NOT NULL DEFAULT now()
);

DROP TRIGGER IF EXISTS trg_tenants_updated_at ON tenants;
CREATE TRIGGER trg_tenants_updated_at
  BEFORE UPDATE ON tenants
  FOR EACH ROW
  EXECUTE FUNCTION set_updated_at();

-- -----------------------------------------------------------------------------
-- 4. Users (core authentication record)
-- -----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS users (
  id                     uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  email                  citext NOT NULL UNIQUE,
  full_name              text NOT NULL,
  password_hash          text NOT NULL, -- bcrypt/argon2 hash computed by the app, never plaintext
  email_verified_at      timestamptz,   -- set once sign-up MFA succeeds
  is_active              boolean NOT NULL DEFAULT true,
  failed_login_attempts  smallint NOT NULL DEFAULT 0,
  locked_until           timestamptz,
  created_at             timestamptz NOT NULL DEFAULT now(),
  updated_at             timestamptz NOT NULL DEFAULT now()
);

COMMENT ON TABLE users IS 'Matches src/types/auth.ts AuthUser (id, email) plus credential/lockout state.';

DROP TRIGGER IF EXISTS trg_users_updated_at ON users;
CREATE TRIGGER trg_users_updated_at
  BEFORE UPDATE ON users
  FOR EACH ROW
  EXECUTE FUNCTION set_updated_at();

-- -----------------------------------------------------------------------------
-- 5. User attributes (ABAC: UserAttributes in src/types/auth.ts)
-- -----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS user_attributes (
  user_id         uuid PRIMARY KEY REFERENCES users (id) ON DELETE CASCADE,
  tenant_id       uuid NOT NULL REFERENCES tenants (id) ON DELETE RESTRICT,
  region          text NOT NULL,
  department      text NOT NULL,
  clearance_level smallint NOT NULL DEFAULT 1 CHECK (clearance_level BETWEEN 1 AND 5),
  updated_at      timestamptz NOT NULL DEFAULT now()
);

COMMENT ON TABLE user_attributes IS 'One-to-one ABAC attributes consumed by AccessPolicy.attributeRules.';

DROP TRIGGER IF EXISTS trg_user_attributes_updated_at ON user_attributes;
CREATE TRIGGER trg_user_attributes_updated_at
  BEFORE UPDATE ON user_attributes
  FOR EACH ROW
  EXECUTE FUNCTION set_updated_at();

-- -----------------------------------------------------------------------------
-- 6. User roles (RBAC: AuthUser.roles)
-- -----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS user_roles (
  user_id     uuid NOT NULL REFERENCES users (id) ON DELETE CASCADE,
  role        auth_role NOT NULL,
  granted_at  timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY (user_id, role)
);

-- -----------------------------------------------------------------------------
-- 7. Scopes catalogue + role/user scope grants
--    (AuthSession.scopes, consumed by AccessPolicy.allScopes)
-- -----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS scopes (
  code         text PRIMARY KEY, -- e.g. 'dashboard:read', 'inventory:write'
  description  text NOT NULL
);

-- Default scopes granted to every member of a role (computed at token-issue time).
CREATE TABLE IF NOT EXISTS role_scopes (
  role        auth_role NOT NULL,
  scope_code  text NOT NULL REFERENCES scopes (code) ON DELETE CASCADE,
  PRIMARY KEY (role, scope_code)
);

-- Optional per-user scope grants layered on top of role defaults.
CREATE TABLE IF NOT EXISTS user_scopes (
  user_id     uuid NOT NULL REFERENCES users (id) ON DELETE CASCADE,
  scope_code  text NOT NULL REFERENCES scopes (code) ON DELETE CASCADE,
  granted_at  timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY (user_id, scope_code)
);

-- -----------------------------------------------------------------------------
-- 8. Refresh tokens (httpOnly-cookie session persistence)
-- -----------------------------------------------------------------------------
-- Access tokens are short-lived (accessTokenTtlMinutes, see appConfig.ts) and
-- verified statelessly, so they are intentionally not stored here. Only the
-- long-lived refresh token is persisted, and only as a hash.
CREATE TABLE IF NOT EXISTS refresh_tokens (
  id                   uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id              uuid NOT NULL REFERENCES users (id) ON DELETE CASCADE,
  token_hash           text NOT NULL UNIQUE, -- sha256 of the raw cookie value
  issued_at            timestamptz NOT NULL DEFAULT now(),
  expires_at           timestamptz NOT NULL,
  revoked_at           timestamptz,
  replaced_by_token_id uuid REFERENCES refresh_tokens (id) ON DELETE SET NULL,
  user_agent           text,
  ip_address           inet
);

CREATE INDEX IF NOT EXISTS idx_refresh_tokens_user_id ON refresh_tokens (user_id);
CREATE INDEX IF NOT EXISTS idx_refresh_tokens_active
  ON refresh_tokens (user_id)
  WHERE revoked_at IS NULL;

-- -----------------------------------------------------------------------------
-- 9. Pending sign-ups
-- -----------------------------------------------------------------------------
-- CreateAccountPage.tsx requests an MFA code before the account exists.
-- The submitted details are held here until the code is verified, at which
-- point a row is promoted into `users` (see fn_complete_sign_up below).
CREATE TABLE IF NOT EXISTS pending_sign_ups (
  id             uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  email          citext NOT NULL,
  full_name      text NOT NULL,
  password_hash  text NOT NULL,
  created_at     timestamptz NOT NULL DEFAULT now(),
  expires_at     timestamptz NOT NULL,
  consumed_at    timestamptz
);

-- Only one active (unconsumed, unexpired) pending sign-up per email at a time.
CREATE UNIQUE INDEX IF NOT EXISTS uq_pending_sign_ups_active_email
  ON pending_sign_ups (email)
  WHERE consumed_at IS NULL;

-- -----------------------------------------------------------------------------
-- 10. MFA challenges (shared by sign-in and sign-up flows)
-- -----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS mfa_challenges (
  id                 uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  purpose            mfa_purpose NOT NULL,
  user_id            uuid REFERENCES users (id) ON DELETE CASCADE,
  pending_sign_up_id uuid REFERENCES pending_sign_ups (id) ON DELETE CASCADE,
  code_hash          text NOT NULL,         -- sha256 of the 6-digit code, never stored raw
  code_length        smallint NOT NULL DEFAULT 6,
  attempts           smallint NOT NULL DEFAULT 0,
  max_attempts       smallint NOT NULL DEFAULT 5,
  expires_at         timestamptz NOT NULL,
  consumed_at        timestamptz,
  created_at         timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT chk_mfa_subject CHECK (
    (purpose = 'sign_in' AND user_id IS NOT NULL AND pending_sign_up_id IS NULL)
    OR
    (purpose = 'sign_up' AND pending_sign_up_id IS NOT NULL AND user_id IS NULL)
  )
);

-- At most one active sign-in challenge per user, and one active sign-up
-- challenge per pending registration — matches the single `mfaChallenge` /
-- `signUpMfaChallenge` state kept client-side in AppContextProvider.tsx.
CREATE UNIQUE INDEX IF NOT EXISTS uq_mfa_challenges_active_user
  ON mfa_challenges (user_id)
  WHERE purpose = 'sign_in' AND consumed_at IS NULL;

CREATE UNIQUE INDEX IF NOT EXISTS uq_mfa_challenges_active_pending_sign_up
  ON mfa_challenges (pending_sign_up_id)
  WHERE purpose = 'sign_up' AND consumed_at IS NULL;

-- -----------------------------------------------------------------------------
-- 11. Password reset tokens (supports the "Forgot password?" link)
-- -----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS password_reset_tokens (
  id          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id     uuid NOT NULL REFERENCES users (id) ON DELETE CASCADE,
  token_hash  text NOT NULL UNIQUE,
  expires_at  timestamptz NOT NULL,
  used_at     timestamptz,
  created_at  timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_password_reset_tokens_user_id
  ON password_reset_tokens (user_id);

-- -----------------------------------------------------------------------------
-- 12. Auth audit log
-- -----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS auth_audit_log (
  id              uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  event_type      auth_event_type NOT NULL,
  user_id         uuid REFERENCES users (id) ON DELETE SET NULL,
  email_attempted citext,
  ip_address      inet,
  user_agent      text,
  metadata        jsonb NOT NULL DEFAULT '{}'::jsonb,
  created_at      timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_auth_audit_log_user_id ON auth_audit_log (user_id);
CREATE INDEX IF NOT EXISTS idx_auth_audit_log_created_at ON auth_audit_log (created_at);

-- -----------------------------------------------------------------------------
-- 13. Effective-scope lookup (role scopes ∪ explicit user scopes)
-- -----------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION get_effective_scopes(p_user_id uuid)
RETURNS TABLE (scope_code text)
LANGUAGE sql
STABLE
AS $$
  SELECT rs.scope_code
  FROM user_roles ur
  JOIN role_scopes rs ON rs.role = ur.role
  WHERE ur.user_id = p_user_id
  UNION
  SELECT us.scope_code
  FROM user_scopes us
  WHERE us.user_id = p_user_id;
$$;

-- -----------------------------------------------------------------------------
-- 14. Session profile view
-- -----------------------------------------------------------------------------
-- Convenience read model shaping a row close to AuthSession.user +
-- AuthSession.scopes, for use when the app server issues an access token.
CREATE OR REPLACE VIEW user_session_profile AS
SELECT
  u.id                                            AS user_id,
  u.email,
  u.full_name,
  u.is_active,
  u.email_verified_at,
  ua.tenant_id,
  ua.region,
  ua.department,
  ua.clearance_level,
  COALESCE(role_rollup.roles, ARRAY[]::auth_role[])   AS roles,
  COALESCE(scope_rollup.scopes, ARRAY[]::text[])       AS scopes
FROM users u
LEFT JOIN user_attributes ua ON ua.user_id = u.id
LEFT JOIN (
  SELECT user_id, array_agg(role ORDER BY role) AS roles
  FROM user_roles
  GROUP BY user_id
) role_rollup ON role_rollup.user_id = u.id
LEFT JOIN (
  SELECT user_id, array_agg(scope_code ORDER BY scope_code) AS scopes
  FROM (
    SELECT ur.user_id, rs.scope_code
    FROM user_roles ur
    JOIN role_scopes rs ON rs.role = ur.role
    UNION
    SELECT us.user_id, us.scope_code
    FROM user_scopes us
  ) effective
  GROUP BY user_id
) scope_rollup ON scope_rollup.user_id = u.id;

-- -----------------------------------------------------------------------------
-- 15. Sign-up completion helper
-- -----------------------------------------------------------------------------
-- Promotes a verified pending sign-up into a real user. Call this inside the
-- same transaction as marking the sign-up MFA challenge consumed.
CREATE OR REPLACE FUNCTION fn_complete_sign_up(p_pending_sign_up_id uuid)
RETURNS uuid
LANGUAGE plpgsql
AS $$
DECLARE
  v_pending pending_sign_ups%ROWTYPE;
  v_user_id uuid;
BEGIN
  SELECT * INTO v_pending
  FROM pending_sign_ups
  WHERE id = p_pending_sign_up_id
    AND consumed_at IS NULL
    AND expires_at > now()
  FOR UPDATE;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'No active pending sign-up for id %', p_pending_sign_up_id;
  END IF;

  INSERT INTO users (email, full_name, password_hash, email_verified_at)
  VALUES (v_pending.email, v_pending.full_name, v_pending.password_hash, now())
  RETURNING id INTO v_user_id;

  UPDATE pending_sign_ups
  SET consumed_at = now()
  WHERE id = p_pending_sign_up_id;

  RETURN v_user_id;
END;
$$;

-- -----------------------------------------------------------------------------
-- 16. Expired-artifact cleanup
-- -----------------------------------------------------------------------------
-- Intended to be run periodically (e.g. via pg_cron or an application-side job).
CREATE OR REPLACE FUNCTION cleanup_expired_auth_artifacts()
RETURNS void
LANGUAGE plpgsql
AS $$
BEGIN
  DELETE FROM mfa_challenges
  WHERE consumed_at IS NULL AND expires_at < now() - interval '1 day';

  DELETE FROM pending_sign_ups
  WHERE consumed_at IS NULL AND expires_at < now() - interval '1 day';

  DELETE FROM refresh_tokens
  WHERE expires_at < now() - interval '30 days';

  DELETE FROM password_reset_tokens
  WHERE expires_at < now() - interval '30 days';
END;
$$;

-- -----------------------------------------------------------------------------
-- 17. Seed data — scopes and default role -> scope grants
-- -----------------------------------------------------------------------------
-- Mirrors the scopes referenced in src/routes/AppRoutes.tsx,
-- src/features/dashboard/pages/DashboardPage.tsx and demoSession in
-- src/config/appConfig.ts. Extend as new feature modules add policies.
INSERT INTO scopes (code, description) VALUES
  ('dashboard:read',  'View the operations dashboard landing page'),
  ('inventory:read',  'View inventory module data'),
  ('inventory:write', 'Modify inventory module data'),
  ('financial:read',  'View financial/accounting module data')
ON CONFLICT (code) DO NOTHING;

INSERT INTO role_scopes (role, scope_code) VALUES
  ('super_admin',       'dashboard:read'),
  ('cto',               'dashboard:read'),
  ('finance_manager',   'dashboard:read'),
  ('senior_accountant', 'dashboard:read'),
  ('junior_accountant', 'dashboard:read'),
  ('inventory_manager', 'dashboard:read'),

  ('super_admin',       'inventory:read'),
  ('cto',               'inventory:read'),
  ('inventory_manager', 'inventory:read'),

  ('super_admin',       'inventory:write'),
  ('cto',               'inventory:write'),
  ('inventory_manager', 'inventory:write'),

  ('super_admin',       'financial:read'),
  ('cto',               'financial:read'),
  ('finance_manager',   'financial:read'),
  ('senior_accountant', 'financial:read'),
  ('junior_accountant', 'financial:read')
ON CONFLICT (role, scope_code) DO NOTHING;

COMMIT;
