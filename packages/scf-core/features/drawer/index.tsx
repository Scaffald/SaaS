// Re-export types and functions for backward compatibility

export type { DrawerContentProps } from './DrawerContent'
// Re-export drawer component
// Default export for backward compatibility
export { DrawerContent, DrawerContent as default } from './DrawerContent'
export { DrawerLayout } from './DrawerLayout'
export type { DrawerItemConfig } from './types'
export { SectionTabs } from './SectionTabs'
export { getSectionTabs, type SectionTabStrip } from './section-tabs'
export { normalizePath } from './utils'
