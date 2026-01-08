/**
 * React integration for Scaffald SDK
 *
 * Provides React hooks and components for using Scaffald API with React Query
 *
 * @packageDocumentation
 */

// Provider
export { ScaffaldProvider, useScaffald } from './provider.js'
export type { ScaffaldProviderProps } from './provider.js'

// Hooks
export {
  // Authentication
  useMagicLink,
  useRoles,
  useSession,
  // Jobs
  useJobs,
  useJob,
  useSimilarJobs,
  useJobFilterOptions,
  // Applications
  useApplications,
  useCreateQuickApplication,
  useCreateFullApplication,
  useApplication,
  useUpdateApplication,
  useWithdrawApplication,
  // Profiles
  useUserProfile,
  useOrganization,
  useEmployer,
  // API Keys
  useAPIKeys,
  useAPIKey,
  useCreateAPIKey,
  useUpdateAPIKey,
  useRevokeAPIKey,
  useAPIKeyUsage,
} from './hooks.js'
