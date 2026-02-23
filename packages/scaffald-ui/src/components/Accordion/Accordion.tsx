/**
 * Accordion component
 * Compound component for creating collapsible accordion menus
 *
 * @example
 * ```tsx
 * import { Accordion } from '@scaffald/ui'
 *
 * // Single mode - only one item open at a time
 * <Accordion mode="single">
 *   <Accordion.Item value="item1">
 *     <Accordion.Trigger>Section 1</Accordion.Trigger>
 *     <Accordion.Content>Content 1</Accordion.Content>
 *   </Accordion.Item>
 *   <Accordion.Item value="item2">
 *     <Accordion.Trigger icon={<Icon />} hintMessage="2 issues">
 *       Section 2
 *     </Accordion.Trigger>
 *     <Accordion.Content>Content 2</Accordion.Content>
 *   </Accordion.Item>
 * </Accordion>
 *
 * // Multiple mode - many items can be open
 * <Accordion mode="multiple" defaultValue={['item1', 'item2']}>
 *   <Accordion.Item value="item1">
 *     <Accordion.Trigger>Section 1</Accordion.Trigger>
 *     <Accordion.Content>Content 1</Accordion.Content>
 *   </Accordion.Item>
 * </Accordion>
 * ```
 */

import { createContext, useContext } from 'react'
import { View, StyleSheet } from 'react-native'
import type { AccordionProps, AccordionContextValue } from './Accordion.types'
import { spacing } from '../../tokens/spacing'
import { useAccordion } from './useAccordion'

// Accordion context
const AccordionContext = createContext<AccordionContextValue | null>(null)

export function useAccordionContext() {
  const context = useContext(AccordionContext)
  if (!context) {
    throw new Error('Accordion components must be used within an Accordion')
  }
  return context
}

export function Accordion({
  value,
  defaultValue,
  onValueChange,
  mode = 'single',
  width = 'constrained',
  disabled = false,
  children,
  containerStyle,
}: AccordionProps) {
  const accordion = useAccordion({
    value,
    defaultValue,
    onValueChange,
    mode,
    width,
    disabled,
  })

  return (
    <AccordionContext.Provider value={accordion}>
      <View style={[styles.container, containerStyle]}>{children}</View>
    </AccordionContext.Provider>
  )
}

const styles = StyleSheet.create({
  container: {
    gap: spacing[12],
  },
})
