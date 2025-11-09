/**
 * Client-side types and exports for tRPC and schemas
 * Re-exports from _shared directory to avoid importing Deno-specific code
 */

// Re-export AppRouter type (placeholder to avoid Deno imports)
export type { AppRouter } from "./app-router-type";

// Re-export types from consolidated schemas
export type {
  EmploymentProfileFormData,
  ProfileEmploymentInput,
  ProfileEmploymentOutput,
  ProfileGeneralInput,
  ProfileGeneralOutput,
  ProfileSkillsInput,
  ProfileSkillsOutput,
  UploadAvatarInput,
  UploadAvatarOutput,
  ProfileWizardProgress,
  ProfileWizardSaveStepInput,
  ProfileWizardStepData,
  ProfileWizardStepId,
} from "./functions/_shared/schemas/consolidated";

export type {
  ImportPayload,
  ResumeParseInput,
} from "./functions/_shared/schemas/profileImport";

// Re-export constants and schemas
export {
  AVAILABILITY_OPTIONS,
  DRIVERS_LICENSE_OPTIONS,
  MILITARY_STATUS_OPTIONS,
  profileEmploymentDefaults,
  profileEmploymentInputSchema,
  PROFILE_WIZARD_STEPS,
  PROFILE_WIZARD_OPTIONAL_STEPS,
  PROFILE_WIZARD_REQUIRED_STEPS,
  PROFILE_WIZARD_STEP_WEIGHTS,
  profileWizardDefaultProgress,
  profileWizardProgressSchema,
  profileWizardSaveStepInputSchema,
} from "./functions/_shared/schemas/consolidated";

export {
  importPayloadSchema,
  resumeParseInputSchema,
  saveImportDataInputSchema,
  validateJsonInputSchema,
} from "./functions/_shared/schemas/profileImport";
