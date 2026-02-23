/**
 * Tabs compound component exports
 */

import { Tabs as TabsRoot } from './Tabs'
import { TabItem } from './TabItem'
import { TabTrigger } from './TabTrigger'
import { TabContent } from './TabContent'

export const Tabs = Object.assign(TabsRoot, {
  Item: TabItem,
  Trigger: TabTrigger,
  Content: TabContent,
})

export { useTabs } from './useTabs'
export { useTabItem } from './useTabItem'

export type { UseTabsProps } from './useTabs'
export type { UseTabItemProps } from './useTabItem'

export type {
  TabsProps,
  TabItemProps,
  TabTriggerProps,
  TabContentProps,
  TabType,
  TabColor,
  TabSize,
  TabOrientation,
  TabState,
  TabContentVariant,
} from './Tabs.types'

