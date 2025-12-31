import { z } from 'zod';

/**
 * Single soft skill rating (self assessment or requirements)
 */
export const softSkillRatingSchema = z.object({
  skill_id: z.string().uuid('Skill ID must be a valid UUID'),
  rating: z
    .number({
      invalid_type_error: 'Rating is required',
    })
    .int('Rating must be a whole number')
    .min(1, 'Rating must be at least 1')
    .max(5, 'Rating must be at most 5'),
})

/**
 * Payload for updating a user's 25 soft skill ratings
 */
export const softSkillsUpdateSchema = z.object({
  skills: z
    .array(softSkillRatingSchema, {
      invalid_type_error: 'You must rate all soft skills',
    })
    .length(25, 'All 25 soft skills must be rated'),
})

/**
 * Requirement definition for job soft skills
 */
export const jobSoftSkillRequirementSchema = z.object({
  skill_id: z.string().uuid('Skill ID must be a valid UUID'),
  importance: z
    .number({
      invalid_type_error: 'Importance is required',
    })
    .int('Importance must be a whole number')
    .min(1, 'Importance must be at least 1')
    .max(5, 'Importance must be at most 5'),
})

export type SoftSkillRatingInput = z.infer<typeof softSkillRatingSchema>
export type SoftSkillsUpdateInput = z.infer<typeof softSkillsUpdateSchema>
export type JobSoftSkillRequirementInput = z.infer<typeof jobSoftSkillRequirementSchema>
