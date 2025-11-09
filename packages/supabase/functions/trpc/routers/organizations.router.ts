import { TRPCError } from "@trpc/server";
import { z } from "zod";
import { protectedProcedure, t } from "../middleware.ts";

const organizationRequestInputSchema = z.object({
  name: z.string().min(1, "Name is required").max(255),
  slug: z
    .string()
    .min(1, "Slug is required")
    .max(120, "Slug must be 120 characters or fewer"),
  website: z
    .string()
    .trim()
    .url("Website must be a valid URL")
    .max(255)
    .optional(),
  notes: z
    .string()
    .trim()
    .max(1000, "Notes must be 1000 characters or fewer")
    .optional(),
});

/**
 * Organizations Router
 * Handles organization-specific queries and operations
 */
export const organizationsRouter = t.router({
  /**
   * Create a moderated organization request accessible to dashboard users.
   * Persists request for office review while enforcing slug uniqueness across
   * live organizations and pending requests.
   */
  createOrganizationRequest: protectedProcedure
    .input(organizationRequestInputSchema)
    .mutation(async ({ ctx, input }) => {
      if (!ctx.user) {
        throw new TRPCError({ code: "UNAUTHORIZED" });
      }

      const trimmedName = input.name.trim();
      const normalizedSlug = input.slug.trim().toLowerCase();
      const slugPattern = /^[a-z0-9-]+$/;

      if (!slugPattern.test(normalizedSlug)) {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message:
            "Slug must contain only lowercase letters, numbers, and hyphens.",
        });
      }

      // Ensure slug is not already in use by an existing organization
      const { data: existingOrganization, error: existingOrgError } =
        await ctx.supabase
          .schema("core")
          .from("organizations")
          .select("id")
          .eq("slug", normalizedSlug)
          .maybeSingle();

      if (existingOrgError && existingOrgError.code !== "PGRST116") {
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: `Failed to validate organization slug: ${existingOrgError.message}`,
        });
      }

      if (existingOrganization) {
        throw new TRPCError({
          code: "CONFLICT",
          message: "An organization with this slug already exists.",
        });
      }

      // Ensure no pending or approved request already exists for this slug
      const { data: existingRequest, error: existingRequestError } =
        await ctx.supabase
          .schema("core")
          .from("organization_requests")
          .select("id, status, created_by_user_id")
          .eq("slug", normalizedSlug)
          .in("status", ["pending", "approved"])
          .maybeSingle();

      if (existingRequestError && existingRequestError.code !== "PGRST116") {
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: `Failed to validate organization request: ${existingRequestError.message}`,
        });
      }

      if (existingRequest) {
        const isOwnRequest = existingRequest.created_by_user_id === ctx.user.id;
        throw new TRPCError({
          code: "CONFLICT",
          message: isOwnRequest
            ? "You already have a pending request for this organization."
            : "Another user already requested this organization and it is pending review.",
        });
      }

      const { data: request, error: requestError } = await ctx.supabase
        .schema("core")
        .from("organization_requests")
        .insert({
          name: trimmedName,
          slug: normalizedSlug,
          website: input.website?.trim() ?? null,
          notes: input.notes?.trim() ?? null,
          created_by_user_id: ctx.user.id,
        })
        .select(
          `
          id,
          name,
          slug,
          status,
          created_at
        `,
        )
        .single();

      if (requestError) {
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: `Failed to submit organization request: ${requestError.message}`,
        });
      }

      return { request };
    }),

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
