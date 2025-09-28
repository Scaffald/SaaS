import { z } from 'zod'
import {
  profileGeneralSchema,
  profileGeneralOutputSchema,
  profileUpdateSchema,
  userPrivateUpdateSchema,
} from './schemas/profile'

// Inferred TypeScript types from Zod schemas
export type ProfileGeneralInput = z.infer<typeof profileGeneralSchema>
export type ProfileGeneralOutput = z.infer<typeof profileGeneralOutputSchema>
export type ProfileUpdate = z.infer<typeof profileUpdateSchema>
export type UserPrivateUpdate = z.infer<typeof userPrivateUpdateSchema>

// tRPC router types for client consumption
export type AppRouter = {
  profile: {
    getGeneral: {
      input: void
      output: ProfileGeneralOutput
    }
    updateGeneral: {
      input: ProfileGeneralInput
      output: { success: boolean }
    }
  }
}
