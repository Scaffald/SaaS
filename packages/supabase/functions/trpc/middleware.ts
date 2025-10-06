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
      user: { ...ctx.user },
      userToken: ctx.userToken,
      supabase: ctx.supabase,
    },
  });
});

/**
 * Middleware to enforce super admin role
 * Checks if user has super_admin role before proceeding
 */
export const enforceSuperAdmin = t.middleware(async ({ ctx, next }) => {
  if (!ctx.user) {
    throw new TRPCError({ code: "UNAUTHORIZED" });
  }

  const { data, error } = await ctx.supabase.rpc("user_has_role", {
    p_user_id: ctx.user.id,
    p_role_name: "super_admin",
    p_org_id: null,
  });

  if (error || !data) {
    throw new TRPCError({
      code: "FORBIDDEN",
      message: "Super admin access required",
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
 * Super admin procedure - requires super admin role
 */
export const superAdminProcedure = t.procedure.use(enforceSuperAdmin);
