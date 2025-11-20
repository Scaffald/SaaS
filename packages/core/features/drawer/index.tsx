// Re-export types and functions for backward compatibility
export type { DrawerItemConfig, DrawerSectionConfig } from './types'
export type { DrawerContentProps } from './DrawerContent'
export { normalizePath } from './utils'
export { DrawerLayout } from './DrawerLayout'
export { UserMenuAvatar } from './UserMenuAvatar'

// Re-export drawer component
export { DrawerContent } from './DrawerContent'

// Default export for backward compatibility
export { DrawerContent as default } from './DrawerContent'
