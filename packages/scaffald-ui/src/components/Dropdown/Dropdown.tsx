/**
 * Dropdown component
 * Fully-featured dropdown component mapped from Figma Forsured Design System
 *
 * @example
 * ```tsx
 * import { Dropdown, DropdownSection, DropdownItem } from '@scaffald/ui'
 *
 * <Dropdown trigger="Select" position="bottom-right">
 *   <DropdownSection heading="Section 1">
 *     <DropdownItem>Option 1</DropdownItem>
 *     <DropdownItem>Option 2</DropdownItem>
 *   </DropdownSection>
 *   <DropdownSection heading="Section 2" divider>
 *     <DropdownItem>Option 3</DropdownItem>
 *   </DropdownSection>
 * </Dropdown>
 * ```
 */

import { useState, useRef } from 'react'
import { Pressable, Text, View, type LayoutChangeEvent, Platform } from 'react-native'
import type { DropdownProps } from './Dropdown.types'
import { getDropdownStyles } from './Dropdown.styles'
import { DropdownMenu } from './DropdownMenu'

/**
 * Simple caret icon component
 */
function CaretIcon({ isOpen }: { isOpen: boolean }) {
  const styles = getDropdownStyles()

  // Simple arrow shape using View borders
  return (
    <View style={caretContainerStyle}>
      {isOpen ? (
        // Up arrow
        <View
          style={[
            caretArrowBaseStyle,
            {
              borderBottomWidth: 8,
              borderTopWidth: 0,
              borderBottomColor: styles.caretColor,
            },
          ]}
        />
      ) : (
        // Down arrow
        <View
          style={[
            caretArrowBaseStyle,
            {
              borderTopWidth: 8,
              borderBottomWidth: 0,
              borderTopColor: styles.caretColor,
            },
          ]}
        />
      )}
    </View>
  )
}

const caretContainerStyle = {
  width: 20,
  height: 20,
  justifyContent: 'center' as const,
  alignItems: 'center' as const,
}

const caretArrowBaseStyle = {
  width: 0,
  height: 0,
  borderLeftWidth: 6,
  borderRightWidth: 6,
  borderLeftColor: 'transparent' as const,
  borderRightColor: 'transparent' as const,
  borderTopColor: 'transparent' as const,
  borderBottomColor: 'transparent' as const,
}

export function Dropdown({
  trigger,
  position = 'bottom-right',
  open: controlledOpen,
  onOpenChange,
  disabled = false,
  children,
  triggerStyle,
  menuStyle,
}: DropdownProps) {
  const [internalOpen, setInternalOpen] = useState(false)
  const [triggerLayout, setTriggerLayout] = useState<{
    x: number
    y: number
    width: number
    height: number
  }>()

  const triggerRef = useRef<View>(null)

  // Determine if dropdown is open (controlled or internal state)
  const isOpen = controlledOpen !== undefined ? controlledOpen : internalOpen

  const styles = getDropdownStyles()

  const handleToggle = () => {
    if (disabled) return

    const newOpen = !isOpen

    // If opening, measure trigger position first
    if (newOpen && triggerRef.current) {
      // On web, use getBoundingClientRect for more accurate viewport coordinates
      if (Platform.OS === 'web' && triggerRef.current) {
        const element = triggerRef.current as unknown as HTMLElement
        if (element.getBoundingClientRect) {
          const rect = element.getBoundingClientRect()
          setTriggerLayout({
            x: rect.left,
            y: rect.top,
            width: rect.width,
            height: rect.height,
          })
        } else {
          // Fallback to measureInWindow
          triggerRef.current.measureInWindow((fx, fy, fwidth, fheight) => {
            setTriggerLayout({
              x: fx || 0,
              y: fy || 0,
              width: fwidth || 100,
              height: fheight || 40,
            })
          })
        }
      } else {
        // Native: use measureInWindow
        triggerRef.current.measureInWindow((fx, fy, fwidth, fheight) => {
          setTriggerLayout({
            x: fx || 0,
            y: fy || 0,
            width: fwidth || 100,
            height: fheight || 40,
          })
        })
      }
    }

    // Open/close dropdown
    if (controlledOpen === undefined) {
      setInternalOpen(newOpen)
    }
    onOpenChange?.(newOpen)
  }

  const handleLayout = (event: LayoutChangeEvent) => {
    const { width, height, x: layoutX, y: layoutY } = event.nativeEvent.layout
    // Pre-measure layout so we have it available
    // Use measureInWindow for absolute position, or measure for relative position
    if (triggerRef.current) {
      triggerRef.current.measureInWindow((fx, fy, fwidth, fheight) => {
        // Use measureInWindow values as they give absolute window coordinates
        setTriggerLayout({
          x: fx,
          y: fy,
          width: fwidth || width,
          height: fheight || height,
        })
      })
    } else {
      // Fallback to layout values (relative to parent)
      setTriggerLayout({
        x: layoutX || 0,
        y: layoutY || 0,
        width,
        height,
      })
    }
  }

  const handleDismiss = () => {
    if (controlledOpen === undefined) {
      setInternalOpen(false)
    }
    onOpenChange?.(false)
  }

  return (
    <View style={dropdownContainerStyle}>
      {/* Trigger Button */}
      <Pressable
        ref={triggerRef}
        onPress={handleToggle}
        onLayout={handleLayout}
        disabled={disabled}
        style={({ pressed }) => [
          styles.trigger,
          disabled && { opacity: 0.5 },
          pressed && !disabled && { opacity: 0.8 },
          triggerStyle,
        ]}
      >
        <Text style={styles.triggerText}>{trigger || 'Select'}</Text>
        <CaretIcon isOpen={isOpen} />
      </Pressable>

      {/* Dropdown Menu */}
      {isOpen && (
        <DropdownMenu
          position={position}
          visible={isOpen}
          triggerLayout={triggerLayout}
          onDismiss={handleDismiss}
          style={menuStyle}
        >
          {children}
        </DropdownMenu>
      )}
    </View>
  )
}

const dropdownContainerStyle = {
  position: 'relative' as const,
}
