import { useCallback, useState } from "react";

import { useAppContext } from "@/context";
import {
  createDepartment,
  createOrganization,
  deactivateDepartment,
  setOrganizationActive,
  updateDepartment,
  updateOrganization,
} from "@/features/organization/api/organizationsApi";
import type {
  CreateDepartmentRequest,
  SaveOrganizationRequest,
  UpdateDepartmentRequest,
} from "@/features/organization/types";

/**
 * Wraps the organization/department write endpoints with shared busy/error state.
 * Each mutation resolves `true` on success so callers can refetch afterwards.
 */
export function useOrganizationMutations() {
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
    createOrganization: useCallback(
      (request: SaveOrganizationRequest) =>
        run((token) => createOrganization(token, request)),
      [run],
    ),
    updateOrganization: useCallback(
      (organizationId: string, request: SaveOrganizationRequest) =>
        run((token) => updateOrganization(token, organizationId, request)),
      [run],
    ),
    setOrganizationActive: useCallback(
      (organizationId: string, isActive: boolean) =>
        run((token) => setOrganizationActive(token, organizationId, isActive)),
      [run],
    ),
    createDepartment: useCallback(
      (organizationId: string, request: CreateDepartmentRequest) =>
        run((token) => createDepartment(token, organizationId, request)),
      [run],
    ),
    updateDepartment: useCallback(
      (
        organizationId: string,
        departmentId: string,
        request: UpdateDepartmentRequest,
      ) =>
        run((token) =>
          updateDepartment(token, organizationId, departmentId, request),
        ),
      [run],
    ),
    deactivateDepartment: useCallback(
      (organizationId: string, departmentId: string) =>
        run((token) => deactivateDepartment(token, organizationId, departmentId)),
      [run],
    ),
  };
}
