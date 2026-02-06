import type { ComponentProps, ReactNode } from 'react'
import { Link } from 'expo-router'
import { styled } from '@tamagui/core'
import { Tabs, Text, useTabsContext, XStack, YStack } from 'tamagui'
import { useTabGroupVariant } from './TabGroup'

export type TabProps = {
  /** Unique value for this tab */
  value: string
  /** Label text to display */
  label: string
  /** Optional href for navigation (creates a Link) */
  href?: string
  /** Optional badge text/count to display */
  badge?: string | number
  /** Content to render inside the tab */
  children?: ReactNode
  /** Whether this tab is disabled */
  disabled?: boolean
} & Omit<ComponentProps<typeof Tabs.Tab>, 'value' | 'children'>

/**
 * Tab - Individual tab component with styled indicator
 *
 * Features:
 * - Smooth underline indicator animation
 * - Badge support for counts/notifications
 * - Link support for navigation-based tabs
 * - Proper active/inactive states
 */
export const Tab = ({ value, label, href, badge, children, disabled, ...props }: TabProps) => {
  const tabsContext = useTabsContext()
  const isActive = tabsContext.value === value
  const variant = useTabGroupVariant()
  const isUnderlined = variant === 'underlined'

  const textColor = isUnderlined
    ? isActive
      ? '$blue9'
      : '$color10'
    : isActive
      ? '$color12'
      : '$color10'

  const content = (
    <Tabs.Tab
      value={value}
      disabled={disabled}
      py="$2"
      px="$4"
      background={isUnderlined ? 'transparent' : '$color2'}
      borderWidth={isUnderlined ? 0 : 1}
      borderColor={isUnderlined ? 'transparent' : '$color4'}
      borderBottomWidth={isUnderlined ? 2 : undefined}
      borderBottomColor={isUnderlined ? (isActive ? '$blue9' : 'transparent') : undefined}
      cursor={disabled ? 'not-allowed' : 'pointer'}
      style={{ position: 'relative', minHeight: '$2' }}
      hoverStyle={
        isUnderlined
          ? { borderBottomColor: '$yellow9', background: 'transparent' }
          : { background: '$blue3' }
      }
      pressStyle={
        isUnderlined
          ? {
              background: 'transparent',
              borderBottomColor: '$blue9',
            }
          : {
              background: '$blue3',
              scale: 0.98,
            }
      }
      disabledStyle={{
        opacity: 0.5,
        cursor: 'not-allowed',
      }}
      {...props}
    >
      <XStack gap="$2" style={{ alignItems: 'center', justifyContent: 'center' }}>
        {children || (
          <Text fontSize="$3" fontWeight={isActive ? '600' : '500'} color={textColor}>
            {label}
          </Text>
        )}
        {badge !== undefined && (
          <YStack
            px="$2"
            py="$1"
            width={20}
            style={{ alignItems: 'center', justifyContent: 'center', borderRadius: 40 }}
            background={isActive ? '$color5' : '$color4'}
          >
            <Text fontSize="$2" fontWeight="600">
              {badge}
            </Text>
          </YStack>
        )}
      </XStack>
    </Tabs.Tab>
  )

  // If href is provided, wrap in Link for navigation
  if (href && !disabled) {
    return (
      <Link href={href} asChild>
        {content}
      </Link>
    )
  }

  return content
}

/**
 * TabBadge - Badge component for tab counts/notifications
 * Currently unused but kept for future badge enhancements
 */
const _TabBadge = styled(YStack, {
  name: 'TabBadge',
  px: '$2',
  py: '$1',
  width: 20,

  variants: {
    active: {
      true: {
        backgroundColor: '$color5',
      },
      false: {
        backgroundColor: '$color4',
      },
    },
  } as const,

  defaultVariants: {
    active: false,
  },
})
