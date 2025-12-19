/**
 * tRPC client initialization and configuration
 *
 * ## Type Safety Strategy
 * 
 * The AppRouter type is imported from @scf/supabase/client-types which uses a safe
 * type export strategy (app-router-safe-type.ts) to avoid issues with @ts-nocheck files.
 * 
 * The router structure includes these namespaces:
 * - profile: Profile management (general, employment, skills, etc.)
 * - auth: Authentication endpoints
 * - jobs: Job listings and applications
 * - applications: Application submissions
 * - And many more (see packages/supabase/functions/trpc/routers/_app-impl.ts)
 * 
 * ## Type Checking
 * 
 * - The AppRouter type is extracted directly from the actual router instance
 * - Type-only imports allow TypeScript to infer types even from @ts-nocheck files
 * - This ensures proper autocomplete and type safety in the client application
 */

import { getGlobalQueryClient } from '@scf/core/provider/react-query/queryClient';
import type { AppRouter } from '@scf/supabase/client-types';
import { httpBatchLink, TRPCClientError, type TRPCLink } from '@trpc/client';
import { createTRPCReact } from '@trpc/react-query';
import { observable } from '@trpc/server/observable';
import Constants from 'expo-constants';
import { Platform } from 'react-native';
import { clearAllAuthStorage } from './auth/clearAuthStorage';
import { supabase } from './supabase/client';

/**
 * tRPC React client instance
 * 
 * This client provides type-safe access to all backend procedures defined in the AppRouter.
 * The type is properly inferred from the actual router implementation, ensuring:
 * - Autocomplete for all available procedures
 * - Type checking for procedure inputs and outputs
 * - Runtime type validation via tRPC
 * 
 * @example
 * ```ts
 * // Query example
 * const { data } = api.profile.general.get.useQuery();
 * 
 * // Mutation example
 * const mutation = api.profile.skills.addSkill.useMutation();
 * ```
 */
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

const supabaseExtra = (Constants?.expoConfig?.extra as {
  supabase?: { url?: string; anonKey?: string };
})?.supabase;

const resolvedSupabaseUrl =
  process.env.EXPO_PUBLIC_SUPABASE_URL ?? supabaseExtra?.url;
const resolvedSupabaseAnonKey =
  process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY ?? supabaseExtra?.anonKey;

if (!resolvedSupabaseUrl) {
  throw new Error(
    "EXPO_PUBLIC_SUPABASE_URL is not configured. Update app.config.ts extra.supabase.url or the build env."
  );
}

if (!resolvedSupabaseAnonKey) {
  throw new Error(
    "EXPO_PUBLIC_SUPABASE_ANON_KEY is not configured. Update app.config.ts extra.supabase.anonKey or the build env."
  );
}

export const createTrpcClient = () =>
  api.createClient({
    links: [
      // Error handling link - detects invalid sessions and signs out
      // This prevents stale sessions after DB resets from causing issues
      sessionValidationLink,
      httpBatchLink({
        url: `${resolvedSupabaseUrl}/functions/v1/trpc`,
        async headers() {
          const headers = new Map<string, string>();

          // Set platform-specific source header
          headers.set(
            "x-trpc-source",
            Platform.OS === "web" ? "expo-web" : "expo-react",
          );

          // Always include apikey header for Supabase Edge Functions
          const anonKey = resolvedSupabaseAnonKey;
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
} from '@scf/supabase/client-types';

// Export constants and schemas for form usage
export {
  AVAILABILITY_OPTIONS,
  DRIVERS_LICENSE_OPTIONS,
  MILITARY_STATUS_OPTIONS,
  profileEmploymentDefaults,
  profileEmploymentInputSchema,
} from '@scf/supabase/client-types';
