import type { AccessPolicy, AuthSession } from '@/types'

function matchesRoles(session: AuthSession, policy: AccessPolicy) {
  if (!policy.anyRoles?.length) {
    return true
  }

  return policy.anyRoles.some((role) => session.user.roles.includes(role))
}

function matchesScopes(session: AuthSession, policy: AccessPolicy) {
  if (!policy.allScopes?.length) {
    return true
  }

  return policy.allScopes.every((scope) => session.scopes.includes(scope))
}

function matchesAttributes(session: AuthSession, policy: AccessPolicy) {
  if (!policy.attributeRules?.length) {
    return true
  }

  return policy.attributeRules.every(
    (rule) => session.user.attributes[rule.key] === rule.equals,
  )
}

function matchesOrganizations(session: AuthSession, policy: AccessPolicy) {
  if (!policy.anyOrganizations?.length) {
    return true
  }

  return policy.anyOrganizations.some((organizationId) =>
    session.user.organizationIds.includes(organizationId),
  )
}

function matchesDepartments(session: AuthSession, policy: AccessPolicy) {
  if (!policy.anyDepartments?.length) {
    return true
  }

  return policy.anyDepartments.some((departmentId) =>
    session.user.departmentIds.includes(departmentId),
  )
}

export function isAuthorized(session: AuthSession | null, policy: AccessPolicy) {
  if (!session?.isAuthenticated) {
    return false
  }

  return (
    matchesRoles(session, policy) &&
    matchesScopes(session, policy) &&
    matchesAttributes(session, policy) &&
    matchesOrganizations(session, policy) &&
    matchesDepartments(session, policy)
  )
}
