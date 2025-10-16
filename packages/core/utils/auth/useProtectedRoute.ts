import { useUser } from "@app/core/utils/useUser";
import { useRouter, useSegments } from "expo-router";
import { useEffect, useRef, useState } from "react";
import { Platform } from "react-native";
import { AUTH_ROUTES } from "@app/core/constants/routes";

/**
 * Hook to handle protected route navigation
 * This should be used in individual route components that need authentication
 */
export function useProtectedRoute() {
  const { user, isPending } = useUser();
  const router = useRouter();
  const segments = useSegments();
  const [hasChecked, setHasChecked] = useState(false);
  const loadingStartTime = useRef<number>(Date.now());

  // Timeout protection: If loading for too long, assume session is invalid
  useEffect(() => {
    if (isPending) {
      loadingStartTime.current = Date.now();
    }

    if (isPending && !hasChecked) {
      const timeoutId = setTimeout(() => {
        const loadingDuration = Date.now() - loadingStartTime.current;

        if (loadingDuration >= 10000) {
          console.warn(
            "[useProtectedRoute] Loading timeout exceeded (10s) - assuming invalid session",
          );
          console.warn(
            "[useProtectedRoute] Redirecting to auth to prevent infinite loading",
          );

          const inAuthGroup = segments[0] === "auth";

          if (!inAuthGroup) {
            try {
              router.replace(AUTH_ROUTES.INDEX.path);
              setHasChecked(true);
            } catch (error) {
              console.error(
                "[useProtectedRoute] Timeout redirect error:",
                error,
              );
            }
          }
        }
      }, 10000);

      return () => clearTimeout(timeoutId);
    }
  }, [isPending, hasChecked, segments, router]);

  useEffect(() => {
    // Don't check if still loading user data
    if (isPending) {
      return;
    }

    // Don't check if we've already performed the check
    if (hasChecked) {
      return;
    }

    const inAuthGroup = segments[0] === "auth";

    // If user is not authenticated and not in auth group, redirect to auth
    if (!user && !inAuthGroup) {
      const performRedirect = () => {
        try {
          router.replace(AUTH_ROUTES.INDEX.path);
          setHasChecked(true);
        } catch (error) {
          console.error("Protected route redirect error:", error);
        }
      };

      if (Platform.OS === "web") {
        performRedirect();
      } else {
        // Small delay for native to ensure router is ready
        setTimeout(performRedirect, 50);
      }
    } else if (user && inAuthGroup) {
      // If user is authenticated but in auth group, redirect to dashboard
      const performRedirect = () => {
        try {
          router.replace("/dashboard");
          setHasChecked(true);
        } catch (error) {
          console.error("Auth redirect error:", error);
        }
      };

      if (Platform.OS === "web") {
        performRedirect();
      } else {
        setTimeout(performRedirect, 50);
      }
    } else {
      // User is in the correct place, mark as checked
      setHasChecked(true);
    }
  }, [user, isPending, segments, hasChecked, router]);

  return {
    isAuthenticated: !!user,
    isLoading: isPending || !hasChecked,
    user,
  };
}
