import { useCallback, useState } from "react";

import { useAppContext } from "@/context";
import {
  createInvitation,
  revokeUserSessions,
  sendPasswordReset,
  setUserActive,
  unlockUser,
  updateUserAttributes,
  updateUserMemberships,
  updateUserRoles,
  updateUserScopes,
} from "@/features/userManagement/api/usersApi";
import type {
  InviteUserRequest,
  MembershipInput,
  UpdateAttributesRequest,
} from "@/features/userManagement/types";
import type { AuthRole } from "@/types";

/**
 * Wraps the user-administration write endpoints with shared busy/error state.
 * Each mutation resolves `true` on success so callers can refetch afterwards.
 */
export function useUserMutations() {
  const { session } = useAppContext();
  const accessToken = session?.accessToken ?? "";
  const [isBusy, setIsBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const run = useCallback(
    async (operation: (token: string) => Promise<unknown>): Promise<boolean> => {
      setIsBusy(true);
      setError(null);

      try {
        await operation(accessToken);
        return true;
      } catch (mutationError: unknown) {
        setError(
          mutationError instanceof Error
            ? mutationError.message
            : String(mutationError),
        );
        return false;
      } finally {
        setIsBusy(false);
      }
    },
    [accessToken],
  );

  const clearError = useCallback(() => {
    setError(null);
  }, []);

  return {
    isBusy,
    error,
    clearError,
    invite: useCallback(
      (request: InviteUserRequest) =>
        run((token) => createInvitation(token, request)),
      [run],
    ),
    updateRoles: useCallback(
      (userId: string, roles: readonly AuthRole[]) =>
        run((token) => updateUserRoles(token, userId, roles)),
      [run],
    ),
    updateAttributes: useCallback(
      (userId: string, request: UpdateAttributesRequest) =>
        run((token) => updateUserAttributes(token, userId, request)),
      [run],
    ),
    updateScopes: useCallback(
      (userId: string, scopeCodes: readonly string[]) =>
        run((token) => updateUserScopes(token, userId, scopeCodes)),
      [run],
    ),
    updateMemberships: useCallback(
      (userId: string, memberships: readonly MembershipInput[]) =>
        run((token) => updateUserMemberships(token, userId, memberships)),
      [run],
    ),
    sendPasswordReset: useCallback(
      (userId: string) => run((token) => sendPasswordReset(token, userId)),
      [run],
    ),
    setActive: useCallback(
      (userId: string, isActive: boolean) =>
        run((token) => setUserActive(token, userId, isActive)),
      [run],
    ),
    unlock: useCallback(
      (userId: string) => run((token) => unlockUser(token, userId)),
      [run],
    ),
    revokeSessions: useCallback(
      (userId: string) => run((token) => revokeUserSessions(token, userId)),
      [run],
    ),
  };
}
