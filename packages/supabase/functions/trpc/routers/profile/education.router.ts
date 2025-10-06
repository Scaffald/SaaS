import { TRPCError } from "@trpc/server";
import { z } from "zod";
import { protectedProcedure, t } from "../../middleware.ts";

/**
 * Education Input/Output Schemas
 */
const educationEntrySchema = z.object({
  id: z.string().uuid().optional(),
  user_id: z.string().uuid().optional(),
  institution_name: z.string().min(1, "Institution name is required"),
  degree_type: z.string().optional().nullable(),
  field_of_study: z.string().optional().nullable(),
  start_date: z.string().optional().nullable(),
  end_date: z.string().optional().nullable(),
  is_current: z.boolean().default(false),
  gpa: z.number().min(0).max(4.0).optional().nullable(),
  honors: z.array(z.string()).optional().nullable(),
  activities: z.string().optional().nullable(),
  description: z.string().optional().nullable(),
  location: z.string().optional().nullable(),
  is_verified: z.boolean().default(false),
  created_at: z.string().optional(),
  updated_at: z.string().optional(),
});

const getEducationOutputSchema = z.array(educationEntrySchema);

const saveEducationInputSchema = z.object({
  education_level: z.string().optional().nullable(),
  education_entries: z.array(educationEntrySchema),
});

const saveEducationOutputSchema = z.object({
  success: z.boolean(),
  education_entries: z.array(educationEntrySchema),
});

const deleteEducationInputSchema = z.object({
  educationId: z.string().uuid(),
});

const deleteEducationOutputSchema = z.object({
  success: z.boolean(),
});

/**
 * Profile Education router - handles education CRUD operations
 */
export const profileEducationRouter = t.router({
  /**
   * Get user's education entries
   */
  getEducation: protectedProcedure
    .output(getEducationOutputSchema)
    .query(async ({ ctx }) => {
      const { supabase, user } = ctx;

      const { data, error } = await supabase
        .from("user_education")
        .select("*")
        .eq("user_id", user.id)
        .order("start_date", { ascending: false });

      if (error) {
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: `Failed to fetch education: ${error.message}`,
        });
      }

      return data || [];
    }),

  /**
   * Get education level from user_private
   */
  getEducationLevel: protectedProcedure
    .output(z.object({ education_level: z.string().nullable() }))
    .query(async ({ ctx }) => {
      const { supabase, user } = ctx;

      const { data, error } = await supabase
        .from("user_private")
        .select("education_level")
        .eq("user_id", user.id)
        .single();

      if (error) {
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: `Failed to fetch education level: ${error.message}`,
        });
      }

      return { education_level: data?.education_level || null };
    }),

  /**
   * Save education (create/update bulk)
   */
  saveEducation: protectedProcedure
    .input(saveEducationInputSchema)
    .output(saveEducationOutputSchema)
    .mutation(async ({ ctx, input }) => {
      const { supabase, user } = ctx;

      try {
        // Update education level in user_private if provided
        if (input.education_level !== undefined) {
          const { error: levelError } = await supabase
            .from("user_private")
            .update({
              education_level: input.education_level,
              updated_at: new Date().toISOString(),
            })
            .eq("user_id", user.id);

          if (levelError) {
            throw new TRPCError({
              code: "INTERNAL_SERVER_ERROR",
              message:
                `Failed to update education level: ${levelError.message}`,
            });
          }
        }

        const savedEducation = [];

        for (const edu of input.education_entries) {
          if (edu.id) {
            // Update existing education
            const { data, error } = await supabase
              .from("user_education")
              .update({
                institution_name: edu.institution_name,
                degree_type: edu.degree_type || null,
                field_of_study: edu.field_of_study || null,
                start_date: edu.start_date || null,
                end_date: edu.end_date || null,
                is_current: edu.is_current,
                gpa: edu.gpa || null,
                honors: edu.honors || null,
                activities: edu.activities || null,
                description: edu.description || null,
                location: edu.location || null,
                is_verified: edu.is_verified,
                updated_at: new Date().toISOString(),
              })
              .eq("id", edu.id)
              .eq("user_id", user.id)
              .select()
              .single();

            if (error) {
              throw new TRPCError({
                code: "INTERNAL_SERVER_ERROR",
                message: `Failed to update education: ${error.message}`,
              });
            }

            savedEducation.push(data);
          } else {
            // Create new education
            const { data, error } = await supabase
              .from("user_education")
              .insert({
                user_id: user.id,
                institution_name: edu.institution_name,
                degree_type: edu.degree_type || null,
                field_of_study: edu.field_of_study || null,
                start_date: edu.start_date || null,
                end_date: edu.end_date || null,
                is_current: edu.is_current,
                gpa: edu.gpa || null,
                honors: edu.honors || null,
                activities: edu.activities || null,
                description: edu.description || null,
                location: edu.location || null,
                is_verified: edu.is_verified,
              })
              .select()
              .single();

            if (error) {
              throw new TRPCError({
                code: "INTERNAL_SERVER_ERROR",
                message: `Failed to create education: ${error.message}`,
              });
            }

            savedEducation.push(data);
          }
        }

        return {
          success: true,
          education_entries: savedEducation,
        };
      } catch (error) {
        const errorMessage = error instanceof Error
          ? error.message
          : String(error);
        console.error("Save education error:", error);
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: `Failed to save education: ${errorMessage}`,
        });
      }
    }),

  /**
   * Delete education entry
   */
  deleteEducation: protectedProcedure
    .input(deleteEducationInputSchema)
    .output(deleteEducationOutputSchema)
    .mutation(async ({ ctx, input }) => {
      const { supabase, user } = ctx;

      try {
        const { error } = await supabase
          .from("user_education")
          .delete()
          .eq("id", input.educationId)
          .eq("user_id", user.id);

        if (error) {
          throw new TRPCError({
            code: "INTERNAL_SERVER_ERROR",
            message: `Failed to delete education: ${error.message}`,
          });
        }

        return { success: true };
      } catch (error) {
        const errorMessage = error instanceof Error
          ? error.message
          : String(error);
        console.error("Delete education error:", error);
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: `Failed to delete education: ${errorMessage}`,
        });
      }
    }),
});
