/**
 * Accessibility module for Beyond UI
 *
 * Provides hooks and components for building accessible interfaces
 * that meet WCAG 2.1 AAA guidelines.
 *
 * @example
 * ```tsx
 * import {
 *   useFocusTrap,
 *   useRovingTabIndex,
 *   useAnnouncer,
 *   useFocusRing,
 *   useId,
 *   VisuallyHidden,
 *   LiveRegion,
 *   SkipLink,
 * } from '@scaffald/ui'
 *
 * // Focus trap for modal
 * function Modal({ visible, children }) {
 *   const containerRef = useRef(null)
 *   useFocusTrap(containerRef, { enabled: visible })
 *   return <View ref={containerRef}>{children}</View>
 * }
 *
 * // Roving tabindex for tabs
 * function TabList({ tabs }) {
 *   const { getItemProps } = useRovingTabIndex({
 *     items: tabs.length,
 *     orientation: 'horizontal',
 *   })
 *   return tabs.map((tab, i) => (
 *     <Tab {...getItemProps(i)}>{tab.label}</Tab>
 *   ))
 * }
 *
 * // Screen reader announcements
 * function SaveButton() {
 *   const { announce } = useAnnouncer()
 *   return (
 *     <Button onPress={() => announce('Saved!')}>
 *       Save
 *     </Button>
 *   )
 * }
 * ```
 */

// Types
export type {
  AriaLive,
  AriaAtomic,
  AriaRelevant,
  FocusableElement,
  FocusTrapConfig,
  RovingTabIndexConfig,
  NavigationKey,
  AccessibilityRole,
  AccessibilityState,
  AccessibilityProps,
} from './types'

// ID generation
export { useId, useIds } from './useId'

// Focus management
export { useFocusTrap, type UseFocusTrapReturn } from './useFocusTrap'
export {
  useRovingTabIndex,
  type UseRovingTabIndexOptions,
  type UseRovingTabIndexReturn,
  type RovingItemProps,
} from './useRovingTabIndex'
export {
  useFocusRing,
  getFocusRingStyles,
  type UseFocusRingOptions,
  type UseFocusRingReturn,
  type FocusRingVariant,
  type FocusRingSize,
  type FocusProps,
} from './useFocusRing'

// Announcements
export {
  useAnnouncer,
  AnnouncerProvider,
  type AnnouncerContextValue,
  type AnnouncerProviderProps,
  type Announcement,
} from './useAnnouncer'

// Components
export { VisuallyHidden, type VisuallyHiddenProps } from './VisuallyHidden'
export { LiveRegion, type LiveRegionProps } from './LiveRegion'
export { SkipLink, type SkipLinkProps } from './SkipLink'
export { FocusGuard, type FocusGuardProps } from './FocusGuard'
