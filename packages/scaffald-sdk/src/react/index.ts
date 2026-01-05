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
} from './hooks.js'
