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
import {
  GoogleSignin,
  statusCodes,
} from "@react-native-google-signin/google-signin";

export function useSocialAuthHandlers() {
  const { t } = useTranslation();
  const toast = useToast();
  const router = useRouter();

  const onGooglePress = useCallback(async () => {
    try {
      captureEvent("auth_social_sign_in_started", { provider: "google" });
      GoogleSignin.configure({
        iosClientId: process.env.GOOGLE_IOS_CLIENT_ID,
        webClientId: process.env.GOOGLE_WEB_CLIENT_ID,
      });
      await GoogleSignin.hasPlayServices();
      const response = await GoogleSignin.signIn();
      const token = response?.data?.idToken;
      if (token) {
        const { error } = await supabase.auth.signInWithIdToken({
          provider: "google",
          token,
        });
        if (error) throw error;
        router.replace(ROUTES.HOME.path);
      } else {
        throw new Error("no ID token present");
      }
    } catch (error) {
      const errorCode = typeof error === "object" && error && "code" in error
        ? String((error as { code: unknown }).code)
        : error instanceof Error
        ? error.name
        : "unknown";
      const errorMessage = error instanceof Error ? error.message : null;
      captureEvent("auth_social_sign_in_failed", {
        provider: "google",
        error_code: errorCode,
        message: errorMessage,
      });
      const isCancelled = error &&
        typeof error === "object" &&
        "code" in error &&
        (error as { code: unknown }).code === statusCodes.SIGN_IN_CANCELLED;
      if (!isCancelled) {
        toast.show({
          message: t("auth.errors.googleSignInFailed"),
          variant: "error",
          duration: 5000,
        });
      }
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
      if (!error) router.replace(ROUTES.HOME.path);
      if (error) throw error;
    } catch (e) {
      const errorCode = typeof e === "object" && e && "code" in e
        ? String((e as { code: unknown }).code)
        : e instanceof Error
        ? e.name
        : "unknown";
      const errorMessage = e instanceof Error ? e.message : null;
      captureEvent("auth_social_sign_in_failed", {
        provider: "apple",
        error_code: errorCode,
        message: errorMessage,
      });
      const isCancelled = typeof e === "object" && e !== null && "code" in e &&
        (e as { code: string }).code === "ERR_REQUEST_CANCELED";
      if (!isCancelled) {
        toast.show({
          message: t("auth.errors.appleSignInFailed"),
          variant: "error",
          duration: 5000,
        });
      }
    }
  }, [t, toast, router]);

  return { onGooglePress, onApplePress };
}
