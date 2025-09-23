import { z } from 'zod';

import { DateTimeSchema, LocationSchema } from './common';

export const OrganizationIdentifierSchema = z
  .object({
    externalId: z.string().trim().min(1).optional(),
    source: z.string().trim().min(1).optional(),
    slug: z.string().trim().min(1).optional(),
  })
  .refine(
    (value) =>
      Boolean(value.externalId || value.source || value.slug),
    'At least one organization identifier must be provided',
  );

export type OrganizationIdentifier = z.infer<typeof OrganizationIdentifierSchema>;

export const OrganizationSizeSchema = z
  .object({
    label: z.string().trim().min(1).optional(),
    min: z.number().int().nonnegative().optional(),
    max: z.number().int().nonnegative().optional(),
  })
  .superRefine((value, ctx) => {
    if (value.min !== undefined && value.max !== undefined && value.min > value.max) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: 'min must be less than or equal to max',
        path: ['min'],
      });
    }
  });

export type OrganizationSize = z.infer<typeof OrganizationSizeSchema>;

export const SocialProfileSchema = z.object({
  type: z.enum([
    'website',
    'linkedin',
    'twitter',
    'facebook',
    'instagram',
    'github',
    'youtube',
    'glassdoor',
    'crunchbase',
    'angelList',
    'other',
  ]),
  url: z.string().url(),
  handle: z.string().trim().min(1).optional(),
});

export type SocialProfile = z.infer<typeof SocialProfileSchema>;

export const NormalizedOrganizationSchema = z.object({
  id: z.string().trim().min(1).optional(),
  identifier: OrganizationIdentifierSchema.optional(),
  name: z.string().trim().min(1),
  legalName: z.string().trim().min(1).optional(),
  description: z.string().optional(),
  websiteUrl: z.string().url().optional(),
  careersUrl: z.string().url().optional(),
  logoUrl: z.string().url().optional(),
  industries: z.array(z.string().trim().min(1)).optional(),
  size: OrganizationSizeSchema.optional(),
  headquarters: LocationSchema.optional(),
  locations: z.array(LocationSchema).optional(),
  remoteFriendly: z.boolean().optional(),
  foundedAt: DateTimeSchema.optional(),
  emails: z.array(z.string().email()).optional(),
  phoneNumbers: z.array(z.string().trim().min(1)).optional(),
  socialProfiles: z.array(SocialProfileSchema).optional(),
  metadata: z.record(z.unknown()).optional(),
});

export type NormalizedOrganization = z.infer<typeof NormalizedOrganizationSchema>;

export { DateTimeSchema, LocationSchema } from './common';
export type { DateTime, Location } from './common';
