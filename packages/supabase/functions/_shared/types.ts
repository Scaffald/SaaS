import { z } from 'zod'
import {
  profileGeneralSchema,
  profileGeneralOutputSchema,
  profileEmploymentSchema,
  profileEmploymentOutputSchema,
  profileSkillsSchema,
  profileSkillsOutputSchema,
  profileUpdateSchema,
  userPrivateUpdateSchema,
  userPrivateEmploymentUpdateSchema,
} from './schemas/profile'

// Inferred TypeScript types from Zod schemas
export type ProfileGeneralInput = z.infer<typeof profileGeneralSchema>
export type ProfileGeneralOutput = z.infer<typeof profileGeneralOutputSchema>
export type ProfileEmploymentInput = z.infer<typeof profileEmploymentSchema>
export type ProfileEmploymentOutput = z.infer<typeof profileEmploymentOutputSchema>
export type ProfileSkillsInput = z.infer<typeof profileSkillsSchema>
export type ProfileSkillsOutput = z.infer<typeof profileSkillsOutputSchema>
export type ProfileUpdate = z.infer<typeof profileUpdateSchema>
export type UserPrivateUpdate = z.infer<typeof userPrivateUpdateSchema>
export type UserPrivateEmploymentUpdate = z.infer<typeof userPrivateEmploymentUpdateSchema>

// tRPC router types for client consumption
export type AppRouter = {
  profile: {
    getGeneral: {
      input: undefined
      output: ProfileGeneralOutput
    }
    updateGeneral: {
      input: ProfileGeneralInput
      output: { success: boolean }
    }
    getEmployment: {
      input: undefined
      output: ProfileEmploymentOutput
    }
    updateEmployment: {
      input: ProfileEmploymentInput
      output: { success: boolean }
    }
    getSkills: {
      input: undefined
      output: ProfileSkillsOutput
    }
    updateSkills: {
      input: ProfileSkillsInput
      output: { success: boolean }
    }
  }
}
