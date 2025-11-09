import { TRPCError } from "@trpc/server";

import { protectedProcedure, t } from "../middleware.ts";

/**
 * Auth router - handles authentication-related operations
 */
export const authRouter = t.router({
  /**
   * Get user roles
   * Returns list of roles assigned to the authenticated user
   */
  getUserRoles: protectedProcedure.query(async ({ ctx }) => {
    const { data, error } = await ctx.supabase
      .schema("core")
      .from("role_assignments")
      .select("role:roles(name)")
      .eq("user_id", ctx.user.id);

    if (error) {
      console.error("[auth.getUserRoles] Failed to fetch roles", {
        userId: ctx.user.id,
        error: error.message,
      });
      throw new TRPCError({
        code: "INTERNAL_SERVER_ERROR",
        message: "Unable to load user roles",
        cause: error,
      });
    }

    const roles =
      (data as Array<{ role: { name: string } | null }> | null)
        ?.map((r) => r.role?.name)
        .filter((name): name is string => Boolean(name)) ?? [];

    if (process.env.NODE_ENV !== "production") {
      console.debug("[auth.getUserRoles] Roles fetched", {
        userId: ctx.user.id,
        roleCount: roles.length,
      });
    }

    return { roles };
  }),
});
