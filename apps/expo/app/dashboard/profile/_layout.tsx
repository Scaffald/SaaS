import { Slot } from 'expo-router'

/**
 * Profile Layout Wrapper
 * All /dashboard/profile routes are automatically wrapped with ProfileLayout via individual pages
 * This _layout.tsx ensures proper routing structure for nested profile routes
 * Tabs are rendered by ProfileLayout component itself
 */
export default function ProfileLayoutWrapper() {
  return <Slot />
}
