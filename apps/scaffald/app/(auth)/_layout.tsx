import { Slot } from 'expo-router'

/**
 * Auth Layout — guest-only route group.
 *
 * Contains login, verify, terms, privacy, callback, and confirm routes.
 * The auth/_layout.tsx inside this group handles the actual redirect-away-if-logged-in logic
 * via useProtectedRoute().
 */
export default function AuthGroupLayout() {
  return <Slot />
}
