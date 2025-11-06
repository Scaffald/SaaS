import { z } from "zod";
import { t } from "../middleware.ts";

/**
 * Organizations Router
 * Handles organization-specific queries and operations
 */
export const organizationsRouter = t.router({
  /**
   * Get open jobs count for an organization
   */
  getOpenJobsCount: t.procedure
    .input(
      z.object({
        organizationId: z.string().uuid(),
      }),
    )
    .query(async ({ ctx, input }) => {
      const { count, error } = await ctx.supabase
        .schema("core")
        .from("jobs")
        .select("*", { count: "exact", head: true })
        .eq("organization_id", input.organizationId)
        .eq("status", "open");

      if (error) {
        throw new Error(`Failed to fetch open jobs count: ${error.message}`);
      }

      return {
        count: count || 0,
        organizationId: input.organizationId,
      };
    }),

  /**
   * Get organization by ID
   */
  getOrganization: t.procedure
    .input(
      z.object({
        id: z.string().uuid(),
      }),
    )
    .query(async ({ ctx, input }) => {
      const { data: organization, error } = await ctx.supabase
        .schema("core")
        .from("organizations")
        .select(
          `
          id,
          name,
          slug,
          description,
          website,
          visibility,
          address,
          logo_url,
          industry_id,
          industries (
            id,
            name,
            slug
          ),
          owner_user_id,
          created_at,
          updated_at
        `,
        )
        .eq("id", input.id)
        .single();

      if (error) {
        throw new Error(`Failed to fetch organization: ${error.message}`);
      }

      return organization;
    }),
});
