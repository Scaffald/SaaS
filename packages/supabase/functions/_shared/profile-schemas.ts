import { z } from "zod";
// @ts-ignore - Deno requires .ts extension for relative imports
import { phoneNumberSchema } from "./phone.ts";

/**
 * General Profile Form Schema
 * Fields: Avatar, First/Last Name, About, Phone, Email, Home Address
 */
export const generalProfileSchema = z.object({
  // Avatar - optional (can be full URL or path)
  avatar_path: z.union([z.string().url(), z.string().min(1), z.literal("")])
    .optional(),

  // Name fields - required
  first_name: z.string().min(1, "First name is required").max(
    50,
    "First name too long",
  ),
  last_name: z.string().min(1, "Last name is required").max(
    50,
    "Last name too long",
  ),

  // About section - optional
  about: z.string().max(500, "About section must be 500 characters or less")
    .optional(),

  // Contact information - optional
  phone: phoneNumberSchema,

  // Email - optional (read-only, managed by auth system)
  email: z.string().email("Please enter a valid email address").optional(),

  // Home Address - nullable to handle null from database
  address: z
    .object({
      street: z.string().optional(),
      city: z.string().optional(),
      state: z.string().optional(),
      zip: z.string().optional(),
      country: z.string().optional(),
      latitude: z.number().optional(),
      longitude: z.number().optional(),
    })
    .nullable()
    .optional(),
});

/**
 * Employment Profile Form Schema
 * Fields: Preferred work locations, Travel, Residency, Military, etc.
 */
export const employmentProfileSchema = z.object({
  // Preferred work locations (up to 3)
  preferred_work_locations: z
    .array(z.string())
    .max(3, "Maximum 3 work locations allowed")
    .optional(),

  // Travel preferences
  open_to_travel: z.boolean().default(true),
  travel_distance_miles: z.number().min(10).max(250).default(25),

  // Residency
  us_resident: z.boolean().default(false),

  // Passport
  us_passport: z.boolean().default(false),

  // Drivers License (multi-select array)
  drivers_license_classes: z
    .array(
      z.enum([
        "Class M",
        "Class A",
        "Class B",
        "Class C",
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
});

export type GeneralProfileFormData = z.infer<typeof generalProfileSchema>;
export type EmploymentProfileFormData = z.infer<typeof employmentProfileSchema>;
