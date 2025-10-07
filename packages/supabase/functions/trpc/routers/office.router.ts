import { TRPCError } from "@trpc/server";
import { z } from "zod";
import { superAdminProcedure, t } from "../middleware.ts";
import {
  jobCreateSchema,
  jobPublishSchema,
  jobUpdateSchema,
} from "../../_shared/job-schemas.ts";

/**
 * Office router - super admin only operations
 */
export const officeRouter = t.router({
  /**
   * List all users
   * Returns paginated list of users with basic profile info
   */
  listUsers: superAdminProcedure.query(async ({ ctx }) => {
    const { data, error, count } = await ctx.supabase
      .from("profiles")
      .select(
        "id, first_name, last_name, avatar_path, created_at, updated_at",
        {
          count: "exact",
        },
      )
      .order("created_at", { ascending: false })
      .limit(50);

    if (error) {
      throw new TRPCError({
        code: "INTERNAL_SERVER_ERROR",
        message: error.message,
      });
    }

    return { users: data ?? [], total: count ?? 0 };
  }),

  /**
   * Get user details
   * TODO: Implement with proper input schema
   */
  getUser: superAdminProcedure.query(async ({ ctx }) => {
    const _res = await ctx.supabase;
    // For now, return mock data - will be implemented with proper input schema
    return { profile: null, privateData: null };
  }),

  /**
   * Update user
   * TODO: Implement with proper input schema
   */
  updateUser: superAdminProcedure.mutation(async ({ ctx }) => {
    const _res = await ctx.supabase;
    // For now, return success - will be implemented with proper input schema
    return { success: true };
  }),

  /**
   * List all jobs (admin view)
   * Returns jobs with optional filters
   */
  listJobs: superAdminProcedure
    .input(
      z.object({
        organization_id: z.string().uuid().optional(),
        status: z.enum(["draft", "open", "paused", "closed"]).optional(),
        limit: z.number().min(1).max(100).default(50),
        offset: z.number().min(0).default(0),
      }),
    )
    .query(async ({ ctx, input }) => {
      let query = ctx.supabase
        .from("jobs")
        .select(
          `
          id,
          title,
          description,
          status,
          employment_type,
          remote_option,
          location,
          pay_range_min_cents,
          pay_range_max_cents,
          pay_range_type,
          posted_at,
          created_at,
          updated_at,
          organization:organizations(id, name, slug),
          created_by:users(id, username, display_name)
        `,
          { count: "exact" },
        )
        .order("created_at", { ascending: false })
        .range(input.offset, input.offset + input.limit - 1);

      if (input.organization_id) {
        query = query.eq("organization_id", input.organization_id);
      }

      if (input.status) {
        query = query.eq("status", input.status);
      }

      const { data, error, count } = await query;

      if (error) {
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: `Failed to fetch jobs: ${error.message}`,
        });
      }

      return {
        jobs: data ?? [],
        total: count ?? 0,
      };
    }),

  /**
   * Get single job with full details
   */
  getJob: superAdminProcedure
    .input(z.object({ id: z.string().uuid() }))
    .query(async ({ ctx, input }) => {
      const { data, error } = await ctx.supabase
        .from("jobs")
        .select(
          `
          *,
          organization:organizations(id, name, slug),
          team:teams(id, name),
          created_by:users(id, username, display_name),
          job_certifications(
            certification:certifications(id, name, slug, issuing_organization)
          ),
          job_skills(
            skill:skills(id, name)
          )
        `,
        )
        .eq("id", input.id)
        .single();

      if (error) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: `Job not found: ${error.message}`,
        });
      }

      return { job: data };
    }),

  /**
   * Create new job
   */
  createJob: superAdminProcedure
    .input(jobCreateSchema)
    .mutation(async ({ ctx, input }) => {
      const { supabase, user } = ctx;

      if (!user) {
        throw new TRPCError({
          code: "UNAUTHORIZED",
          message: "User not authenticated",
        });
      }

      // Extract certification_ids and skill_ids before inserting job
      const { certification_ids, skill_ids, ...jobData } = input;

      // Insert job
      const { data: job, error: jobError } = await supabase
        .from("jobs")
        .insert({
          ...jobData,
          created_by_user_id: user.id,
        })
        .select()
        .single();

      if (jobError) {
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: `Failed to create job: ${jobError.message}`,
        });
      }

      // Insert certifications if provided
      if (certification_ids && certification_ids.length > 0) {
        const { error: certError } = await supabase
          .from("job_certifications")
          .insert(
            certification_ids.map((cert_id) => ({
              job_id: job.id,
              certification_id: cert_id,
              is_required: true,
            })),
          );

        if (certError) {
          console.error("Failed to insert certifications:", certError);
        }
      }

      // Insert skills if provided
      if (skill_ids && skill_ids.length > 0) {
        const { error: skillError } = await supabase
          .from("job_skills")
          .insert(
            skill_ids.map((skill_id) => ({
              job_id: job.id,
              skill_id: skill_id,
            })),
          );

        if (skillError) {
          console.error("Failed to insert skills:", skillError);
        }
      }

      return { job };
    }),

  /**
   * Update existing job
   */
  updateJob: superAdminProcedure
    .input(jobUpdateSchema)
    .mutation(async ({ ctx, input }) => {
      const { supabase } = ctx;
      const { id, certification_ids, skill_ids, ...jobData } = input;

      // Update job
      const { data: job, error: jobError } = await supabase
        .from("jobs")
        .update(jobData)
        .eq("id", id)
        .select()
        .single();

      if (jobError) {
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: `Failed to update job: ${jobError.message}`,
        });
      }

      // Update certifications if provided
      if (certification_ids !== undefined) {
        // Delete existing certifications
        await supabase.from("job_certifications").delete().eq("job_id", id);

        // Insert new certifications
        if (certification_ids.length > 0) {
          const { error: certError } = await supabase
            .from("job_certifications")
            .insert(
              certification_ids.map((cert_id) => ({
                job_id: id,
                certification_id: cert_id,
                is_required: true,
              })),
            );

          if (certError) {
            console.error("Failed to update certifications:", certError);
          }
        }
      }

      // Update skills if provided
      if (skill_ids !== undefined) {
        // Delete existing skills
        await supabase.from("job_skills").delete().eq("job_id", id);

        // Insert new skills
        if (skill_ids.length > 0) {
          const { error: skillError } = await supabase
            .from("job_skills")
            .insert(
              skill_ids.map((skill_id) => ({
                job_id: id,
                skill_id: skill_id,
              })),
            );

          if (skillError) {
            console.error("Failed to update skills:", skillError);
          }
        }
      }

      return { job };
    }),

  /**
   * Publish job (draft -> open)
   */
  publishJob: superAdminProcedure
    .input(z.object({ id: z.string().uuid() }))
    .mutation(async ({ ctx, input }) => {
      const { data: job, error } = await ctx.supabase
        .from("jobs")
        .update({
          status: "open",
          posted_at: new Date().toISOString(),
        })
        .eq("id", input.id)
        .select()
        .single();

      if (error) {
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: `Failed to publish job: ${error.message}`,
        });
      }

      return { job };
    }),

  /**
   * Close job
   */
  closeJob: superAdminProcedure
    .input(z.object({ id: z.string().uuid() }))
    .mutation(async ({ ctx, input }) => {
      const { data: job, error } = await ctx.supabase
        .from("jobs")
        .update({ status: "closed" })
        .eq("id", input.id)
        .select()
        .single();

      if (error) {
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: `Failed to close job: ${error.message}`,
        });
      }

      return { job };
    }),

  /**
   * Get all organizations (admin view)
   * Super admins can see and manage jobs for any organization
   */
  getOrganizations: superAdminProcedure.query(async ({ ctx }) => {
    const { data, error } = await ctx.supabase
      .from("organizations")
      .select("id, name, slug, owner_user_id")
      .order("name", { ascending: true });

    if (error) {
      throw new TRPCError({
        code: "INTERNAL_SERVER_ERROR",
        message: `Failed to fetch organizations: ${error.message}`,
      });
    }

    return { organizations: data ?? [] };
  }),

  /**
   * Get all certifications
   */
  getCertifications: superAdminProcedure.query(async ({ ctx }) => {
    const { data, error } = await ctx.supabase
      .from("certifications")
      .select("*")
      .eq("is_active", true)
      .order("name");

    if (error) {
      throw new TRPCError({
        code: "INTERNAL_SERVER_ERROR",
        message: `Failed to fetch certifications: ${error.message}`,
      });
    }

    return { certifications: data ?? [] };
  }),

  /**
   * Get all skills
   */
  getSkills: superAdminProcedure.query(async ({ ctx }) => {
    const { data, error } = await ctx.supabase
      .from("skills")
      .select("id, name, industry_id")
      .eq("active", true)
      .order("name");

    if (error) {
      throw new TRPCError({
        code: "INTERNAL_SERVER_ERROR",
        message: `Failed to fetch skills: ${error.message}`,
      });
    }

    return { skills: data ?? [] };
  }),
});
