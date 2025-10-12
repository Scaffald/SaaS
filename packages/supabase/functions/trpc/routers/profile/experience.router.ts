import { TRPCError } from "@trpc/server";
import { z } from "zod";
import { protectedProcedure, t } from "../../middleware.ts";

/**
 * Experience Input/Output Schemas
 */
const experienceEntrySchema = z.object({
  id: z.string().uuid().optional(),
  user_id: z.string().uuid().optional(),
  job_title: z.string().min(1, "Job title is required"),
  company_name: z.string().min(1, "Company name is required"),
  employment_type: z.string().optional().nullable(),
  location: z.string().optional().nullable(),
  is_remote: z.boolean().default(false),
  start_date: z.string().optional().nullable(),
  end_date: z.string().optional().nullable(),
  is_current: z.boolean().default(false),
  description: z.string().optional().nullable(),
  key_achievements: z.array(z.string()).optional().nullable(),
  skills_used: z.array(z.string()).optional().nullable(),
  industry: z.string().optional().nullable(),
  company_size: z.string().optional().nullable(),
  salary_range: z.string().optional().nullable(),
  is_verified: z.boolean().default(false),
  created_at: z.string().optional(),
  updated_at: z.string().optional(),
});

const getExperienceOutputSchema = z.array(experienceEntrySchema);

const saveExperienceInputSchema = z.object({
  career_level: z.string().optional().nullable(),
  experience_entries: z.array(experienceEntrySchema),
});

const saveExperienceOutputSchema = z.object({
  success: z.boolean(),
  experience_entries: z.array(experienceEntrySchema),
});

const deleteExperienceInputSchema = z.object({
  experienceId: z.string().uuid(),
});

const deleteExperienceOutputSchema = z.object({
  success: z.boolean(),
});

/**
 * Profile Experience router - handles work experience CRUD operations
 */
export const profileExperienceRouter = t.router({
  /**
   * Get user's experience entries
   */
  getExperience: protectedProcedure
    .output(getExperienceOutputSchema)
    .query(async ({ ctx }) => {
      const { supabase, user } = ctx;

      const { data, error } = await supabase
        .from("user_experience")
        .select("*")
        .eq("user_id", user.id)
        .order("start_date", { ascending: false });

      if (error) {
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: `Failed to fetch experience: ${error.message}`,
        });
      }

      return data || [];
    }),

  /**
   * Get experience summary from private.profile
   */
  getExperienceSummary: protectedProcedure
    .output(
      z.object({
        career_level: z.string().nullable(),
      }),
    )
    .query(async ({ ctx }) => {
      const { supabase, user } = ctx;

      const { data, error } = await supabase
        .schema("private")
        .from("profile")
        .select("career_level")
        .eq("user_id", user.id)
        .single();

      if (error) {
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: `Failed to fetch experience summary: ${error.message}`,
        });
      }

      return {
        career_level: data?.career_level || null,
      };
    }),

  /**
   * Save experience (create/update bulk)
   */
  saveExperience: protectedProcedure
    .input(saveExperienceInputSchema)
    .output(saveExperienceOutputSchema)
    .mutation(async ({ ctx, input }) => {
      const { supabase, user } = ctx;

      try {
        // Update experience summary in private.profile if provided
        if (input.career_level !== undefined) {
          const updateData: Record<string, unknown> = {
            updated_at: new Date().toISOString(),
            career_level: input.career_level,
          };

          const { error: summaryError } = await supabase
            .schema("private")
            .from("profile")
            .update(updateData)
            .eq("user_id", user.id);

          if (summaryError) {
            throw new TRPCError({
              code: "INTERNAL_SERVER_ERROR",
              message:
                `Failed to update experience summary: ${summaryError.message}`,
            });
          }
        }

        const savedExperience = [];

        for (const exp of input.experience_entries) {
          if (exp.id) {
            // Update existing experience
            const { data, error } = await supabase
              .from("user_experience")
              .update({
                job_title: exp.job_title,
                company_name: exp.company_name,
                employment_type: exp.employment_type || null,
                location: exp.location || null,
                is_remote: exp.is_remote,
                start_date: exp.start_date || null,
                end_date: exp.end_date || null,
                is_current: exp.is_current,
                description: exp.description || null,
                key_achievements: exp.key_achievements || null,
                skills_used: exp.skills_used || null,
                industry: exp.industry || null,
                company_size: exp.company_size || null,
                salary_range: exp.salary_range || null,
                is_verified: exp.is_verified,
                updated_at: new Date().toISOString(),
              })
              .eq("id", exp.id)
              .eq("user_id", user.id)
              .select()
              .single();

            if (error) {
              throw new TRPCError({
                code: "INTERNAL_SERVER_ERROR",
                message: `Failed to update experience: ${error.message}`,
              });
            }

            savedExperience.push(data);
          } else {
            // Create new experience
            const { data, error } = await supabase
              .from("user_experience")
              .insert({
                user_id: user.id,
                job_title: exp.job_title,
                company_name: exp.company_name,
                employment_type: exp.employment_type || null,
                location: exp.location || null,
                is_remote: exp.is_remote,
                start_date: exp.start_date || null,
                end_date: exp.end_date || null,
                is_current: exp.is_current,
                description: exp.description || null,
                key_achievements: exp.key_achievements || null,
                skills_used: exp.skills_used || null,
                industry: exp.industry || null,
                company_size: exp.company_size || null,
                salary_range: exp.salary_range || null,
                is_verified: exp.is_verified,
              })
              .select()
              .single();

            if (error) {
              throw new TRPCError({
                code: "INTERNAL_SERVER_ERROR",
                message: `Failed to create experience: ${error.message}`,
              });
            }

            savedExperience.push(data);
          }
        }

        return {
          success: true,
          experience_entries: savedExperience,
        };
      } catch (error) {
        const errorMessage = error instanceof Error
          ? error.message
          : String(error);
        console.error("Save experience error:", error);
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: `Failed to save experience: ${errorMessage}`,
        });
      }
    }),

  /**
   * Delete experience entry
   */
  deleteExperience: protectedProcedure
    .input(deleteExperienceInputSchema)
    .output(deleteExperienceOutputSchema)
    .mutation(async ({ ctx, input }) => {
      const { supabase, user } = ctx;

      try {
        const { error } = await supabase
          .from("user_experience")
          .delete()
          .eq("id", input.experienceId)
          .eq("user_id", user.id);

        if (error) {
          throw new TRPCError({
            code: "INTERNAL_SERVER_ERROR",
            message: `Failed to delete experience: ${error.message}`,
          });
        }

        return { success: true };
      } catch (error) {
        const errorMessage = error instanceof Error
          ? error.message
          : String(error);
        console.error("Delete experience error:", error);
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: `Failed to delete experience: ${errorMessage}`,
        });
      }
    }),
});
