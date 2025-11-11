import { TRPCError } from "@trpc/server";
import { z } from "zod";
import {
  applicationCreateSchema,
  applicationFilterSchema,
  applicationStepUpdateSchema,
  applicationSubmitSchema,
  applicationUpdateSchema,
  fileUploadSchema,
} from "../../_shared/application-schemas.ts";
import { trackServerEvent } from "../../_shared/analytics.ts";
import { t } from "../middleware.ts";

const publicProcedure = t.procedure;
const router = t.router;

/**
 * Applications router - handles job application operations
 */
export const applicationsRouter = router({
  /**
   * Submit a new application
   */
  submit: publicProcedure
    .input(applicationSubmitSchema)
    .mutation(async ({ ctx, input }) => {
      const { supabase, user } = ctx;

      if (!user) {
        throw new TRPCError({
          code: "UNAUTHORIZED",
          message: "You must be logged in to submit an application",
        });
      }

      // Check for duplicate application
      const { data: existingApp } = await supabase
        .schema("core")
        .from("applications")
        .select("id")
        .eq("job_id", input.job_id)
        .eq("user_id", user.id)
        .single();

      if (existingApp) {
        throw new TRPCError({
          code: "CONFLICT",
          message: "You have already applied to this job",
        });
      }

      // Verify job exists and is accepting applications
      const { data: job, error: jobError } = await supabase
        .schema("core")
        .from("jobs")
        .select("id, status, application_deadline")
        .eq("id", input.job_id)
        .single();

      if (jobError || !job) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Job not found",
        });
      }

      if (job.status !== "published") {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: "This job is not accepting applications",
        });
      }

      if (job.application_deadline) {
        const deadline = new Date(job.application_deadline);
        if (deadline < new Date()) {
          throw new TRPCError({
            code: "BAD_REQUEST",
            message: "Application deadline has passed",
          });
        }
      }

      // Create application
      const { data: application, error } = await supabase
        .schema("core")
        .from("applications")
        .insert({
          job_id: input.job_id,
          user_id: user.id,
          current_location: input.current_location,
          willing_to_relocate: input.willing_to_relocate,
          years_experience: input.years_experience,
          is_authorized_to_work: input.is_authorized_to_work,
          earliest_start_date: input.earliest_start_date,
          screening_answers: input.screening_answers || {},
          custom_question_answers: input.custom_question_answers || [],
          attachments: input.attachments || {},
          completed_steps: input.completed_steps || [],
          is_complete: input.is_complete,
          status: "pending",
          applied_at: new Date().toISOString(),
        })
        .select()
        .single();

      if (error) {
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Failed to create application",
          cause: error,
        });
      }

      const attachmentsCount = Array.isArray(application.attachments)
        ? application.attachments.length
        : Object.keys(application.attachments || {}).length;

      await trackServerEvent(user.id, "application_submitted", {
        application_id: application.id,
        job_id: input.job_id,
        is_complete: application.is_complete,
        has_screening_answers: Boolean(input.screening_answers && Object.keys(input.screening_answers).length > 0),
        attachments_count: attachmentsCount,
      });

      // Scoring and auto-rejection will be handled by database triggers

      return application;
    }),

  /**
   * Update application step (for multi-step form)
   */
  updateStep: publicProcedure
    .input(applicationStepUpdateSchema)
    .mutation(async ({ ctx, input }) => {
      const { supabase, user } = ctx;

      if (!user) {
        throw new TRPCError({
          code: "UNAUTHORIZED",
          message: "You must be logged in to update an application",
        });
      }

      // Verify ownership
      const { data: application } = await supabase
        .schema("core")
        .from("applications")
        .select("user_id, completed_steps")
        .eq("id", input.application_id)
        .single();

      if (!application || application.user_id !== user.id) {
        throw new TRPCError({
          code: "FORBIDDEN",
          message: "You can only update your own applications",
        });
      }

      // Update completed steps
      const completedSteps = application.completed_steps || [];
      if (!completedSteps.includes(input.step)) {
        completedSteps.push(input.step);
      }

      // Update application
      const { data: updated, error } = await supabase
        .schema("core")
        .from("applications")
        .update({
          ...input.data,
          completed_steps: completedSteps,
          updated_at: new Date().toISOString(),
        })
        .eq("id", input.application_id)
        .select()
        .single();

      if (error) {
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Failed to update application",
          cause: error,
        });
      }

      return updated;
    }),

  /**
   * Update existing application (general update)
   */
  update: publicProcedure
    .input(applicationUpdateSchema)
    .mutation(async ({ ctx, input }) => {
      const { supabase, user } = ctx;

      if (!user) {
        throw new TRPCError({
          code: "UNAUTHORIZED",
          message: "You must be logged in to update an application",
        });
      }

      // Verify ownership
      const { data: application } = await supabase
        .schema("core")
        .from("applications")
        .select("user_id")
        .eq("id", input.application_id)
        .single();

      if (!application || application.user_id !== user.id) {
        throw new TRPCError({
          code: "FORBIDDEN",
          message: "You can only update your own applications",
        });
      }

      const { application_id, ...updateData } = input;

      const { data: updated, error } = await supabase
        .schema("core")
        .from("applications")
        .update({
          ...updateData,
          updated_at: new Date().toISOString(),
        })
        .eq("id", application_id)
        .select()
        .single();

      if (error) {
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Failed to update application",
          cause: error,
        });
      }

      return updated;
    }),

  /**
   * Get user's applications
   */
  getUserApplications: publicProcedure
    .input(
      z.object({
        status: z
          .enum([
            "pending",
            "reviewing",
            "interview",
            "offer",
            "hired",
            "rejected",
            "withdrawn",
          ])
          .optional(),
        limit: z.number().min(1).max(100).default(20),
        offset: z.number().min(0).default(0),
      }),
    )
    .query(async ({ ctx, input }) => {
      const { supabase, user } = ctx;

      if (!user) {
        throw new TRPCError({
          code: "UNAUTHORIZED",
          message: "You must be logged in to view applications",
        });
      }

      // Query applications from private schema
      let query = supabase
        .schema("core")
        .from("applications")
        .select("*")
        .eq("user_id", user.id)
        .order("created_at", { ascending: false })
        .range(input.offset, input.offset + input.limit - 1);

      if (input.status) {
        query = query.eq("status", input.status);
      }

      const { data: applications, error } = await query;

      if (error) {
        console.error("Applications query error:", error);
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: `Failed to fetch applications: ${error.message}`,
          cause: error,
        });
      }

      if (!applications || applications.length === 0) {
        return [];
      }

      // Get unique job IDs
      const jobIds = [...new Set(applications.map((a) => a.job_id))];

      // Fetch jobs separately from core schema
      const { data: jobs } = await supabase
        .schema("core")
        .from("jobs")
        .select(
          "id, slug, title, employment_type, remote_option, location, status, organization_id",
        )
        .in("id", jobIds);

      // Fetch user data from core.users
      const { data: userData } = await supabase
        .schema("core")
        .from("users")
        .select("id, slug, username, about, avatar_path")
        .eq("id", user.id)
        .single();

      // Create jobs map for lookup
      const jobsMap = new Map(jobs?.map((j) => [j.id, j]) || []);

      // Combine applications with job and user data
      const result = applications.map((app) => ({
        ...app,
        user: userData || {
          id: user.id,
          slug: "",
          username: "",
          about: "",
          avatar_path: "",
        },
        job: jobsMap.get(app.job_id) || null,
      }));

      return result;
    }),

  /**
   * Get application by ID
   */
  getById: publicProcedure
    .input(z.object({ id: z.string().uuid() }))
    .query(async ({ ctx, input }) => {
      const { supabase, user } = ctx;

      if (!user) {
        throw new TRPCError({
          code: "UNAUTHORIZED",
          message: "You must be logged in to view application",
        });
      }

      const { data: application, error } = await supabase
        .schema("core")
        .from("applications")
        .select(
          `
          *,
          job:jobs(*)
        `,
        )
        .eq("id", input.id)
        .single();

      if (error || !application) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Application not found",
        });
      }

      // Verify ownership
      if (application.user_id !== user.id) {
        throw new TRPCError({
          code: "FORBIDDEN",
          message: "You can only view your own applications",
        });
      }

      return application;
    }),

  /**
   * Withdraw application
   */
  withdraw: publicProcedure
    .input(z.object({ id: z.string().uuid() }))
    .mutation(async ({ ctx, input }) => {
      const { supabase, user } = ctx;

      if (!user) {
        throw new TRPCError({
          code: "UNAUTHORIZED",
          message: "You must be logged in to withdraw an application",
        });
      }

      // Verify ownership
      const { data: application } = await supabase
        .schema("core")
        .from("applications")
        .select("user_id, status")
        .eq("id", input.id)
        .single();

      if (!application || application.user_id !== user.id) {
        throw new TRPCError({
          code: "FORBIDDEN",
          message: "You can only withdraw your own applications",
        });
      }

      if (application.status === "withdrawn") {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: "Application is already withdrawn",
        });
      }

      if (["hired", "rejected"].includes(application.status)) {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: "Cannot withdraw application in current status",
        });
      }

      const { data: updated, error } = await supabase
        .schema("core")
        .from("applications")
        .update({
          status: "withdrawn",
          updated_at: new Date().toISOString(),
        })
        .eq("id", input.id)
        .select()
        .single();

      if (error) {
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Failed to withdraw application",
          cause: error,
        });
      }

      return updated;
    }),

  /**
   * Calculate application score (manual trigger)
   */
  calculateScore: publicProcedure
    .input(z.object({ id: z.string().uuid() }))
    .mutation(async ({ ctx, input }) => {
      const { supabase, user } = ctx;

      if (!user) {
        throw new TRPCError({
          code: "UNAUTHORIZED",
          message: "You must be logged in",
        });
      }

      // Verify ownership
      const { data: application } = await supabase
        .schema("core")
        .from("applications")
        .select("user_id")
        .eq("id", input.id)
        .single();

      if (!application || application.user_id !== user.id) {
        throw new TRPCError({
          code: "FORBIDDEN",
          message: "You can only calculate score for your own applications",
        });
      }

      // Call database function to calculate score
      const { data, error } = await supabase.rpc(
        "calculate_application_score",
        {
          p_application_id: input.id,
        },
      );

      if (error) {
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Failed to calculate score",
          cause: error,
        });
      }

      return { score: data };
    }),

  /**
   * Get upload URL for file attachment
   */
  getUploadUrl: publicProcedure
    .input(fileUploadSchema)
    .mutation(async ({ ctx, input }) => {
      const { supabase, user } = ctx;

      if (!user) {
        throw new TRPCError({
          code: "UNAUTHORIZED",
          message: "You must be logged in to upload files",
        });
      }

      // Verify ownership
      const { data: application } = await supabase
        .schema("core")
        .from("applications")
        .select("user_id, job_id")
        .eq("id", input.application_id)
        .single();

      if (!application || application.user_id !== user.id) {
        throw new TRPCError({
          code: "FORBIDDEN",
          message: "You can only upload files to your own applications",
        });
      }

      // Generate file path
      const filePath =
        `${user.id}/${application.job_id}/${input.application_id}/${input.attachment_type}/${input.filename}`;

      // Generate signed upload URL (valid for 5 minutes)
      const { data, error } = await supabase.storage
        .from("application-attachments")
        .createSignedUploadUrl(filePath);

      if (error) {
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Failed to generate upload URL",
          cause: error,
        });
      }

      return {
        uploadUrl: data.signedUrl,
        path: filePath,
        token: data.token,
      };
    }),

  /**
   * Confirm file upload and update application
   */
  confirmUpload: publicProcedure
    .input(
      z.object({
        application_id: z.string().uuid(),
        attachment_type: z.enum([
          "resume",
          "cover_letter",
          "portfolio",
          "assessment",
          "video_interview",
        ]),
        path: z.string(),
        filename: z.string(),
        size: z.number(),
        mime_type: z.string(),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      const { supabase, user } = ctx;

      if (!user) {
        throw new TRPCError({
          code: "UNAUTHORIZED",
          message: "You must be logged in",
        });
      }

      // Verify ownership
      const { data: application } = await supabase
        .schema("core")
        .from("applications")
        .select("user_id, attachments")
        .eq("id", input.application_id)
        .single();

      if (!application || application.user_id !== user.id) {
        throw new TRPCError({
          code: "FORBIDDEN",
          message: "You can only update your own applications",
        });
      }

      // Update attachments
      const attachments =
        (application.attachments as Record<string, unknown>) || {};
      attachments[input.attachment_type] = {
        path: input.path,
        filename: input.filename,
        size: input.size,
        mime_type: input.mime_type,
        uploaded_at: new Date().toISOString(),
      };

      const { data: updated, error } = await supabase
        .schema("core")
        .from("applications")
        .update({ attachments })
        .eq("id", input.application_id)
        .select()
        .single();

      if (error) {
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Failed to update application",
          cause: error,
        });
      }

      return updated;
    }),
});
