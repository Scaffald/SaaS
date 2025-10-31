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
   * NOTE: Simplified to work with current schema (no status field or progress tracking yet)
   */
  createDraft: protectedProcedure
    .input(createReviewDraftSchema)
    .mutation(async ({ ctx, input }) => {
      // Check for existing draft - simplified without status field
      const { data: existingDraft } = await ctx.supabase
        .from("reviews")
        .select("*")
        .eq("author_user_id", ctx.user.id)
        .eq("subject_id", input.subjectId)
        .eq("subject_type", input.subjectType)
        .maybeSingle();

      // If draft exists, return it instead of creating a new one
      if (existingDraft) {
        return existingDraft;
      }

      // Create new review (no status field in current schema)
      const { data: review, error } = await ctx.supabase
        .from("reviews")
        .insert({
          author_user_id: ctx.user.id,
          subject_id: input.subjectId,
          subject_type: input.subjectType,
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

      // Note: review_progress table doesn't exist in current schema

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
   * NOTE: Simplified to work with current schema (no related tables yet)
   */
  getDraft: protectedProcedure
    .input(z.object({ reviewId: z.string().uuid() }))
    .query(async ({ ctx, input }) => {
      const { data: review, error } = await ctx.supabase
        .from("reviews")
        .select("*")
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
   * NOTE: Uses 'body' field for comment text, stores isPublic in metadata
   */
  updateComment: protectedProcedure
    .input(updateReviewCommentSchema)
    .mutation(async ({ ctx, input }) => {
      // Get existing metadata to preserve it
      const { data: existingReview } = await ctx.supabase
        .from("reviews")
        .select("metadata")
        .eq("id", input.reviewId)
        .eq("author_user_id", ctx.user.id)
        .single();

      const metadata = existingReview?.metadata || {};

      const { error } = await ctx.supabase
        .from("reviews")
        .update({
          body: input.comment,
          metadata: { ...metadata, isPublic: input.isPublic },
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
   * Submit review
   * NOTE: Simplified to work with current schema (no status/progress tracking)
   * Maps recommendation (-1, 0, 1) to rating field
   */
  submitReview: protectedProcedure
    .input(submitReviewSchema)
    .mutation(async ({ ctx, input }) => {
      const now = new Date().toISOString();

      const { error } = await ctx.supabase
        .from("reviews")
        .update({
          rating: input.recommendation,
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

      // Note: review_progress table doesn't exist in current schema

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
   * NOTE: Simplified to work with current schema (no related tables yet)
   */
  getMyReviews: protectedProcedure.query(async ({ ctx }) => {
    const { data, error } = await ctx.supabase
      .from("reviews")
      .select("*")
      .eq("author_user_id", ctx.user.id)
      .order("created_at", { ascending: false });

    if (error) {
      throw new TRPCError({
        code: "INTERNAL_SERVER_ERROR",
        message: "Failed to fetch reviews",
        cause: error,
      });
    }

    return data || [];
  }),

  /**
   * Get aggregated review analytics for a subject
   * Returns comprehensive statistics and breakdowns for visualizations
   */
  getReviewAnalytics: publicProcedure
    .input(z.object({
      subjectId: z.string().uuid(),
      subjectType: z.enum(["user", "organization"]).default("user"),
    }))
    .query(async ({ ctx, input }) => {
      // Get all reviews for this subject
      const { data: reviews, error: reviewsError } = await ctx.supabase
        .from("reviews")
        .select(`
          id,
          rating,
          body,
          created_at,
          review_skill_ratings (
            skill_id,
            score,
            skills (name, id)
          ),
          review_category_ratings (
            category,
            rating
          ),
          review_soft_skill_votes (
            skill_id,
            is_strength,
            rating,
            soft_skills (name, category, id)
          )
        `)
        .eq("subject_id", input.subjectId)
        .eq("subject_type", input.subjectType)
        .not("rating", "is", null)
        .order("created_at", { ascending: false });

      if (reviewsError) {
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Failed to fetch review analytics",
          cause: reviewsError,
        });
      }

      if (!reviews || reviews.length === 0) {
        return null;
      }

      // Calculate overall statistics
      const totalReviews = reviews.length;
      const recommendCount = reviews.filter((r) => r.rating === 1).length;
      const notRecommendCount = reviews.filter((r) => r.rating === -1).length;

      // Aggregate skill ratings
      const skillRatings = new Map<
        string,
        { name: string; total: number; count: number; skillId: string }
      >();
      for (const review of reviews) {
        if (review.review_skill_ratings) {
          for (const sr of review.review_skill_ratings) {
            const skillId = sr.skill_id;
            const skillName = sr.skills?.name || "Unknown Skill";
            if (!skillRatings.has(skillId)) {
              skillRatings.set(skillId, {
                name: skillName,
                total: 0,
                count: 0,
                skillId,
              });
            }
            const skill = skillRatings.get(skillId)!;
            skill.total += sr.score;
            skill.count += 1;
          }
        }
      }

      // Aggregate category ratings
      const categoryRatings = new Map<
        string,
        { total: number; count: number }
      >();
      for (const review of reviews) {
        if (review.review_category_ratings) {
          for (const cr of review.review_category_ratings) {
            if (!categoryRatings.has(cr.category)) {
              categoryRatings.set(cr.category, { total: 0, count: 0 });
            }
            const cat = categoryRatings.get(cr.category)!;
            cat.total += cr.rating;
            cat.count += 1;
          }
        }
      }

      // Aggregate soft skill votes (strengths and improvements)
      const strengthTags = new Map<
        string,
        { name: string; count: number; category: string }
      >();
      const improvementTags = new Map<
        string,
        { name: string; count: number; category: string }
      >();
      for (const review of reviews) {
        if (review.review_soft_skill_votes) {
          for (const vote of review.review_soft_skill_votes) {
            const skillName = vote.soft_skills?.name || "Unknown";
            const skillCategory = vote.soft_skills?.category || "other";
            const map = vote.is_strength ? strengthTags : improvementTags;

            if (!map.has(skillName)) {
              map.set(skillName, {
                name: skillName,
                count: 0,
                category: skillCategory,
              });
            }
            map.get(skillName)!.count += 1;
          }
        }
      }

      // Calculate timeline data (group by month)
      const timelineData = new Map<
        string,
        { month: string; count: number; avgRating: number; totalRating: number }
      >();
      for (const review of reviews) {
        const date = new Date(review.created_at);
        const monthKey = `${date.getFullYear()}-${
          String(date.getMonth() + 1).padStart(2, "0")
        }`;

        if (!timelineData.has(monthKey)) {
          timelineData.set(monthKey, {
            month: monthKey,
            count: 0,
            avgRating: 0,
            totalRating: 0,
          });
        }
        const data = timelineData.get(monthKey)!;
        data.count += 1;

        // Calculate average from category ratings
        const avgCategoryRating = review.review_category_ratings?.length > 0
          ? review.review_category_ratings.reduce(
            (sum: number, cr: { rating: number }) => sum + cr.rating,
            0,
          ) / review.review_category_ratings.length
          : 0;
        data.totalRating += avgCategoryRating;
        data.avgRating = data.totalRating / data.count;
      }

      return {
        overall: {
          totalReviews,
          recommendCount,
          notRecommendCount,
          recommendPercentage: totalReviews > 0
            ? (recommendCount / totalReviews) * 100
            : 0,
        },
        skills: Array.from(skillRatings.entries()).map(([id, data]) => ({
          skillId: id,
          skillName: data.name,
          averageRating: data.total / data.count,
          frequency: data.count,
        })).sort((a, b) => b.frequency - a.frequency),
        categories: Array.from(categoryRatings.entries()).map((
          [category, data],
        ) => ({
          category,
          averageRating: data.total / data.count,
          frequency: data.count,
        })),
        tags: {
          strengths: Array.from(strengthTags.values())
            .sort((a, b) => b.count - a.count)
            .slice(0, 20),
          improvements: Array.from(improvementTags.values())
            .sort((a, b) => b.count - a.count)
            .slice(0, 20),
        },
        timeline: Array.from(timelineData.values())
          .sort((a, b) => a.month.localeCompare(b.month)),
      };
    }),

  /**
   * Delete review draft
   * NOTE: Simplified - no status field in current schema, just delete if user owns it
   */
  deleteDraft: protectedProcedure
    .input(z.object({ reviewId: z.string().uuid() }))
    .mutation(async ({ ctx, input }) => {
      const { error } = await ctx.supabase
        .from("reviews")
        .delete()
        .eq("id", input.reviewId)
        .eq("author_user_id", ctx.user.id);

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
