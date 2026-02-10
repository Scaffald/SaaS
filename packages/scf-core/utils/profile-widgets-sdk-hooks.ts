import { useQuery, type UseQueryOptions } from '@tanstack/react-query'
import { useScaffaldJobsClient } from '@scf/core/provider'

/**
 * Profile Widgets SDK Hooks
 *
 * These hooks support viewing both own profile and other users' profiles
 * by accepting an optional userId parameter.
 *
 * When userId is provided, fetches public profile data for that user.
 * When userId is omitted, fetches authenticated user's profile (including private data).
 */

// ============================================================================
// GENERAL INFO
// ============================================================================

export interface GeneralInfoWidgetData {
  id: string
  username: string | null
  slug: string | null
  avatar_path: string | null
  avatar_url: string | null
  about: string | null
  headline: string | null
  display_name: string | null
  industry_id: string | null
  years_of_experience: number | null
  open_to_work: boolean | null
  calculatedYearsOfExperience: number
  industries?: {
    id: string
    name: string
    slug: string
  } | null
  privateData?: {
    first_name: string | null
    last_name: string | null
    address: string | null
    location: string | null
    email?: string
    phone?: string
  } | null
  idVerificationBadge?: {
    badge_status: string | null
    badge_expires_at: string | null
    verified_at: string | null
  } | null
}

export interface UseGeneralInfoWidgetParams {
  userId?: string
}

/**
 * Get general profile information for widget display
 * Supports viewing own profile (with private data) or other users (public only)
 */
export function useGeneralInfoWidget(
  params?: UseGeneralInfoWidgetParams,
  options?: Omit<UseQueryOptions<GeneralInfoWidgetData, Error>, 'queryKey' | 'queryFn'>
) {
  const client = useScaffaldJobsClient()
  const userId = params?.userId

  return useQuery({
    queryKey: ['profiles', 'widgets', 'general', userId],
    queryFn: async () => {
      if (!client) throw new Error('Missing client')
      return client.profileWidgets.getGeneralInfo(params)
    },
    enabled: !!client && (options?.enabled !== false),
    staleTime: 5 * 60 * 1000, // 5 minutes
    ...options,
  })
}

// ============================================================================
// EXPERIENCE
// ============================================================================

export interface ExperienceWidgetEntry {
  id: string
  user_id: string
  job_title: string
  company_name: string
  start_date: string | null
  end_date: string | null
  is_current: boolean | null
  location: string | null
  employment_type: string | null
  is_remote: boolean | null
  description: string | null
  created_at: string
  updated_at: string
}

export interface UseExperienceWidgetParams {
  userId?: string
}

/**
 * Get work experience for widget display
 */
export function useExperienceWidget(
  params?: UseExperienceWidgetParams,
  options?: Omit<UseQueryOptions<ExperienceWidgetEntry[], Error>, 'queryKey' | 'queryFn'>
) {
  const client = useScaffaldJobsClient()
  const userId = params?.userId

  return useQuery({
    queryKey: ['profiles', 'widgets', 'experience', userId],
    queryFn: async () => {
      if (!client) throw new Error('Missing client')
      return client.profileWidgets.getExperience(params)
    },
    enabled: !!client && (options?.enabled !== false),
    staleTime: 5 * 60 * 1000, // 5 minutes
    ...options,
  })
}

// ============================================================================
// EDUCATION
// ============================================================================

export interface EducationWidgetEntry {
  id: string
  user_id: string
  degree_type: string | null
  field_of_study: string | null
  institution_name: string | null
  start_date: string | null
  end_date: string | null
  is_current: boolean | null
  description: string | null
  location: string | null
  created_at: string
  updated_at: string
}

export interface UseEducationWidgetParams {
  userId?: string
}

/**
 * Get education for widget display
 */
export function useEducationWidget(
  params?: UseEducationWidgetParams,
  options?: Omit<UseQueryOptions<EducationWidgetEntry[], Error>, 'queryKey' | 'queryFn'>
) {
  const client = useScaffaldJobsClient()
  const userId = params?.userId

  return useQuery({
    queryKey: ['profiles', 'widgets', 'education', userId],
    queryFn: async () => {
      if (!client) throw new Error('Missing client')
      return client.profileWidgets.getEducation(params)
    },
    enabled: !!client && (options?.enabled !== false),
    staleTime: 5 * 60 * 1000, // 5 minutes
    ...options,
  })
}

// ============================================================================
// SKILLS
// ============================================================================

export interface SkillWidgetEntry {
  id: string
  taxonomy: 'csi' | 'onet'
  name: string
  label: string
  displayCode: string | null
  proficiency: number
  yearsExperience: number | null
  verified: boolean
  metadata: Record<string, unknown> | null
}

export interface UseSkillsWidgetParams {
  userId?: string
}

/**
 * Get technical skills for widget display (excludes soft skills)
 */
export function useSkillsWidget(
  params?: UseSkillsWidgetParams,
  options?: Omit<UseQueryOptions<SkillWidgetEntry[], Error>, 'queryKey' | 'queryFn'>
) {
  const client = useScaffaldJobsClient()
  const userId = params?.userId

  return useQuery({
    queryKey: ['profiles', 'widgets', 'skills', userId],
    queryFn: async () => {
      if (!client) throw new Error('Missing client')
      return client.profileWidgets.getSkills(params)
    },
    enabled: !!client && (options?.enabled !== false),
    staleTime: 5 * 60 * 1000, // 5 minutes
    ...options,
  })
}

// ============================================================================
// CERTIFICATIONS
// ============================================================================

export interface CertificationWidgetEntry {
  id: string
  user_id: string
  name: string
  issuing_organization: string | null
  issue_date: string | null
  expiration_date: string | null
  credential_id: string | null
  credential_url: string | null
  does_not_expire: boolean | null
  created_at: string
  updated_at: string
}

export interface UseCertificationsWidgetParams {
  userId?: string
}

/**
 * Get certifications for widget display
 */
export function useCertificationsWidget(
  params?: UseCertificationsWidgetParams,
  options?: Omit<UseQueryOptions<CertificationWidgetEntry[], Error>, 'queryKey' | 'queryFn'>
) {
  const client = useScaffaldJobsClient()
  const userId = params?.userId

  return useQuery({
    queryKey: ['profiles', 'widgets', 'certifications', userId],
    queryFn: async () => {
      if (!client) throw new Error('Missing client')
      return client.profileWidgets.getCertifications(params)
    },
    enabled: !!client && (options?.enabled !== false),
    staleTime: 5 * 60 * 1000, // 5 minutes
    ...options,
  })
}

// ============================================================================
// PREFERENCES (Own Profile Only)
// ============================================================================

export interface PreferencesWidgetData {
  availability?: string | null
  preferred_work_locations?: string[] | null
  open_to_travel?: boolean | null
  travel_distance_miles?: number | null
  career_level?: string | null
  hourly_rate_cents?: number | null
  us_resident?: boolean | null
  us_passport?: boolean | null
  authorized_countries?: string[] | null
  veteran?: boolean | null
  military_status?: string | null
  drivers_license_classes?: string[] | null
}

/**
 * Get work preferences for widget display
 * Only works for authenticated user's own profile
 */
export function usePreferencesWidget(
  options?: Omit<UseQueryOptions<PreferencesWidgetData, Error>, 'queryKey' | 'queryFn'>
) {
  const client = useScaffaldJobsClient()

  return useQuery({
    queryKey: ['profiles', 'widgets', 'preferences'],
    queryFn: async () => {
      if (!client) throw new Error('Missing client')
      return client.profileWidgets.getPreferences()
    },
    enabled: !!client && (options?.enabled !== false),
    staleTime: 5 * 60 * 1000, // 5 minutes
    ...options,
  })
}
