import { z } from "zod";
import { TRPCError } from "@trpc/server";
import { protectedProcedure, publicProcedure, t } from "../middleware.ts";

// ========================================
// Input Schemas
// ========================================

const createReviewDraftSchema = z.object({
  subjectId: z.string().uuid(),
  subjectType: z.enum(["user", "organization"]),
  context: z.string().optional(),
});

const saveDraftSchema = z.object({
  reviewId: z.string().uuid(),
  draft: z.record(z.unknown()),
});

const updateReviewStepSchema = z.object({
  reviewId: z.string().uuid(),
  step: z.string(),
  data: z.record(z.unknown()),
});

const updateSkillRatingsSchema = z.object({
  reviewId: z.string().uuid(),
  ratings: z.array(
    z.object({
      skillId: z.string().uuid(),
      score: z.number().int().min(1).max(5),
    }),
  ),
});

const updateCategoryRatingSchema = z.object({
  reviewId: z.string().uuid(),
  category: z.enum([
    "skills",
    "reliability",
    "collaboration",
    "professionalism",
    "technical",
  ]),
  rating: z.number().int().min(1).max(5),
});

const updateSoftSkillVotesSchema = z.object({
  reviewId: z.string().uuid(),
  votes: z.array(
    z.object({
      skillId: z.string().uuid(),
      rating: z.number().int().min(1).max(5).optional(),
      isStrength: z.boolean(),
      notes: z.string().optional(),
    }),
  ),
});

const updateReviewCommentSchema = z.object({
  reviewId: z.string().uuid(),
  comment: z.string(),
  isPublic: z.boolean().default(false),
});

const submitReviewSchema = z.object({
  reviewId: z.string().uuid(),
  recommendation: z.number().int().min(-1).max(1), // -1 = do not recommend, 1 = recommend
});

const getReviewsBySubjectSchema = z.object({
  subjectId: z.string().uuid(),
  subjectType: z.enum(["user", "organization"]),
  status: z.enum(["draft", "submitted", "released"]).optional(),
});

// ========================================
// Reviews Router
// ========================================

export const reviewsRouter = t.router({
  /**
   * Get all soft skills by category
   */
  getSoftSkills: publicProcedure
    .input(
      z.object({
        category: z.enum([
          "reliability",
          "collaboration",
          "professionalism",
          "technical",
        ]).optional(),
      }).optional(),
    )
    .query(async ({ ctx, input }) => {
      const { data, error } = await ctx.supabase
        .from("soft_skills")
        .select("*")
        .eq("is_active", true)
        .order("category")
        .order("order_index");

      if (error) {
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Failed to fetch soft skills",
          cause: error,
        });
      }

      if (input?.category) {
        return data.filter((skill) => skill.category === input.category);
      }

      return data;
    }),

  /**
   * Get soft skills grouped by category
   */
  getSoftSkillsByCategory: publicProcedure.query(async ({ ctx }) => {
    const { data, error } = await ctx.supabase
      .from("soft_skills")
      .select("*")
      .eq("is_active", true)
      .order("category")
      .order("order_index");

    if (error) {
      throw new TRPCError({
        code: "INTERNAL_SERVER_ERROR",
        message: "Failed to fetch soft skills",
        cause: error,
      });
    }

    // Group by category
    const grouped = data.reduce((acc, skill) => {
      if (!acc[skill.category]) {
        acc[skill.category] = [];
      }
      acc[skill.category].push(skill);
      return acc;
    }, {} as Record<string, typeof data>);

    return grouped;
  }),

  /**
   * Create a new review draft
   * Checks for existing draft first to prevent duplicate constraint errors
   */
  createDraft: protectedProcedure
    .input(createReviewDraftSchema)
    .mutation(async ({ ctx, input }) => {
      // Check for existing draft for this user/subject combination
      const { data: existingDraft } = await ctx.supabase
        .from("reviews")
        .select(`
          *,
          review_progress(*),
          review_skill_ratings(*),
          review_soft_skill_votes(*),
          review_category_ratings(*)
        `)
        .eq("author_user_id", ctx.user.id)
        .eq("subject_id", input.subjectId)
        .eq("subject_type", input.subjectType)
        .eq("status", "draft")
        .maybeSingle();

      // If draft exists, return it instead of creating a new one
      if (existingDraft) {
        return existingDraft;
      }

      // Create new draft
      const { data: review, error } = await ctx.supabase
        .from("reviews")
        .insert({
          author_user_id: ctx.user.id,
          subject_id: input.subjectId,
          subject_type: input.subjectType,
          status: "draft",
          metadata: input.context ? { context: input.context } : {},
        })
        .select()
        .single();

      if (error) {
        console.error("Database error creating review:", error);
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: `Failed to create review draft: ${
            error.message || JSON.stringify(error)
          }`,
          cause: error,
        });
      }

      // Initialize progress tracking
      const { error: progressError } = await ctx.supabase
        .from("review_progress")
        .insert({
          review_id: review.id,
          steps_completed: {},
          current_step: 1,
        });

      if (progressError) {
        console.error("Failed to create review progress:", progressError);
      }

      return review;
    }),

  /**
   * Save review draft data (auto-save)
   */
  saveDraft: protectedProcedure
    .input(saveDraftSchema)
    .mutation(async ({ ctx, input }) => {
      // Verify user owns this review
      const { data: review } = await ctx.supabase
        .from("reviews")
        .select("id")
        .eq("id", input.reviewId)
        .eq("author_user_id", ctx.user.id)
        .single();

      if (!review) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Review not found",
        });
      }

      // Update the metadata with draft data
      const { error } = await ctx.supabase
        .from("reviews")
        .update({
          metadata: input.draft,
          updated_at: new Date().toISOString(),
        })
        .eq("id", input.reviewId)
        .eq("author_user_id", ctx.user.id);

      if (error) {
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Failed to save review draft",
          cause: error,
        });
      }

      return { success: true };
    }),

  /**
   * Get review draft by ID
   */
  getDraft: protectedProcedure
    .input(z.object({ reviewId: z.string().uuid() }))
    .query(async ({ ctx, input }) => {
      const { data: review, error } = await ctx.supabase
        .from("reviews")
        .select(`
          *,
          review_progress(*),
          review_skill_ratings(*),
          review_soft_skill_votes(*),
          review_category_ratings(*)
        `)
        .eq("id", input.reviewId)
        .eq("author_user_id", ctx.user.id)
        .single();

      if (error) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Review not found",
          cause: error,
        });
      }

      return review;
    }),

  /**
   * Update review progress step
   */
  updateStep: protectedProcedure
    .input(updateReviewStepSchema)
    .mutation(async ({ ctx, input }) => {
      // Verify user owns this review
      const { data: review } = await ctx.supabase
        .from("reviews")
        .select("id")
        .eq("id", input.reviewId)
        .eq("author_user_id", ctx.user.id)
        .single();

      if (!review) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Review not found",
        });
      }

      // Update progress
      const { error } = await ctx.supabase.rpc("update_review_progress", {
        p_review_id: input.reviewId,
        p_step: input.step,
        p_completed: true,
      });

      if (error) {
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Failed to update review progress",
          cause: error,
        });
      }

      return { success: true };
    }),

  /**
   * Update skill ratings (technical skills)
   */
  updateSkillRatings: protectedProcedure
    .input(updateSkillRatingsSchema)
    .mutation(async ({ ctx, input }) => {
      // Verify user owns this review
      const { data: review } = await ctx.supabase
        .from("reviews")
        .select("id")
        .eq("id", input.reviewId)
        .eq("author_user_id", ctx.user.id)
        .single();

      if (!review) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Review not found",
        });
      }

      // Delete existing ratings for this review
      await ctx.supabase
        .from("review_skill_ratings")
        .delete()
        .eq("review_id", input.reviewId);

      // Insert new ratings
      if (input.ratings.length > 0) {
        const { error } = await ctx.supabase.from("review_skill_ratings")
          .insert(
            input.ratings.map((rating) => ({
              review_id: input.reviewId,
              skill_id: rating.skillId,
              score: rating.score,
            })),
          );

        if (error) {
          throw new TRPCError({
            code: "INTERNAL_SERVER_ERROR",
            message: "Failed to update skill ratings",
            cause: error,
          });
        }
      }

      return { success: true };
    }),

  /**
   * Update category rating (overall rating for a category)
   */
  updateCategoryRating: protectedProcedure
    .input(updateCategoryRatingSchema)
    .mutation(async ({ ctx, input }) => {
      // Verify user owns this review
      const { data: review } = await ctx.supabase
        .from("reviews")
        .select("id")
        .eq("id", input.reviewId)
        .eq("author_user_id", ctx.user.id)
        .single();

      if (!review) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Review not found",
        });
      }

      // Upsert category rating
      const { error } = await ctx.supabase
        .from("review_category_ratings")
        .upsert(
          {
            review_id: input.reviewId,
            category: input.category,
            rating: input.rating,
          },
          {
            onConflict: "review_id,category",
          },
        );

      if (error) {
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Failed to update category rating",
          cause: error,
        });
      }

      return { success: true };
    }),

  /**
   * Update soft skill votes (strengths and areas to improve)
   */
  updateSoftSkillVotes: protectedProcedure
    .input(updateSoftSkillVotesSchema)
    .mutation(async ({ ctx, input }) => {
      // Verify user owns this review
      const { data: review } = await ctx.supabase
        .from("reviews")
        .select("id")
        .eq("id", input.reviewId)
        .eq("author_user_id", ctx.user.id)
        .single();

      if (!review) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Review not found",
        });
      }

      // Delete existing votes for this review
      await ctx.supabase
        .from("review_soft_skill_votes")
        .delete()
        .eq("review_id", input.reviewId);

      // Insert new votes
      if (input.votes.length > 0) {
        const { error } = await ctx.supabase.from("review_soft_skill_votes")
          .insert(
            input.votes.map((vote) => ({
              review_id: input.reviewId,
              skill_id: vote.skillId,
              rating: vote.rating,
              is_strength: vote.isStrength,
              notes: vote.notes,
            })),
          );

        if (error) {
          throw new TRPCError({
            code: "INTERNAL_SERVER_ERROR",
            message: "Failed to update soft skill votes",
            cause: error,
          });
        }
      }

      return { success: true };
    }),

  /**
   * Update review comment
   */
  updateComment: protectedProcedure
    .input(updateReviewCommentSchema)
    .mutation(async ({ ctx, input }) => {
      const { error } = await ctx.supabase
        .from("reviews")
        .update({
          comment: input.comment,
          is_comment_public: input.isPublic,
          updated_at: new Date().toISOString(),
        })
        .eq("id", input.reviewId)
        .eq("author_user_id", ctx.user.id);

      if (error) {
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Failed to update review comment",
          cause: error,
        });
      }

      return { success: true };
    }),

  /**
   * Submit review (auto-releases review immediately)
   */
  submitReview: protectedProcedure
    .input(submitReviewSchema)
    .mutation(async ({ ctx, input }) => {
      const now = new Date().toISOString();

      const { error } = await ctx.supabase
        .from("reviews")
        .update({
          status: "released",
          reaction: input.recommendation,
          submitted_at: now,
          revealed_at: now,
          updated_at: now,
        })
        .eq("id", input.reviewId)
        .eq("author_user_id", ctx.user.id);

      if (error) {
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Failed to submit review",
          cause: error,
        });
      }

      // Mark progress as completed
      await ctx.supabase
        .from("review_progress")
        .update({
          completed_at: now,
          updated_at: now,
        })
        .eq("review_id", input.reviewId);

      return { success: true };
    }),

  /**
   * Get reviews by subject (user or organization)
   * NOTE: Simplified to work with current schema (no status field or related tables yet)
   */
  getBySubject: publicProcedure
    .input(getReviewsBySubjectSchema)
    .query(async ({ ctx, input }) => {
      const { data, error } = await ctx.supabase
        .from("reviews")
        .select("*")
        .eq("subject_id", input.subjectId)
        .eq("subject_type", input.subjectType)
        .order("created_at", { ascending: false });

      if (error) {
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Failed to fetch reviews",
          cause: error,
        });
      }

      // Note: input.status parameter is ignored for now since status field doesn't exist in current schema
      return data || [];
    }),

  /**
   * Get user's own reviews (drafts and submitted)
   */
  getMyReviews: protectedProcedure.query(async ({ ctx }) => {
    const { data, error } = await ctx.supabase
      .from("reviews")
      .select(`
        *,
        review_progress(*),
        review_skill_ratings(*),
        review_soft_skill_votes(*),
        review_category_ratings(*)
      `)
      .eq("author_user_id", ctx.user.id)
      .order("created_at", { ascending: false });

    if (error) {
      throw new TRPCError({
        code: "INTERNAL_SERVER_ERROR",
        message: "Failed to fetch reviews",
        cause: error,
      });
    }

    return data;
  }),

  /**
   * Delete review draft
   */
  deleteDraft: protectedProcedure
    .input(z.object({ reviewId: z.string().uuid() }))
    .mutation(async ({ ctx, input }) => {
      const { error } = await ctx.supabase
        .from("reviews")
        .delete()
        .eq("id", input.reviewId)
        .eq("author_user_id", ctx.user.id)
        .eq("status", "draft");

      if (error) {
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Failed to delete review draft",
          cause: error,
        });
      }

      return { success: true };
    }),
});
