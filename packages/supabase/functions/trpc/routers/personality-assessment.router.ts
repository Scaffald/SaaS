import { TRPCError } from "@trpc/server";
import { z } from "zod";
import { protectedProcedure, publicProcedure, t } from "../middleware.ts";
import { mapToArchetype } from "../../_shared/ipip-archetype-mapper.ts";
import { getScore } from "../../_shared/ipip-score.ts";
import type { IPIPAnswer } from "../../_shared/ipip-types.ts";

/**
 * Personality Assessment Router - Handles personality assessment operations
 */
export const personalityAssessmentRouter = t.router({
  /**
   * Get assessment status or create new assessment
   * Returns current progress or creates a new assessment if none exists
   */
  getAssessmentStatus: protectedProcedure.query(async ({ ctx }) => {
    const { supabase, user } = ctx;

    try {
      const { data, error } = await supabase
        .schema("core")
        .from("personality_assessments")
        .select("*")
        .eq("user_id", user.id)
        .single();

      if (error && error.code !== "PGRST116") {
        // PGRST116 is "not found" - that's okay, we'll create one
        console.error("Error fetching assessment:", error);
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: `Failed to fetch assessment: ${error.message}`,
        });
      }

      // If assessment exists, return it
      if (data) {
        return data;
      }

      // Create new assessment
      const now = new Date().toISOString();
      const { data: newAssessment, error: createError } = await supabase
        .schema("core")
        .from("personality_assessments")
        .insert({
          user_id: user.id,
          current_step: "luscher1",
          completion_score: 0,
          started_at: now,
          last_updated_at: now,
        })
        .select()
        .single();

      if (createError) {
        console.error("Error creating assessment:", createError);
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: `Failed to create assessment: ${createError.message}`,
        });
      }

      return newAssessment;
    } catch (error) {
      if (error instanceof TRPCError) throw error;
      console.error("Error in getAssessmentStatus:", error);
      throw new TRPCError({
        code: "INTERNAL_SERVER_ERROR",
        message: "Failed to get assessment status",
      });
    }
  }),

  /**
   * Save Luscher Test 1 results
   */
  saveLuscher1: protectedProcedure
    .input(
      z.object({
        choices: z.array(z.number()).length(8, "Must select exactly 8 colors"),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      const { supabase, user } = ctx;

      try {
        const now = new Date();

        // Get existing assessment to preserve other fields
        const { error: fetchError } = await supabase
          .schema("core")
          .from("personality_assessments")
          .select("*")
          .eq("user_id", user.id)
          .single();

        // Create assessment if it doesn't exist
        if (fetchError && fetchError.code === "PGRST116") {
          const cooldownEndTime = new Date(now.getTime() + 60 * 1000); // 60 seconds from now

          const { error: createError } = await supabase
            .schema("core")
            .from("personality_assessments")
            .insert({
              user_id: user.id,
              luscher1_choices: input.choices,
              luscher1_completed_at: now.toISOString(),
              current_step: "cooldown",
              completion_score: 25,
              cooldown_end_time: cooldownEndTime.toISOString(),
              started_at: now.toISOString(),
              last_updated_at: now.toISOString(),
            });

          if (createError) {
            throw new TRPCError({
              code: "INTERNAL_SERVER_ERROR",
              message: `Failed to create assessment: ${createError.message}`,
            });
          }

          return { success: true };
        }

        const cooldownEndTime = new Date(now.getTime() + 60 * 1000); // 60 seconds from now

        const updateData: {
          luscher1_choices: number[];
          luscher1_completed_at: string;
          completion_score: number;
          last_updated_at: string;
          updated_at: string;
          current_step: string;
          cooldown_end_time: string;
        } = {
          luscher1_choices: input.choices,
          luscher1_completed_at: now.toISOString(),
          completion_score: 25, // 25% after completing luscher1
          last_updated_at: now.toISOString(),
          updated_at: now.toISOString(),
          current_step: "cooldown",
          cooldown_end_time: cooldownEndTime.toISOString(),
        };

        const { error } = await supabase
          .schema("core")
          .from("personality_assessments")
          .update(updateData)
          .eq("user_id", user.id);

        if (error) {
          console.error("Error saving Luscher Test 1:", error);
          throw new TRPCError({
            code: "INTERNAL_SERVER_ERROR",
            message: `Failed to save Luscher Test 1: ${error.message}`,
          });
        }

        return { success: true };
      } catch (error) {
        if (error instanceof TRPCError) throw error;
        console.error("Error in saveLuscher1:", error);
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Failed to save Luscher Test 1",
        });
      }
    }),

  /**
   * Save IPIP progress (incremental saves)
   */
  saveIPIPProgress: protectedProcedure
    .input(
      z.object({
        answers: z.array(
          z.object({
            id: z.string(),
            domain: z.enum(["A", "E", "N", "C", "O"]),
            facet: z.number(),
            score: z.number().min(1).max(5),
          }),
        ),
        current_index: z.number().min(0).max(120),
        language: z.string().default("en"),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      const { supabase, user } = ctx;

      try {
        const now = new Date().toISOString();
        const isComplete = input.answers.length >= 120;

        // Calculate completion score: 25% for luscher1 (if exists) + progress in IPIP
        const { data: assessment } = await supabase
          .schema("core")
          .from("personality_assessments")
          .select("luscher1_choices")
          .eq("user_id", user.id)
          .single();

        const luscher1Completed = assessment?.luscher1_choices?.length === 8;
        const luscher1Progress = luscher1Completed ? 25 : 0;
        const ipipProgress = Math.min((input.answers.length / 120) * 25, 25);
        const completionScore = Math.round(luscher1Progress + ipipProgress);

        const updateData: {
          ipip_answers: typeof input.answers;
          ipip_current_index: number;
          ipip_language: string;
          completion_score: number;
          last_updated_at: string;
          updated_at: string;
          ipip_completed_at?: string;
          current_step?: string;
        } = {
          ipip_answers: input.answers,
          ipip_current_index: input.current_index,
          ipip_language: input.language,
          completion_score: completionScore,
          last_updated_at: now,
          updated_at: now,
        };

        if (isComplete) {
          updateData.ipip_completed_at = now;
          // Only update step if part of combined flow
          const { data: existing } = await supabase
            .schema("core")
            .from("personality_assessments")
            .select("current_step")
            .eq("user_id", user.id)
            .single();
          if (existing?.current_step && existing.current_step !== "completed") {
            updateData.current_step = "luscher2";
          }
          updateData.completion_score = Math.round(luscher1Progress + 25); // 25% for completed IPIP

          // Set 30-day cooldown for retest
          const nextAvailableAt = new Date();
          nextAvailableAt.setDate(nextAvailableAt.getDate() + 30);
          updateData.next_available_at = nextAvailableAt.toISOString();
        }

        const { error } = await supabase
          .schema("core")
          .from("personality_assessments")
          .update(updateData)
          .eq("user_id", user.id);

        if (error) {
          console.error("Error saving IPIP progress:", error);
          throw new TRPCError({
            code: "INTERNAL_SERVER_ERROR",
            message: `Failed to save IPIP progress: ${error.message}`,
          });
        }

        // On completion: calculate archetype, store it, and award completion bonus XP
        if (isComplete) {
          try {
            // Calculate IPIP scores
            const scores = getScore({ answers: input.answers as IPIPAnswer[] });

            // Calculate archetype
            const archetypeResult = mapToArchetype(scores);

            // Get archetype ID from database
            const { data: archetypeData, error: archetypeError } = await supabase
              .schema("core")
              .from("archetypes")
              .select("id")
              .eq("name", archetypeResult.archetype.replace("Evolving ", ""))
              .single();

            if (!archetypeError && archetypeData) {
              // Mark previous archetypes as not primary
              await supabase
                .schema("core")
                .from("user_archetypes")
                .update({ is_primary: false })
                .eq("user_id", user.id);

              // Store new archetype as primary
              await supabase
                .schema("core")
                .from("user_archetypes")
                .insert({
                  user_id: user.id,
                  archetype_id: archetypeData.id,
                  assessment_date: now,
                  confidence_score: archetypeResult.confidence,
                  domain_scores: scores as unknown as Record<string, unknown>,
                  is_primary: true,
                });

              // Award +50 XP completion bonus (check if already awarded)
              const { data: existingXP } = await supabase
                .schema("core")
                .from("user_assessment_xp")
                .select("id")
                .eq("user_id", user.id)
                .eq("assessment_type", "ipip")
                .eq("xp_type", "completion")
                .single();

              if (!existingXP) {
                // Award +50 XP
                const { data: userData } = await supabase
                  .schema("core")
                  .from("users")
                  .select("frequency_xp")
                  .eq("id", user.id)
                  .single();

                const currentXP = (userData?.frequency_xp as number) || 0;
                const newXP = currentXP + 50;

                await supabase
                  .schema("core")
                  .from("users")
                  .update({ frequency_xp: newXP })
                  .eq("id", user.id);

                // Track XP award
                await supabase
                  .schema("core")
                  .from("user_assessment_xp")
                  .insert({
                    user_id: user.id,
                    assessment_type: "ipip",
                    xp_type: "completion",
                    xp_amount: 50,
                  });
              }
            }
          } catch (archetypeError) {
            // Log but don't fail the save operation
            console.error("Error calculating archetype:", archetypeError);
          }
        }

        return { success: true, isComplete };
      } catch (error) {
        if (error instanceof TRPCError) throw error;
        console.error("Error in saveIPIPProgress:", error);
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Failed to save IPIP progress",
        });
      }
    }),

  /**
   * Save Luscher Test 2 results
   */
  saveLuscher2: protectedProcedure
    .input(
      z.object({
        choices: z.array(z.number()).length(8, "Must select exactly 8 colors"),
        results: z.string().optional(), // Raw luscher-test library output
      }),
    )
    .mutation(async ({ ctx, input }) => {
      const { supabase, user } = ctx;

      try {
        const now = new Date().toISOString();

        // Calculate completion score: luscher1 (25%) + ipip (25%) + luscher2 (25%)
        const { data: assessment } = await supabase
          .schema("core")
          .from("personality_assessments")
          .select("luscher1_choices, ipip_answers")
          .eq("user_id", user.id)
          .single();

        const luscher1Completed = assessment?.luscher1_choices?.length === 8;
        const ipipAnswers = (assessment?.ipip_answers as Array<
          { id: string; domain: string; facet: number; score: number }
        >) || [];
        const ipipCompleted = ipipAnswers.length >= 120;
        const completionScore = (luscher1Completed ? 25 : 0) +
          (ipipCompleted ? 25 : 0) + 25;

        const updateData: {
          luscher2_choices: number[];
          luscher2_completed_at: string;
          completion_score: number;
          last_updated_at: string;
          updated_at: string;
          current_step?: string;
          luscher2_results?: string;
        } = {
          luscher2_choices: input.choices,
          luscher2_completed_at: now,
          completion_score: completionScore,
          last_updated_at: now,
          updated_at: now,
        };

        // Only update step if part of combined flow
        const { data: existing } = await supabase
          .schema("core")
          .from("personality_assessments")
          .select("current_step")
          .eq("user_id", user.id)
          .single();
        if (existing?.current_step && existing.current_step !== "completed") {
          updateData.current_step = "acute";
        }

        if (input.results) {
          updateData.luscher2_results = input.results;
        }

        const { error } = await supabase
          .schema("core")
          .from("personality_assessments")
          .update(updateData)
          .eq("user_id", user.id);

        if (error) {
          console.error("Error saving Luscher Test 2:", error);
          throw new TRPCError({
            code: "INTERNAL_SERVER_ERROR",
            message: `Failed to save Luscher Test 2: ${error.message}`,
          });
        }

        return { success: true };
      } catch (error) {
        if (error instanceof TRPCError) throw error;
        console.error("Error in saveLuscher2:", error);
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Failed to save Luscher Test 2",
        });
      }
    }),

  /**
   * Generate AI report from Luscher results
   * This calls OpenAI to generate a personality report
   */
  generateReport: protectedProcedure
    .input(
      z.object({
        luscherResults: z.string().min(1, "Luscher results are required"),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      const { supabase, user } = ctx;

      try {
        // Get OpenAI API key from environment
        const openaiApiKey = Deno.env.get("OPENAI_API_KEY");
        if (!openaiApiKey) {
          throw new TRPCError({
            code: "INTERNAL_SERVER_ERROR",
            message: "OpenAI API key not configured",
          });
        }

        // Call OpenAI API
        const response = await fetch(
          "https://api.openai.com/v1/chat/completions",
          {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
              Authorization: `Bearer ${openaiApiKey}`,
            },
            body: JSON.stringify({
              model: "gpt-4",
              messages: [
                {
                  role: "system",
                  content:
                    'You are a career psychologist and consultant. Use the following raw results from a Lüscher test and write a second-hand report to me, your client. The report should be a professional with a cohesive narrative around my acute vs aspirational challenges and opportunities. Unprofessional themes such as "sexual frustration" could be mapped to "frustrations in personal life" and so on. You don\'t need an opener or closing statement, just the raw report.',
                },
                {
                  role: "user",
                  content: input.luscherResults,
                },
              ],
              temperature: 1,
              max_tokens: 4000,
              top_p: 1,
              frequency_penalty: 0,
              presence_penalty: 0,
            }),
          },
        );

        if (!response.ok) {
          const errorData = await response.text();
          console.error("OpenAI API error:", errorData);
          throw new TRPCError({
            code: "INTERNAL_SERVER_ERROR",
            message: "Failed to generate report from OpenAI",
          });
        }

        const data = await response.json();
        const report = data.choices[0]?.message?.content;

        if (!report) {
          throw new TRPCError({
            code: "INTERNAL_SERVER_ERROR",
            message: "No report generated from OpenAI",
          });
        }

        // Save report to database
        const now = new Date().toISOString();
        const { error } = await supabase
          .schema("core")
          .from("personality_assessments")
          .update({
            ai_report: report,
            ai_report_generated_at: now,
            current_step: "completed",
            completed_at: now,
            completion_score: 100,
            last_updated_at: now,
            updated_at: now,
          })
          .eq("user_id", user.id);

        if (error) {
          console.error("Error saving report:", error);
          throw new TRPCError({
            code: "INTERNAL_SERVER_ERROR",
            message: `Failed to save report: ${error.message}`,
          });
        }

        return { success: true, report };
      } catch (error) {
        if (error instanceof TRPCError) throw error;
        console.error("Error in generateReport:", error);
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Failed to generate report",
        });
      }
    }),

  /**
   * Get completed assessment results
   */
  getResults: protectedProcedure.query(async ({ ctx }) => {
    const { supabase, user } = ctx;

    try {
      const { data, error } = await supabase
        .schema("core")
        .from("personality_assessments")
        .select("*")
        .eq("user_id", user.id)
        .single();

      if (error) {
        console.error("Error fetching results:", error);
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: `Failed to fetch results: ${error.message}`,
        });
      }

      if (!data) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Assessment not found",
        });
      }

      return data;
    } catch (error) {
      if (error instanceof TRPCError) throw error;
      console.error("Error in getResults:", error);
      throw new TRPCError({
        code: "INTERNAL_SERVER_ERROR",
        message: "Failed to get results",
      });
    }
  }),

  /**
   * Update current step
   * Used to advance to the next step after cooldown completes
   */
  updateCurrentStep: protectedProcedure
    .input(
      z.object({
        step: z.enum([
          "luscher1",
          "cooldown",
          "ipip",
          "luscher2",
          "acute",
          "completed",
        ]),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      const { supabase, user } = ctx;

      try {
        const now = new Date().toISOString();
        const { error } = await supabase
          .schema("core")
          .from("personality_assessments")
          .update({
            current_step: input.step,
            last_updated_at: now,
            updated_at: now,
          })
          .eq("user_id", user.id);

        if (error) {
          console.error("Error updating step:", error);
          throw new TRPCError({
            code: "INTERNAL_SERVER_ERROR",
            message: `Failed to update step: ${error.message}`,
          });
        }

        return { success: true };
      } catch (error) {
        if (error instanceof TRPCError) throw error;
        console.error("Error in updateCurrentStep:", error);
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Failed to update step",
        });
      }
    }),

  /**
   * Get Luscher Test 1 completion status
   */
  getLuscherTest1Status: protectedProcedure.query(async ({ ctx }) => {
    const { supabase, user } = ctx;

    try {
      const { data, error } = await supabase
        .schema("core")
        .from("personality_assessments")
        .select("luscher1_choices, luscher1_completed_at")
        .eq("user_id", user.id)
        .single();

      if (error && error.code !== "PGRST116") {
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: `Failed to fetch status: ${error.message}`,
        });
      }

      return {
        isCompleted: !!(data?.luscher1_completed_at &&
          data?.luscher1_choices?.length === 8),
        completedAt: data?.luscher1_completed_at || null,
      };
    } catch (error) {
      if (error instanceof TRPCError) throw error;
      console.error("Error in getLuscherTest1Status:", error);
      throw new TRPCError({
        code: "INTERNAL_SERVER_ERROR",
        message: "Failed to get Luscher Test 1 status",
      });
    }
  }),

  /**
   * Get IPIP assessment completion status
   */
  getIPIPStatus: protectedProcedure.query(async ({ ctx }) => {
    const { supabase, user } = ctx;

    try {
      const { data, error } = await supabase
        .schema("core")
        .from("personality_assessments")
        .select("ipip_answers, ipip_completed_at")
        .eq("user_id", user.id)
        .single();

      if (error && error.code !== "PGRST116") {
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: `Failed to fetch status: ${error.message}`,
        });
      }

      const answers = (data?.ipip_answers as Array<unknown>) || [];
      return {
        isCompleted: !!(data?.ipip_completed_at && answers.length >= 120),
        completedAt: data?.ipip_completed_at || null,
        progress: answers.length,
      };
    } catch (error) {
      if (error instanceof TRPCError) throw error;
      console.error("Error in getIPIPStatus:", error);
      throw new TRPCError({
        code: "INTERNAL_SERVER_ERROR",
        message: "Failed to get IPIP status",
      });
    }
  }),

  /**
   * Get Luscher Test 2 completion status
   */
  getLuscherTest2Status: protectedProcedure.query(async ({ ctx }) => {
    const { supabase, user } = ctx;

    try {
      const { data, error } = await supabase
        .schema("core")
        .from("personality_assessments")
        .select("luscher2_choices, luscher2_completed_at")
        .eq("user_id", user.id)
        .single();

      if (error && error.code !== "PGRST116") {
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: `Failed to fetch status: ${error.message}`,
        });
      }

      return {
        isCompleted: !!(data?.luscher2_completed_at &&
          data?.luscher2_choices?.length === 8),
        completedAt: data?.luscher2_completed_at || null,
      };
    } catch (error) {
      if (error instanceof TRPCError) throw error;
      console.error("Error in getLuscherTest2Status:", error);
      throw new TRPCError({
        code: "INTERNAL_SERVER_ERROR",
        message: "Failed to get Luscher Test 2 status",
      });
    }
  }),

  /**
   * Get Luscher Test availability (cooldown status)
   */
  getLuscherTestAvailability: protectedProcedure.query(async ({ ctx }) => {
    const { supabase, user } = ctx;

    try {
      const { data, error } = await supabase
        .schema("core")
        .from("personality_assessments")
        .select(
          "luscher1_completed_at, luscher2_completed_at, next_luscher_test_available_at",
        )
        .eq("user_id", user.id)
        .single();

      if (error && error.code !== "PGRST116") {
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: `Failed to fetch availability: ${error.message}`,
        });
      }

      const isCompleted =
        !!(data?.luscher1_completed_at && data?.luscher2_completed_at);
      const nextAvailableAt = data?.next_luscher_test_available_at || null;
      const now = new Date();

      // Check if on cooldown
      let isOnCooldown = false;
      if (nextAvailableAt) {
        const availableDate = new Date(nextAvailableAt);
        isOnCooldown = availableDate > now;
      }

      return {
        isCompleted,
        isOnCooldown,
        nextAvailableAt,
      };
    } catch (error) {
      if (error instanceof TRPCError) throw error;
      console.error("Error in getLuscherTestAvailability:", error);
      throw new TRPCError({
        code: "INTERNAL_SERVER_ERROR",
        message: "Failed to get test availability",
      });
    }
  }),

  /**
   * Save unified Luscher test session (both parts + diary + XP + cooldown)
   */
  saveLuscherTestSession: protectedProcedure
    .input(
      z.object({
        luscher1Choices: z.array(z.number()).length(
          8,
          "Must select exactly 8 colors",
        ),
        luscher2Choices: z.array(z.number()).length(
          8,
          "Must select exactly 8 colors",
        ),
        diaryResponse: z.string().optional(),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      const { supabase, user } = ctx;

      try {
        const now = new Date();
        const nextAvailableAt = new Date(
          now.getTime() + 7 * 24 * 60 * 60 * 1000,
        ); // 7 days from now

        // Get existing assessment
        const { error: fetchError } = await supabase
          .schema("core")
          .from("personality_assessments")
          .select("*")
          .eq("user_id", user.id)
          .single();

        // Generate results using TwoStageTest (for future use)
        // For now, we'll just store the choices

        const updateData: {
          luscher1_choices: number[];
          luscher1_completed_at: string;
          luscher2_choices: number[];
          luscher2_completed_at: string;
          diary_response?: string;
          current_step: string;
          completion_score: number;
          completed_at: string;
          next_luscher_test_available_at: string;
          last_updated_at: string;
          updated_at: string;
        } = {
          luscher1_choices: input.luscher1Choices,
          luscher1_completed_at: now.toISOString(),
          luscher2_choices: input.luscher2Choices,
          luscher2_completed_at: now.toISOString(),
          current_step: "completed",
          completion_score: 100,
          completed_at: now.toISOString(),
          next_luscher_test_available_at: nextAvailableAt.toISOString(),
          last_updated_at: now.toISOString(),
          updated_at: now.toISOString(),
        };

        if (input.diaryResponse) {
          updateData.diary_response = input.diaryResponse;
        }

        // Create or update assessment
        if (fetchError && fetchError.code === "PGRST116") {
          // Create new
          const { error: createError } = await supabase
            .schema("core")
            .from("personality_assessments")
            .insert({
              user_id: user.id,
              ...updateData,
              started_at: now.toISOString(),
            });

          if (createError) {
            throw new TRPCError({
              code: "INTERNAL_SERVER_ERROR",
              message: `Failed to create assessment: ${createError.message}`,
            });
          }
        } else {
          // Update existing
          const { error: updateError } = await supabase
            .schema("core")
            .from("personality_assessments")
            .update(updateData)
            .eq("user_id", user.id);

          if (updateError) {
            throw new TRPCError({
              code: "INTERNAL_SERVER_ERROR",
              message: `Failed to update assessment: ${updateError.message}`,
            });
          }
        }

        // Award +5 Frequency XP
        const { error: xpError } = await supabase.rpc(
          "increment_frequency_xp",
          {
            user_id_param: user.id,
            xp_amount: 5,
          },
        );

        // If RPC doesn't exist, update directly
        if (xpError) {
          const { data: userData } = await supabase
            .schema("core")
            .from("users")
            .select("frequency_xp")
            .eq("id", user.id)
            .single();

          const currentXP = (userData?.frequency_xp as number) || 0;
          const newXP = currentXP + 5;

          await supabase
            .schema("core")
            .from("users")
            .update({ frequency_xp: newXP })
            .eq("id", user.id);
        }

        // Create assessment session record
        await supabase
          .schema("core")
          .from("assessment_sessions")
          .insert({
            user_id: user.id,
            assessment_type: "personality",
            session_data: {
              luscher1_choices: input.luscher1Choices,
              luscher2_choices: input.luscher2Choices,
              diary_response: input.diaryResponse || null,
            },
            completed_at: now.toISOString(),
            next_available_at: nextAvailableAt.toISOString(),
          });

        return {
          success: true,
          nextAvailableAt: nextAvailableAt.toISOString(),
        };
      } catch (error) {
        if (error instanceof TRPCError) throw error;
        console.error("Error in saveLuscherTestSession:", error);
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Failed to save test session",
        });
      }
    }),

  /**
   * Award Frequency XP to user
   */
  awardFrequencyXP: protectedProcedure
    .input(
      z.object({
        amount: z.number().int().min(1).max(100),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      const { supabase, user } = ctx;

      try {
        // Get current XP
        const { data: userData, error: fetchError } = await supabase
          .schema("core")
          .from("users")
          .select("frequency_xp")
          .eq("id", user.id)
          .single();

        if (fetchError) {
          throw new TRPCError({
            code: "INTERNAL_SERVER_ERROR",
            message: `Failed to fetch user: ${fetchError.message}`,
          });
        }

        const currentXP = (userData?.frequency_xp as number) || 0;
        const newXP = currentXP + input.amount;

        // Update XP
        const { error: updateError } = await supabase
          .schema("core")
          .from("users")
          .update({ frequency_xp: newXP })
          .eq("id", user.id);

        if (updateError) {
          throw new TRPCError({
            code: "INTERNAL_SERVER_ERROR",
            message: `Failed to update XP: ${updateError.message}`,
          });
        }

        return { success: true, newXP };
      } catch (error) {
        if (error instanceof TRPCError) throw error;
        console.error("Error in awardFrequencyXP:", error);
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Failed to award XP",
        });
      }
    }),

  /**
   * Get current archetype for user
   */
  getArchetype: protectedProcedure.query(async ({ ctx }) => {
    const { supabase, user } = ctx;

    try {
      const { data, error } = await supabase
        .schema("core")
        .from("user_archetypes")
        .select(
          `
          id,
          assessment_date,
          confidence_score,
          domain_scores,
          is_primary,
          archetypes (
            id,
            name,
            description,
            strengths,
            work_styles,
            team_dynamics,
            growth_areas
          )
        `,
        )
        .eq("user_id", user.id)
        .eq("is_primary", true)
        .single();

      if (error && error.code !== "PGRST116") {
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: `Failed to fetch archetype: ${error.message}`,
        });
      }

      if (!data) {
        return null;
      }

      return {
        archetype: (data.archetypes as { name: string; description: string; strengths: string[]; work_styles: string; team_dynamics: string; growth_areas: string[] })?.name || null,
        confidence: data.confidence_score,
        assessmentDate: data.assessment_date,
        domainScores: data.domain_scores,
        details: data.archetypes as {
          name: string;
          description: string;
          strengths: string[];
          work_styles: string;
          team_dynamics: string;
          growth_areas: string[];
        } | null,
      };
    } catch (error) {
      if (error instanceof TRPCError) throw error;
      console.error("Error in getArchetype:", error);
      throw new TRPCError({
        code: "INTERNAL_SERVER_ERROR",
        message: "Failed to get archetype",
      });
    }
  }),

  /**
   * Get archetype history for user
   */
  getArchetypeHistory: protectedProcedure.query(async ({ ctx }) => {
    const { supabase, user } = ctx;

    try {
      const { data, error } = await supabase
        .schema("core")
        .from("user_archetypes")
        .select(
          `
          id,
          assessment_date,
          confidence_score,
          domain_scores,
          is_primary,
          archetypes (
            id,
            name,
            description
          )
        `,
        )
        .eq("user_id", user.id)
        .order("assessment_date", { ascending: false });

      if (error) {
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: `Failed to fetch archetype history: ${error.message}`,
        });
      }

      return (data || []).map((item) => ({
        id: item.id,
        archetype: (item.archetypes as { name: string } | null)?.name || null,
        confidence: item.confidence_score,
        assessmentDate: item.assessment_date,
        domainScores: item.domain_scores,
        isPrimary: item.is_primary,
      }));
    } catch (error) {
      if (error instanceof TRPCError) throw error;
      console.error("Error in getArchetypeHistory:", error);
      throw new TRPCError({
        code: "INTERNAL_SERVER_ERROR",
        message: "Failed to get archetype history",
      });
    }
  }),

  /**
   * Generate share token for IPIP results
   */
  generateShareToken: protectedProcedure
    .input(
      z.object({
        expiresInDays: z.number().min(1).max(365).optional(),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      const { supabase, user } = ctx;

      try {
        // Validate user has completed IPIP
        const { data: assessment } = await supabase
          .schema("core")
          .from("personality_assessments")
          .select("id, ipip_completed_at")
          .eq("user_id", user.id)
          .single();

        if (!assessment?.ipip_completed_at) {
          throw new TRPCError({
            code: "BAD_REQUEST",
            message: "IPIP assessment must be completed before sharing",
          });
        }

        // Calculate expiration
        const expiresAt = input.expiresInDays
          ? new Date(Date.now() + input.expiresInDays * 24 * 60 * 60 * 1000).toISOString()
          : null;

        // Generate token (UUID will be generated by database)
        const { data: tokenData, error: tokenError } = await supabase
          .schema("core")
          .from("ipip_share_tokens")
          .insert({
            user_id: user.id,
            assessment_id: assessment.id,
            expires_at: expiresAt,
          })
          .select("token")
          .single();

        if (tokenError) {
          throw new TRPCError({
            code: "INTERNAL_SERVER_ERROR",
            message: `Failed to generate share token: ${tokenError.message}`,
          });
        }

        // Award +5 XP for first share (check if already awarded)
        const { data: existingXP } = await supabase
          .schema("core")
          .from("user_assessment_xp")
          .select("id")
          .eq("user_id", user.id)
          .eq("assessment_type", "ipip")
          .eq("xp_type", "share")
          .single();

        if (!existingXP) {
          const { data: userData } = await supabase
            .schema("core")
            .from("users")
            .select("frequency_xp")
            .eq("id", user.id)
            .single();

          const currentXP = (userData?.frequency_xp as number) || 0;
          const newXP = currentXP + 5;

          await supabase
            .schema("core")
            .from("users")
            .update({ frequency_xp: newXP })
            .eq("id", user.id);

          await supabase
            .schema("core")
            .from("user_assessment_xp")
            .insert({
              user_id: user.id,
              assessment_type: "ipip",
              xp_type: "share",
              xp_amount: 5,
            });
        }

        return {
          token: tokenData.token,
          shareUrl: `/profile/ipip/share/${tokenData.token}`,
          expiresAt: expiresAt,
        };
      } catch (error) {
        if (error instanceof TRPCError) throw error;
        console.error("Error in generateShareToken:", error);
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Failed to generate share token",
        });
      }
    }),

  /**
   * Revoke share token
   */
  revokeShareToken: protectedProcedure
    .input(
      z.object({
        token: z.string().uuid(),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      const { supabase, user } = ctx;

      try {
        const { error } = await supabase
          .schema("core")
          .from("ipip_share_tokens")
          .update({ is_revoked: true })
          .eq("token", input.token)
          .eq("user_id", user.id);

        if (error) {
          throw new TRPCError({
            code: "INTERNAL_SERVER_ERROR",
            message: `Failed to revoke token: ${error.message}`,
          });
        }

        return { success: true };
      } catch (error) {
        if (error instanceof TRPCError) throw error;
        console.error("Error in revokeShareToken:", error);
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Failed to revoke share token",
        });
      }
    }),

  /**
   * Get shared results by token (public endpoint)
   */
  getSharedResults: publicProcedure
    .input(
      z.object({
        token: z.string().uuid(),
      }),
    )
    .query(async ({ ctx, input }) => {
      const { supabase } = ctx;

      try {
        // Validate token
        const { data: tokenData, error: tokenError } = await supabase
          .schema("core")
          .from("ipip_share_tokens")
          .select("assessment_id, expires_at, is_revoked, view_count")
          .eq("token", input.token)
          .single();

        if (tokenError || !tokenData) {
          throw new TRPCError({
            code: "NOT_FOUND",
            message: "Share link not found or invalid",
          });
        }

        if (tokenData.is_revoked) {
          throw new TRPCError({
            code: "FORBIDDEN",
            message: "This share link has been revoked",
          });
        }

        if (tokenData.expires_at && new Date(tokenData.expires_at) < new Date()) {
          throw new TRPCError({
            code: "FORBIDDEN",
            message: "This share link has expired",
          });
        }

        // Increment view count
        await supabase
          .schema("core")
          .from("ipip_share_tokens")
          .update({ view_count: (tokenData.view_count || 0) + 1 })
          .eq("token", input.token);

        // Get assessment results (anonymized) - return answers for client-side processing
        const { data: assessment, error: assessmentError } = await supabase
          .schema("core")
          .from("personality_assessments")
          .select("ipip_answers, ipip_completed_at, user_id")
          .eq("id", tokenData.assessment_id)
          .single();

        if (assessmentError || !assessment) {
          throw new TRPCError({
            code: "NOT_FOUND",
            message: "Assessment results not found",
          });
        }

        // Get archetype if available
        let archetypeData = null;
        if (assessment.user_id) {
          const { data } = await supabase
            .schema("core")
            .from("user_archetypes")
            .select(
              `
              confidence_score,
              archetypes (
                name,
                description
              )
            `,
            )
            .eq("user_id", assessment.user_id)
            .eq("is_primary", true)
            .single();
          archetypeData = data;
        }

        return {
          answers: assessment.ipip_answers,
          completedAt: assessment.ipip_completed_at,
          archetype: archetypeData
            ? {
                name: (archetypeData.archetypes as { name: string } | null)?.name || null,
                confidence: archetypeData.confidence_score,
              }
            : null,
        };
      } catch (error) {
        if (error instanceof TRPCError) throw error;
        console.error("Error in getSharedResults:", error);
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Failed to get shared results",
        });
      }
    }),

  /**
   * Award XP for viewing results (one-time)
   */
  awardResultsViewXP: protectedProcedure.mutation(async ({ ctx }) => {
    const { supabase, user } = ctx;

    try {
      // Check if already awarded
      const { data: existingXP } = await supabase
        .schema("core")
        .from("user_assessment_xp")
        .select("id")
        .eq("user_id", user.id)
        .eq("assessment_type", "ipip")
        .eq("xp_type", "view")
        .single();

      if (existingXP) {
        return { success: true, alreadyAwarded: true };
      }

      // Award +2 XP
      const { data: userData } = await supabase
        .schema("core")
        .from("users")
        .select("frequency_xp")
        .eq("id", user.id)
        .single();

      const currentXP = (userData?.frequency_xp as number) || 0;
      const newXP = currentXP + 2;

      await supabase
        .schema("core")
        .from("users")
        .update({ frequency_xp: newXP })
        .eq("id", user.id);

      // Track XP award
      await supabase
        .schema("core")
        .from("user_assessment_xp")
        .insert({
          user_id: user.id,
          assessment_type: "ipip",
          xp_type: "view",
          xp_amount: 2,
        });

      return { success: true, newXP };
    } catch (error) {
      if (error instanceof TRPCError) throw error;
      console.error("Error in awardResultsViewXP:", error);
      throw new TRPCError({
        code: "INTERNAL_SERVER_ERROR",
        message: "Failed to award results view XP",
      });
    }
  }),
});
