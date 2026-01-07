/**
 * AccordionItem component
 * Individual item within an accordion
 */

import { createContext, useContext } from 'react'
import { View, StyleSheet } from 'react-native'
import type {
  AccordionItemProps,
  AccordionItemContextValue,
} from './Accordion.types'
import { useAccordionContext } from './Accordion'
import { colors } from '../../tokens/colors'
import { spacing } from '../../tokens/spacing'
import { borderRadius } from '../../tokens/borders'
import { boxShadows } from '../../tokens/shadows'
import { useThemeContext } from '../../playground/ThemeProvider'

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

  // Check if this item is expanded
  const isExpanded = Array.isArray(accordionContext.value)
    ? accordionContext.value.includes(value)
    : accordionContext.value === value

  // Item is disabled if parent is disabled or if explicitly disabled
  const disabled = accordionContext.disabled || disabledProp

  const contextValue: AccordionItemContextValue = {
    isExpanded,
    disabled,
    value,
  }

  return (
    <AccordionItemContext.Provider value={contextValue}>
      <View
        style={[
          styles.container,
          {
            backgroundColor: colors.bg[theme].default,
            borderColor: colors.border[theme].default,
            ...boxShadows.buttonShadow,
          },
          disabled && styles.disabled,
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
  disabled: {
    opacity: 0.5,
  },
})
