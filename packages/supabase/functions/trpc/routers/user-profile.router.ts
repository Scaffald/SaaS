import { z } from "zod";
import { t } from "../middleware.ts";

export const userProfileRouter = t.router({
  // Get comprehensive user profile
  getUserProfile: t.procedure
    .input(
      z.object({
        userId: z.string().uuid(),
      }),
    )
    .query(async ({ ctx, input }) => {
      const { data: profile, error } = await ctx.supabase
        .from("v_profile_search")
        .select(
          `
          id,
          name,
          avatar_url,
          headline,
          bio,
          industry_name,
          years_of_experience,
          gamified_score,
          location,
          availability,
          certifications,
          hourly_rate_cents,
          open_to_travel,
          travel_mileage,
          open_to_work,
          education_level
        `,
        )
        .eq("id", input.userId)
        .single();

      if (error) {
        throw new Error(`Failed to fetch user profile: ${error.message}`);
      }

      return profile;
    }),

  // Get user skills with proficiency
  getUserSkills: t.procedure
    .input(
      z.object({
        userId: z.string().uuid(),
      }),
    )
    .query(async ({ ctx, input }) => {
      const { data: skills, error } = await ctx.supabase
        .from("user_skills")
        .select(
          `
          skill_id,
          proficiency,
          last_verified_at,
          source,
          skills (
            id,
            name,
            csi_display,
            industry_id
          )
        `,
        )
        .eq("user_id", input.userId)
        .order("proficiency", { ascending: false });

      if (error) {
        throw new Error(`Failed to fetch user skills: ${error.message}`);
      }

      return (
        skills?.map((skill) => ({
          id: skill.skill_id,
          name: skill.skills?.name || "Unknown Skill",
          csiDisplay: skill.skills?.csi_display,
          proficiency: skill.proficiency || 0,
          lastVerifiedAt: skill.last_verified_at,
          source: skill.source,
        })) || []
      );
    }),

  // Get user certifications
  getUserCertifications: t.procedure
    .input(
      z.object({
        userId: z.string().uuid(),
      }),
    )
    .query(async ({ ctx, input }) => {
      const { data: certifications, error } = await ctx.supabase
        .from("user_certifications")
        .select("*")
        .eq("user_id", input.userId)
        .eq("is_active", true)
        .order("issue_date", { ascending: false });

      if (error) {
        throw new Error(`Failed to fetch certifications: ${error.message}`);
      }

      return certifications || [];
    }),

  // Get user work experience
  getUserExperience: t.procedure
    .input(
      z.object({
        userId: z.string().uuid(),
      }),
    )
    .query(async ({ ctx, input }) => {
      const { data: experience, error } = await ctx.supabase
        .from("user_experience")
        .select("*")
        .eq("user_id", input.userId)
        .order("is_current", { ascending: false })
        .order("start_date", { ascending: false });

      if (error) {
        throw new Error(`Failed to fetch work experience: ${error.message}`);
      }

      return experience || [];
    }),

  // Get user education
  getUserEducation: t.procedure
    .input(
      z.object({
        userId: z.string().uuid(),
      }),
    )
    .query(async ({ ctx, input }) => {
      const { data: education, error } = await ctx.supabase
        .from("user_education")
        .select("*")
        .eq("user_id", input.userId)
        .order("is_current", { ascending: false })
        .order("start_date", { ascending: false });

      if (error) {
        throw new Error(`Failed to fetch education: ${error.message}`);
      }

      return education || [];
    }),

  // Get user reviews summary
  getUserReviewsSummary: t.procedure
    .input(
      z.object({
        userId: z.string().uuid(),
      }),
    )
    .query(async ({ ctx, input }) => {
      // Get released reviews for this user
      const { data: reviews, error: reviewsError } = await ctx.supabase
        .from("reviews")
        .select(
          `
          id,
          reaction,
          comment,
          created_at,
          author_user_id,
          review_category_ratings (
            category,
            rating
          )
        `,
        )
        .eq("subject_id", input.userId)
        .eq("subject_type", "user")
        .eq("status", "released")
        .order("created_at", { ascending: false });

      if (reviewsError) {
        console.error("Error fetching reviews:", reviewsError);
        // Return empty data structure instead of throwing
        return {
          averageRating: 0,
          totalReviews: 0,
          ratings: {},
          strengths: [],
          improvements: [],
          recommendCount: 0,
          notRecommendCount: 0,
          reviews: [],
        };
      }

      const reviewsList = reviews || [];
      const totalReviews = reviewsList.length;

      // Calculate recommendation counts
      const recommendCount = reviewsList.filter((r) => r.reaction === 1).length;
      const notRecommendCount = reviewsList.filter((r) => r.reaction === -1)
        .length;

      // Calculate average ratings by category
      const categoryRatings: Record<string, number[]> = {};
      reviewsList.forEach((review) => {
        review.review_category_ratings?.forEach((rating) => {
          if (!categoryRatings[rating.category]) {
            categoryRatings[rating.category] = [];
          }
          categoryRatings[rating.category].push(rating.rating);
        });
      });

      const ratings: Record<string, number> = {};
      let totalRating = 0;
      let categoryCount = 0;

      Object.entries(categoryRatings).forEach(([category, values]) => {
        const avg = values.reduce((sum, val) => sum + val, 0) / values.length;
        ratings[category] = Math.round(avg * 10) / 10;
        totalRating += avg;
        categoryCount++;
      });

      const averageRating = categoryCount > 0
        ? Math.round((totalRating / categoryCount) * 10) / 10
        : 0;

      // For now, return simplified structure
      // TODO: Fetch strengths/improvements from soft skills votes
      return {
        averageRating,
        totalReviews,
        ratings,
        strengths: [],
        improvements: [],
        recommendCount,
        notRecommendCount,
        reviews: reviewsList.slice(0, 10).map((review) => ({
          id: review.id,
          comment: review.comment || "",
          date: review.created_at,
          rating: averageRating,
          authorId: review.author_user_id,
        })),
      };
    }),

  // Get user contact info (requires authentication or permission)
  getUserContactInfo: t.procedure
    .input(
      z.object({
        userId: z.string().uuid(),
      }),
    )
    .query(async ({ ctx, input }) => {
      // TODO: Add permission check - should only return if user has permission
      const { data: contactInfo, error } = await ctx.supabase
        .schema("private")
        .from("profile")
        .select(
          `
          email,
          phone,
          location,
          employment_city,
          employment_state,
          employment_zip
        `,
        )
        .eq("user_id", input.userId)
        .single();

      if (error) {
        // Return null if not found or permission denied
        return null;
      }

      return contactInfo;
    }),
});
