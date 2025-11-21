/**
 * Client-side types and exports for tRPC and schemas
 * Re-exports from @app/trpc package to avoid importing Deno-specific code
 */

// Re-export AppRouter type (placeholder to avoid Deno imports)
export type { AppRouter } from './app-router-type'

// Re-export types from @app/trpc schemas
export type {
  EmploymentProfileFormData,
  ProfileEmploymentInput,
  ProfileEmploymentOutput,
  ProfileGeneralInput,
  ProfileGeneralOutput,
  ProfileSkillsInput,
  ProfileSkillsOutput,
  ProfileWizardProgress,
  ProfileWizardSaveStepInput,
  ProfileWizardStepData,
  ProfileWizardStepId,
  UploadAvatarInput,
  UploadAvatarOutput,
} from '@app/trpc/schemas'
// Re-export constants and schemas
export {
  AVAILABILITY_OPTIONS,
  DRIVERS_LICENSE_OPTIONS,
  MILITARY_STATUS_OPTIONS,
  PROFILE_WIZARD_OPTIONAL_STEPS,
  PROFILE_WIZARD_REQUIRED_STEPS,
  PROFILE_WIZARD_STEP_WEIGHTS,
  PROFILE_WIZARD_STEPS,
  profileEmploymentDefaults,
  profileEmploymentInputSchema,
  profileWizardDefaultProgress,
  profileWizardProgressSchema,
  profileWizardSaveStepInputSchema,
} from '@app/trpc/schemas'
export type {
  ImportPayload,
  ResumeParseInput,
} from '@app/trpc/schemas'

export {
  importPayloadSchema,
  resumeParseInputSchema,
  saveImportDataInputSchema,
  validateJsonInputSchema,
} from '@app/trpc/schemas'
