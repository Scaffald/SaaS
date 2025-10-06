import { httpBatchLink } from "@trpc/client";
import { createTRPCReact } from "@trpc/react-query";
import { Platform } from "react-native";
import type { AppRouter } from "@app/supabase/client-types";

import { getBaseUrl } from "./getBaseUrl";
import { supabase } from "./supabase/client";

// Create tRPC React client with proper typing from shared supabase package
// biome-ignore lint/suspicious/noExplicitAny: Required for cross-environment tRPC compatibility
export const api = createTRPCReact<AppRouter>() as any;

export const createTrpcClient = () =>
  // biome-ignore lint/suspicious/noExplicitAny: Required for tRPC router compatibility
  (api as any).createClient({
    links: [
      httpBatchLink({
        url: `${process.env.EXPO_PUBLIC_SUPABASE_URL}/functions/v1/trpc`,
        async headers() {
          const headers = new Map<string, string>();

          // Set platform-specific source header
          headers.set(
            "x-trpc-source",
            Platform.OS === "web" ? "expo-web" : "expo-react",
          );

          const session = (await supabase.auth.getSession()).data.session;

          // Add auth header for Supabase authentication
          if (session?.access_token) {
            headers.set("Authorization", `Bearer ${session.access_token}`);
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
