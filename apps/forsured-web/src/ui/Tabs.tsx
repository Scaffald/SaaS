import { useState } from 'react'
import { Tabs as BeyondUITabs, Chip, colors, spacing } from '@scaffald/ui'
import type { ReactNode } from 'react'

/**
 * Tab configuration interface for Tabs component
 */
export interface TabConfig {
  id: string
  label: string
  content: ReactNode
  disabled?: boolean
  badge?: string | number
  icon?: React.ComponentType<{ size?: number; color?: string }>
}

/**
 * Tabs component props (compatible with TabsCustom API)
 */
export interface TabsProps {
  /** Array of tab configurations */
  tabs: TabConfig[]
  /** Default active tab ID (uncontrolled mode) */
  defaultTab?: string
  /** Active tab ID (controlled mode) */
  activeTab?: string
  /** Callback when tab changes */
  onChange?: (tabId: string) => void
  /** Visual variant style */
  variant?: 'line' | 'pill' | 'enclosed'
}

/**
 * Tabs - Customizable tabs component with three visual variants
 *
 * A flexible tabs component supporting both controlled and uncontrolled modes,
 * with three visual variants (line, pill, enclosed) and support for icons,
 * badges, and disabled states.
 */
function Tabs({
  tabs,
  defaultTab,
  activeTab: controlledActiveTab,
  onChange,
  variant = 'line',
}: TabsProps) {
  const [internalActiveTab, setInternalActiveTab] = useState(defaultTab || tabs[0]?.id)
  
  // Support controlled mode when activeTab prop is provided
  const activeTab = controlledActiveTab !== undefined ? controlledActiveTab : internalActiveTab

  const handleTabChange = (tabId: string) => {
    setInternalActiveTab(tabId)
    onChange?.(tabId)
  }

  // Map variant to Beyond UI type
  const type = variant === 'pill' ? 'default' : variant === 'enclosed' ? 'default' : 'line'

  return (
    <BeyondUITabs
      value={activeTab}
      onValueChange={handleTabChange}
      type={type}
      color="primary"
    >
      {tabs.map((tab) => (
        <BeyondUITabs.Item key={tab.id} value={tab.id} disabled={tab.disabled}>
          <BeyondUITabs.Trigger>
            {tab.icon && <tab.icon size={16} color={colors.text.light.secondary} />}
            {tab.label}
            {tab.badge && (
              <Chip
                size="xs"
                color="gray"
                variant="outline"
                style={{ marginLeft: spacing[8] }}
              >
                {tab.badge}
              </Chip>
            )}
          </BeyondUITabs.Trigger>
          <BeyondUITabs.Content>{tab.content}</BeyondUITabs.Content>
        </BeyondUITabs.Item>
      ))}
    </BeyondUITabs>
  )
}

export { Tabs }
export default Tabs
