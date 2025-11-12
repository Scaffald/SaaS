import { TRPCError } from "@trpc/server";
import { z } from "zod";
import { officeProcedure, t } from "../middleware.ts";
import { jobCreateSchema, jobUpdateSchema } from "../../_shared/job-schemas.ts";
import {
  employmentProfileSchema,
  generalProfileSchema,
} from "../../_shared/profile-schemas.ts";
import { officeProfilesRouter } from "./office/profiles.router.ts";
import { officeUniversitiesRouter } from "./office/universities.router.ts";
import { transformJobSkills } from "../../_shared/skill-helpers.ts";
import { officeTeamsRouter } from "./teams.router.ts";

/**
 * Office router - super admin only operations
 */
export const officeRouter = t.router({
  universities: officeUniversitiesRouter,
  profiles: officeProfilesRouter,
  teams: officeTeamsRouter,
  /**
   * List all users
   * Returns paginated list of users with basic profile info
   */
  listUsers: officeProcedure.query(async ({ ctx }) => {
    // Get public user data
    const { data: usersData, error: usersError, count } = await ctx
      .supabaseAdmin
      .schema("core")
      .from("users")
      .select(
        "id, username, display_name, avatar_path, created_at, updated_at",
        {
          count: "exact",
        },
      )
      .order("created_at", { ascending: false })
      .limit(50);

    if (usersError) {
      throw new TRPCError({
        code: "INTERNAL_SERVER_ERROR",
        message: usersError.message,
      });
    }

    // Get private profile data for all users
    const userIds = usersData?.map((u) => u.id) || [];
    const { data: profilesData } = await ctx.supabaseAdmin
      .schema("core")
      .from("profile")
      .select("user_id, first_name, last_name")
      .in("user_id", userIds);

    // Create a map for quick lookup
    const profilesMap = new Map(
      profilesData?.map((p) => [p.user_id, p]) || [],
    );

    // Combine the data
    const users = (usersData ?? []).map((user) => {
      const profile = profilesMap.get(user.id);
      return {
        id: user.id,
        username: user.username,
        display_name: user.display_name,
        first_name: profile?.first_name || "",
        last_name: profile?.last_name || "",
        avatar_path: user.avatar_path,
        created_at: user.created_at,
        updated_at: user.updated_at,
      };
    });

    return { users, total: count ?? 0 };
  }),

  /**
   * Get user details
   */
  getUser: officeProcedure
    .input(z.object({ id: z.string().uuid() }))
    .query(async ({ ctx, input }) => {
      // Get profile data
      const { data: profile, error: profileError } = await ctx.supabaseAdmin
        .schema("core")
        .from("users")
        .select("*")
        .eq("id", input.id)
        .single();

      if (profileError) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: `User not found: ${profileError.message}`,
        });
      }

      // Get private data
      const { data: privateData, error: privateError } = await ctx.supabaseAdmin
        .schema("core")
        .from("profile")
        .select("*")
        .eq("user_id", input.id)
        .single();

      if (privateError && privateError.code !== "PGRST116") {
        // PGRST116 is "no rows returned", which is acceptable
        console.error("Error fetching private data:", privateError);
      }

      return {
        profile,
        privateData: privateData || null,
      };
    }),

  /**
   * Update user profile and private data
   */
  updateUser: officeProcedure
    .input(
      z.object({
        id: z.string().uuid(),
        profile: z
          .object({
            first_name: z.string().optional(),
            last_name: z.string().optional(),
            display_name: z.string().optional(),
            bio: z.string().optional(),
          })
          .optional(),
        privateData: z
          .object({
            birth_date: z.string().optional(),
            location: z.string().optional(),
            employment_status: z.string().optional(),
            job_search_status: z.string().optional(),
            years_of_experience: z.number().optional(),
            current_title: z.string().optional(),
            current_employer: z.string().optional(),
          })
          .optional(),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      const { id, profile, privateData } = input;

      // Update profile if data provided
      if (profile) {
        const { error: profileError } = await ctx.supabaseAdmin
          .schema("core")
          .from("users")
          .update(profile)
          .eq("id", id);

        if (profileError) {
          throw new TRPCError({
            code: "INTERNAL_SERVER_ERROR",
            message: `Failed to update profile: ${profileError.message}`,
          });
        }
      }

      // Update private data if provided
      if (privateData) {
        const { error: privateError } = await ctx.supabaseAdmin
          .schema("core")
          .from("profile")
          .update(privateData)
          .eq("user_id", id);

        if (privateError) {
          throw new TRPCError({
            code: "INTERNAL_SERVER_ERROR",
            message: `Failed to update private data: ${privateError.message}`,
          });
        }
      }

      return { success: true };
    }),

  /**
   * List all jobs (admin view)
   * Returns jobs with optional filters
   */
  listJobs: officeProcedure
    .input(
      z.object({
        organization_id: z.string().uuid().optional(),
        status: z.enum(["draft", "open", "paused", "closed"]).optional(),
        team_id: z.string().uuid().optional(),
        myTeamsOnly: z.boolean().optional(),
        limit: z.number().min(1).max(100).default(50),
        offset: z.number().min(0).default(0),
      }),
    )
    .query(async ({ ctx, input }) => {
      const { supabaseAdmin, user } = ctx;

      let query = supabaseAdmin
        .schema("core")
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
          assigned_team_id,
          updated_at,
          organization:organizations!organization_id(id, name, slug),
          team:teams(id, name, organization_id),
          created_by:users!created_by_user_id(id, username, display_name)
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

      if (input.team_id) {
        query = query.eq("assigned_team_id", input.team_id);
      }

      if (input.myTeamsOnly) {
        if (!user) {
          throw new TRPCError({
            code: "UNAUTHORIZED",
            message: "User not authenticated",
          });
        }

        const { data: memberships, error: membershipsError } = await supabaseAdmin
          .schema("core")
          .from("team_members")
          .select("team_id")
          .eq("user_id", user.id)
          .neq("status", "removed");

        if (membershipsError) {
          throw new TRPCError({
            code: "INTERNAL_SERVER_ERROR",
            message: `Failed to load team memberships: ${membershipsError.message}`,
          });
        }

        const teamIds = (memberships ?? [])
          .map((membership) => membership.team_id as string | null)
          .filter((teamId): teamId is string => Boolean(teamId));

        if (teamIds.length === 0) {
          return {
            jobs: [],
            total: 0,
          };
        }

        query = query.in("assigned_team_id", teamIds);
      }

      const { data, error, count } = await query;

      if (error) {
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: `Failed to fetch jobs: ${error.message}`,
        });
      }

      const jobs = (data ?? []).map((job) => ({
        ...job,
        team: job.team
          ? {
            id: job.team.id,
            name: job.team.name,
            organization_id: job.team.organization_id,
          }
          : null,
      }));

      return {
        jobs,
        total: count ?? 0,
      };
    }),

  /**
   * Get single job with full details
   */
  getJob: officeProcedure
    .input(z.object({ id: z.string().uuid() }))
    .query(async ({ ctx, input }) => {
      const { data, error } = await ctx.supabaseAdmin
        .schema("core")
        .from("jobs")
        .select(
          `
          *,
          organization:organizations!organization_id(id, name, slug),
          team:teams(id, name),
          created_by:users!created_by_user_id(id, username, display_name),
          job_certifications(
            certification:certifications(id, name, slug, issuing_organization)
          ),
          job_skills(
            skill_taxonomy,
            csi_skill_id,
            onet_occupation_id
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

      return {
        job: {
          ...data,
          skills: transformJobSkills(data.job_skills || []),
        },
      };
    }),

  /**
   * Create new job
   */
  createJob: officeProcedure
    .input(jobCreateSchema)
    .mutation(async ({ ctx, input }) => {
      const { supabaseAdmin, user } = ctx;

      if (!user) {
        throw new TRPCError({
          code: "UNAUTHORIZED",
          message: "User not authenticated",
        });
      }

      // Extract certification_ids and skill_ids before inserting job
      const { certification_ids, skill_ids, ...jobData } = input;

      if (
        Object.prototype.hasOwnProperty.call(jobData, "assigned_team_id") &&
        (!jobData.assigned_team_id || jobData.assigned_team_id === "")
      ) {
        // Normalize falsy values to null for Supabase
        jobData.assigned_team_id = null;
      }

      if (jobData.assigned_team_id) {
        const { data: teamRecord, error: teamError } = await supabaseAdmin
          .schema("core")
          .from("teams")
          .select("id, organization_id")
          .eq("id", jobData.assigned_team_id)
          .single();

        if (teamError || !teamRecord) {
          throw new TRPCError({
            code: teamError?.code === "PGRST116" ? "BAD_REQUEST" : "INTERNAL_SERVER_ERROR",
            message: teamError
              ? `Failed to validate assigned team: ${teamError.message}`
              : "Assigned team not found",
          });
        }

        if (teamRecord.organization_id !== jobData.organization_id) {
          throw new TRPCError({
            code: "BAD_REQUEST",
            message: "Assigned team must belong to the same organization as the job.",
          });
        }
      }

      // Insert job using admin client to bypass RLS
      const { data: job, error: jobError } = await supabaseAdmin
        .schema("core")
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
        const { error: certError } = await supabaseAdmin
          .schema("core")
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

      // TODO: Skill insertion needs to be updated for polymorphic skills
      // The new schema requires skill_taxonomy, csi_skill_id, or onet_occupation_id
      // This will need to be implemented when the job creation UI is updated
      if (skill_ids && skill_ids.length > 0) {
        console.warn(
          "Skill insertion not yet implemented for polymorphic skills",
        );
      }

      return { job };
    }),

  /**
   * Update existing job
   */
  updateJob: officeProcedure
    .input(jobUpdateSchema)
    .mutation(async ({ ctx, input }) => {
      const { supabaseAdmin } = ctx;
      const { id, certification_ids, skill_ids, ...jobData } = input;

      const { data: existingJob, error: existingJobError } = await supabaseAdmin
        .schema("core")
        .from("jobs")
        .select("organization_id, assigned_team_id")
        .eq("id", id)
        .single();

      if (existingJobError || !existingJob) {
        throw new TRPCError({
          code: existingJobError?.code === "PGRST116" ? "NOT_FOUND" : "INTERNAL_SERVER_ERROR",
          message: existingJobError
            ? `Failed to load job: ${existingJobError.message}`
            : "Job not found",
        });
      }

      const currentOrganizationId = existingJob.organization_id as string;
      const nextOrganizationId = jobData.organization_id ?? currentOrganizationId;

      if (
        Object.prototype.hasOwnProperty.call(jobData, "assigned_team_id") &&
        (!jobData.assigned_team_id || jobData.assigned_team_id === "")
      ) {
        jobData.assigned_team_id = null;
      }

      if (jobData.assigned_team_id) {
        const { data: teamRecord, error: teamError } = await supabaseAdmin
          .schema("core")
          .from("teams")
          .select("id, organization_id")
          .eq("id", jobData.assigned_team_id)
          .single();

        if (teamError || !teamRecord) {
          throw new TRPCError({
            code: teamError?.code === "PGRST116" ? "BAD_REQUEST" : "INTERNAL_SERVER_ERROR",
            message: teamError
              ? `Failed to validate assigned team: ${teamError.message}`
              : "Assigned team not found",
          });
        }

        if (teamRecord.organization_id !== nextOrganizationId) {
          throw new TRPCError({
            code: "BAD_REQUEST",
            message: "Assigned team must belong to the job's organization.",
          });
        }
      } else if (
        jobData.organization_id &&
        existingJob.assigned_team_id &&
        jobData.assigned_team_id === undefined
      ) {
        const { data: teamRecord, error: teamError } = await supabaseAdmin
          .schema("core")
          .from("teams")
          .select("id, organization_id")
          .eq("id", existingJob.assigned_team_id as string)
          .single();

        if (teamError || !teamRecord) {
          throw new TRPCError({
            code: teamError?.code === "PGRST116" ? "BAD_REQUEST" : "INTERNAL_SERVER_ERROR",
            message: teamError
              ? `Failed to validate existing assigned team: ${teamError.message}`
              : "Assigned team not found",
          });
        }

        if (teamRecord.organization_id !== jobData.organization_id) {
          throw new TRPCError({
            code: "BAD_REQUEST",
            message:
              "Assigned team must belong to the new organization. Provide a team from the new organization or clear the team assignment.",
          });
        }
      }

      // Update job
      const { data: job, error: jobError } = await supabaseAdmin
        .schema("core")
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
        await supabaseAdmin.schema("core").from("job_certifications").delete()
          .eq(
            "job_id",
            id,
          );

        // Insert new certifications
        if (certification_ids.length > 0) {
          const { error: certError } = await supabaseAdmin
            .schema("core")
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

      // TODO: Skill updates need to be updated for polymorphic skills
      // The new schema requires skill_taxonomy, csi_skill_id, or onet_occupation_id
      // This will need to be implemented when the job editing UI is updated
      if (skill_ids !== undefined) {
        // Delete existing skills
        await supabaseAdmin.from("job_skills").delete().eq("job_id", id);

        if (skill_ids.length > 0) {
          console.warn(
            "Skill insertion not yet implemented for polymorphic skills",
          );
        }
      }

      return { job };
    }),

  /**
   * Publish job (draft -> open)
   */
  publishJob: officeProcedure
    .input(z.object({ id: z.string().uuid() }))
    .mutation(async ({ ctx, input }) => {
      const { data: job, error } = await ctx.supabaseAdmin
        .schema("core")
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
  closeJob: officeProcedure
    .input(z.object({ id: z.string().uuid() }))
    .mutation(async ({ ctx, input }) => {
      const { data: job, error } = await ctx.supabaseAdmin
        .schema("core")
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
   * Delete job (hard delete)
   * Removes job and related records permanently
   */
  deleteJob: officeProcedure
    .input(z.object({ id: z.string().uuid() }))
    .mutation(async ({ ctx, input }) => {
      const { supabaseAdmin } = ctx;

      // Delete related records first (due to foreign key constraints)
      // Delete job certifications
      await supabaseAdmin.from("job_certifications").delete().eq(
        "job_id",
        input.id,
      );

      // Delete job skills
      await supabaseAdmin.from("job_skills").delete().eq("job_id", input.id);

      // Delete applications (if any)
      await supabaseAdmin.from("applications").delete().eq("job_id", input.id);

      // Finally delete the job itself
      const { error } = await supabaseAdmin
        .from("jobs")
        .delete()
        .eq("id", input.id);

      if (error) {
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: `Failed to delete job: ${error.message}`,
        });
      }

      return { success: true };
    }),

  /**
   * Get all organizations (admin view)
   * Super admins can see and manage jobs for any organization
   */
  getOrganizations: officeProcedure.query(async ({ ctx }) => {
    const { data, error } = await ctx.supabaseAdmin
      .schema("core")
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
   * List organizations with pagination and search
   */
  listOrganizations: officeProcedure
    .input(
      z.object({
        limit: z.number().min(1).max(100).default(50),
        offset: z.number().min(0).default(0),
        search: z.string().optional(),
      }),
    )
    .query(async ({ ctx, input }) => {
      let query = ctx.supabaseAdmin
        .schema("core")
        .from("organizations")
        .select(
          `
          id,
          name,
          slug,
          industry_id,
          logo_url,
          visibility,
          owner_user_id,
          created_at,
          updated_at,
          industry:industries(name)
        `,
          { count: "exact" },
        )
        .order("created_at", { ascending: false })
        .range(input.offset, input.offset + input.limit - 1);

      if (input.search) {
        query = query.or(
          `name.ilike.%${input.search}%,slug.ilike.%${input.search}%`,
        );
      }

      const { data, error, count } = await query;

      if (error) {
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: `Failed to fetch organizations: ${error.message}`,
        });
      }

      // Transform data to include industry_name
      const organizations = (data ?? []).map((org) => ({
        ...org,
        industry_name: org.industry?.name || null,
      }));

      return {
        organizations,
        total: count ?? 0,
      };
    }),

  /**
   * List organization requests for moderation
   */
  listOrganizationRequests: officeProcedure
    .input(
      z
        .object({
          status: z.enum(["pending", "approved", "rejected"]).optional(),
          limit: z.number().min(1).max(100).default(25),
        })
        .optional(),
    )
    .query(async ({ ctx, input }) => {
      const appliedStatus = input?.status;
      const limit = input?.limit ?? 25;

      let query = ctx.supabaseAdmin
        .schema("core")
        .from("organization_requests")
        .select(
          `
          id,
          name,
          slug,
          website,
          notes,
          status,
          metadata,
          created_at,
          created_by_user_id,
          reviewed_at,
          reviewed_by_user_id,
          rejection_reason,
          organization_id
        `,
        )
        .order("created_at", { ascending: true })
        .limit(limit);

      if (appliedStatus) {
        query = query.eq("status", appliedStatus);
      }

      const { data: requests, error } = await query;

      if (error) {
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: `Failed to fetch organization requests: ${error.message}`,
        });
      }

      const [
        { count: pendingCount = 0 } = {},
        { count: approvedCount = 0 } = {},
        { count: rejectedCount = 0 } = {},
      ] = await Promise.all([
        ctx.supabaseAdmin
          .schema("core")
          .from("organization_requests")
          .select("*", { head: true, count: "exact" })
          .eq("status", "pending"),
        ctx.supabaseAdmin
          .schema("core")
          .from("organization_requests")
          .select("*", { head: true, count: "exact" })
          .eq("status", "approved"),
        ctx.supabaseAdmin
          .schema("core")
          .from("organization_requests")
          .select("*", { head: true, count: "exact" })
          .eq("status", "rejected"),
      ]);

      return {
        requests: requests ?? [],
        counts: {
          pending: pendingCount ?? 0,
          approved: approvedCount ?? 0,
          rejected: rejectedCount ?? 0,
        },
      };
    }),

  /**
   * Review an organization request (approve or reject)
   */
  reviewOrganizationRequest: officeProcedure
    .input(
      z.object({
        id: z.string().uuid(),
        action: z.enum(["approve", "reject"]),
        rejectionReason: z.string().trim().max(1000).optional(),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      const { user, supabaseAdmin } = ctx;

      if (!user) {
        throw new TRPCError({
          code: "UNAUTHORIZED",
          message: "User not authenticated",
        });
      }

      const { data: request, error: requestError } = await supabaseAdmin
        .schema("core")
        .from("organization_requests")
        .select("*")
        .eq("id", input.id)
        .single();

      if (requestError) {
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: `Failed to load organization request: ${requestError.message}`,
        });
      }

      if (!request) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Organization request not found",
        });
      }

      if (request.status !== "pending") {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: "Only pending requests can be reviewed",
        });
      }

      const moderationTimestamp = new Date().toISOString();

      if (input.action === "reject") {
        if (!input.rejectionReason || input.rejectionReason.trim().length === 0) {
          throw new TRPCError({
            code: "BAD_REQUEST",
            message: "Rejection reason is required when rejecting a request",
          });
        }

        const { data: updatedRequest, error: updateError } = await supabaseAdmin
          .schema("core")
          .from("organization_requests")
          .update({
            status: "rejected",
            reviewed_by_user_id: user.id,
            reviewed_at: moderationTimestamp,
            rejection_reason: input.rejectionReason.trim(),
          })
          .eq("id", input.id)
          .select()
          .single();

        if (updateError) {
          throw new TRPCError({
            code: "INTERNAL_SERVER_ERROR",
            message: `Failed to reject organization request: ${updateError.message}`,
          });
        }

        return { request: updatedRequest, organization: null };
      }

      // Approve flow
      const { data: existingOrg, error: existingOrgError } = await supabaseAdmin
        .schema("core")
        .from("organizations")
        .select("id")
        .eq("slug", request.slug)
        .maybeSingle();

      if (existingOrgError && existingOrgError.code !== "PGRST116") {
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: `Failed to validate organization slug: ${existingOrgError.message}`,
        });
      }

      if (existingOrg) {
        throw new TRPCError({
          code: "CONFLICT",
          message: "An organization with this slug already exists",
        });
      }

      const { data: organization, error: createOrgError } = await supabaseAdmin
        .schema("core")
        .from("organizations")
        .insert({
          name: request.name,
          slug: request.slug,
          visibility: "public",
          website: request.website ?? null,
          owner_user_id: request.created_by_user_id,
        })
        .select()
        .single();

      if (createOrgError) {
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: `Failed to create organization: ${createOrgError.message}`,
        });
      }

      const { data: approvedRequest, error: approveError } = await supabaseAdmin
        .schema("core")
        .from("organization_requests")
        .update({
          status: "approved",
          reviewed_by_user_id: user.id,
          reviewed_at: moderationTimestamp,
          organization_id: organization?.id ?? null,
          rejection_reason: null,
        })
        .eq("id", input.id)
        .select()
        .single();

      if (approveError) {
        // Attempt to clean up the organization if request update fails
        if (organization?.id) {
          await supabaseAdmin
            .schema("core")
            .from("organizations")
            .delete()
            .eq("id", organization.id);
        }

        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: `Failed to update organization request: ${approveError.message}`,
        });
      }

      return { request: approvedRequest, organization };
    }),

  /**
   * Get single organization with full details
   */
  getOrganization: officeProcedure
    .input(z.object({ id: z.string().uuid() }))
    .query(async ({ ctx, input }) => {
      const { data, error } = await ctx.supabaseAdmin
        .schema("core")
        .from("organizations")
        .select(
          `
          *,
          industry:industries(id, name)
        `,
        )
        .eq("id", input.id)
        .single();

      if (error) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: `Organization not found: ${error.message}`,
        });
      }

      return { organization: data };
    }),

  /**
   * Create new organization
   */
  createOrganization: officeProcedure
    .input(
      z.object({
        name: z.string().min(1, "Name is required"),
        slug: z.string().min(1, "Slug is required").toLowerCase(),
        industry_id: z.string().uuid().optional(),
        logo_url: z.string().url().optional().or(z.literal("")),
        visibility: z.enum(["public", "private"]).default("public"),
        address: z.record(z.unknown()).optional(),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      const { user } = ctx;

      if (!user) {
        throw new TRPCError({
          code: "UNAUTHORIZED",
          message: "User not authenticated",
        });
      }

      // Check if slug is unique
      const { data: existing } = await ctx.supabaseAdmin
        .schema("core")
        .from("organizations")
        .select("id")
        .eq("slug", input.slug)
        .single();

      if (existing) {
        throw new TRPCError({
          code: "CONFLICT",
          message: "An organization with this slug already exists",
        });
      }

      const { data: organization, error } = await ctx.supabaseAdmin
        .schema("core")
        .from("organizations")
        .insert({
          ...input,
          owner_user_id: user.id,
        })
        .select()
        .single();

      if (error) {
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: `Failed to create organization: ${error.message}`,
        });
      }

      return { organization };
    }),

  /**
   * Update existing organization
   */
  updateOrganization: officeProcedure
    .input(
      z.object({
        id: z.string().uuid(),
        name: z.string().min(1, "Name is required"),
        slug: z.string().min(1, "Slug is required").toLowerCase(),
        industry_id: z.string().uuid().optional(),
        logo_url: z.string().url().optional().or(z.literal("")),
        visibility: z.enum(["public", "private"]),
        address: z.record(z.unknown()).optional(),
        locations: z.array(z.object({
          name: z.string(),
          address: z.record(z.unknown()),
        })).optional(),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      const { id, ...updateData } = input;

      // Check if slug is unique (excluding current organization)
      const { data: existing } = await ctx.supabaseAdmin
        .schema("core")
        .from("organizations")
        .select("id")
        .eq("slug", input.slug)
        .neq("id", id)
        .single();

      if (existing) {
        throw new TRPCError({
          code: "CONFLICT",
          message: "An organization with this slug already exists",
        });
      }

      // Update organization including locations in JSONB column
      const { data: organization, error } = await ctx.supabaseAdmin
        .schema("core")
        .from("organizations")
        .update(updateData)
        .eq("id", id)
        .select()
        .single();

      if (error) {
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: `Failed to update organization: ${error.message}`,
        });
      }

      return { organization };
    }),

  /**
   * Delete organization (hard delete)
   * WARNING: This will cascade delete:
   * - Teams and team_members
   * - Jobs and all related records (applications, job_skills, job_certifications)
   * - Organization_skills
   * - Follows
   * - Invites
   */
  deleteOrganization: officeProcedure
    .input(z.object({ id: z.string().uuid() }))
    .mutation(async ({ ctx, input }) => {
      const { error } = await ctx.supabaseAdmin
        .schema("core")
        .from("organizations")
        .delete()
        .eq("id", input.id);

      if (error) {
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: `Failed to delete organization: ${error.message}`,
        });
      }

      return { success: true };
    }),

  /**
   * Search certifications with pagination
   */
  searchCertifications: officeProcedure
    .input(
      z.object({
        query: z.string().optional(),
        category: z.enum([
          "safety",
          "trade",
          "equipment",
          "license",
          "management",
          "other",
        ]).optional(),
        include_inactive: z.boolean().default(false),
        limit: z.number().min(1).max(100).default(50),
        offset: z.number().min(0).default(0),
      }),
    )
    .query(async ({ ctx, input }) => {
      let query = ctx.supabaseAdmin
        .from("certifications")
        .select("*", { count: "exact" })
        .order("name");

      if (!input.include_inactive) {
        query = query.eq("is_active", true);
      }

      if (input.category) {
        query = query.eq("category", input.category);
      }

      if (input.query) {
        query = query.ilike("name", `%${input.query}%`);
      }

      query = query.range(input.offset, input.offset + input.limit - 1);

      const { data, error, count } = await query;

      if (error) {
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: `Failed to search certifications: ${error.message}`,
        });
      }

      return {
        certifications: data ?? [],
        total: count ?? 0,
      };
    }),

  /**
   * Create new user (sends invite email)
   * Creates user in Supabase Auth and sends invite email
   */
  createUser: officeProcedure
    .input(
      z.object({
        email: z.string().email("Valid email required"),
        first_name: z.string().min(1, "First name required"),
        last_name: z.string().min(1, "Last name required"),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      const { supabaseAdmin } = ctx;

      // 1. Create user in Supabase Auth
      const { data: authData, error: authError } = await supabaseAdmin.auth
        .admin.createUser({
          email: input.email,
          email_confirm: false, // User must confirm via invite email
          user_metadata: {
            first_name: input.first_name,
            last_name: input.last_name,
          },
        });

      if (authError) {
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: `Failed to create user: ${authError.message}`,
        });
      }

      // 2. Send invite email
      const { error: inviteError } = await supabaseAdmin.auth.admin
        .inviteUserByEmail(
          input.email,
        );

      if (inviteError) {
        console.error("Failed to send invite email:", inviteError);
        // Don't fail the whole operation if invite fails - user is created
      }

      // 3. Profile is created automatically via database trigger
      // 4. Return user data
      return {
        user: authData.user,
        inviteSent: !inviteError,
      };
    }),

  /**
   * Delete user (hard delete)
   * Permanently removes user and all related data
   */
  deleteUser: officeProcedure
    .input(z.object({ id: z.string().uuid() }))
    .mutation(async ({ ctx, input }) => {
      const { supabaseAdmin } = ctx;

      // Delete related records first
      // Note: Many tables have ON DELETE CASCADE, but we'll be explicit

      // Delete user skills
      await supabaseAdmin.schema("core").from("user_skills").delete().eq(
        "user_id",
        input.id,
      );

      // Delete user certifications
      await supabaseAdmin.from("user_certifications").delete().eq(
        "user_id",
        input.id,
      );

      // Delete work experience
      await supabaseAdmin.from("work_experience").delete().eq(
        "user_id",
        input.id,
      );

      // Delete education
      await supabaseAdmin.from("education").delete().eq("user_id", input.id);

      // Delete applications
      await supabaseAdmin.from("applications").delete().eq("user_id", input.id);

      // Delete reviews authored by user
      await supabaseAdmin.from("reviews").delete().eq("user_id", input.id);

      // Delete organization memberships
      await supabaseAdmin.from("organization_members").delete().eq(
        "user_id",
        input.id,
      );

      // Delete private data
      await supabaseAdmin.schema("core").from("profile").delete().eq(
        "user_id",
        input.id,
      );

      // Delete profile
      const { error: profileError } = await supabaseAdmin
        .schema("core")
        .from("users")
        .delete()
        .eq("id", input.id);

      if (profileError) {
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: `Failed to delete user profile: ${profileError.message}`,
        });
      }

      // Delete from Supabase Auth
      const { error: authError } = await supabaseAdmin.auth.admin.deleteUser(
        input.id,
      );

      if (authError) {
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: `Failed to delete user from auth: ${authError.message}`,
        });
      }

      return { success: true };
    }),

  /**
   * Get all certifications (simple list)
   */
  getCertifications: officeProcedure.query(async ({ ctx }) => {
    const { data, error } = await ctx.supabaseAdmin
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
   * Get single certification by ID
   */
  getCertification: officeProcedure
    .input(z.object({ id: z.string().uuid() }))
    .query(async ({ ctx, input }) => {
      const { data, error } = await ctx.supabaseAdmin
        .from("certifications")
        .select("*")
        .eq("id", input.id)
        .single();

      if (error) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: `Certification not found: ${error.message}`,
        });
      }

      return { certification: data };
    }),

  /**
   * Create new certification
   */
  createCertification: officeProcedure
    .input(
      z.object({
        name: z.string().min(1, "Name is required"),
        slug: z.string().min(1, "Slug is required"),
        issuing_organization: z.string().optional(),
        category: z.enum([
          "safety",
          "trade",
          "equipment",
          "license",
          "management",
          "other",
        ]),
        description: z.string().optional(),
        typical_duration_days: z.number().int().positive().optional(),
        requires_renewal: z.boolean().default(false),
        renewal_period_months: z.number().int().positive().optional(),
        metadata: z.record(z.any()).optional(),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      const { data, error } = await ctx.supabaseAdmin
        .from("certifications")
        .insert({
          ...input,
          is_active: true,
        })
        .select()
        .single();

      if (error) {
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: `Failed to create certification: ${error.message}`,
        });
      }

      return { certification: data };
    }),

  /**
   * Update existing certification
   */
  updateCertification: officeProcedure
    .input(
      z.object({
        id: z.string().uuid(),
        name: z.string().min(1).optional(),
        slug: z.string().min(1).optional(),
        issuing_organization: z.string().optional(),
        category: z.enum([
          "safety",
          "trade",
          "equipment",
          "license",
          "management",
          "other",
        ]).optional(),
        description: z.string().optional(),
        typical_duration_days: z.number().int().positive().optional(),
        requires_renewal: z.boolean().optional(),
        renewal_period_months: z.number().int().positive().optional(),
        is_active: z.boolean().optional(),
        metadata: z.record(z.any()).optional(),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      const { id, ...updateData } = input;

      const { data, error } = await ctx.supabaseAdmin
        .from("certifications")
        .update(updateData)
        .eq("id", id)
        .select()
        .single();

      if (error) {
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: `Failed to update certification: ${error.message}`,
        });
      }

      return { certification: data };
    }),

  /**
   * Deactivate certification (soft delete)
   */
  deactivateCertification: officeProcedure
    .input(z.object({ id: z.string().uuid() }))
    .mutation(async ({ ctx, input }) => {
      const { data, error } = await ctx.supabaseAdmin
        .from("certifications")
        .update({ is_active: false })
        .eq("id", input.id)
        .select()
        .single();

      if (error) {
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: `Failed to deactivate certification: ${error.message}`,
        });
      }

      return { certification: data };
    }),

  /**
   * Reactivate certification
   */
  reactivateCertification: officeProcedure
    .input(z.object({ id: z.string().uuid() }))
    .mutation(async ({ ctx, input }) => {
      const { data, error } = await ctx.supabaseAdmin
        .from("certifications")
        .update({ is_active: true })
        .eq("id", input.id)
        .select()
        .single();

      if (error) {
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: `Failed to reactivate certification: ${error.message}`,
        });
      }

      return { certification: data };
    }),

  /**
   * Get all skills
   * TODO: Update to query from polymorphic skill sources (CSI, O*NET)
   */
  getSkills: officeProcedure.query(async ({ ctx }) => {
    // For now, return empty array since the skills table no longer exists
    // This needs to be updated to query csi.masterformat and onet.occupation_data
    return { skills: [] };
  }),

  /**
   * Get user general profile data (admin)
   * Uses the same schema as user profile for consistency
   */
  getUserGeneral: officeProcedure
    .input(z.object({ userId: z.string().uuid() }))
    .query(async ({ ctx, input }) => {
      const { data: profile, error: profileError } = await ctx.supabaseAdmin
        .schema("core")
        .from("users")
        .select("first_name, last_name, about, avatar_path")
        .eq("id", input.userId)
        .single();

      if (profileError) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: `User profile not found: ${profileError.message}`,
        });
      }

      // Get email from auth.users
      const { data: authUser, error: authError } = await ctx.supabaseAdmin.auth
        .admin.getUserById(input.userId);

      if (authError) {
        console.error("Error fetching auth user:", authError);
      }

      const { data: privateData, error: privateError } = await ctx.supabaseAdmin
        .schema("core")
        .from("profile")
        .select(
          "street_address, city, state, zip_code, country, latitude, longitude",
        )
        .eq("user_id", input.userId)
        .single();

      if (privateError && privateError.code !== "PGRST116") {
        console.error("Error fetching private data:", privateError);
      }

      return {
        first_name: profile.first_name || "",
        last_name: profile.last_name || "",
        about: profile.about || "",
        avatar_path: profile.avatar_path || "",
        email: authUser?.user?.email || "",
        phone: authUser?.user?.phone || "",
        address: {
          street: privateData?.street_address || "",
          city: privateData?.city || "",
          state: privateData?.state || "",
          zip: privateData?.zip_code || "",
          country: privateData?.country || "United States",
          latitude: privateData?.latitude,
          longitude: privateData?.longitude,
        },
      };
    }),

  /**
   * Update user general profile (admin)
   * Uses the same schema as user profile for consistency
   */
  updateUserGeneral: officeProcedure
    .input(
      z.object({
        userId: z.string().uuid(),
        data: generalProfileSchema,
      }),
    )
    .mutation(async ({ ctx, input }) => {
      const { userId, data } = input;

      // Update profiles table
      const profileUpdate: Record<string, string> = {};
      if (data.first_name) profileUpdate.first_name = data.first_name;
      if (data.last_name) profileUpdate.last_name = data.last_name;
      if (data.about !== undefined) profileUpdate.about = data.about;
      if (data.avatar_path !== undefined) {
        profileUpdate.avatar_path = data.avatar_path;
      }

      if (Object.keys(profileUpdate).length > 0) {
        const { error: profileError } = await ctx.supabaseAdmin
          .schema("core")
          .from("users")
          .update(profileUpdate)
          .eq("id", userId);

        if (profileError) {
          throw new TRPCError({
            code: "INTERNAL_SERVER_ERROR",
            message: `Failed to update profile: ${profileError.message}`,
          });
        }
      }

      // Update private table (phone is read-only from auth.users, not updated here)
      const privateUpdate: Record<string, string | number | null> = {};
      if (data.address) {
        if (data.address.street !== undefined) {
          privateUpdate.street_address = data.address.street;
        }
        if (data.address.city !== undefined) {
          privateUpdate.city = data.address.city;
        }
        if (data.address.state !== undefined) {
          privateUpdate.state = data.address.state;
        }
        if (data.address.zip !== undefined) {
          privateUpdate.zip_code = data.address.zip;
        }
        if (data.address.country !== undefined) {
          privateUpdate.country = data.address.country;
        }
        if (data.address.latitude !== undefined) {
          privateUpdate.latitude = data.address.latitude;
        }
        if (data.address.longitude !== undefined) {
          privateUpdate.longitude = data.address.longitude;
        }
      }

      if (Object.keys(privateUpdate).length > 0) {
        const { error: privateError } = await ctx.supabaseAdmin
          .schema("core")
          .from("profile")
          .update(privateUpdate)
          .eq("user_id", userId);

        if (privateError) {
          throw new TRPCError({
            code: "INTERNAL_SERVER_ERROR",
            message: `Failed to update private data: ${privateError.message}`,
          });
        }
      }

      return { success: true };
    }),

  /**
   * Get user employment data (admin)
   * Uses the same schema as user profile for consistency
   */
  getUserEmployment: officeProcedure
    .input(z.object({ userId: z.string().uuid() }))
    .query(async ({ ctx, input }) => {
      const { data, error } = await ctx.supabaseAdmin
        .schema("core")
        .from("profile")
        .select(
          "preferred_work_locations, open_to_travel, travel_distance_miles, us_resident, us_passport, drivers_license_classes, military_status, availability, hourly_rate",
        )
        .eq("user_id", input.userId)
        .single();

      if (error && error.code !== "PGRST116") {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: `User employment data not found: ${error.message}`,
        });
      }

      return {
        preferred_work_locations: data?.preferred_work_locations || [],
        open_to_travel: data?.open_to_travel ?? true,
        travel_distance_miles: data?.travel_distance_miles || 25,
        us_resident: data?.us_resident || false,
        us_passport: data?.us_passport || false,
        drivers_license_classes: data?.drivers_license_classes || [],
        military_status: data?.military_status || [],
        availability: data?.availability || [],
        hourly_rate: data?.hourly_rate,
      };
    }),

  /**
   * Update user employment data (admin)
   * Uses the same schema as user profile for consistency
   */
  updateUserEmployment: officeProcedure
    .input(
      z.object({
        userId: z.string().uuid(),
        data: employmentProfileSchema,
      }),
    )
    .mutation(async ({ ctx, input }) => {
      const { userId, data } = input;

      const { error } = await ctx.supabaseAdmin
        .schema("core")
        .from("profile")
        .update({
          preferred_work_locations: data.preferred_work_locations,
          open_to_travel: data.open_to_travel,
          travel_distance_miles: data.travel_distance_miles,
          us_resident: data.us_resident,
          us_passport: data.us_passport,
          drivers_license_classes: data.drivers_license_classes,
          military_status: data.military_status,
          availability: data.availability,
          hourly_rate: data.hourly_rate,
        })
        .eq("user_id", userId);

      if (error) {
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: `Failed to update employment data: ${error.message}`,
        });
      }

      return { success: true };
    }),
});
