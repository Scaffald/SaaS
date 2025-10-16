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

  // Get user skills with proficiency (polymorphic taxonomy support)
  getUserSkills: t.procedure
    .input(
      z.object({
        userId: z.string().uuid(),
      }),
    )
    .query(async ({ ctx, input }) => {
      const { data: skills, error } = await ctx.supabase
        .from("user_skills")
        .select("*")
        .eq("user_id", input.userId)
        .order("proficiency_level", { ascending: false });

      if (error) {
        throw new Error(`Failed to fetch user skills: ${error.message}`);
      }

      // Return simplified structure (detailed skill info would require joining taxonomy tables)
      return (
        skills?.map((skill) => ({
          id: skill.id,
          taxonomy: skill.skill_taxonomy,
          csiSkillId: skill.csi_skill_id,
          onetOccupationId: skill.onet_occupation_id,
          proficiency: skill.proficiency_level || 0,
          yearsExperience: skill.years_experience,
          verified: skill.verified,
          verifiedAt: skill.verified_at,
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
        .schema("private")
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
        .schema("private")
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
        .schema("private")
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
      // Get reviews for this user (simplified for current schema)
      const { data: reviews, error: reviewsError } = await ctx.supabase
        .from("reviews")
        .select("*")
        .eq("subject_id", input.userId)
        .eq("subject_type", "user")
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
          reviews: [],
        };
      }

      const reviewsList = reviews || [];
      const totalReviews = reviewsList.length;

      // Calculate average rating if rating field exists
      const ratingsArray = reviewsList
        .filter((r) => r.rating != null)
        .map((r) => r.rating);
      const averageRating = ratingsArray.length > 0
        ? Math.round(
          (ratingsArray.reduce((sum, val) => sum + val, 0) /
            ratingsArray.length) * 10,
        ) / 10
        : 0;

      // Return simplified structure (full review system not yet implemented in schema)
      return {
        averageRating,
        totalReviews,
        ratings: {},
        strengths: [],
        improvements: [],
        reviews: reviewsList.slice(0, 10).map((review) => ({
          id: review.id,
          headline: review.headline || "",
          body: review.body || "",
          date: review.created_at,
          rating: review.rating || 0,
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
