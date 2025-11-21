import type { ComponentProps, ReactNode } from 'react'
import { Link } from 'expo-router'
import { styled, Tabs, Text, useTabsContext, XStack, YStack } from 'tamagui'

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

  const content = (
    <Tabs.Tab
      value={value}
      disabled={disabled}
      position="relative"
      paddingVertical="$2"
      paddingHorizontal="$4"
      minHeight="$2"
      bg="$color2"
      borderWidth={1}
      borderColor="$color4"
      cursor={disabled ? 'not-allowed' : 'pointer'}
      hoverStyle={{
        bg: '$blue3',
      }}
      pressStyle={{
        bg: '$blue3',
        scale: 0.98,
      }}
      disabledStyle={{
        opacity: 0.5,
        cursor: 'not-allowed',
      }}
      {...props}
    >
      <XStack gap="$2" items="center" justify="center">
        {children || (
          <Text
            fontSize="$3"
            fontWeight={isActive ? '600' : '500'}
            color={isActive ? '$color12' : '$color10'}
          >
            {label}
          </Text>
        )}
        {badge !== undefined && (
          <TabBadge active={isActive}>{typeof badge === 'number' ? badge : badge}</TabBadge>
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
 */
const TabBadge = styled(YStack, {
  name: 'TabBadge',
  px: '$2',
  py: '$1',
  rounded: '$10',
  width: 20,
  items: 'center',
  justify: 'center',

  variants: {
    active: {
      true: {
        bg: '$color5',
      },
      false: {
        bg: '$color4',
      },
    },
  } as const,

  defaultVariants: {
    active: false,
  },
})
