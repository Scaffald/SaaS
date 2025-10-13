import { api } from "@app/core/utils/api";
import { useEffect } from "react";

export function useUserRoles() {
  const { data, isLoading, error } = api.auth.getUserRoles.useQuery();

  useEffect(() => {
    if (!isLoading) {
      console.log("[useUserRoles] Loading complete", {
        roles: data?.roles,
        hasRoles: !!data?.roles?.length,
        error: error?.message,
      });
    }
  }, [isLoading, data, error]);

  return {
    roles: data?.roles ?? [],
    isLoading,
    hasRole: (roleName: string) => {
      const hasRole = data?.roles?.includes(roleName) ?? false;
      console.log(`[useUserRoles] Checking role "${roleName}":`, hasRole);
      return hasRole;
    },
    hasOfficeRole: data?.roles?.includes("office") ?? false,
  };
}
