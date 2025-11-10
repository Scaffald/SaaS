import { TRPCError } from "@trpc/server";
import { z } from "zod";
import { protectedProcedure, t } from "../../middleware.ts";

/**
 * Education Input/Output Schemas
 */
const educationEntrySchema = z.object({
  id: z.string().uuid().optional(),
  user_id: z.string().uuid().optional(),
  university_id: z.string().uuid().nullable().optional(),
  institution_name: z.string().min(1, "Institution name is required"),
  is_verified: z.boolean().default(false),
  degree_type: z.string().optional().nullable(),
  custom_degree_type: z.string().optional().nullable(),
  field_of_study: z.string().optional().nullable(),
  start_date: z.string().optional().nullable(),
  end_date: z.string().optional().nullable(),
  expected_graduation_date: z.string().optional().nullable(),
  is_current: z.boolean().default(false),
  gpa: z.number().min(0).max(4.0).optional().nullable(),
  description: z.string().optional().nullable(),
  location: z.string().optional().nullable(),
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
   * Get user's education entries with university details
   */
  getEducation: protectedProcedure
    .output(getEducationOutputSchema)
    .query(async ({ ctx }) => {
      const { supabase, user } = ctx;

      const { data, error } = await supabase
        .schema("core")
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

      // Fetch university names for records that have university_id
      const educationData = await Promise.all(
        (data || []).map(async (edu) => {
          if (edu.university_id) {
            const { data: university } = await supabase
              .schema("data")
              .from("universities")
              .select("name")
              .eq("id", edu.university_id)
              .single();

            return {
              ...edu,
              institution_name: university?.name || edu.institution_name,
            };
          }
          return edu;
        }),
      );

      return educationData;
    }),

  /**
   * Get education level from private.profile
   */
  getEducationLevel: protectedProcedure
    .output(z.object({ education_level: z.string().nullable() }))
    .query(async ({ ctx }) => {
      const { supabase, user } = ctx;

      const { data, error } = await supabase
        .schema("core")
        .from("profile")
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
        // Update education level in private.profile if provided
        if (input.education_level !== undefined) {
          const { error: levelError } = await supabase
            .schema("core")
            .from("profile")
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

        // Get all existing education entries to identify which ones to delete
        const { data: existingEducation, error: fetchError } = await supabase
          .schema("core")
          .from("user_education")
          .select("id")
          .eq("user_id", user.id);

        if (fetchError) {
          throw new TRPCError({
            code: "INTERNAL_SERVER_ERROR",
            message:
              `Failed to fetch existing education: ${fetchError.message}`,
          });
        }

        const existingIds = new Set((existingEducation || []).map((e) => e.id));
        const inputIds = new Set(
          input.education_entries.filter((e) => e.id).map((e) =>
            e.id as string
          ),
        );

        const savedEducation = [];

        for (const [index, edu] of input.education_entries.entries()) {
          const entryLabel = `education entry #${index + 1}`;

          const universityId = edu.university_id ?? null;
          const institutionName = (edu.institution_name ?? "").trim();
          if (!institutionName) {
            throw new TRPCError({
              code: "BAD_REQUEST",
              message: `${entryLabel}: Institution name is required.`,
            });
          }

          const startDateRaw = edu.start_date ?? "";
          const startDate = startDateRaw.trim();
          if (!startDate) {
            throw new TRPCError({
              code: "BAD_REQUEST",
              message: `${entryLabel}: Start date is required.`,
            });
          }

          const isCurrent = edu.is_current ?? false;
          const endDateRaw = edu.end_date ?? null;
          const endDate = endDateRaw ? endDateRaw.trim() : null;
          if (!isCurrent && !endDate) {
            throw new TRPCError({
              code: "BAD_REQUEST",
              message: `${entryLabel}: End date is required unless currently enrolled.`,
            });
          }

          if (endDate) {
            const start = new Date(startDate);
            const end = new Date(endDate);
            if (!Number.isNaN(start.getTime()) && !Number.isNaN(end.getTime()) && end <= start) {
              throw new TRPCError({
                code: "BAD_REQUEST",
                message: `${entryLabel}: End date must be after start date.`,
              });
            }
          }

          const expectedGradRaw = edu.expected_graduation_date ?? null;
          const expectedGraduationDate =
            isCurrent && expectedGradRaw ? expectedGradRaw.trim() : null;

          const fieldOfStudy =
            typeof edu.field_of_study === "string" && edu.field_of_study.trim().length > 0
              ? edu.field_of_study.trim()
              : null;

          const location =
            typeof edu.location === "string" && edu.location.trim().length > 0
              ? edu.location.trim()
              : null;

          const description =
            typeof edu.description === "string" && edu.description.trim().length > 0
              ? edu.description.trim()
              : null;
          if (description && description.length > 500) {
            throw new TRPCError({
              code: "BAD_REQUEST",
              message: `${entryLabel}: Description cannot exceed 500 characters.`,
            });
          }

          const hasCustomDegree = edu.degree_type === "Other";
          const customDegree =
            hasCustomDegree && typeof edu.custom_degree_type === "string"
              ? edu.custom_degree_type.trim()
              : "";
          if (hasCustomDegree && customDegree.length === 0) {
            throw new TRPCError({
              code: "BAD_REQUEST",
              message: `${entryLabel}: Please specify the degree type for "Other".`,
            });
          }

          const normalizedDegree =
            hasCustomDegree
              ? customDegree
              : typeof edu.degree_type === "string" && edu.degree_type.trim().length > 0
              ? edu.degree_type.trim()
              : null;

          const rawGpa =
            typeof edu.gpa === "number"
              ? edu.gpa
              : typeof edu.gpa === "string" && edu.gpa.trim().length > 0
                ? Number(edu.gpa)
                : null;
          if (
            rawGpa != null &&
            (Number.isNaN(rawGpa) || rawGpa < 0 || rawGpa > 4)
          ) {
            throw new TRPCError({
              code: "BAD_REQUEST",
              message: `${entryLabel}: GPA must be between 0.0 and 4.0.`,
            });
          }

          const isVerified = !!universityId;

          if (edu.id) {
            // Update existing education
            const { data, error } = await supabase
              .schema("core")
              .from("user_education")
              .update({
                university_id: universityId,
                institution_name: institutionName,
                is_verified: isVerified,
                degree_type: normalizedDegree,
                field_of_study: fieldOfStudy,
                start_date: startDate,
                end_date: endDate,
                expected_graduation_date: expectedGraduationDate,
                is_current: isCurrent,
                gpa: rawGpa,
                description,
                location,
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

            savedEducation.push({
              ...data,
              institution_name: institutionName,
              degree_type: normalizedDegree,
              field_of_study: fieldOfStudy,
              start_date: startDate,
              end_date: endDate,
              expected_graduation_date: expectedGraduationDate,
              is_current: isCurrent,
              gpa: rawGpa,
              description,
              location,
              is_verified: isVerified,
            });
          } else {
            // Create new education
            const { data, error } = await supabase
              .schema("core")
              .from("user_education")
              .insert({
                user_id: user.id,
                university_id: universityId,
                institution_name: institutionName,
                is_verified: isVerified,
                degree_type: normalizedDegree,
                field_of_study: fieldOfStudy,
                start_date: startDate,
                end_date: endDate,
                expected_graduation_date: expectedGraduationDate,
                is_current: isCurrent,
                gpa: rawGpa,
                description,
                location,
              })
              .select()
              .single();

            if (error) {
              throw new TRPCError({
                code: "INTERNAL_SERVER_ERROR",
                message: `Failed to create education: ${error.message}`,
              });
            }

            savedEducation.push({
              ...data,
              institution_name: institutionName,
              degree_type: normalizedDegree,
              field_of_study: fieldOfStudy,
              start_date: startDate,
              end_date: endDate,
              expected_graduation_date: expectedGraduationDate,
              is_current: isCurrent,
              gpa: rawGpa,
              description,
              location,
              is_verified: isVerified,
            });
          }
        }

        // Delete entries that exist in DB but are not in the input array
        const idsToDelete = Array.from(existingIds).filter((id) =>
          !inputIds.has(id)
        );
        if (idsToDelete.length > 0) {
          const { error: deleteError } = await supabase
            .schema("core")
            .from("user_education")
            .delete()
            .eq("user_id", user.id)
            .in("id", idsToDelete);

          if (deleteError) {
            throw new TRPCError({
              code: "INTERNAL_SERVER_ERROR",
              message:
                `Failed to delete removed education entries: ${deleteError.message}`,
            });
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
          .schema("core")
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
