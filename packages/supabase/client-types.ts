/**
 * Client-side types and exports for tRPC and schemas
 * Re-exports from @scf/trpc package to avoid importing Deno-specific code
 */

// Re-export AppRouter type - use fallback when Deno router type fails to resolve
// (e.g. scaffald-app typecheck with excluded functions); runtime tRPC remains correct
export type { AppRouter } from './app-router-fallback'

// Re-export types from @scf/trpc schemas
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
} from '@scf/trpc/schemas'
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
} from '@scf/trpc/schemas'
export type {
  ImportPayload,
  ResumeParseInput,
} from '@scf/trpc/schemas'

export {
  importPayloadSchema,
  resumeParseInputSchema,
  saveImportDataInputSchema,
  validateJsonInputSchema,
} from '@scf/trpc/schemas'
