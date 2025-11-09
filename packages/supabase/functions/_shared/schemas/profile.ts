import { z } from "zod";

// Profile schemas for tRPC operations
export const profileGeneralSchema = z.object({
  // Required fields (matching frontend expectations)
  first_name: z.string().min(1, "First name is required").max(
    50,
    "First name too long",
  ),
  last_name: z.string().min(1, "Last name is required").max(
    50,
    "Last name too long",
  ),

  // Optional fields
  avatar_path: z.union([z.string().url(), z.string().min(1), z.literal("")])
    .optional(),
  email: z.string().email().optional(),
  phone: z.string().optional(),
  about: z.string().max(500).optional(),
});

// Output schema for profile data
export const profileGeneralOutputSchema = z.object({
  first_name: z.string(),
  last_name: z.string(),
  avatar_path: z.string(),
  email: z.string(),
  phone: z.string(),
  about: z.string(),
});

// Database update schemas with proper typing
export const profileUpdateSchema = z.object({
  id: z.string(),
  updated_at: z.string(),
  first_name: z.string().optional(),
  last_name: z.string().optional(),
  avatar_path: z.string().optional(),
});

export const userPrivateUpdateSchema = z.object({
  user_id: z.string(),
  updated_at: z.string(),
  phone: z.string().optional(),
  about: z.string().optional(),
});

// Employment profile schema for tRPC operations
export const profileEmploymentSchema = z
  .object({
    // Home Address
    address: z
      .object({
        street: z.string().optional(),
        city: z.string().optional(),
        state: z.string().optional(),
        zip: z.string().optional(),
        country: z.string().optional(),
      })
      .optional(),

    // Preferred work locations (up to 3)
    preferred_work_locations: z
      .array(z.string())
      .max(3, "Maximum 3 work locations allowed")
      .optional(),

    // Travel preferences
    open_to_travel: z.boolean().optional(),
    travel_distance_miles: z.number().min(10).max(250).optional(),

    // Residency (multiple countries but keep US boolean)
    us_resident: z.boolean().optional(),
    authorized_countries: z.array(z.string()).max(
      3,
      "Maximum 3 countries allowed",
    ).optional(),

    // Passport
    us_passport: z.boolean().optional(),

    // Drivers License (multi-select array)
    drivers_license_classes: z
      .array(
        z.enum([
          "Class M",
          "Class A",
          "Class B",
          "Class C",
          "Class D",
          "CDL A",
          "CDL B",
          "CDL C",
        ]),
      )
      .optional(),

    // Military Status (multi-select)
    military_status: z
      .array(
        z.enum([
          "Active Duty",
          "Reserve",
          "National Guard",
          "Veteran",
          "Retired",
        ]),
      )
      .optional(),

    // Availability (multi-select)
    availability: z
      .array(
        z.enum([
          "Part-time",
          "Contract",
          "Full-time",
          "Weekend",
          "Night Shift",
          "Day Shift",
          "Temporary",
          "Short Notice",
        ]),
      )
      .optional(),

    // Hourly Rate
    hourly_rate: z.number().min(0).max(200).optional(),
  })
  .partial();

// Output schema for employment profile data
export const profileEmploymentOutputSchema = z.object({
  address: z
    .object({
      street: z.string(),
      city: z.string(),
      state: z.string(),
      zip: z.string(),
      country: z.string(),
    })
    .nullable(),
  preferred_work_locations: z.array(z.string()),
  open_to_travel: z.boolean(),
  travel_distance_miles: z.number(),
  us_resident: z.boolean(),
  authorized_countries: z.array(z.string()),
  us_passport: z.boolean(),
  drivers_license_classes: z.array(z.string()),
  military_status: z.array(z.string()),
  availability: z.array(z.string()),
  hourly_rate: z.number().nullable(),
});

// Database update schema for employment data
export const userPrivateEmploymentUpdateSchema = z.object({
  user_id: z.string(),
  updated_at: z.string(),
  employment_street: z.string().optional(),
  employment_city: z.string().optional(),
  employment_state: z.string().optional(),
  employment_zip: z.string().optional(),
  employment_country: z.string().optional(),
  preferred_work_locations: z.array(z.string()).optional(),
  open_to_travel: z.boolean().optional(),
  travel_distance_miles: z.number().optional(),
  us_resident: z.boolean().optional(),
  authorized_countries: z.array(z.string()).optional(),
  us_passport: z.boolean().optional(),
  drivers_license_classes: z.array(z.string()).optional(),
  military_status: z.array(z.string()).optional(),
  availability: z.array(z.string()).optional(),
  hourly_rate: z.number().optional(),
});

// Skills profile schema for tRPC operations
export const profileSkillsSchema = z
  .object({
    // Skills array with proficiency
    skills: z
      .array(
        z.object({
          skill_id: z.string().uuid(),
          skill_name: z.string(),
          proficiency: z.number().min(1).max(5).default(3),
          years_experience: z.number().min(0).max(50).optional(),
          is_primary: z.boolean().default(false),
          endorsed_count: z.number().default(0).optional(),
        }),
      )
      .optional(),

    // Industry focus
    industry_id: z.string().uuid().optional(),
    secondary_industries: z.array(z.string().uuid()).max(3).optional(),

    // Skill categories of interest
    skill_categories: z.array(z.string()).optional(),
  })
  .partial();

// Output schema for skills profile data
export const profileSkillsOutputSchema = z.object({
  skills: z.array(
    z.object({
      skill_id: z.string(),
      skill_name: z.string(),
      proficiency: z.number(),
      years_experience: z.number().nullable(),
      is_primary: z.boolean(),
      endorsed_count: z.number(),
    }),
  ),
  industry_id: z.string().nullable(),
  secondary_industries: z.array(z.string()),
  skill_categories: z.array(z.string()),
});
