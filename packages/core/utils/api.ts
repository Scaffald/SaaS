// @ts-nocheck
/**
 * tRPC client initialization and configuration
 *
 * This file uses @ts-nocheck because createTRPCReact<AppRouter>() returns
 * an object whose type exposes the AppRouter type, which ultimately derives
 * from @ts-nocheck files on the server. TypeScript cannot properly name these
 * complex types (TS4023 error), but the code works correctly at runtime.
 */

import { getGlobalQueryClient } from "@app/core/provider/react-query/queryClient";
import type { AppRouter } from "@app/supabase/client-types";
import { httpBatchLink, TRPCClientError, type TRPCLink } from "@trpc/client";
import { createTRPCReact } from "@trpc/react-query";
import { observable } from "@trpc/server/observable";
import { Platform } from "react-native";
import { clearAllAuthStorage } from "./auth/clearAuthStorage";
import { supabase } from "./supabase/client";
// Create tRPC React client with proper typing from shared supabase package
// Note: AppRouter is a placeholder type to avoid importing Deno-specific code
// The actual router types are provided at runtime
export const api = createTRPCReact<AppRouter>();

// Custom error handling link for session validation
const sessionValidationLink: TRPCLink<AppRouter> = () => {
  return ({ next, op }) => {
    return observable((observer) => {
      const unsubscribe = next(op).subscribe({
        next: observer.next.bind(observer),
        error: async (err) => {
          // Check if this is an UNAUTHORIZED error indicating invalid session
          if (
            err instanceof TRPCClientError && err.data?.code === "UNAUTHORIZED"
          ) {
            console.log(
              "[tRPC] UNAUTHORIZED error detected - invalid or expired session",
            );
            console.log(
              "[tRPC] Triggering comprehensive auth cleanup and redirect",
            );

            // Get query client for cache clearing
            const queryClient = getGlobalQueryClient();

            // Perform comprehensive cleanup
            await clearAllAuthStorage(queryClient || undefined);

            console.log(
              "[tRPC] Auth cleanup completed - user will be redirected to /auth",
            );
          }
          observer.error(err);
        },
        complete: observer.complete.bind(observer),
      });
      return unsubscribe;
    });
  };
};

export const createTrpcClient = () =>
  api.createClient({
    links: [
      // Error handling link - detects invalid sessions and signs out
      // This prevents stale sessions after DB resets from causing issues
      sessionValidationLink,
      httpBatchLink({
        url: `${process.env.EXPO_PUBLIC_SUPABASE_URL}/functions/v1/trpc`,
        async headers() {
          const headers = new Map<string, string>();

          // Set platform-specific source header
          headers.set(
            "x-trpc-source",
            Platform.OS === "web" ? "expo-web" : "expo-react",
          );

          // Always include apikey header for Supabase Edge Functions
          const anonKey = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY;
          if (anonKey) {
            headers.set("apikey", anonKey);
          }

          const session = (await supabase.auth.getSession()).data.session;

          // Supabase Edge Functions require an Authorization header
          // Use user's access token if available, otherwise use anon key for public endpoints
          if (session?.access_token && session.access_token.trim().length > 0) {
            headers.set("Authorization", `Bearer ${session.access_token}`);
          } else if (anonKey) {
            // For public endpoints, use anon key as Bearer token
            // This satisfies Supabase's requirement for Authorization header
            headers.set("Authorization", `Bearer ${anonKey}`);
          }

          return Object.fromEntries(headers);
        },
      }),
    ],
  });

// Export individual types for easier usage
export type {
  EmploymentProfileFormData,
  ProfileEmploymentInput,
  ProfileEmploymentOutput,
  ProfileGeneralInput,
  ProfileGeneralOutput,
  ProfileSkillsInput,
  ProfileSkillsOutput,
  UploadAvatarInput,
  UploadAvatarOutput,
} from "@app/supabase/client-types";

// Export constants and schemas for form usage
export {
  AVAILABILITY_OPTIONS,
  DRIVERS_LICENSE_OPTIONS,
  MILITARY_STATUS_OPTIONS,
  profileEmploymentDefaults,
  profileEmploymentInputSchema,
} from "@app/supabase/client-types";
