/**
 * AccordionItem component
 * Individual item within an accordion
 */

import { createContext, useContext } from 'react'
import { View, StyleSheet, Platform } from 'react-native'
import type { AccordionItemProps, AccordionItemContextValue } from './Accordion.types'
import { useAccordionContext } from './Accordion'
import { useAccordionItem } from './useAccordionItem'
import { colors } from '../../tokens/colors'
import { spacing } from '../../tokens/spacing'
import { borderRadius } from '../../tokens/borders'
import { boxShadows } from '../../tokens/shadows'
import { useThemeContext } from '../../theme'

// AccordionItem context
const AccordionItemContext = createContext<AccordionItemContextValue | null>(null)

export function useAccordionItemContext() {
  const context = useContext(AccordionItemContext)
  if (!context) {
    throw new Error('AccordionItem components must be used within an AccordionItem')
  }
  return context
}

export function AccordionItem({
  value,
  disabled: disabledProp = false,
  children,
  containerStyle,
}: AccordionItemProps) {
  const accordionContext = useAccordionContext()
  const { theme } = useThemeContext()

  const itemContext = useAccordionItem({
    value,
    disabled: disabledProp,
    context: accordionContext,
  })

  // Focus ring style (web only) - applied to entire item, not just trigger
  const focusRing =
    itemContext.isFocused && !itemContext.disabled
      ? Platform.OS === 'web'
        ? { boxShadow: `${boxShadows.focusBase}, ${boxShadows.button}` }
        : {}
      : {}

  return (
    <AccordionItemContext.Provider value={itemContext}>
      <View
        {...itemContext.getRootProps()}
        style={[
          styles.container,
          {
            backgroundColor: colors.bg[theme].default,
            borderColor: colors.border[theme].default,
            ...(Platform.OS === 'web' ? { boxShadow: boxShadows.button } : {}),
            ...focusRing,
          },
          accordionContext.width === 'constrained' && styles.constrained,
          itemContext.disabled && styles.disabled,
          containerStyle,
        ]}
      >
        {children}
      </View>
    </AccordionItemContext.Provider>
  )
}

const styles = StyleSheet.create({
  container: {
    borderWidth: 1,
    borderRadius: borderRadius.m,
    paddingHorizontal: spacing[16],
    paddingVertical: spacing[10],
  },
  constrained: {
    alignSelf: 'stretch', // Maintain consistent width
  },
  disabled: {
    opacity: 0.5,
  },
})
