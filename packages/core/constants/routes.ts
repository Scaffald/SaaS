/**
 * Application route constants
 * Centralized route management to avoid hardcoded strings throughout the app
 */

export const ROUTES = {
  // Authentication routes
  LOGIN: '/auth/login',
  SIGN_IN: '/auth/sign-in',
  ONBOARDING: '/auth/onboarding',
  RESET_PASSWORD: '/auth/reset-password',

  // Public routes
  HOME: '/',
  USER_PROFILE: '/user',

  // Protected routes (dashboard context)
  DASHBOARD: '/dashboard',
  DISCOVER: '/dashboard/discover',
  COMMUNITY: '/dashboard/community',
  COMMUNITY_REVIEWS: '/dashboard/community/reviews',
  SETTINGS: '/dashboard/settings',
  SETTINGS_GENERAL: '/dashboard/settings/general',
  SETTINGS_CHANGE_PASSWORD: '/dashboard/settings/change-password',
  SETTINGS_CHANGE_EMAIL: '/dashboard/settings/change-email',
  PROFILE: '/dashboard/profile',
  PROFILE_OVERVIEW: '/dashboard/profile/overview',
  PROFILE_BASIC_INFO: '/dashboard/profile/basic-info',
  PROFILE_WORK_SKILLS: '/dashboard/profile/work-skills',
  PROFILE_TRAVEL_COMPLIANCE: '/dashboard/profile/travel-compliance',
  PROFILE_CONTACT_AVAILABILITY: '/dashboard/profile/contact-availability',
  ORGANIZATIONS: '/dashboard/organizations',
  ORGANIZATIONS_NEW: '/dashboard/organizations/new',
} as const

// Legacy route mappings for backward compatibility during migration
export const LEGACY_ROUTES = {
  // Old auth routes without prefix
  OLD_LOGIN: '/login',
  OLD_SIGN_IN: '/sign-in',
  OLD_ONBOARDING: '/onboarding',
  OLD_RESET_PASSWORD: '/reset-password',
} as const

// Route type for TypeScript safety
export type AppRoute = (typeof ROUTES)[keyof typeof ROUTES]

// Helper function to build routes with query parameters
export const buildRoute = (route: AppRoute, params?: Record<string, string>) => {
  if (!params) return route

  const searchParams = new URLSearchParams(params)
  return `${route}?${searchParams.toString()}`
}
