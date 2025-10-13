// Re-export types and functions for backward compatibility
export type { DrawerItemConfig, DrawerSectionConfig, DrawerContentProps } from './types'
export { drawerSections } from './config'
export { normalizePath } from './utils'
export { DrawerFooter } from './DrawerFooter'
export { DrawerLayout } from './DrawerLayout'

// Re-export drawer components from DrawerMenu.tsx to avoid circular dependency
export { UnifiedDrawer, DrawerMenu, StaticDrawer } from './DrawerMenu'
export type { UnifiedDrawerProps } from './DrawerMenu'

// Default export for backward compatibility
export { DrawerMenu as default } from './DrawerMenu'
