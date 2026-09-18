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

export function isAuthorized(session: AuthSession, policy: AccessPolicy) {
  if (!session.isAuthenticated) {
    return false
  }

  return (
    matchesRoles(session, policy) &&
    matchesScopes(session, policy) &&
    matchesAttributes(session, policy)
  )
}
