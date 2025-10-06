import { z } from "zod";
import { t } from "../middleware.ts";

/**
 * Employers Router
 * Handles discovery and querying of organizations (employers)
 */
export const employersRouter = t.router({
  /**
   * Get all organizations with filtering
   */
  getEmployers: t.procedure
    .input(
      z
        .object({
          search: z.string().optional(),
          industryIds: z.array(z.string()).optional(),
          employeeCountRanges: z.array(z.string()).optional(),
          limit: z.number().min(1).max(100).default(50),
        })
        .optional(),
    )
    .query(async ({ ctx, input }) => {
      let query = ctx.supabase
        .from("organizations")
        .select(
          `
          id,
          name,
          slug,
          description,
          website_url,
          employee_count_range,
          annual_revenue_range,
          visibility,
          address,
          industry_id,
          industries (
            id,
            name
          ),
          created_at,
          updated_at
        `,
        )
        .eq("visibility", "public")
        .order("created_at", { ascending: false });

      // Apply limit
      if (input?.limit) {
        query = query.limit(input.limit);
      }

      const { data: organizations, error } = await query;

      if (error) {
        throw new Error(`Failed to fetch organizations: ${error.message}`);
      }

      return {
        employers: organizations || [],
        total: organizations?.length || 0,
      };
    }),

  /**
   * Get a single organization by ID
   */
  getEmployerById: t.procedure
    .input(
      z.object({
        id: z.string().uuid(),
      }),
    )
    .query(async ({ ctx, input }) => {
      const { data: organization, error } = await ctx.supabase
        .from("organizations")
        .select(
          `
          id,
          name,
          slug,
          description,
          website_url,
          employee_count_range,
          annual_revenue_range,
          visibility,
          address,
          industry_id,
          industries (
            id,
            name
          ),
          owner_user_id,
          created_at,
          updated_at
        `,
        )
        .eq("id", input.id)
        .eq("visibility", "public")
        .single();

      if (error) {
        throw new Error(`Failed to fetch organization: ${error.message}`);
      }

      return organization;
    }),

  /**
   * Get organization by slug
   */
  getEmployerBySlug: t.procedure
    .input(
      z.object({
        slug: z.string(),
      }),
    )
    .query(async ({ ctx, input }) => {
      const { data: organization, error } = await ctx.supabase
        .from("organizations")
        .select(
          `
          id,
          name,
          slug,
          description,
          website_url,
          employee_count_range,
          annual_revenue_range,
          visibility,
          address,
          industry_id,
          industries (
            id,
            name
          ),
          created_at,
          updated_at
        `,
        )
        .eq("slug", input.slug)
        .eq("visibility", "public")
        .single();

      if (error) {
        throw new Error(`Failed to fetch organization: ${error.message}`);
      }

      return organization;
    }),
});
