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

import { createContext, useContext, useState } from 'react'
import { View, StyleSheet } from 'react-native'
import type { AccordionProps, AccordionContextValue, AccordionValue } from './Accordion.types'
import { spacing } from '../../tokens/spacing'

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
  value: valueProp,
  defaultValue,
  onValueChange,
  mode = 'single',
  width = 'constrained',
  disabled = false,
  children,
  containerStyle,
}: AccordionProps) {
  // Support both controlled and uncontrolled mode
  const [internalValue, setInternalValue] = useState<AccordionValue>(
    defaultValue ?? (mode === 'single' ? '' : [])
  )
  const isControlled = valueProp !== undefined
  const value = isControlled ? valueProp : internalValue

  const handleValueChange = (itemValue: string) => {
    if (disabled) return

    let newValue: AccordionValue

    if (mode === 'single') {
      // Single mode: toggle the item or set new item
      newValue = value === itemValue ? '' : itemValue
    } else {
      // Multiple mode: toggle item in array
      const currentArray = Array.isArray(value) ? value : []
      newValue = currentArray.includes(itemValue)
        ? currentArray.filter((v) => v !== itemValue)
        : [...currentArray, itemValue]
    }

    // Update internal state if uncontrolled
    if (!isControlled) {
      setInternalValue(newValue)
    }

    // Always call onChange if provided
    onValueChange?.(newValue)
  }

  const contextValue: AccordionContextValue = {
    value,
    onValueChange: handleValueChange,
    mode,
    width,
    disabled,
  }

  return (
    <AccordionContext.Provider value={contextValue}>
      <View style={[styles.container, containerStyle]}>{children}</View>
    </AccordionContext.Provider>
  )
}

const styles = StyleSheet.create({
  container: {
    gap: spacing[12],
  },
})
