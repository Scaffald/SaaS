import { createContext, useContext } from 'react'
import type { ComponentProps, ReactNode } from 'react'
import { ScrollView, styled, Tabs } from 'tamagui'

export type TabGroupVariant = 'default' | 'underlined'

const TabGroupVariantContext = createContext<TabGroupVariant>('default')

export const useTabGroupVariant = () => useContext(TabGroupVariantContext)

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
  /** Visual style variant */
  variant?: TabGroupVariant
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
  variant = 'default',
  ...props
}: TabGroupProps) => {
  const resolvedBordered = variant === 'underlined' ? false : bordered

  const tabListProps = {
    bordered: resolvedBordered,
    scrollable,
    variant,
    'aria-label': ariaLabel,
  } as const

  return (
    <TabGroupVariantContext.Provider value={variant}>
      <Tabs
        value={value}
        onValueChange={onValueChange}
        activationMode="manual"
        flexDirection="column"
        {...props}
      >
        {(() => {
          const TabListComponent = BaseTabList as unknown as React.ComponentType<{
            children: ReactNode
            bordered: boolean
            scrollable: boolean
            variant: TabGroupVariant
            'aria-label'?: string
          }>
          return (
            <TabListComponent {...tabListProps}>
              {scrollable ? (
                <ScrollView horizontal showsHorizontalScrollIndicator={false}>
                  {children}
                </ScrollView>
              ) : (
                children
              )}
            </TabListComponent>
          )
        })()}
      </Tabs>
    </TabGroupVariantContext.Provider>
  )
}

/**
 * TabList - Styled container for tabs
 * Features border, background, and proper spacing
 */
const BaseTabListStyled = styled(Tabs.List, {
  name: 'TabList',
  borderRadius: '$4',
  flexWrap: 'wrap',

  variants: {
    variant: {
      default: {
        backgroundColor: '$color2',
        gap: '$1',
      },
      underlined: {
        borderRadius: 0,
        borderWidth: 0,
        backgroundColor: 'transparent',
        gap: '$3',
        paddingHorizontal: 0,
      },
    },
    bordered: {
      true: {
        borderWidth: 1,
        borderColor: '$borderColor',
      },
      false: {
        borderWidth: 0,
        borderColor: 'transparent',
        backgroundColor: 'transparent',
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
    variant: 'default',
    bordered: true,
    scrollable: false,
  },
})

// Type-safe wrapper for BaseTabListStyled that accepts ReactNode children
const BaseTabList = BaseTabListStyled as unknown as React.ComponentType<
  Omit<ComponentProps<typeof BaseTabListStyled>, 'children'> & { children?: ReactNode }
>
