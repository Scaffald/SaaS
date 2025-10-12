import { TRPCError } from "@trpc/server";
import { z } from "zod";
import { protectedProcedure, publicProcedure, t } from "../middleware.ts";

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
        // Use O*NET's search function
        const { data, error } = await supabase.rpc("search_occupations", {
          search_query: input.query,
          max_results: input.limit,
        });

        if (error) {
          console.error("Error searching occupations:", error);
          throw new TRPCError({
            code: "INTERNAL_SERVER_ERROR",
            message: `Failed to search occupations: ${error.message}`,
          });
        }

        return {
          occupations: data || [],
          query: input.query,
        };
      } catch (error) {
        console.error("Error in searchOccupations:", error);
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Failed to search occupations",
        });
      }
    }),

  /**
   * Save user's RIASEC assessment
   */
  saveCareerAssessment: protectedProcedure
    .input(
      z.object({
        riasec_scores: z.object({
          realistic: z.number().min(1).max(5),
          investigative: z.number().min(1).max(5),
          artistic: z.number().min(1).max(5),
          social: z.number().min(1).max(5),
          enterprising: z.number().min(1).max(5),
          conventional: z.number().min(1).max(5),
        }),
        current_occupation_code: z.string().optional(),
        target_occupation_codes: z.array(z.string()).optional(),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      const { supabase, user } = ctx;

      try {
        const now = new Date().toISOString();

        const { error } = await supabase
          .schema("private")
          .from("preferences")
          .upsert({
            user_id: user.id,
            riasec_scores: input.riasec_scores,
            current_occupation_code: input.current_occupation_code || null,
            target_occupation_codes: input.target_occupation_codes || [],
            career_assessment_completed_at: now,
            updated_at: now,
          });

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
        .schema("private")
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
});
