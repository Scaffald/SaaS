// Re-export everything from the standalone UI package
export * from '@scaffald/tamagui-ui'

// Domain-specific components that extend the standalone package
// These have dependencies on @app/core or other domain-specific code

// ImageUpload has domain-specific Supabase dependencies
export { ImageUpload, type ImageUploadProps } from './components/ImageUpload'

// Layout components with domain dependencies
export { AssessmentsLayout } from './components/layouts/AssessmentsLayout'
export { DashboardLayout } from './components/layouts/DashboardLayout'
export { OfficeLayout } from './components/layouts/OfficeLayout'
export { ProfileLayout } from './components/layouts/ProfileLayout'

// Navigation components with domain dependencies
export {
  AssessmentsTabs,
  type AssessmentsTabsItem,
  type AssessmentsTabsProps,
} from './components/navigation/AssessmentsTabs'
export {
  ProfileTabs,
  type ProfileTabsItem,
  type ProfileTabsProps,
} from './components/navigation/ProfileTabs'

// Charts with domain dependencies
export {
  SoftSkillsRadarGrid,
  type SoftSkillsRadarGridProps,
} from './components/charts/SoftSkillsRadarGrid'

// Table components with domain dependencies
export * from './components/table/DataTable'

// NotificationItem type (from moved NotificationPopover)
export type { NotificationItem } from '@app/core/components/notifications'
// UniversityAutocomplete (from moved university components)
export { UniversityAutocomplete } from '@app/core/components/university'

// Hooks with domain dependencies
export { useBreadcrumbs } from './hooks/useBreadcrumbs'
// useUniversitySearch is already exported from standalone package, but we have a domain-specific version
// Export it explicitly to override the standalone version
export {
  useUniversitySearch,
  type UseUniversitySearchOptions,
  type UseUniversitySearchResult,
} from './hooks/useUniversitySearch'

// Re-export config from local (tamagui.config may have domain-specific settings)
// Note: themes/scaffald-theme is already exported from standalone package
export { config } from './tamagui.config'
