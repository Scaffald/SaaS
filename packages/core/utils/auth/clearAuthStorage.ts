import type { QueryClient } from "@tanstack/react-query";
import { Platform } from "react-native";
import { supabase } from "../supabase/client.ts";

type CookieStoreDeleteTarget = string | {
  name: string;
  domain?: string;
  path?: string;
};

/**
 * Comprehensive auth storage cleanup utility
 * Clears all authentication-related storage across platforms
 *
 * This function should be called when:
 * - Session becomes invalid (UNAUTHORIZED errors)
 * - User explicitly signs out
 * - Session expires and needs to be cleared
 *
 * @param queryClient - React Query client for cache clearing
 */
export async function clearAllAuthStorage(
  queryClient?: QueryClient,
): Promise<void> {
  console.log("[clearAuthStorage] Starting comprehensive auth cleanup");

  try {
    // 1. Clear React Query cache
    if (queryClient) {
      console.log("[clearAuthStorage] Clearing React Query cache");
      queryClient.clear();
    }

    // 2. Sign out from Supabase (this clears Supabase's internal storage)
    await handleSupabaseSignOut();

    // 3. Platform-specific storage cleanup
    if (Platform.OS === "web") {
      await clearWebStorage();
    } else {
      await clearNativeStorage();
    }

    console.log("[clearAuthStorage] Auth cleanup completed successfully");
  } catch (error) {
    console.error("[clearAuthStorage] Error during cleanup:", error);
    // Don't throw - we want cleanup to be as complete as possible
  }
}

async function handleSupabaseSignOut(): Promise<void> {
  console.log("[clearAuthStorage] Signing out from Supabase");

  try {
    const {
      data: { session },
      error: getSessionError,
    } = await supabase.auth.getSession();

    if (getSessionError) {
      console.error(
        "[clearAuthStorage] Error fetching current session before sign out:",
        getSessionError,
      );
    }

    if (!session) {
      console.log(
        "[clearAuthStorage] No active Supabase session detected, performing local sign out",
      );
      await performLocalSignOut();
      return;
    }

    // Check if session is expired before attempting signOut
    if (session.expires_at && isSessionExpired(session.expires_at)) {
      console.log(
        "[clearAuthStorage] Session expired, performing local cleanup only",
      );
      await performLocalSignOut();
      return;
    }

    const { error: signOutError } = await supabase.auth.signOut();
    if (signOutError) {
      console.error("[clearAuthStorage] Supabase signOut error:", signOutError);

      if (signOutError.name === "AuthSessionMissingError") {
        console.log(
          "[clearAuthStorage] Session already missing, ensuring local auth storage is cleared",
        );
        await performLocalSignOut();
      }
    }
  } catch (error) {
    console.error(
      "[clearAuthStorage] Unexpected error during sign out:",
      error,
    );
    await performLocalSignOut();
  }
}

async function performLocalSignOut(): Promise<void> {
  try {
    const { error } = await supabase.auth.signOut({ scope: "local" });
    if (error) {
      // AuthSessionMissingError is expected when session is already gone
      if (error.name === "AuthSessionMissingError") {
        console.log(
          "[clearAuthStorage] Session already cleared (expected for expired sessions)",
        );
      } else {
        console.error(
          "[clearAuthStorage] Local Supabase signOut error:",
          error,
        );
      }
    } else {
      console.log(
        "[clearAuthStorage] Local Supabase session cleared successfully",
      );
    }
  } catch (error) {
    // Handle AuthSessionMissingError in catch block as well
    if (
      error &&
      typeof error === "object" &&
      "name" in error &&
      error.name === "AuthSessionMissingError"
    ) {
      console.log(
        "[clearAuthStorage] Session already cleared (expected for expired sessions)",
      );
    } else {
      console.error(
        "[clearAuthStorage] Unexpected error during local sign out:",
        error,
      );
    }
  }
}

/**
 * Clear web storage (localStorage, sessionStorage, cookies)
 */
async function clearWebStorage(): Promise<void> {
  console.log("[clearAuthStorage] Clearing web storage");

  try {
    // Clear localStorage items related to auth
    const authKeys = [
      "supabase.auth.token",
      "sb-auth-token",
      "sb-access-token",
      "sb-refresh-token",
    ];

    // Clear specific auth keys
    for (const key of authKeys) {
      localStorage.removeItem(key);
    }

    // Clear any keys that start with supabase auth patterns
    const keysToRemove: string[] = [];
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (
        key &&
        (key.startsWith("sb-") || key.includes("supabase") ||
          key.includes("auth"))
      ) {
        keysToRemove.push(key);
      }
    }
    for (const key of keysToRemove) {
      localStorage.removeItem(key);
    }

    // Clear sessionStorage
    sessionStorage.clear();

    const cookieStoreApi = (globalThis as typeof globalThis & {
      cookieStore?: {
        delete: (options: CookieStoreDeleteTarget) => Promise<void>;
      };
    }).cookieStore;

    let cookieStoreWarningLogged = false;
    const deleteCookie = async (cookieName: string) => {
      if (!cookieStoreApi) {
        if (!cookieStoreWarningLogged) {
          console.warn(
            "[clearAuthStorage] Cookie Store API not available; skipping cookie deletion",
          );
          cookieStoreWarningLogged = true;
        }
        return;
      }

      const targets: CookieStoreDeleteTarget[] = [cookieName];
      const hostname = typeof window !== "undefined"
        ? window.location.hostname
        : undefined;
      if (hostname) {
        targets.push({ name: cookieName, path: "/", domain: hostname });
        targets.push({ name: cookieName, path: "/", domain: `.${hostname}` });
      }

      for (const target of targets) {
        await cookieStoreApi.delete(target);
      }
    };

    // Clear cookies (best effort - some may be httpOnly)
    const cookies = document.cookie.split(";");
    for (const cookie of cookies) {
      const eqPos = cookie.indexOf("=");
      const name = eqPos > -1
        ? cookie.substring(0, eqPos).trim()
        : cookie.trim();

      // Clear auth-related cookies
      if (
        name.includes("sb-") ||
        name.includes("supabase") ||
        name.includes("auth") ||
        name.includes("session")
      ) {
        await deleteCookie(name);
      }
    }

    console.log("[clearAuthStorage] Web storage cleared");
  } catch (error) {
    console.error("[clearAuthStorage] Error clearing web storage:", error);
  }
}

/**
 * Clear native storage (AsyncStorage)
 */
async function clearNativeStorage(): Promise<void> {
  console.log("[clearAuthStorage] Clearing native storage");

  try {
    // Dynamic import for React Native AsyncStorage
    const AsyncStorage =
      require("@react-native-async-storage/async-storage").default;

    // Get all keys
    const allKeys = await AsyncStorage.getAllKeys();

    // Filter for auth-related keys
    const authKeys = allKeys.filter(
      (key: string) =>
        key.startsWith("sb-") ||
        key.includes("supabase") ||
        key.includes("auth") ||
        key.includes("session"),
    );

    if (authKeys.length > 0) {
      console.log(
        `[clearAuthStorage] Removing ${authKeys.length} auth keys from AsyncStorage`,
      );
      await AsyncStorage.multiRemove(authKeys);
    }

    console.log("[clearAuthStorage] Native storage cleared");
  } catch (error) {
    console.error("[clearAuthStorage] Error clearing native storage:", error);
  }
}

/**
 * Check if the current session is expired
 * @param expiresAt - Unix timestamp (seconds) when session expires
 * @returns true if session is expired or will expire in the next 60 seconds
 */
export function isSessionExpired(expiresAt?: number): boolean {
  if (!expiresAt) return true;

  const now = Math.floor(Date.now() / 1000); // Current time in seconds
  const bufferSeconds = 60; // Consider expired if less than 60 seconds remaining

  return expiresAt - now < bufferSeconds;
}
