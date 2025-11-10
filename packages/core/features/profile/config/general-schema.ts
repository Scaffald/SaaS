import { z } from "zod";
import { phoneNumberSchema } from "@app/schemas/common/phone";

/**
 * General Profile Form Schema
 * Fields: Avatar, First/Last Name, About, Phone, Email, Home Address
 */
export const generalProfileSchema = z.object({
  // Avatar - optional (can be full URL or path)
  avatar_path: z.union([z.string().url(), z.string().min(1), z.literal("")])
    .optional(),

  // Name fields - required (as shown with asterisks in UI)
  first_name: z.string().min(1, "First name is required").max(
    50,
    "First name too long",
  ),
  last_name: z.string().min(1, "Last name is required").max(
    50,
    "Last name too long",
  ),

  // About section - accepts both string (legacy) and JSONContent (TipTap format)
  about: z.union([
    z.string().max(500, "About section must be 500 characters or less"),
    z.object({
      type: z.string(),
      content: z.array(z.any()).optional(),
    }).passthrough(), // TipTap JSONContent format
  ]).optional().nullable(),

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

export type GeneralProfileFormData = z.infer<typeof generalProfileSchema>;

export const generalProfileDefaults: GeneralProfileFormData = {
  avatar_path: "",
  first_name: "",
  last_name: "",
  about: null,
  phone: "",
  email: "",
  address: {
    street: "",
    city: "",
    state: "",
    zip: "",
    country: "United States",
    latitude: undefined,
    longitude: undefined,
  },
};
