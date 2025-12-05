import { TRPCError } from "@trpc/server";
import { z } from "zod";
import { protectedProcedure, publicProcedure, t } from '../middleware.ts';

/**
 * O*NET Router - Handles career assessment and occupation data
 */
export const onetRouter = t.router({
  /**
   * Search occupations by keyword
   * Returns matching occupations from O*NET database
   */
  searchOccupations: publicProcedure
    .input(
      z.object({
        query: z.string().min(1, "Search query is required"),
        limit: z.number().min(1).max(50).optional().default(10),
      }),
    )
    .query(async ({ ctx, input }) => {
      const { supabase } = ctx;

      try {
        // Attempt to use the managed RPC if available
        const { data, error } = await supabase.rpc("search_occupations", {
          search_query: input.query,
          max_results: input.limit,
        });

        if (error) {
          // When running locally the RPC may not be present—fall back to a basic ilike query
          const missingFunction = error.code === "PGRST202" ||
            error.code === "42704" ||
            error.code === "42883" ||
            error.message?.includes("search_occupations");

          if (!missingFunction) {
            console.error("[onet.searchOccupations] RPC error", {
              message: error.message,
              code: error.code,
            });
            throw new TRPCError({
              code: "INTERNAL_SERVER_ERROR",
              message: `Failed to search occupations: ${error.message}`,
            });
          }

          const { data: fallbackData, error: fallbackError } = await supabase
            .schema("onet")
            .from("occupation_data")
            .select("onetsoc_code, title, description")
            .ilike("title", `%${input.query}%`)
            .order("title", { ascending: true })
            .limit(input.limit);

          if (fallbackError) {
            console.error("[onet.searchOccupations] Fallback query failed", {
              message: fallbackError.message,
              code: fallbackError.code,
            });
            throw new TRPCError({
              code: "INTERNAL_SERVER_ERROR",
              message: `Failed to search occupations: ${fallbackError.message}`,
            });
          }

          return {
            occupations: fallbackData ?? [],
            query: input.query,
          };
        }

        return {
          occupations: data || [],
          query: input.query,
        };
      } catch (error) {
        if (error instanceof TRPCError) {
          throw error;
        }

        console.error("Error in searchOccupations:", error);
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Failed to search occupations",
        });
      }
    }),

  /**
   * Save user's RIASEC assessment
   * Can save RIASEC scores, occupations, or both independently
   */
  saveCareerAssessment: protectedProcedure
    .input(
      z.object({
        riasec_scores: z
          .object({
            realistic: z.number().min(1).max(5),
            investigative: z.number().min(1).max(5),
            artistic: z.number().min(1).max(5),
            social: z.number().min(1).max(5),
            enterprising: z.number().min(1).max(5),
            conventional: z.number().min(1).max(5),
          })
          .optional(),
        current_occupation_code: z.string().optional(),
        target_occupation_codes: z.array(z.string()).optional(),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      const { supabase, user } = ctx;

      try {
        // Get existing preferences to merge with
        const { data: existing, error: fetchError } = await supabase
          .schema("core")
          .from("preferences")
          .select(
            "riasec_scores, current_occupation_code, target_occupation_codes",
          )
          .eq("user_id", user.id)
          .single();

        const now = new Date().toISOString();

        // Merge with existing data - only update provided fields
        const updateData: {
          user_id: string;
          riasec_scores?: unknown;
          current_occupation_code?: string | null;
          target_occupation_codes?: string[];
          career_assessment_completed_at?: string;
          updated_at: string;
        } = {
          user_id: user.id,
          updated_at: now,
        };

        // Only update RIASEC scores if provided
        if (input.riasec_scores) {
          updateData.riasec_scores = input.riasec_scores;
          // Mark as completed if RIASEC scores are provided
          updateData.career_assessment_completed_at = now;
        } else if (existing?.riasec_scores) {
          updateData.riasec_scores = existing.riasec_scores;
        }

        // Only update occupations if provided
        if (input.current_occupation_code !== undefined) {
          updateData.current_occupation_code = input.current_occupation_code ||
            null;
        } else if (existing?.current_occupation_code !== undefined) {
          updateData.current_occupation_code = existing.current_occupation_code;
        }

        if (input.target_occupation_codes !== undefined) {
          updateData.target_occupation_codes = input.target_occupation_codes ||
            [];
        } else if (existing?.target_occupation_codes !== undefined) {
          updateData.target_occupation_codes =
            existing.target_occupation_codes || [];
        }

        // If preferences don't exist and we're creating new, include all fields
        if (fetchError && fetchError.code === "PGRST116") {
          // Create new preferences record
          const { error: createError } = await supabase
            .schema("core")
            .from("preferences")
            .insert({
              user_id: user.id,
              riasec_scores: input.riasec_scores || null,
              current_occupation_code: input.current_occupation_code || null,
              target_occupation_codes: input.target_occupation_codes || [],
              career_assessment_completed_at: input.riasec_scores ? now : null,
              updated_at: now,
            });

          if (createError) {
            throw new TRPCError({
              code: "INTERNAL_SERVER_ERROR",
              message: `Failed to create preferences: ${createError.message}`,
            });
          }

          return { success: true };
        }

        const { error } = await supabase.schema("core").from("preferences")
          .upsert(updateData);

        if (error) {
          console.error("Error saving career assessment:", error);
          throw new TRPCError({
            code: "INTERNAL_SERVER_ERROR",
            message: `Failed to save career assessment: ${error.message}`,
          });
        }

        return { success: true };
      } catch (error) {
        if (error instanceof TRPCError) throw error;
        console.error("Error in saveCareerAssessment:", error);
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Failed to save career assessment",
        });
      }
    }),

  /**
   * Get user's career assessment status
   */
  getCareerAssessmentStatus: protectedProcedure.query(async ({ ctx }) => {
    const { supabase, user } = ctx;

    try {
      const { data, error } = await supabase
        .schema("core")
        .from("preferences")
        .select(
          "riasec_scores, current_occupation_code, target_occupation_codes, career_assessment_completed_at",
        )
        .eq("user_id", user.id)
        .single();

      if (error && error.code !== "PGRST116") {
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: `Failed to fetch career assessment: ${error.message}`,
        });
      }

      return {
        hasCompleted: !!data?.career_assessment_completed_at,
        riasec_scores: data?.riasec_scores || null,
        current_occupation_code: data?.current_occupation_code || null,
        target_occupation_codes: data?.target_occupation_codes || [],
        completed_at: data?.career_assessment_completed_at || null,
      };
    } catch (error) {
      if (error instanceof TRPCError) throw error;
      console.error("Error in getCareerAssessmentStatus:", error);
      throw new TRPCError({
        code: "INTERNAL_SERVER_ERROR",
        message: "Failed to fetch career assessment status",
      });
    }
  }),

  /**
   * Get occupation details by O*NET code
   */
  getOccupation: publicProcedure
    .input(
      z.object({
        onetCode: z.string().min(1, "O*NET code is required"),
      }),
    )
    .query(async ({ ctx, input }) => {
      const { supabase } = ctx;

      try {
        const { data, error } = await supabase
          .schema("onet")
          .from("occupation_data")
          .select("*")
          .eq("onetsoc_code", input.onetCode)
          .single();

        if (error) {
          if (error.code === "PGRST116") {
            throw new TRPCError({
              code: "NOT_FOUND",
              message: "Occupation not found",
            });
          }
          throw new TRPCError({
            code: "INTERNAL_SERVER_ERROR",
            message: `Failed to fetch occupation: ${error.message}`,
          });
        }

        return data;
      } catch (error) {
        if (error instanceof TRPCError) throw error;
        console.error("Error in getOccupation:", error);
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Failed to fetch occupation details",
        });
      }
    }),

  /**
   * Get RIASEC assessment completion status
   */
  getRIASECStatus: protectedProcedure.query(async ({ ctx }) => {
    const { supabase, user } = ctx;

    try {
      const { data, error } = await supabase
        .schema("core")
        .from("preferences")
        .select("riasec_scores")
        .eq("user_id", user.id)
        .single();

      if (error && error.code !== "PGRST116") {
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: `Failed to fetch status: ${error.message}`,
        });
      }

      const riasecScores = data?.riasec_scores as {
        realistic?: number;
        investigative?: number;
        artistic?: number;
        social?: number;
        enterprising?: number;
        conventional?: number;
      } | null;

      const isCompleted = !!(
        riasecScores &&
        typeof riasecScores.realistic === "number" &&
        typeof riasecScores.investigative === "number" &&
        typeof riasecScores.artistic === "number" &&
        typeof riasecScores.social === "number" &&
        typeof riasecScores.enterprising === "number" &&
        typeof riasecScores.conventional === "number"
      );

      return {
        isCompleted,
        scores: riasecScores,
      };
    } catch (error) {
      if (error instanceof TRPCError) throw error;
      console.error("Error in getRIASECStatus:", error);
      throw new TRPCError({
        code: "INTERNAL_SERVER_ERROR",
        message: "Failed to get RIASEC status",
      });
    }
  }),

  /**
   * Get occupation assessment completion status
   */
  getOccupationStatus: protectedProcedure.query(async ({ ctx }) => {
    const { supabase, user } = ctx;

    try {
      const { data, error } = await supabase
        .schema("core")
        .from("preferences")
        .select("current_occupation_code, target_occupation_codes")
        .eq("user_id", user.id)
        .single();

      if (error && error.code !== "PGRST116") {
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: `Failed to fetch status: ${error.message}`,
        });
      }

      const hasCurrentOccupation = !!data?.current_occupation_code;
      const hasTargetOccupations = !!(
        data?.target_occupation_codes &&
        Array.isArray(data.target_occupation_codes) &&
        data.target_occupation_codes.length > 0
      );
      const isCompleted = hasCurrentOccupation || hasTargetOccupations;

      return {
        isCompleted,
        hasCurrentOccupation,
        hasTargetOccupations,
        currentOccupationCode: data?.current_occupation_code || null,
        targetOccupationCodes: data?.target_occupation_codes || [],
      };
    } catch (error) {
      if (error instanceof TRPCError) throw error;
      console.error("Error in getOccupationStatus:", error);
      throw new TRPCError({
        code: "INTERNAL_SERVER_ERROR",
        message: "Failed to get occupation status",
      });
    }
  }),
});
