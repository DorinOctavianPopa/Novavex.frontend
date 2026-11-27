-- =============================================================================
-- Novavex ERP — User, Organization & Department Management (PostgreSQL)
-- =============================================================================
-- Extends db/auth_schema.sql (run that first) with the admin user-management
-- module implemented in:
--   src/features/userManagement, src/features/organization,
--   src/services/accessPolicies.ts, src/types/auth.ts
--
-- Model summary (spec v1 + v1.1):
--   - Tenant (existing) -> Organization (new) -> Department tree (new, max 6
--     levels, adjacency list + recursive CTEs).
--   - A user belongs to one or more organizations (exactly one is primary) and
--     to any number of departments *within organizations they are members of*
--     (enforced structurally via composite foreign keys).
--   - Admin pre-provisioning via user_invitations (token emailed to invitee).
--   - All admin mutations are audit-logged in admin_audit_log.
--   - New scopes: users:read/write/admin, organizations:read/write.
--
-- Target: PostgreSQL 14+. Idempotent: safe to re-run.
-- =============================================================================

BEGIN;

-- -----------------------------------------------------------------------------
-- 1. Organizations (tenant -> N organizations)
-- -----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS organizations (
  id          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id   uuid NOT NULL REFERENCES tenants (id) ON DELETE RESTRICT,
  name        text NOT NULL,
  region      text NOT NULL,
  is_active   boolean NOT NULL DEFAULT true,
  created_at  timestamptz NOT NULL DEFAULT now(),
  updated_at  timestamptz NOT NULL DEFAULT now()
);

CREATE UNIQUE INDEX IF NOT EXISTS uq_organizations_tenant_name
  ON organizations (tenant_id, lower(name))
  WHERE is_active;

DROP TRIGGER IF EXISTS trg_organizations_updated_at ON organizations;
CREATE TRIGGER trg_organizations_updated_at
  BEFORE UPDATE ON organizations
  FOR EACH ROW
  EXECUTE FUNCTION set_updated_at();

-- -----------------------------------------------------------------------------
-- 2. Departments (multilevel tree within one organization)
-- -----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS departments (
  id               uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id  uuid NOT NULL REFERENCES organizations (id) ON DELETE RESTRICT,
  parent_id        uuid REFERENCES departments (id) ON DELETE RESTRICT,
  name             text NOT NULL,
  depth            smallint NOT NULL DEFAULT 1 CHECK (depth BETWEEN 1 AND 6),
  is_active        boolean NOT NULL DEFAULT true,
  created_at       timestamptz NOT NULL DEFAULT now(),
  updated_at       timestamptz NOT NULL DEFAULT now(),
  -- Lets child FKs assert "the parent is in the same organization".
  UNIQUE (id, organization_id),
  FOREIGN KEY (parent_id, organization_id)
    REFERENCES departments (id, organization_id)
);

-- Unique sibling names per parent (NULL parent = top level), case-insensitive.
CREATE UNIQUE INDEX IF NOT EXISTS uq_departments_sibling_name
  ON departments (
    organization_id,
    coalesce(parent_id, '00000000-0000-0000-0000-000000000000'::uuid),
    lower(name)
  )
  WHERE is_active;

CREATE INDEX IF NOT EXISTS idx_departments_parent ON departments (parent_id);

DROP TRIGGER IF EXISTS trg_departments_updated_at ON departments;
CREATE TRIGGER trg_departments_updated_at
  BEFORE UPDATE ON departments
  FOR EACH ROW
  EXECUTE FUNCTION set_updated_at();

-- Cycle + depth guard: recomputes depth on insert/move, rejects self/descendant
-- parents and any move that would push a descendant past the depth cap.
CREATE OR REPLACE FUNCTION fn_departments_validate_tree()
RETURNS trigger
LANGUAGE plpgsql
AS $$
DECLARE
  v_parent_depth  smallint;
  v_subtree_height smallint;
BEGIN
  IF NEW.parent_id IS NULL THEN
    NEW.depth := 1;
  ELSE
    IF NEW.parent_id = NEW.id THEN
      RAISE EXCEPTION 'A department cannot be its own parent';
    END IF;

    -- Reject moving a department under one of its own descendants.
    IF TG_OP = 'UPDATE' AND EXISTS (
      WITH RECURSIVE subtree AS (
        SELECT id FROM departments WHERE id = NEW.id
        UNION ALL
        SELECT d.id FROM departments d JOIN subtree s ON d.parent_id = s.id
      )
      SELECT 1 FROM subtree WHERE id = NEW.parent_id
    ) THEN
      RAISE EXCEPTION 'Cannot move a department under its own descendant';
    END IF;

    SELECT depth INTO v_parent_depth
    FROM departments
    WHERE id = NEW.parent_id AND organization_id = NEW.organization_id;

    IF v_parent_depth IS NULL THEN
      RAISE EXCEPTION 'Parent department not found in the same organization';
    END IF;

    NEW.depth := v_parent_depth + 1;
  END IF;

  IF NEW.depth > 6 THEN
    RAISE EXCEPTION 'Department tree depth cannot exceed 6 levels';
  END IF;

  -- On a move, make sure the deepest descendant still fits under the cap.
  IF TG_OP = 'UPDATE' THEN
    WITH RECURSIVE subtree AS (
      SELECT id, 1 AS relative_depth FROM departments WHERE id = NEW.id
      UNION ALL
      SELECT d.id, s.relative_depth + 1
      FROM departments d
      JOIN subtree s ON d.parent_id = s.id
    )
    SELECT max(relative_depth) INTO v_subtree_height FROM subtree;

    IF NEW.depth + coalesce(v_subtree_height, 1) - 1 > 6 THEN
      RAISE EXCEPTION 'Move rejected: a descendant would exceed the depth cap';
    END IF;
  END IF;

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_departments_validate_tree ON departments;
CREATE TRIGGER trg_departments_validate_tree
  BEFORE INSERT OR UPDATE OF parent_id, organization_id ON departments
  FOR EACH ROW
  EXECUTE FUNCTION fn_departments_validate_tree();

-- Cascade recomputed depths to descendants after a move.
CREATE OR REPLACE FUNCTION fn_departments_cascade_depth()
RETURNS trigger
LANGUAGE plpgsql
AS $$
BEGIN
  IF NEW.depth IS DISTINCT FROM OLD.depth THEN
    UPDATE departments
    SET depth = depth + (NEW.depth - OLD.depth)
    WHERE parent_id = NEW.id;
  END IF;
  RETURN NULL;
END;
$$;

DROP TRIGGER IF EXISTS trg_departments_cascade_depth ON departments;
CREATE TRIGGER trg_departments_cascade_depth
  AFTER UPDATE OF depth ON departments
  FOR EACH ROW
  EXECUTE FUNCTION fn_departments_cascade_depth();

-- Read helper: a department and all of its descendants.
CREATE OR REPLACE FUNCTION fn_department_subtree(p_department_id uuid)
RETURNS TABLE (department_id uuid)
LANGUAGE sql
STABLE
AS $$
  WITH RECURSIVE subtree AS (
    SELECT id FROM departments WHERE id = p_department_id
    UNION ALL
    SELECT d.id FROM departments d JOIN subtree s ON d.parent_id = s.id
  )
  SELECT id FROM subtree;
$$;

-- -----------------------------------------------------------------------------
-- 3. Memberships (user <-> organization, user <-> department)
-- -----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS user_organizations (
  user_id          uuid NOT NULL REFERENCES users (id) ON DELETE CASCADE,
  organization_id  uuid NOT NULL REFERENCES organizations (id) ON DELETE RESTRICT,
  is_primary       boolean NOT NULL DEFAULT false,
  joined_at        timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY (user_id, organization_id)
);

-- Exactly one primary organization per user.
CREATE UNIQUE INDEX IF NOT EXISTS uq_user_organizations_primary
  ON user_organizations (user_id)
  WHERE is_primary;

CREATE TABLE IF NOT EXISTS user_departments (
  user_id          uuid NOT NULL,
  organization_id  uuid NOT NULL,
  department_id    uuid NOT NULL,
  assigned_at      timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY (user_id, department_id),
  -- The user must be a member of the organization...
  FOREIGN KEY (user_id, organization_id)
    REFERENCES user_organizations (user_id, organization_id) ON DELETE CASCADE,
  -- ...and the department must belong to that same organization.
  FOREIGN KEY (department_id, organization_id)
    REFERENCES departments (id, organization_id) ON DELETE RESTRICT
);

CREATE INDEX IF NOT EXISTS idx_user_departments_department
  ON user_departments (department_id);

-- -----------------------------------------------------------------------------
-- 4. User invitations (admin pre-provisioning)
-- -----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS user_invitations (
  id          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  email       citext NOT NULL,
  full_name   text NOT NULL,
  roles       auth_role[] NOT NULL DEFAULT '{}',
  token_hash  text NOT NULL UNIQUE,  -- sha256 of the emailed token, never raw
  invited_by  uuid NOT NULL REFERENCES users (id),
  expires_at  timestamptz NOT NULL,  -- proposed: now() + interval '7 days'
  accepted_at timestamptz,
  revoked_at  timestamptz,
  created_at  timestamptz NOT NULL DEFAULT now()
);

-- Only one live invitation per email at a time.
CREATE UNIQUE INDEX IF NOT EXISTS uq_user_invitations_active_email
  ON user_invitations (email)
  WHERE accepted_at IS NULL AND revoked_at IS NULL;

-- Memberships the invitee will receive on acceptance (mirrors section 3's FKs).
CREATE TABLE IF NOT EXISTS user_invitation_organizations (
  invitation_id    uuid NOT NULL REFERENCES user_invitations (id) ON DELETE CASCADE,
  organization_id  uuid NOT NULL REFERENCES organizations (id) ON DELETE CASCADE,
  is_primary       boolean NOT NULL DEFAULT false,
  PRIMARY KEY (invitation_id, organization_id)
);

CREATE UNIQUE INDEX IF NOT EXISTS uq_user_invitation_orgs_primary
  ON user_invitation_organizations (invitation_id)
  WHERE is_primary;

CREATE TABLE IF NOT EXISTS user_invitation_departments (
  invitation_id    uuid NOT NULL,
  organization_id  uuid NOT NULL,
  department_id    uuid NOT NULL,
  PRIMARY KEY (invitation_id, department_id),
  FOREIGN KEY (invitation_id, organization_id)
    REFERENCES user_invitation_organizations (invitation_id, organization_id)
    ON DELETE CASCADE,
  FOREIGN KEY (department_id, organization_id)
    REFERENCES departments (id, organization_id) ON DELETE CASCADE
);

-- -----------------------------------------------------------------------------
-- 5. Admin audit log (actor/target semantics, separate from auth_audit_log)
-- -----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS admin_audit_log (
  id              uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  actor_user_id   uuid REFERENCES users (id) ON DELETE SET NULL,
  target_user_id  uuid REFERENCES users (id) ON DELETE SET NULL,
  -- e.g. 'user_invited','invitation_resent','invitation_revoked','roles_changed',
  -- 'scopes_changed','attributes_changed','memberships_changed','user_deactivated',
  -- 'user_reactivated','user_unlocked','password_reset_sent','sessions_revoked',
  -- 'org_created','org_updated','org_deactivated','org_reactivated',
  -- 'department_created','department_renamed','department_moved','department_deactivated'
  action          text NOT NULL,
  metadata        jsonb NOT NULL DEFAULT '{}'::jsonb,  -- before/after diff
  created_at      timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_admin_audit_target
  ON admin_audit_log (target_user_id, created_at);
CREATE INDEX IF NOT EXISTS idx_admin_audit_actor
  ON admin_audit_log (actor_user_id, created_at);

-- -----------------------------------------------------------------------------
-- 6. Scope seeds (users:* and organizations:*)
-- -----------------------------------------------------------------------------
INSERT INTO scopes (code, description) VALUES
  ('users:read',          'View users, roles, scopes and audit history'),
  ('users:write',         'Invite users and modify roles/scopes/attributes/memberships'),
  ('users:admin',         'Deactivate accounts, unlock, revoke sessions'),
  ('organizations:read',  'View organizations, department trees and membership rosters'),
  ('organizations:write', 'Create/rename/move/deactivate organizations and departments')
ON CONFLICT (code) DO NOTHING;

INSERT INTO role_scopes (role, scope_code) VALUES
  ('super_admin', 'users:read'),
  ('super_admin', 'users:write'),
  ('super_admin', 'users:admin'),
  ('super_admin', 'organizations:read'),
  ('super_admin', 'organizations:write'),
  ('cto',         'users:read'),
  ('cto',         'organizations:read')
ON CONFLICT (role, scope_code) DO NOTHING;

-- -----------------------------------------------------------------------------
-- 7. Admin directory view (backs GET /api/admin/users)
-- -----------------------------------------------------------------------------
CREATE OR REPLACE VIEW admin_user_directory AS
SELECT
  u.id                                              AS user_id,
  u.email,
  u.full_name,
  CASE
    WHEN NOT u.is_active                                   THEN 'inactive'
    WHEN u.locked_until IS NOT NULL AND u.locked_until > now() THEN 'locked'
    ELSE 'active'
  END                                               AS status,
  usp.roles,
  usp.scopes,
  primary_org.organization_id                       AS primary_organization_id,
  primary_org.organization_name                     AS primary_organization_name,
  coalesce(dept_rollup.department_names, ARRAY[]::text[]) AS department_names,
  last_sign_in.last_sign_in_at,
  coalesce(session_rollup.active_session_count, 0)  AS active_session_count,
  u.email_verified_at,
  u.locked_until,
  u.created_at
FROM users u
LEFT JOIN user_session_profile usp ON usp.user_id = u.id
LEFT JOIN LATERAL (
  SELECT o.id AS organization_id, o.name AS organization_name
  FROM user_organizations uo
  JOIN organizations o ON o.id = uo.organization_id
  WHERE uo.user_id = u.id AND uo.is_primary
  LIMIT 1
) primary_org ON true
LEFT JOIN (
  SELECT ud.user_id, array_agg(d.name ORDER BY d.name) AS department_names
  FROM user_departments ud
  JOIN departments d ON d.id = ud.department_id
  GROUP BY ud.user_id
) dept_rollup ON dept_rollup.user_id = u.id
LEFT JOIN (
  SELECT user_id, max(created_at) AS last_sign_in_at
  FROM auth_audit_log
  WHERE event_type = 'sign_in_succeeded'
  GROUP BY user_id
) last_sign_in ON last_sign_in.user_id = u.id
LEFT JOIN (
  SELECT user_id, count(*) AS active_session_count
  FROM refresh_tokens
  WHERE revoked_at IS NULL AND expires_at > now()
  GROUP BY user_id
) session_rollup ON session_rollup.user_id = u.id;

-- -----------------------------------------------------------------------------
-- 8. Membership replacement (PUT /api/admin/users/{id}/memberships)
-- -----------------------------------------------------------------------------
-- Atomic full-replace with the "at least one membership, exactly one primary"
-- guards. p_memberships: [{"organizationId": uuid, "isPrimary": bool,
--                          "departmentIds": [uuid, ...]}, ...]
CREATE OR REPLACE FUNCTION fn_replace_user_memberships(
  p_user_id uuid,
  p_memberships jsonb,
  p_actor_id uuid
)
RETURNS void
LANGUAGE plpgsql
AS $$
DECLARE
  v_count         integer;
  v_primary_count integer;
BEGIN
  SELECT
    count(*),
    count(*) FILTER (WHERE (entry->>'isPrimary')::boolean)
  INTO v_count, v_primary_count
  FROM jsonb_array_elements(p_memberships) AS entry;

  IF v_count = 0 THEN
    RAISE EXCEPTION 'A user must belong to at least one organization';
  END IF;

  IF v_primary_count <> 1 THEN
    RAISE EXCEPTION 'Exactly one membership must be primary';
  END IF;

  -- user_departments rows cascade away with their user_organizations rows.
  DELETE FROM user_organizations WHERE user_id = p_user_id;

  INSERT INTO user_organizations (user_id, organization_id, is_primary)
  SELECT
    p_user_id,
    (entry->>'organizationId')::uuid,
    (entry->>'isPrimary')::boolean
  FROM jsonb_array_elements(p_memberships) AS entry;

  INSERT INTO user_departments (user_id, organization_id, department_id)
  SELECT
    p_user_id,
    (entry->>'organizationId')::uuid,
    department_id::uuid
  FROM jsonb_array_elements(p_memberships) AS entry,
       jsonb_array_elements_text(entry->'departmentIds') AS department_id;

  INSERT INTO admin_audit_log (actor_user_id, target_user_id, action, metadata)
  VALUES (p_actor_id, p_user_id, 'memberships_changed',
          jsonb_build_object('memberships', p_memberships));
END;
$$;

-- -----------------------------------------------------------------------------
-- 9. Invitation acceptance (POST /api/admin/users/invitations/accept)
-- -----------------------------------------------------------------------------
-- Promotes a live invitation into a real user with roles + memberships.
CREATE OR REPLACE FUNCTION fn_accept_invitation(
  p_token_hash text,
  p_password_hash text
)
RETURNS uuid
LANGUAGE plpgsql
AS $$
DECLARE
  v_invitation user_invitations%ROWTYPE;
  v_user_id    uuid;
BEGIN
  SELECT * INTO v_invitation
  FROM user_invitations
  WHERE token_hash = p_token_hash
    AND accepted_at IS NULL
    AND revoked_at IS NULL
    AND expires_at > now()
  FOR UPDATE;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Invitation is invalid, expired or already used';
  END IF;

  INSERT INTO users (email, full_name, password_hash, email_verified_at)
  VALUES (v_invitation.email, v_invitation.full_name, p_password_hash, now())
  RETURNING id INTO v_user_id;

  INSERT INTO user_roles (user_id, role)
  SELECT v_user_id, unnest(v_invitation.roles);

  INSERT INTO user_organizations (user_id, organization_id, is_primary)
  SELECT v_user_id, uio.organization_id, uio.is_primary
  FROM user_invitation_organizations uio
  WHERE uio.invitation_id = v_invitation.id;

  INSERT INTO user_departments (user_id, organization_id, department_id)
  SELECT v_user_id, uid.organization_id, uid.department_id
  FROM user_invitation_departments uid
  WHERE uid.invitation_id = v_invitation.id;

  UPDATE user_invitations
  SET accepted_at = now()
  WHERE id = v_invitation.id;

  INSERT INTO admin_audit_log (actor_user_id, target_user_id, action, metadata)
  VALUES (v_invitation.invited_by, v_user_id, 'invitation_accepted',
          jsonb_build_object('invitationId', v_invitation.id));

  RETURN v_user_id;
END;
$$;

-- -----------------------------------------------------------------------------
-- 10. Guarded deactivation (POST /api/admin/users/{id}/deactivate)
-- -----------------------------------------------------------------------------
-- Blocks self-deactivation and removing the last active super_admin; revokes
-- all refresh tokens so the change takes effect immediately.
CREATE OR REPLACE FUNCTION fn_deactivate_user(p_user_id uuid, p_actor_id uuid)
RETURNS void
LANGUAGE plpgsql
AS $$
BEGIN
  IF p_user_id = p_actor_id THEN
    RAISE EXCEPTION 'Administrators cannot deactivate their own account';
  END IF;

  IF EXISTS (
        SELECT 1 FROM user_roles
        WHERE user_id = p_user_id AND role = 'super_admin'
      )
      AND NOT EXISTS (
        SELECT 1
        FROM user_roles ur
        JOIN users u ON u.id = ur.user_id
        WHERE ur.role = 'super_admin'
          AND u.is_active
          AND ur.user_id <> p_user_id
      ) THEN
    RAISE EXCEPTION 'The last active super_admin cannot be deactivated';
  END IF;

  UPDATE users SET is_active = false WHERE id = p_user_id;

  UPDATE refresh_tokens
  SET revoked_at = now()
  WHERE user_id = p_user_id AND revoked_at IS NULL;

  INSERT INTO admin_audit_log (actor_user_id, target_user_id, action)
  VALUES (p_actor_id, p_user_id, 'user_deactivated');
END;
$$;

-- -----------------------------------------------------------------------------
-- 11. Cleanup: purge expired, unaccepted invitations
-- -----------------------------------------------------------------------------
-- Companion to cleanup_expired_auth_artifacts() in auth_schema.sql; schedule
-- both together (e.g. via pg_cron).
CREATE OR REPLACE FUNCTION cleanup_expired_user_management_artifacts()
RETURNS void
LANGUAGE plpgsql
AS $$
BEGIN
  DELETE FROM user_invitations
  WHERE accepted_at IS NULL
    AND revoked_at IS NULL
    AND expires_at < now() - interval '30 days';
END;
$$;

COMMIT;
