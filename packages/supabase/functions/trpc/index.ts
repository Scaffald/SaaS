import { fetchRequestHandler } from "@trpc/server/adapters/fetch";
import { initTRPC, TRPCError } from "@trpc/server";
import { createClient } from "@supabase/supabase-js";
import {
  profileEmploymentInputSchema,
  profileGeneralInputSchema,
  profileSkillsInputSchema,
  type ProfileUpdate,
  uploadAvatarInputSchema,
  type UserPrivateEmploymentUpdate,
  type UserPrivateUpdate,
} from "../_shared/schemas/consolidated";

// Environment variables
const supabaseUrl = Deno.env.get("SUPABASE_URL") ?? "";
const supabaseAnonKey = Deno.env.get("SUPABASE_ANON_KEY") ?? "";

// Create tRPC context
const createTRPCContext = async (opts: { req: Request }) => {
  const authorizationHeader = opts.req.headers.get("authorization");
  console.log("Auth header present:", !!authorizationHeader);

  // Create Supabase client with auth context
  const supabase = createClient(supabaseUrl, supabaseAnonKey, {
    global: {
      headers: authorizationHeader
        ? { Authorization: authorizationHeader }
        : {},
    },
  });

  let userId: string | undefined;
  let userToken: string | undefined;

  if (authorizationHeader) {
    const token = authorizationHeader.replace("Bearer ", "");
    userToken = token;
    console.log("Token extracted:", !!token);

    try {
      // Use Supabase's built-in user verification
      const {
        data: { user },
        error,
      } = await supabase.auth.getUser(token);

      if (error) {
        console.error("Auth error:", error.message);
      } else if (user) {
        userId = user.id;
        console.log("User authenticated:", user.id);
      } else {
        console.log("No user found");
      }
    } catch (error) {
      const errorMessage = error instanceof Error
        ? error.message
        : String(error);
      console.error("Error getting user:", errorMessage);
    }
  } else {
    console.log("No authorization header found");
  }

  console.log("Final user context:", userId ? { id: userId } : "undefined");
  return {
    user: userId ? { id: userId } : undefined,
    userToken,
    supabase,
  };
};

// Initialize tRPC
const t = initTRPC.context<typeof createTRPCContext>().create();

// Middleware for protected procedures
const enforceUserIsAuthed = t.middleware(({ ctx, next }) => {
  if (!ctx.user) {
    throw new TRPCError({ code: "UNAUTHORIZED" });
  }
  return next({
    ctx: {
      user: { ...ctx.user },
      userToken: ctx.userToken,
      supabase: ctx.supabase,
    },
  });
});

const protectedProcedure = t.procedure.use(enforceUserIsAuthed);

// Profile router
const profileRouter = t.router({
  getGeneral: protectedProcedure.query(async ({ ctx }) => {
    const { supabase, user, userToken } = ctx;

    // Get auth user data for email using the token explicitly
    const { data: authUser, error: authError } = await supabase.auth.getUser(
      userToken,
    );

    if (authError) {
      console.error("Error fetching auth user:", authError.message);
    }

    // Get profile data from profiles table
    const { data: profile, error: profileError } = await supabase
      .from("profiles")
      .select("first_name, last_name, avatar_path")
      .eq("id", user.id)
      .single();

    if (profileError && profileError.code !== "PGRST116") {
      throw new TRPCError({
        code: "INTERNAL_SERVER_ERROR",
        message: `Failed to fetch profile: ${profileError.message}`,
      });
    }

    // Get additional data from user_private table including address
    const { data: privateData, error: privateError } = await supabase
      .from("user_private")
      .select("phone, about, address")
      .eq("user_id", user.id)
      .single();

    if (privateError && privateError.code !== "PGRST116") {
      throw new TRPCError({
        code: "INTERNAL_SERVER_ERROR",
        message: `Failed to fetch private data: ${privateError.message}`,
      });
    }

    console.log("Auth user email:", authUser?.user?.email);

    return {
      first_name: profile?.first_name || "",
      last_name: profile?.last_name || "",
      avatar_path: profile?.avatar_path || "",
      email: authUser?.user?.email || "",
      phone: privateData?.phone || "",
      about: privateData?.about || "",
      address: privateData?.address || null,
    };
  }),

  updateGeneral: protectedProcedure
    .input(profileGeneralInputSchema)
    .mutation(async ({ ctx, input }) => {
      const { supabase, user } = ctx;

      // Note: Email updates are not supported to avoid authentication issues
      // The email field is read-only and comes from the auth system

      // Build profile update object with only provided fields
      const profileUpdate: ProfileUpdate = {
        id: user.id,
        updated_at: new Date().toISOString(),
      };

      if (input.first_name !== undefined) {
        profileUpdate.first_name = input.first_name;
      }
      if (input.last_name !== undefined) {
        profileUpdate.last_name = input.last_name;
      }
      if (input.avatar_path !== undefined) {
        profileUpdate.avatar_path = input.avatar_path;
      }

      // Update profiles table only if there are fields to update
      if (Object.keys(profileUpdate).length > 2) {
        // More than just id and updated_at
        const { error: profileError } = await supabase.from("profiles").upsert(
          profileUpdate,
        );

        if (profileError) {
          throw new TRPCError({
            code: "INTERNAL_SERVER_ERROR",
            message: `Failed to update profile: ${profileError.message}`,
          });
        }
      }

      // Build user_private update object with only provided fields
      const privateUpdate: UserPrivateUpdate & {
        address?: Record<string, unknown>;
      } = {
        user_id: user.id,
        updated_at: new Date().toISOString(),
      };

      if (input.phone !== undefined) privateUpdate.phone = input.phone;
      if (input.about !== undefined) privateUpdate.about = input.about;
      if (input.address !== undefined) {
        privateUpdate.address = input.address === null
          ? undefined
          : input.address;
      }

      // Update user_private table only if there are fields to update
      if (Object.keys(privateUpdate).length > 2) {
        // More than just user_id and updated_at
        const { error: privateError } = await supabase.from("user_private")
          .upsert(privateUpdate);

        if (privateError) {
          throw new TRPCError({
            code: "INTERNAL_SERVER_ERROR",
            message: `Failed to update private data: ${privateError.message}`,
          });
        }
      }

      return { success: true };
    }),

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

  getSkills: protectedProcedure.query(async () => {
    // For now, we'll return mock data since we don't have a skills table yet
    // TODO: Implement actual skills table query using ctx.supabase and ctx.user
    // In a real implementation, you'd query from a user_skills table
    return {
      skills: [],
      primary_industry_id: null,
      secondary_industries: [],
      skill_categories: [],
    };
  }),

  updateSkills: protectedProcedure.input(profileSkillsInputSchema).mutation(
    async ({ input }) => {
      // For now, we'll just return success since we don't have a skills table yet
      // TODO: In a real implementation, you'd update the user_skills table using ctx.supabase and ctx.user
      console.log("Skills data to save:", input);

      return { success: true };
    },
  ),

  uploadAvatar: protectedProcedure
    .input(uploadAvatarInputSchema)
    .mutation(async ({ ctx, input }) => {
      const { supabase, user } = ctx;

      try {
        // Convert base64 to Uint8Array
        const base64Data = input.file.split(",")[1]; // Remove data:image/jpeg;base64, prefix
        const binaryString = atob(base64Data);
        const bytes = new Uint8Array(binaryString.length);
        for (let i = 0; i < binaryString.length; i++) {
          bytes[i] = binaryString.charCodeAt(i);
        }

        // Generate unique file name
        const fileExtension = input.fileName.split(".").pop() || "jpg";
        const uniqueFileName =
          `${user.id}/avatar-${Date.now()}.${fileExtension}`;

        // Upload to Supabase Storage
        const { error: uploadError } = await supabase.storage
          .from("avatars")
          .upload(uniqueFileName, bytes, {
            contentType: input.contentType,
            upsert: true,
          });

        if (uploadError) {
          throw new TRPCError({
            code: "INTERNAL_SERVER_ERROR",
            message: `Failed to upload avatar: ${uploadError.message}`,
          });
        }

        // Store only the file path, not the full URL
        // Client will construct the full URL using their environment variables
        const { error: updateError } = await supabase.from("profiles").upsert({
          id: user.id,
          avatar_path: uniqueFileName, // Store just the file path
          updated_at: new Date().toISOString(),
        });

        if (updateError) {
          throw new TRPCError({
            code: "INTERNAL_SERVER_ERROR",
            message:
              `Failed to update profile with avatar path: ${updateError.message}`,
          });
        }

        return {
          success: true,
          avatarPath: uniqueFileName, // Return the file path
        };
      } catch (error) {
        const errorMessage = error instanceof Error
          ? error.message
          : String(error);
        console.error("Avatar upload error:", error);
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: `Avatar upload failed: ${errorMessage}`,
        });
      }
    }),

  getCompletionStatus: protectedProcedure.query(async ({ ctx }) => {
    const { supabase, user } = ctx;

    try {
      // Get profile data from profiles table (linked to auth.users)
      const { data: profileData, error: profileError } = await supabase
        .from("profiles")
        .select("first_name, last_name")
        .eq("id", user.id)
        .single();

      if (profileError && profileError.code !== "PGRST116") {
        console.error("Profile data error:", profileError);
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: `Failed to fetch profile data: ${profileError.message}`,
        });
      }

      // Get user_private data directly (this should work with proper RLS)
      const { data: privateData, error: privateError } = await supabase
        .from("user_private")
        .select(`
          phone,
          address,
          preferred_work_locations,
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
        first_name: profileData?.first_name || "",
        last_name: profileData?.last_name || "",
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

// App router
const appRouter = t.router({
  profile: profileRouter,
});

// Export the router type for client-side usage
export type AppRouter = typeof appRouter;

// Use Deno.serve() as recommended by Supabase best practices
Deno.serve(async (req: Request) => {
  // Handle CORS preflight requests
  if (req.method === "OPTIONS") {
    return new Response("ok", {
      headers: {
        "Access-Control-Allow-Origin": "*",
        "Access-Control-Allow-Methods": "POST, GET, OPTIONS",
        "Access-Control-Allow-Headers":
          "authorization, x-client-info, apikey, content-type, x-trpc-source",
      },
    });
  }

  try {
    return await fetchRequestHandler({
      endpoint: "/trpc",
      req,
      router: appRouter,
      createContext: createTRPCContext,
      batching: {
        enabled: true,
      },
    });
  } catch (error) {
    console.error("tRPC handler error:", error);
    return new Response(JSON.stringify({ error: "Internal server error" }), {
      status: 500,
      headers: { "Content-Type": "application/json" },
    });
  }
});
