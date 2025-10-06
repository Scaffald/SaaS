import { TRPCError } from "@trpc/server";
import { protectedProcedure, t } from "../../middleware.ts";
import {
  profileEmploymentInputSchema,
  type UserPrivateEmploymentUpdate,
  // @ts-ignore - Deno requires .ts extension
} from "../../../_shared/schemas/consolidated.ts";

/**
 * Profile Employment router - handles employment-related profile data
 */
export const profileEmploymentRouter = t.router({
  /**
   * Get employment profile information
   * Returns user's employment preferences and status
   */
  getEmployment: protectedProcedure.query(async ({ ctx }) => {
    const { supabase, user } = ctx;

    // Get employment data from user_private table
    const { data: employmentData, error: employmentError } = await supabase
      .from("user_private")
      .select(`
        preferred_work_locations,
        willing_to_travel,
        travel_distance_miles,
        us_resident,
        residency_countries,
        us_passport,
        drivers_license_classes,
        military_status,
        availability,
        hourly_rate
      `)
      .eq("user_id", user.id)
      .single();

    if (employmentError && employmentError.code !== "PGRST116") {
      throw new TRPCError({
        code: "INTERNAL_SERVER_ERROR",
        message: `Failed to fetch employment data: ${employmentError.message}`,
      });
    }

    return {
      preferred_work_locations: employmentData?.preferred_work_locations || [],
      willing_to_travel: employmentData?.willing_to_travel || false,
      travel_distance_miles: employmentData?.travel_distance_miles || 25,
      us_resident: employmentData?.us_resident || false,
      residency_countries: employmentData?.residency_countries || [],
      us_passport: employmentData?.us_passport || false,
      drivers_license_classes: employmentData?.drivers_license_classes || [],
      military_status: employmentData?.military_status || [],
      availability: employmentData?.availability || [],
      hourly_rate: employmentData?.hourly_rate || null,
    };
  }),

  /**
   * Update employment profile information
   * Updates user's employment preferences in user_private table
   */
  updateEmployment: protectedProcedure
    .input(profileEmploymentInputSchema)
    .mutation(async ({ ctx, input }) => {
      const { supabase, user } = ctx;

      // Build employment update object with only provided fields
      const employmentUpdate: UserPrivateEmploymentUpdate = {
        user_id: user.id,
        updated_at: new Date().toISOString(),
      };

      if (input.preferred_work_locations !== undefined) {
        employmentUpdate.preferred_work_locations =
          input.preferred_work_locations;
      }
      if (input.willing_to_travel !== undefined) {
        employmentUpdate.willing_to_travel = input.willing_to_travel;
      }
      if (input.travel_distance_miles !== undefined) {
        employmentUpdate.travel_distance_miles = input.travel_distance_miles;
      }
      if (input.us_resident !== undefined) {
        employmentUpdate.us_resident = input.us_resident;
      }
      if (input.residency_countries !== undefined) {
        employmentUpdate.residency_countries = input.residency_countries;
      }
      if (input.us_passport !== undefined) {
        employmentUpdate.us_passport = input.us_passport;
      }
      if (input.drivers_license_classes !== undefined) {
        employmentUpdate.drivers_license_classes =
          input.drivers_license_classes;
      }
      if (input.military_status !== undefined) {
        employmentUpdate.military_status = input.military_status;
      }
      if (input.availability !== undefined) {
        employmentUpdate.availability = input.availability;
      }
      if (input.hourly_rate !== undefined) {
        employmentUpdate.hourly_rate = input.hourly_rate;
      }

      // Update user_private table only if there are fields to update
      if (Object.keys(employmentUpdate).length > 2) {
        // More than just user_id and updated_at
        const { error: employmentError } = await supabase
          .from("user_private")
          .upsert(employmentUpdate);

        if (employmentError) {
          throw new TRPCError({
            code: "INTERNAL_SERVER_ERROR",
            message:
              `Failed to update employment data: ${employmentError.message}`,
          });
        }
      }

      return { success: true };
    }),
});
