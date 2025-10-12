import { TRPCError } from "@trpc/server";
import { protectedProcedure, t } from "../../middleware.ts";

/**
 * Profile Completion router - handles profile completion status
 */
export const profileCompletionRouter = t.router({
  /**
   * Get profile completion status
   * Returns data needed to determine if profile is complete
   */
  getCompletionStatus: protectedProcedure.query(async ({ ctx }) => {
    const { supabase, user } = ctx;

    try {
      // Get private.profile data directly (includes first_name, last_name)
      const { data: privateData, error: privateError } = await supabase
        .schema("private")
        .from("profile")
        .select(`
          first_name,
          last_name,
          phone,
          address,
          location,
          availability,
          education_level
        `)
        .eq("user_id", user.id)
        .single();

      if (privateError && privateError.code !== "PGRST116") {
        console.error("Private data error:", privateError);
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: `Failed to fetch private data: ${privateError.message}`,
        });
      }

      // Get skills data - handle permission errors gracefully
      let skillsData: unknown[] = [];
      try {
        const { data, error: skillsError } = await supabase
          .from("user_skills")
          .select("skill_id")
          .eq("user_id", user.id);

        if (skillsError) {
          console.warn("Skills data access failed:", skillsError.message);
        } else {
          skillsData = data || [];
        }
      } catch (error) {
        const errorMessage = error instanceof Error
          ? error.message
          : String(error);
        console.warn("Skills table access failed:", errorMessage);
      }

      // Get certifications data - handle permission errors gracefully
      let certificationsData: unknown[] = [];
      try {
        const { data, error: certificationsError } = await supabase
          .from("user_certifications")
          .select("name, issuing_organization")
          .eq("user_id", user.id);

        if (certificationsError) {
          console.warn(
            "Certifications data access failed:",
            certificationsError.message,
          );
        } else {
          certificationsData = data || [];
        }
      } catch (error) {
        const errorMessage = error instanceof Error
          ? error.message
          : String(error);
        console.warn("Certifications table access failed:", errorMessage);
      }

      // Get education data - handle permission errors gracefully
      let educationData: unknown[] = [];
      try {
        const { data, error: educationError } = await supabase
          .from("user_education")
          .select("institution_name")
          .eq("user_id", user.id);

        if (educationError) {
          console.warn("Education data access failed:", educationError.message);
        } else {
          educationData = data || [];
        }
      } catch (error) {
        const errorMessage = error instanceof Error
          ? error.message
          : String(error);
        console.warn("Education table access failed:", errorMessage);
      }

      // Get experience data - handle permission errors gracefully
      let experienceData: unknown[] = [];
      try {
        const { data, error: experienceError } = await supabase
          .from("user_experience")
          .select("job_title, company_name")
          .eq("user_id", user.id);

        if (experienceError) {
          console.warn(
            "Experience data access failed:",
            experienceError.message,
          );
        } else {
          experienceData = data || [];
        }
      } catch (error) {
        const errorMessage = error instanceof Error
          ? error.message
          : String(error);
        console.warn("Experience table access failed:", errorMessage);
      }

      return {
        first_name: privateData?.first_name || "",
        last_name: privateData?.last_name || "",
        user_private: privateData,
        users: { industry_id: null }, // Simplified - we don't actually need this for completion
        user_skills: skillsData,
        user_certifications: certificationsData,
        user_education: educationData,
        user_experience: experienceData,
      };
    } catch (error) {
      const errorMessage = error instanceof Error
        ? error.message
        : String(error);
      console.error("Completion status error:", error);
      throw new TRPCError({
        code: "INTERNAL_SERVER_ERROR",
        message: `Failed to fetch completion status: ${errorMessage}`,
      });
    }
  }),
});
