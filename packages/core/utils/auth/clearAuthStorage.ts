import { Platform } from "react-native";
import type { QueryClient } from "@tanstack/react-query";
import { supabase } from "../supabase/client";

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
    console.log("[clearAuthStorage] Signing out from Supabase");
    const { error } = await supabase.auth.signOut();
    if (error) {
      console.error("[clearAuthStorage] Supabase signOut error:", error);
    }

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
        (key.startsWith("sb-") ||
          key.includes("supabase") ||
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
        document.cookie =
          `${name}=;expires=Thu, 01 Jan 1970 00:00:00 GMT;path=/`;
        document.cookie =
          `${name}=;expires=Thu, 01 Jan 1970 00:00:00 GMT;path=/;domain=${window.location.hostname}`;
        // Try with leading dot for subdomain cookies
        document.cookie =
          `${name}=;expires=Thu, 01 Jan 1970 00:00:00 GMT;path=/;domain=.${window.location.hostname}`;
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
