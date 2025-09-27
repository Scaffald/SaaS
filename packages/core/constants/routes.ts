/**
 * Application route constants
 * Centralized route management to avoid hardcoded strings throughout the app
 */

export const ROUTES = {
  // Authentication routes
  AUTH: '/auth',
  WELCOME: '/auth/welcome',
  CONFIRM: '/auth/confirm',

  // Public routes
  HOME: '/',
  USER_PROFILE: '/user',
  STYLEGUIDE: '/styleguide',
  STYLEGUIDE_TYPOGRAPHY: '/styleguide/typography',
  STYLEGUIDE_BUTTONS: '/styleguide/buttons',
  STYLEGUIDE_FORMS: '/styleguide/forms',
  STYLEGUIDE_DATA_DISPLAY: '/styleguide/data-display',
  STYLEGUIDE_INTERACTIVE: '/styleguide/interactive',
  STYLEGUIDE_LAYOUT: '/styleguide/layout',

  // Protected routes (dashboard context)
  DASHBOARD: '/dashboard',
  WORKERS_MAP: '/dashboard/workers/map',
  COMMUNITY: '/dashboard/community',
  COMMUNITY_REVIEWS: '/dashboard/community/reviews',
  SETTINGS: '/dashboard/settings',
  SETTINGS_GENERAL: '/dashboard/settings/general',
  SETTINGS_SECURITY: '/dashboard/settings/security',
  SETTINGS_AUTHENTICATION: '/dashboard/settings/authentication',
  PROFILE: '/dashboard/profile',
  PROFILE_OVERVIEW: '/dashboard/profile/overview',
  PROFILE_GENERAL: '/dashboard/profile/general',
  PROFILE_SKILLS: '/dashboard/profile/skills',
  PROFILE_PREFERENCES: '/dashboard/profile/preferences',
  PROFILE_CONTACT: '/dashboard/profile/contact',
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

  // Previous auth routes (before consolidation)
  OLD_AUTH_LOGIN: '/auth/login',
  OLD_AUTH_SIGN_IN: '/auth/sign-in',
  OLD_AUTH_ONBOARDING: '/auth/onboarding',
  OLD_AUTH_RESET_PASSWORD: '/auth/reset-password',

  // Old profile routes with previous naming
  OLD_PROFILE_BASIC_INFO: '/dashboard/profile/basic-info',
  OLD_PROFILE_WORK_SKILLS: '/dashboard/profile/work-skills',
  OLD_PROFILE_TRAVEL_COMPLIANCE: '/dashboard/profile/travel-compliance',
  OLD_PROFILE_CONTACT_AVAILABILITY: '/dashboard/profile/contact-availability',

  // Old settings routes with previous naming
  OLD_SETTINGS_CHANGE_PASSWORD: '/dashboard/settings/change-password',
  OLD_SETTINGS_CHANGE_EMAIL: '/dashboard/settings/change-email',

  // Old discover route
  OLD_DISCOVER: '/dashboard/discover',
} as const

// Route type for TypeScript safety
export type AppRoute = (typeof ROUTES)[keyof typeof ROUTES]

// Helper function to build routes with query parameters
export const buildRoute = (route: AppRoute, params?: Record<string, string>) => {
  if (!params) return route

  const searchParams = new URLSearchParams(params)
  return `${route}?${searchParams.toString()}`
}
