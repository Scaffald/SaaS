import { initTRPC, TRPCError } from "@trpc/server";
import type { Context } from "./context.ts";

// Initialize tRPC with context type
export const t = initTRPC.context<Context>().create();

/**
 * Middleware to enforce user authentication
 * Ensures user is logged in before accessing protected procedures
 */
export const enforceUserIsAuthed = t.middleware(({ ctx, next }) => {
  if (!ctx.user) {
    throw new TRPCError({ code: "UNAUTHORIZED" });
  }
  return next({
    ctx: {
      user: { id: ctx.user.id, email: ctx.user.email },
      userToken: ctx.userToken,
      supabase: ctx.supabase,
    },
  });
});

/**
 * Middleware to enforce office role
 * Checks if user has office role before proceeding
 */
export const enforceOfficeRole = t.middleware(async ({ ctx, next }) => {
  if (!ctx.user) {
    throw new TRPCError({ code: "UNAUTHORIZED" });
  }

  const { data, error } = await ctx.supabase.rpc("user_has_role", {
    p_user_id: ctx.user.id,
    p_role_name: "office",
    p_org_id: null,
  });

  if (error || !data) {
    throw new TRPCError({
      code: "FORBIDDEN",
      message: "Office access required",
    });
  }

  return next({ ctx });
});

/**
 * Base procedure - no authentication required
 */
export const publicProcedure = t.procedure;

/**
 * Protected procedure - requires authentication
 */
export const protectedProcedure = t.procedure.use(enforceUserIsAuthed);

/**
 * Office procedure - requires office role
 */
export const officeProcedure = t.procedure.use(enforceOfficeRole);
