import { z } from "zod";
import { TRPCError } from "@trpc/server";
import { protectedProcedure, t } from "../middleware.ts";

/**
 * Employers Router
 * Handles discovery and querying of organizations (employers)
 */
export const employersRouter = t.router({
  /**
   * Determine if the current user has linked employment with the organization
   */
  getOrganizationEmploymentStatus: protectedProcedure
    .input(
      z.object({
        organizationId: z.string().uuid(),
      }),
    )
    .query(async ({ ctx, input }) => {
      if (!ctx.user) {
        throw new TRPCError({ code: "UNAUTHORIZED" });
      }

      const { data, error } = await ctx.supabase
        .schema("core")
        .from("user_experience")
        .select("id, source, is_current, claimed_at, created_at")
        .eq("user_id", ctx.user.id)
        .eq("organization_id", input.organizationId)
        .order("is_current", { ascending: false })
        .order("created_at", { ascending: false })
        .limit(1)
        .maybeSingle();

      if (error && error.code !== "PGRST116") {
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: `Failed to check employment status: ${error.message}`,
        });
      }

      return {
        isLinked: Boolean(data?.id),
        experienceId: data?.id ?? null,
        source: data?.source ?? null,
        isCurrent: data?.is_current ?? false,
        claimedAt: data?.claimed_at ?? null,
        createdAt: data?.created_at ?? null,
      };
    }),

  /**
   * Link the current user to an organization via a lightweight experience record
   */
  claimOrganizationEmployment: protectedProcedure
    .input(
      z.object({
        organizationId: z.string().uuid(),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      if (!ctx.user) {
        throw new TRPCError({ code: "UNAUTHORIZED" });
      }

      const { data: existingExperience, error: existingError } = await ctx.supabase
        .schema("core")
        .from("user_experience")
        .select("id, source, is_current, claimed_at, created_at")
        .eq("user_id", ctx.user.id)
        .eq("organization_id", input.organizationId)
        .maybeSingle();

      if (existingError && existingError.code !== "PGRST116") {
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: `Failed to check existing employment: ${existingError.message}`,
        });
      }

      if (existingExperience) {
        return {
          alreadyLinked: true,
          experience: existingExperience,
        };
      }

      const { data: organization, error: organizationError } = await ctx.supabase
        .schema("core")
        .from("organizations")
        .select("name")
        .eq("id", input.organizationId)
        .single();

      if (organizationError) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: `Organization not found: ${organizationError.message}`,
        });
      }

      const { data: experience, error: createError } = await ctx.supabase
        .schema("core")
        .from("user_experience")
        .insert({
          user_id: ctx.user.id,
          organization_id: input.organizationId,
          job_title: "Team Member",
          company_name: organization.name ?? "Unknown Organization",
          is_current: true,
          source: "claim",
          claimed_at: new Date().toISOString(),
        })
        .select("id, source, is_current, claimed_at, created_at")
        .single();

      if (createError) {
        if (createError.code === "23505") {
          const { data: existing, error: fetchError } = await ctx.supabase
            .schema("core")
            .from("user_experience")
            .select("id, source, is_current, claimed_at, created_at")
            .eq("user_id", ctx.user.id)
            .eq("organization_id", input.organizationId)
            .single();

          if (fetchError && fetchError.code !== "PGRST116") {
            throw new TRPCError({
              code: "INTERNAL_SERVER_ERROR",
              message: `Failed to confirm existing employment link: ${fetchError.message}`,
            });
          }

          if (existing) {
            return {
              alreadyLinked: true,
              experience: existing,
            };
          }
        }

        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: `Failed to create employment link: ${createError.message}`,
        });
      }

      return {
        alreadyLinked: false,
        experience: experience,
      };
    }),

  /**
   * Remove the lightweight employment link created via the dashboard flow
   */
  removeOrganizationEmployment: protectedProcedure
    .input(
      z.object({
        organizationId: z.string().uuid(),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      if (!ctx.user) {
        throw new TRPCError({ code: "UNAUTHORIZED" });
      }

      const { data: deletedRows, error } = await ctx.supabase
        .schema("core")
        .from("user_experience")
        .delete()
        .eq("user_id", ctx.user.id)
        .eq("organization_id", input.organizationId)
        .eq("source", "claim")
        .select("id");

      if (error) {
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: `Failed to remove employment link: ${error.message}`,
        });
      }

      return {
        removed: (deletedRows ?? []).length > 0,
      };
    }),

  /**
   * Determine if the current user follows a specific organization
   */
  getOrganizationFollowStatus: protectedProcedure
    .input(
      z.object({
        organizationId: z.string().uuid(),
      }),
    )
    .query(async ({ ctx, input }) => {
      if (!ctx.user) {
        throw new TRPCError({ code: "UNAUTHORIZED" });
      }

      const { data, error } = await ctx.supabase
        .schema("core")
        .from("follows")
        .select("id, created_at")
        .match({
          follower_type: "user",
          follower_id: ctx.user.id,
          followee_type: "organization",
          followee_id: input.organizationId,
        })
        .maybeSingle();

      if (error && error.code !== "PGRST116") {
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: `Failed to check follow status: ${error.message}`,
        });
      }

      return {
        isFollowing: Boolean(data?.id),
        followId: data?.id ?? null,
        createdAt: data?.created_at ?? null,
      };
    }),

  /**
   * Follow an organization as the current user
   */
  followOrganization: protectedProcedure
    .input(
      z.object({
        organizationId: z.string().uuid(),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      if (!ctx.user) {
        throw new TRPCError({ code: "UNAUTHORIZED" });
      }

      const payload = {
        follower_type: "user" as const,
        follower_id: ctx.user.id,
        followee_type: "organization" as const,
        followee_id: input.organizationId,
      };

      const { data, error } = await ctx.supabase
        .schema("core")
        .from("follows")
        .insert(payload)
        .select("id, created_at")
        .single();

      if (error) {
        if (error.code === "23505") {
          const { data: existing, error: fetchError } = await ctx.supabase
            .schema("core")
            .from("follows")
            .select("id, created_at")
            .match(payload)
            .single();

          if (fetchError && fetchError.code !== "PGRST116") {
            throw new TRPCError({
              code: "INTERNAL_SERVER_ERROR",
              message: `Failed to confirm existing follow: ${fetchError.message}`,
            });
          }

          if (existing) {
            return {
              alreadyFollowing: true,
              follow: existing,
            };
          }
        }

        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: `Failed to follow organization: ${error.message}`,
        });
      }

      return {
        alreadyFollowing: false,
        follow: data,
      };
    }),

  /**
   * Unfollow an organization as the current user
   */
  unfollowOrganization: protectedProcedure
    .input(
      z.object({
        organizationId: z.string().uuid(),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      if (!ctx.user) {
        throw new TRPCError({ code: "UNAUTHORIZED" });
      }

      const { error } = await ctx.supabase
        .schema("core")
        .from("follows")
        .delete()
        .match({
          follower_type: "user",
          follower_id: ctx.user.id,
          followee_type: "organization",
          followee_id: input.organizationId,
        });

      if (error) {
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: `Failed to unfollow organization: ${error.message}`,
        });
      }

      return { success: true };
    }),

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

      // Apply search filter
      if (input?.search && input.search.trim().length > 0) {
        const searchTerm = input.search.trim();
        query = query.or(
          `name.ilike.%${searchTerm}%,slug.ilike.%${searchTerm}%,website.ilike.%${searchTerm}%`,
        );
      }

      // Apply industry filter
      if (input?.industryIds && input.industryIds.length > 0) {
        query = query.in("industry_id", input.industryIds);
      }

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
