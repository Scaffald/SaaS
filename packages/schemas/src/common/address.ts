import { z } from "zod";

/**
 * Address schema used across the application
 * All fields are optional to support partial addresses
 * Handles null values from database
 */
export const addressSchema = z
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
  .optional();

export type Address = z.infer<typeof addressSchema>;
