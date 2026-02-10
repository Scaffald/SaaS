/**
 * tRPC Context Creation
 * tRPC context and production configuration
 *
 * Creates context for each tRPC request containing:
 * - Database connection
 * - User session (if authenticated)
 * - Organization ID (if authenticated)
 */

import type { FetchCreateContextFnOptions } from "@trpc/server/adapters/fetch";
import { supabase } from "../../lib/supabase";
import type { User } from "@supabase/supabase-js";

/**
 * Context type for tRPC procedures
 */
export interface Context {
  db: typeof supabase;
  session: User | null;
  userId: string | null;
  organizationId: string | null;
  accessToken: string | null; // Access token for calling Edge Functions
  req?: Request; // Request object for accessing headers
}

/**
 * Creates context for tRPC procedures
 * Extracts authentication state from request headers
 */
export async function createContext(
  opts: FetchCreateContextFnOptions,
): Promise<Context> {
  const { req } = opts;

  // Extract authorization header
  const authHeader = req.headers.get("authorization");
  const token = authHeader?.replace("Bearer ", "");

  let session: User | null = null;
  let userId: string | null = null;
  let organizationId: string | null = null;
  let accessToken: string | null = token || null;

  if (token) {
    try {
      // Handle E2E test tokens (mock-supabase-token-*)
      // These tokens are set by tests/utils/auth.ts for E2E testing
      if (token.startsWith("mock-supabase-token-")) {
        const mockUserId = token.replace("mock-supabase-token-", "");
        // Create a mock user object for test context
        session = {
          id: mockUserId,
          email: `test-${mockUserId}@test.forsured.com`,
          aud: "authenticated",
          role: "authenticated",
          app_metadata: {},
          user_metadata: {},
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        } as User;
        userId = mockUserId;
        organizationId = `org-${mockUserId}`;
      } else {
        // Get user from Supabase auth token (production flow)
        const { data, error } = await supabase.auth.getUser(token);

        if (!error && data.user) {
          session = data.user;
          userId = data.user.id;
          // Extract organization ID from user metadata
          organizationId =
            (data.user.user_metadata?.organization_id as string) || null;
        }
      }
    } catch (error) {
      // Invalid token or auth error - continue with null session
      console.warn("Auth error in context creation:", error);
    }
  }

  return {
    db: supabase,
    session,
    userId,
    organizationId,
    accessToken, // Store access token for Edge Function calls
    req, // Include request for accessing headers in routers
  };
}
