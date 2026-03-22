import { Slot } from 'expo-router'

/**
 * Public Layout — no auth required.
 * Routes here are accessible to anyone (public profiles, public job pages, invitation links).
 */
export default function PublicLayout() {
  return <Slot />
}
