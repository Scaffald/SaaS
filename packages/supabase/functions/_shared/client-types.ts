// Re-export types from consolidated schemas for client-side usage
export type {
  ProfileGeneralInput,
  ProfileGeneralOutput,
  ProfileEmploymentInput,
  ProfileEmploymentOutput,
  ProfileSkillsInput,
  ProfileSkillsOutput,
  UploadAvatarInput,
  UploadAvatarOutput,
  EmploymentProfileFormData,
} from './schemas/consolidated'

// Re-export constants and schemas
export {
  DRIVERS_LICENSE_OPTIONS,
  MILITARY_STATUS_OPTIONS,
  AVAILABILITY_OPTIONS,
  profileEmploymentDefaults,
  profileEmploymentInputSchema,
} from './schemas/consolidated'

// AppRouter type for client-side tRPC usage
export type { AppRouter } from '../trpc/index'
