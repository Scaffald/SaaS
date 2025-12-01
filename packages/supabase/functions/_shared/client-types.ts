// Re-export types from consolidated schemas for client-side usage

// AppRouter type for client-side tRPC usage
// Re-export from the placeholder type to avoid importing Deno-specific code
export type { AppRouter } from "../../app-router-type.ts";
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
} from "./schemas/consolidated.ts";
// Re-export constants and schemas
export {
  AVAILABILITY_OPTIONS,
  DRIVERS_LICENSE_OPTIONS,
  MILITARY_STATUS_OPTIONS,
  profileEmploymentDefaults,
  profileEmploymentInputSchema,
} from "./schemas/consolidated.ts";
