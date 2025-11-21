import type { ComponentProps, ReactNode } from 'react'
import { ScrollView, styled, Tabs } from 'tamagui'

export type TabGroupProps = {
  /** Current active tab value */
  value: string
  /** Callback when tab changes */
  onValueChange: (value: string) => void
  /** Tab items to render */
  children: ReactNode
  /** Optional aria-label for accessibility */
  ariaLabel?: string
  /** Whether to show border around tab list */
  bordered?: boolean
  /** Whether to enable horizontal scrolling on small screens */
  scrollable?: boolean
  /** Custom className */
  className?: string
} & Omit<ComponentProps<typeof Tabs>, 'value' | 'onValueChange' | 'children'>

/**
 * TabGroup - Styled tab navigation component
 *
 * A proper tab group with underline indicators and smooth transitions.
 * Built on Tamagui's Tabs component with Scaffald design system styling.
 */
export const TabGroup = ({
  value,
  onValueChange,
  children,
  ariaLabel,
  bordered = true,
  scrollable = false,
  ...props
}: TabGroupProps) => {
  return (
    <Tabs
      value={value}
      onValueChange={onValueChange}
      activationMode="manual"
      flexDirection="column"
      {...props}
    >
      <TabList bordered={bordered} scrollable={scrollable} aria-label={ariaLabel}>
        {scrollable ? (
          <ScrollView horizontal showsHorizontalScrollIndicator={false}>
            {children}
          </ScrollView>
        ) : (
          children
        )}
      </TabList>
    </Tabs>
  )
}

/**
 * TabList - Styled container for tabs
 * Features border, background, and proper spacing
 */
const TabList = styled(Tabs.List, {
  name: 'TabList',
  rounded: '$4',
  flexWrap: 'wrap',

  variants: {
    bordered: {
      true: {
        borderWidth: 1,
        borderColor: '$borderColor',
      },
      false: {
        borderWidth: 0,
        borderColor: 'transparent',
        bg: 'transparent',
      },
    },
    scrollable: {
      true: {
        overflow: 'hidden',
        flexWrap: 'nowrap',
      },
      false: {
        overflow: 'visible',
        flexWrap: 'wrap',
      },
    },
  } as const,

  defaultVariants: {
    bordered: true,
    scrollable: false,
  },
})

TabList.defaultProps = {
  bordered: true,
  scrollable: false,
}
