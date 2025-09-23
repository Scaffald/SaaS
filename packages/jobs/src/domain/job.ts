import { z } from 'zod';

import {
  CompensationSchema,
  DateTimeSchema,
  LocationSchema,
} from './common';
import { NormalizedOrganizationSchema } from './organization';

export const EmploymentTypeSchema = z.enum([
  'full_time',
  'part_time',
  'contract',
  'temporary',
  'internship',
  'volunteer',
  'freelance',
  'other',
]);

export type EmploymentType = z.infer<typeof EmploymentTypeSchema>;

export const ExperienceLevelSchema = z.enum([
  'intern',
  'entry',
  'mid',
  'senior',
  'lead',
  'director',
  'executive',
]);

export type ExperienceLevel = z.infer<typeof ExperienceLevelSchema>;

export const WorkplaceTypeSchema = z.enum([
  'onsite',
  'remote',
  'hybrid',
  'flexible',
]);

export type WorkplaceType = z.infer<typeof WorkplaceTypeSchema>;

export const JobStatusSchema = z.enum(['open', 'closed', 'draft']);

export type JobStatus = z.infer<typeof JobStatusSchema>;

export const JobIdentifierSchema = z.object({
  externalId: z.string().trim().min(1),
  source: z.string().trim().min(1),
  url: z.string().url().optional(),
});

export type JobIdentifier = z.infer<typeof JobIdentifierSchema>;

export const NormalizedJobSchema = z
  .object({
    id: z.string().trim().min(1).optional(),
    identifier: JobIdentifierSchema,
    title: z.string().trim().min(1),
    url: z.string().url(),
    description: z.string().trim().min(1).optional(),
    summary: z.string().trim().min(1).optional(),
    language: z.string().trim().min(1).optional(),
    applicationUrl: z.string().url().optional(),
    postedAt: DateTimeSchema.optional(),
    updatedAt: DateTimeSchema.optional(),
    closesAt: DateTimeSchema.optional(),
    employmentType: EmploymentTypeSchema.optional(),
    experienceLevel: ExperienceLevelSchema.optional(),
    workplaceType: WorkplaceTypeSchema.optional(),
    compensation: CompensationSchema.optional(),
    locations: z.array(LocationSchema).nonempty().optional(),
    primaryLocation: LocationSchema.optional(),
    remote: z.boolean().optional(),
    tags: z.array(z.string().trim().min(1)).optional(),
    skills: z.array(z.string().trim().min(1)).optional(),
    benefits: z.array(z.string().trim().min(1)).optional(),
    keywords: z.array(z.string().trim().min(1)).optional(),
    organization: NormalizedOrganizationSchema,
    status: JobStatusSchema.optional(),
    metadata: z.record(z.unknown()).optional(),
  })
  .refine((value) => Boolean(value.description || value.summary), {
    message: 'Provide a description or summary for the job listing',
    path: ['description'],
  });

export type NormalizedJob = z.infer<typeof NormalizedJobSchema>;

export { CompensationSchema, DateTimeSchema, LocationSchema } from './common';
export type {
  Compensation,
  CompensationFrequency,
  DateTime,
  Location,
} from './common';
