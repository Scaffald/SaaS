import { useUserRoles } from "./useUserRoles";
import { useProtectedRoute } from "./useProtectedRoute";
import { useRouter } from "expo-router";
import { useEffect } from "react";

export function useRoleProtectedRoute(requiredRoles: string[]) {
  const { isAuthenticated, isLoading: authLoading } = useProtectedRoute();
  const { roles, isLoading: rolesLoading } = useUserRoles();
  const router = useRouter();

  const hasRequiredRole = requiredRoles.some((role) => roles.includes(role));
  const isLoading = authLoading || rolesLoading;

  useEffect(() => {
    console.log("[useRoleProtectedRoute] State check", {
      isLoading,
      isAuthenticated,
      hasRequiredRole,
      requiredRoles,
      userRoles: roles,
      authLoading,
      rolesLoading,
    });

    if (!isLoading && isAuthenticated && !hasRequiredRole) {
      console.warn(
        "[useRoleProtectedRoute] Access denied - redirecting to dashboard",
        {
          requiredRoles,
          userRoles: roles,
        },
      );
      router.replace("/dashboard");
    } else if (!isLoading && isAuthenticated && hasRequiredRole) {
      console.log("[useRoleProtectedRoute] Access granted", {
        requiredRoles,
        userRoles: roles,
      });
    }
  }, [
    isLoading,
    isAuthenticated,
    hasRequiredRole,
    router,
    roles,
    requiredRoles,
    authLoading,
    rolesLoading,
  ]);

  return {
    isAuthorized: hasRequiredRole,
    isLoading,
    roles,
  };
}
