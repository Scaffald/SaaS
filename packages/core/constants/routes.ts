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
