/**
 * Application route constants
 * Centralized route management to avoid hardcoded strings throughout the app
 */

export const ROUTES = {
  // Authentication routes
  LOGIN: '/login',
  RESET_PASSWORD: '/reset-password',

  // Public routes
  HOME: '/',
  USER_PROFILE: '/user',

  // Protected routes
  ONBOARDING: '/onboarding',
  DISCOVER: '/discover',
  SETTINGS: '/settings',
  PROFILE: '/profile',
  PROFILE_OVERVIEW: '/profile/overview',
  PROFILE_BASIC_INFO: '/profile/basic-info',
  PROFILE_WORK_SKILLS: '/profile/work-skills',
  PROFILE_TRAVEL_COMPLIANCE: '/profile/travel-compliance',
  PROFILE_CONTACT_AVAILABILITY: '/profile/contact-availability',
  ORGANIZATIONS: '/organizations',
} as const

// Legacy route mappings for backward compatibility during migration
export const LEGACY_ROUTES = {
  SIGN_IN: '/sign-in',
  SIGN_UP: '/sign-up',
} as const

// Route type for TypeScript safety
export type AppRoute = (typeof ROUTES)[keyof typeof ROUTES]

// Helper function to build routes with query parameters
export const buildRoute = (route: AppRoute, params?: Record<string, string>) => {
  if (!params) return route

  const searchParams = new URLSearchParams(params)
  return `${route}?${searchParams.toString()}`
}
