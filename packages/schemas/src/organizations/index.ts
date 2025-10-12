import { z } from "zod";

export const organizationCreateSchema = z.object({
  name: z.string().min(1, "Name is required"),
  slug: z.string().min(1, "Slug is required").toLowerCase(),
  industry_id: z.string().uuid().optional(),
  logo_url: z.string().url().optional().or(z.literal("")),
  visibility: z.enum(["public", "private"]).default("public"),
  address: z.record(z.unknown()).optional(),
});

export const organizationUpdateSchema = organizationCreateSchema.extend({
  id: z.string().uuid(),
});

export type OrganizationCreate = z.infer<typeof organizationCreateSchema>;
export type OrganizationUpdate = z.infer<typeof organizationUpdateSchema>;
