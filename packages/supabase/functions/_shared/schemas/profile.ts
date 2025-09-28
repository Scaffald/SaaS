import { z } from 'zod'

// Profile schemas for tRPC operations
export const profileGeneralSchema = z
  .object({
    first_name: z.string().min(1).optional(),
    last_name: z.string().min(1).optional(),
    avatar_url: z.union([z.string().url(), z.literal('')]).optional(),
    email: z.string().email().optional(),
    phone: z.string().optional(),
    about: z.string().max(500).optional(),
  })
  .partial()

// Output schema for profile data
export const profileGeneralOutputSchema = z.object({
  first_name: z.string(),
  last_name: z.string(),
  avatar_url: z.string(),
  email: z.string(),
  phone: z.string(),
  about: z.string(),
})

// Database update schemas with proper typing
export const profileUpdateSchema = z.object({
  id: z.string(),
  updated_at: z.string(),
  first_name: z.string().optional(),
  last_name: z.string().optional(),
  avatar_url: z.string().optional(),
})

export const userPrivateUpdateSchema = z.object({
  user_id: z.string(),
  updated_at: z.string(),
  phone: z.string().optional(),
  about: z.string().optional(),
})
