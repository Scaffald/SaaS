// @ts-nocheck
import { z } from 'zod'

export const resumeFileTypeEnum = z.enum([
  'application/pdf',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
])

export const resumeParseInputSchema = z.object({
  fileName: z.string().min(1),
  fileType: resumeFileTypeEnum,
  fileSize: z.number().int().positive(),
  fileBase64: z.string().min(1),
})

const generalEntrySchema = z.object({
  id: z.string().optional(),
  first_name: z.string().optional(),
  last_name: z.string().optional(),
  headline: z.string().optional(),
  summary: z.string().optional(),
  email: z.string().optional(),
  phone: z.string().optional(),
  confidence_score: z.number().min(0).max(100).optional(),
})

const experienceEntrySchema = z.object({
  id: z.string().optional(),
  job_title: z.string().min(1),
  company_name: z.string().min(1),
  start_date: z.string().optional().nullable(),
  end_date: z.string().optional().nullable(),
  is_current: z.boolean().optional(),
  location: z.string().optional(),
  summary: z.string().optional(),
  confidence_score: z.number().min(0).max(100).optional(),
})

const educationEntrySchema = z.object({
  id: z.string().optional(),
  institution: z.string().min(1),
  degree: z.string().optional(),
  start_date: z.string().optional().nullable(),
  end_date: z.string().optional().nullable(),
  confidence_score: z.number().min(0).max(100).optional(),
})

const skillEntrySchema = z.object({
  id: z.string().optional(),
  name: z.string().min(1),
  taxonomy: z.string().optional(),
  confidence_score: z.number().min(0).max(100).optional(),
})

const certificationEntrySchema = z.object({
  id: z.string().optional(),
  name: z.string().min(1),
  issuer: z.string().optional(),
  issue_date: z.string().optional().nullable(),
  credential_id: z.string().optional(),
  confidence_score: z.number().min(0).max(100).optional(),
})

export const importPayloadSchema = z.object({
  general: z.array(generalEntrySchema).default([]),
  experience: z.array(experienceEntrySchema).default([]),
  education: z.array(educationEntrySchema).default([]),
  skills: z.array(skillEntrySchema).default([]),
  certifications: z.array(certificationEntrySchema).default([]),
})

export const importMetadataSchema = z.object({
  version: z.literal(1),
  source: z.enum(['resume', 'json']),
  storedAt: z.string(),
  expiresAt: z.string(),
  payload: importPayloadSchema,
})

export const saveImportDataInputSchema = z.object({
  source: z.enum(['resume', 'json']),
  payload: importPayloadSchema,
})

export const validateJsonInputSchema = z.object({
  payload: importPayloadSchema,
})

export const clearImportDataInputSchema = z.object({})

export type ResumeParseInput = z.infer<typeof resumeParseInputSchema>
export type ImportPayload = z.infer<typeof importPayloadSchema>
export type ImportMetadata = z.infer<typeof importMetadataSchema>
