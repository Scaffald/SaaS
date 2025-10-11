import { TRPCError } from "@trpc/server";
import { z } from "zod";
import { superAdminProcedure, t } from "../middleware.ts";
import {
  jobCreateSchema,
  jobPublishSchema,
  jobUpdateSchema,
} from "../../_shared/job-schemas.ts";
import {
  employmentProfileSchema,
  generalProfileSchema,
} from "../../_shared/profile-schemas.ts";
import { officeUniversitiesRouter } from "./office/universities.router.ts";

/**
 * Office router - super admin only operations
 */
export const officeRouter = t.router({
  universities: officeUniversitiesRouter,
  /**
   * List all users
   * Returns paginated list of users with basic profile info
   */
  listUsers: superAdminProcedure.query(async ({ ctx }) => {
    const { data, error, count } = await ctx.supabaseAdmin
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
   */
  getUser: superAdminProcedure
    .input(z.object({ id: z.string().uuid() }))
    .query(async ({ ctx, input }) => {
      // Get profile data
      const { data: profile, error: profileError } = await ctx.supabaseAdmin
        .from("profiles")
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
        .from("user_private")
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
  updateUser: superAdminProcedure
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
            email: z.string().email().optional(),
            phone_number: z.string().optional(),
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
          .from("profiles")
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
          .from("user_private")
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
      let query = ctx.supabaseAdmin
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
          organization:organizations!organization_id(id, name, slug),
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
      const { data, error } = await ctx.supabaseAdmin
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
      const { supabaseAdmin, user } = ctx;

      if (!user) {
        throw new TRPCError({
          code: "UNAUTHORIZED",
          message: "User not authenticated",
        });
      }

      // Extract certification_ids and skill_ids before inserting job
      const { certification_ids, skill_ids, ...jobData } = input;

      // Insert job using admin client to bypass RLS
      const { data: job, error: jobError } = await supabaseAdmin
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
        const { error: skillError } = await supabaseAdmin
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
      const { supabaseAdmin } = ctx;
      const { id, certification_ids, skill_ids, ...jobData } = input;

      // Update job
      const { data: job, error: jobError } = await supabaseAdmin
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
        await supabaseAdmin.from("job_certifications").delete().eq(
          "job_id",
          id,
        );

        // Insert new certifications
        if (certification_ids.length > 0) {
          const { error: certError } = await supabaseAdmin
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
        await supabaseAdmin.from("job_skills").delete().eq("job_id", id);

        // Insert new skills
        if (skill_ids.length > 0) {
          const { error: skillError } = await supabaseAdmin
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
      const { data: job, error } = await ctx.supabaseAdmin
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
      const { data: job, error } = await ctx.supabaseAdmin
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
  deleteJob: superAdminProcedure
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
  getOrganizations: superAdminProcedure.query(async ({ ctx }) => {
    const { data, error } = await ctx.supabaseAdmin
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
   * Search certifications with pagination
   */
  searchCertifications: superAdminProcedure
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
  createUser: superAdminProcedure
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
  deleteUser: superAdminProcedure
    .input(z.object({ id: z.string().uuid() }))
    .mutation(async ({ ctx, input }) => {
      const { supabaseAdmin } = ctx;

      // Delete related records first
      // Note: Many tables have ON DELETE CASCADE, but we'll be explicit

      // Delete user skills
      await supabaseAdmin.from("user_skills").delete().eq("user_id", input.id);

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

      // Delete user_private data
      await supabaseAdmin.from("user_private").delete().eq("user_id", input.id);

      // Delete profile
      const { error: profileError } = await supabaseAdmin
        .from("profiles")
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
  getCertifications: superAdminProcedure.query(async ({ ctx }) => {
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
  getCertification: superAdminProcedure
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
  createCertification: superAdminProcedure
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
  updateCertification: superAdminProcedure
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
  deactivateCertification: superAdminProcedure
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
  reactivateCertification: superAdminProcedure
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
   */
  getSkills: superAdminProcedure.query(async ({ ctx }) => {
    const { data, error } = await ctx.supabaseAdmin
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

  /**
   * Get user general profile data (admin)
   * Uses the same schema as user profile for consistency
   */
  getUserGeneral: superAdminProcedure
    .input(z.object({ userId: z.string().uuid() }))
    .query(async ({ ctx, input }) => {
      const { data: profile, error: profileError } = await ctx.supabaseAdmin
        .from("profiles")
        .select("first_name, last_name, about, avatar_path, email")
        .eq("id", input.userId)
        .single();

      if (profileError) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: `User profile not found: ${profileError.message}`,
        });
      }

      const { data: privateData, error: privateError } = await ctx.supabaseAdmin
        .from("user_private")
        .select(
          "phone_number, street_address, city, state, zip_code, country, latitude, longitude",
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
        email: profile.email || "",
        phone: privateData?.phone_number || "",
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
  updateUserGeneral: superAdminProcedure
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
          .from("profiles")
          .update(profileUpdate)
          .eq("id", userId);

        if (profileError) {
          throw new TRPCError({
            code: "INTERNAL_SERVER_ERROR",
            message: `Failed to update profile: ${profileError.message}`,
          });
        }
      }

      // Update user_private table
      const privateUpdate: Record<string, string | number | null> = {};
      if (data.phone !== undefined) privateUpdate.phone_number = data.phone;
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
          .from("user_private")
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
  getUserEmployment: superAdminProcedure
    .input(z.object({ userId: z.string().uuid() }))
    .query(async ({ ctx, input }) => {
      const { data, error } = await ctx.supabaseAdmin
        .from("user_private")
        .select(
          "preferred_work_locations, willing_to_travel, travel_distance_miles, us_resident, us_passport, drivers_license_classes, military_status, availability, hourly_rate",
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
        willing_to_travel: data?.willing_to_travel || false,
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
  updateUserEmployment: superAdminProcedure
    .input(
      z.object({
        userId: z.string().uuid(),
        data: employmentProfileSchema,
      }),
    )
    .mutation(async ({ ctx, input }) => {
      const { userId, data } = input;

      const { error } = await ctx.supabaseAdmin
        .from("user_private")
        .update({
          preferred_work_locations: data.preferred_work_locations,
          willing_to_travel: data.willing_to_travel,
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
