/**
 * Social auth handlers for native (ID token flow)
 */

import { useCallback } from "react";
import { Platform } from "react-native";
import { ROUTES } from "@scf/core/constants/routes";
import { captureEvent } from "@scf/core/utils/analytics/client";
import { initiateAppleSignIn } from "@scf/core/utils/auth/initiateAppleSignIn";
import { supabase } from "@scf/core/utils/supabase/client";
import { useTranslation } from "@scf/core/utils/useTranslation";
import { useToast } from "@scaffald/ui";
import { useRouter } from "expo-router";
import { GoogleSignin } from "@react-native-google-signin/google-signin";

import { normalizeOAuthError } from "./oauthErrorUtils";

// Configure Google Sign-In once at module load — re-running configure() on
// every press is wasteful and produces noisy logs (audit finding 2.1 P2).
GoogleSignin.configure({
  iosClientId: process.env.EXPO_PUBLIC_GOOGLE_IOS_CLIENT_ID,
  webClientId: process.env.EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID,
});

export function useSocialAuthHandlers() {
  const { t } = useTranslation();
  const toast = useToast();
  const router = useRouter();

  const onGooglePress = useCallback(async () => {
    try {
      captureEvent("auth_social_sign_in_started", { provider: "google" });
      await GoogleSignin.hasPlayServices();
      const response = await GoogleSignin.signIn();
      const token = response?.data?.idToken;
      if (!token) {
        throw new Error("no ID token present");
      }
      const { error } = await supabase.auth.signInWithIdToken({
        provider: "google",
        token,
      });
      if (error) throw error;
      captureEvent("auth_social_sign_in_succeeded", { provider: "google" });
      router.replace(ROUTES.HOME.path);
    } catch (error) {
      const normalized = normalizeOAuthError(error, "google");
      captureEvent("auth_social_sign_in_failed", {
        provider: "google",
        error_code: normalized.errorCode,
        message: normalized.message,
      });
      if (normalized.isCancelled || normalized.isInProgress) return;
      toast.show({
        message: t("auth.errors.googleSignInFailed"),
        variant: "error",
        duration: 5000,
      });
    }
  }, [t, toast, router]);

  const onApplePress = useCallback(async () => {
    if (Platform.OS !== "ios") return;
    try {
      captureEvent("auth_social_sign_in_started", { provider: "apple" });
      const { token, nonce } = await initiateAppleSignIn();
      const { error } = await supabase.auth.signInWithIdToken({
        provider: "apple",
        token,
        nonce,
      });
      if (error) throw error;
      captureEvent("auth_social_sign_in_succeeded", { provider: "apple" });
      router.replace(ROUTES.HOME.path);
    } catch (error) {
      const normalized = normalizeOAuthError(error, "apple");
      captureEvent("auth_social_sign_in_failed", {
        provider: "apple",
        error_code: normalized.errorCode,
        message: normalized.message,
      });
      if (normalized.isCancelled) return;
      toast.show({
        message: t("auth.errors.appleSignInFailed"),
        variant: "error",
        duration: 5000,
      });
    }
  }, [t, toast, router]);

  return { onGooglePress, onApplePress };
}
