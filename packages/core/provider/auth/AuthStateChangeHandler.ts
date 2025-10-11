import { supabase } from "@app/core/utils/supabase/client";
import { useEffect } from "react";
import { useRouter } from "expo-router";
import { AUTH_ROUTES, ROUTES } from "@app/core/constants/routes";

const useRedirectAfterSignOut = () => {
  // Using supabase directly from import
  const router = useRouter();
  useEffect(() => {
    const signOutListener = supabase.auth.onAuthStateChange((event) => {
      if (event === "SIGNED_OUT") {
        router.replace(AUTH_ROUTES.INDEX.path);
      }
    });
    return () => {
      signOutListener.data.subscription.unsubscribe();
    };
  }, [supabase, router]);
};

export const AuthStateChangeHandler = () => {
  useRedirectAfterSignOut();
  return null;
};
