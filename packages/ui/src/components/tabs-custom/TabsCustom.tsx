import type { ComponentProps, ReactNode } from 'react'
import type { GetThemeValueForKey } from '@tamagui/core'
import type { XStackProps } from '@tamagui/stacks'
import { YStack, XStack } from '@tamagui/stacks'
import { Text } from 'tamagui'
import { useTheme } from '@tamagui/core'
import { useState } from 'react'

import { Chip } from '../chips'

/**
 * Tab configuration interface for TabsCustom component
 */
export interface TabConfig {
  id: string
  label: string
  content: ReactNode
  icon?: React.ComponentType<{ size?: number; color?: string }>
  disabled?: boolean
  badge?: string | number
}

/**
 * TabsCustom component props
 */
export interface TabsCustomProps {
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
 * Get TabsList container styles based on variant
 */
const getTabsListStyles = (variant: 'line' | 'pill' | 'enclosed') => {
  const baseStyles = {
    gap: '$1',
  }

  if (variant === 'line') {
    return {
      ...baseStyles,
      borderBottomWidth: 1,
      borderBottomColor: '$borderColor',
    }
  }

  if (variant === 'pill') {
    return {
      ...baseStyles,
      backgroundColor: '$backgroundSecondary',
      padding: '$1',
      borderRadius: 16,
    } as unknown as XStackProps
  }

  // enclosed
  return {
    ...baseStyles,
    borderBottomWidth: 1,
    borderBottomColor: '$borderColor',
  }
}

/**
 * TabsCustom - Customizable tabs component with three visual variants
 *
 * A flexible tabs component supporting both controlled and uncontrolled modes,
 * with three visual variants (line, pill, enclosed) and support for icons,
 * badges, and disabled states.
 *
 * Variants:
 * - line: Underline indicator for active tab (default)
 * - pill: Rounded pill-style with filled background for active tab
 * - enclosed: Tab-like appearance with borders
 *
 * Features:
 * - Controlled and uncontrolled modes
 * - Icons with contextual coloring
 * - Badge indicators
 * - Disabled state support
 * - Smooth transitions between tabs
 *
 * @example
 * ```tsx
 * // Uncontrolled tabs with line variant
 * <TabsCustom
 *   tabs={[
 *     { id: 'tab1', label: 'Overview', content: <Overview /> },
 *     { id: 'tab2', label: 'Details', content: <Details />, badge: 3 },
 *   ]}
 *   defaultTab="tab1"
 *   variant="line"
 * />
 *
 * // Controlled tabs with pill variant
 * const [activeTab, setActiveTab] = useState('tab1')
 * <TabsCustom
 *   tabs={tabs}
 *   activeTab={activeTab}
 *   onChange={setActiveTab}
 *   variant="pill"
 * />
 *
 * // Tabs with icons
 * <TabsCustom
 *   tabs={[
 *     { id: 'home', label: 'Home', content: <Home />, icon: HomeIcon },
 *     { id: 'settings', label: 'Settings', content: <Settings />, icon: SettingsIcon },
 *   ]}
 *   variant="enclosed"
 * />
 * ```
 */
export function TabsCustom({
  tabs,
  defaultTab,
  activeTab: controlledActiveTab,
  onChange,
  variant = 'line',
}: TabsCustomProps) {
  const [internalActiveTab, setInternalActiveTab] = useState(defaultTab || tabs[0]?.id)
  const theme = useTheme()

  // Support controlled mode when activeTab prop is provided
  const activeTab = controlledActiveTab !== undefined ? controlledActiveTab : internalActiveTab

  const handleTabChange = (tabId: string) => {
    setInternalActiveTab(tabId)
    onChange?.(tabId)
  }

  const activeTabContent = tabs.find((tab) => tab.id === activeTab)?.content

  // Compute button styles based on variant and active state
  const getTabButtonProps = (
    isActive: boolean,
    tabVariant: 'line' | 'pill' | 'enclosed',
    isDisabled?: boolean
  ): XStackProps => {
    const baseStyle = { alignItems: 'center' as const }

    if (tabVariant === 'line') {
      return {
        px: '$4',
        py: '$2',
        cursor: isDisabled ? 'not-allowed' : 'pointer',
        gap: '$2',
        opacity: isDisabled ? 0.5 : 1,
        pressStyle: { opacity: isDisabled ? 0.5 : 0.8 },
        borderBottomWidth: 2,
        borderBottomColor: (isActive ? (theme.primary9?.val ?? '#0ea5e9') : 'transparent') as GetThemeValueForKey<'borderBottomColor'>,
        style: { ...baseStyle, borderRadius: 0 },
        hoverStyle: {
          borderBottomColor: (isActive ? (theme.primary9?.val ?? '') : (theme.borderColorHover?.val ?? '')) as GetThemeValueForKey<'borderBottomColor'>,
        },
      } as unknown as XStackProps
    }

    if (tabVariant === 'pill') {
      return {
        px: '$4',
        py: '$2',
        cursor: isDisabled ? 'not-allowed' : 'pointer',
        gap: '$2',
        opacity: isDisabled ? 0.5 : 1,
        pressStyle: { opacity: isDisabled ? 0.5 : 0.8 },
        backgroundColor: isActive ? (theme.primary9?.val ?? '#0ea5e9') : 'transparent',
        shadowColor: isActive ? theme.shadowColor?.val : undefined,
        shadowRadius: isActive ? 2 : 0,
        shadowOffset: isActive ? { width: 0, height: 1 } : undefined,
        style: { ...baseStyle, borderRadius: 12 },
        hoverStyle: {
          backgroundColor: isActive
            ? theme.primary9?.val
            : (theme.backgroundTertiary?.val ?? '#f3f4f6'),
        },
      } as unknown as XStackProps
    }

    // enclosed variant
    return {
      px: '$4',
      py: '$2',
      cursor: isDisabled ? 'not-allowed' : 'pointer',
      gap: '$2',
      opacity: isDisabled ? 0.5 : 1,
      pressStyle: { opacity: isDisabled ? 0.5 : 0.8 },
      borderWidth: 1,
      borderColor: isActive ? theme.borderColor?.val : 'transparent',
      borderBottomColor: isActive ? theme.background?.val : undefined,
      marginBottom: -1,
      backgroundColor: isActive ? theme.background?.val : 'transparent',
      style: { ...baseStyle, borderTopLeftRadius: 16, borderTopRightRadius: 16 },
      hoverStyle: {
        borderColor: theme.borderColorHover?.val,
      },
    } as unknown as XStackProps
  }

  return (
    <YStack>
      <XStack {...getTabsListStyles(variant)}>
        {tabs.map((tab) => {
          const Icon = tab.icon
          const isActive = activeTab === tab.id
          const buttonProps = getTabButtonProps(isActive, variant, tab.disabled)

          return (
            <XStack
              key={tab.id}
              onPress={() => !tab.disabled && handleTabChange(tab.id)}
              {...buttonProps}
            >
              {Icon && (
                <Icon
                  size={16}
                  color={
                    isActive
                      ? variant === 'pill'
                        ? (theme.color1?.val ?? '#fff')
                        : (theme.primary11?.val ?? '#0ea5e9')
                      : (theme.color10?.val ?? '#6b7280')
                  }
                />
              )}
              <Text
                color={
                  isActive
                    ? variant === 'pill'
                      ? (theme.color1?.val ?? '#fff')
                      : (theme.primary11?.val ?? '#0ea5e9')
                    : (theme.color10?.val ?? '#6b7280')
                }
              >
                {tab.label}
              </Text>
              {tab.badge && (
                <Chip
                  background={
                    isActive && variant === 'pill'
                      ? 'rgba(255, 255, 255, 0.2)'
                      : (theme.backgroundTertiary?.val ?? '#f3f4f6')
                  }
                  color={
                    (isActive && variant === 'pill'
                      ? (theme.color1?.val ?? '#fff')
                      : (theme.color11?.val ?? '#374151')) as GetThemeValueForKey<'color'>
                  }
                  fontSize="$2"
                  px="$2"
                  py="$1"
                >
                  {tab.badge}
                </Chip>
              )}
            </XStack>
          )
        })}
      </XStack>
      <YStack mt="$4">{activeTabContent}</YStack>
    </YStack>
  )
}
