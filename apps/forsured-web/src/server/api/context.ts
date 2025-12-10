/**
 * tRPC Context Creation
 * REQ-292: Configure tRPC for production deployment
 * TASK-1: Set up tRPC core infrastructure
 *
 * Creates context for each tRPC request containing:
 * - Database connection
 * - User session (if authenticated)
 * - Organization ID (if authenticated)
 */

import type { FetchCreateContextFnOptions } from '@trpc/server/adapters/fetch';
import { supabase } from '../../lib/supabase';
import type { User } from '@supabase/supabase-js';

/**
 * Context type for tRPC procedures
 */
export interface Context {
  db: typeof supabase;
  session: User | null;
  organizationId: string | null;
}

/**
 * Creates context for tRPC procedures
 * Extracts authentication state from request headers
 */
export async function createContext(
  opts: FetchCreateContextFnOptions
): Promise<Context> {
  const { req } = opts;

  // Extract authorization header
  const authHeader = req.headers.get('authorization');
  const token = authHeader?.replace('Bearer ', '');

  let session: User | null = null;
  let organizationId: string | null = null;

  if (token) {
    try {
      // Get user from Supabase auth token
      const { data, error } = await supabase.auth.getUser(token);

      if (!error && data.user) {
        session = data.user;
        // Extract organization ID from user metadata
        organizationId =
          (data.user.user_metadata?.organization_id as string) || null;
      }
    } catch (error) {
      // Invalid token or auth error - continue with null session
      console.warn('Auth error in context creation:', error);
    }
  }

  return {
    db: supabase,
    session,
    organizationId,
  };
}
