import { TRPCError } from '@trpc/server';
import {
  profileEmploymentInputSchema,
  type UserPrivateEmploymentUpdate,
} from '@scf/trpc/schemas';
import { protectedProcedure, t } from '../../middleware';

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

    // Get employment data from private.profile table
    const { data: employmentData, error: employmentError } = await supabase
      .schema("core")
      .from("profile")
      .select(`
        preferred_work_locations,
        open_to_travel,
        travel_distance_miles,
        us_resident,
        authorized_countries,
        us_passport,
        drivers_license_classes,
        military_status,
        availability,
        hourly_rate_cents
      `)
      .eq("user_id", user.id)
      .single();

    if (employmentError && employmentError.code !== "PGRST116") {
      throw new TRPCError({
        code: "INTERNAL_SERVER_ERROR",
        message: `Failed to fetch employment data: ${employmentError.message}`,
      });
    }

    // Convert hourly_rate_cents to hourly_rate (dollars), default to 0
    const hourlyRate = employmentData?.hourly_rate_cents
      ? employmentData.hourly_rate_cents / 100
      : 0;

    return {
      preferred_work_locations: employmentData?.preferred_work_locations || [],
      open_to_travel: employmentData?.open_to_travel ?? true,
      travel_distance_miles: employmentData?.travel_distance_miles || 25,
      us_resident: employmentData?.us_resident || false,
      authorized_countries: employmentData?.authorized_countries || [],
      us_passport: employmentData?.us_passport || false,
      drivers_license_classes: employmentData?.drivers_license_classes || [],
      military_status: employmentData?.military_status || [],
      availability: employmentData?.availability || [],
      hourly_rate: hourlyRate,
    };
  }),

  /**
   * Update employment profile information
   * Updates user's employment preferences in private.profile table
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
      if (input.open_to_travel !== undefined) {
        employmentUpdate.open_to_travel = input.open_to_travel;
      }
      if (input.travel_distance_miles !== undefined) {
        employmentUpdate.travel_distance_miles = input.travel_distance_miles;
      }
      if (input.us_resident !== undefined) {
        employmentUpdate.us_resident = input.us_resident;
      }
      if (input.authorized_countries !== undefined) {
        employmentUpdate.authorized_countries = input.authorized_countries;
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
        // Convert hourly_rate (dollars) to hourly_rate_cents for database storage
        employmentUpdate.hourly_rate_cents = Math.round(
          input.hourly_rate * 100,
        );
      }

      // Update private.profile table only if there are fields to update
      if (Object.keys(employmentUpdate).length > 2) {
        // More than just user_id and updated_at
        const { error: employmentError } = await supabase
          .schema("core")
          .from("profile")
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
