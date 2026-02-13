/**
 * Social auth handlers for web (OAuth redirect flow)
 */

import { useCallback } from "react";
import { captureEvent } from "@scf/core/utils/analytics/client";
import { supabase } from "@scf/core/utils/supabase/client";
import { useTranslation } from "@scf/core/utils/useTranslation";
import { useToast } from "@scaffald/ui";
import { logger } from "@scf/core";

export function useSocialAuthHandlers() {
  const { t } = useTranslation();
  const toast = useToast();

  const onGooglePress = useCallback(async () => {
    captureEvent("auth_social_sign_in_started", { provider: "google" });
    const { error } = await supabase.auth.signInWithOAuth({
      provider: "google",
      options: {
        redirectTo: process.env.EXPO_PUBLIC_URL,
      },
    });
    if (error) {
      logger.error("Google Sign-In Error", error, { provider: "google" });
      captureEvent("auth_social_sign_in_failed", {
        provider: "google",
        error_code: error.name ?? null,
        message: error.message ?? null,
      });
      toast.show({
        message: t("auth.errors.googleSignInFailed"),
        variant: "error",
        duration: 5000,
      });
    }
  }, [t, toast]);

  const onApplePress = useCallback(async () => {
    captureEvent("auth_social_sign_in_started", { provider: "apple" });
    const { error } = await supabase.auth.signInWithOAuth({
      provider: "apple",
      options: {
        redirectTo: process.env.EXPO_PUBLIC_URL,
      },
    });
    if (error) {
      logger.error("Apple Sign-In Error", error, { provider: "apple" });
      captureEvent("auth_social_sign_in_failed", {
        provider: "apple",
        error_code: error.name ?? null,
        message: error.message ?? null,
      });
      toast.show({
        message: t("auth.errors.appleSignInFailed"),
        variant: "error",
        duration: 5000,
      });
    }
  }, [t, toast]);

  return { onGooglePress, onApplePress };
}
