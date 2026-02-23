import { useState, useCallback, useRef } from 'react'
import { Platform, type LayoutChangeEvent, type View } from 'react-native'

export interface UseDropdownProps {
  /** Controlled open state */
  open?: boolean
  /** Callback when open state changes */
  onOpenChange?: (open: boolean) => void
  /** Disable dropdown */
  disabled?: boolean
}

/**
 * Headless hook for managing Dropdown state and positioning logic.
 * Use this to build completely custom Dropdown visual components.
 */
export function useDropdown({
  open: controlledOpen,
  onOpenChange,
  disabled = false,
}: UseDropdownProps = {}) {
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

  const handleToggle = useCallback(() => {
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
  }, [disabled, isOpen, controlledOpen, onOpenChange])

  const handleLayout = useCallback((event: LayoutChangeEvent) => {
    const { width, height, x: layoutX, y: layoutY } = event.nativeEvent.layout
    // Pre-measure layout so we have it available
    if (triggerRef.current) {
      triggerRef.current.measureInWindow((fx, fy, fwidth, fheight) => {
        setTriggerLayout({
          x: fx,
          y: fy,
          width: fwidth || width,
          height: fheight || height,
        })
      })
    } else {
      setTriggerLayout({
        x: layoutX || 0,
        y: layoutY || 0,
        width,
        height,
      })
    }
  }, [])

  const handleDismiss = useCallback(() => {
    if (controlledOpen === undefined) {
      setInternalOpen(false)
    }
    onOpenChange?.(false)
  }, [controlledOpen, onOpenChange])

  return {
    // State
    isOpen,
    triggerLayout,
    triggerRef,
    
    // Actions
    handleToggle,
    handleLayout,
    handleDismiss,
    
    // Prop getters
    getTriggerProps: () => ({
      ref: triggerRef,
      onPress: handleToggle,
      onLayout: handleLayout,
      disabled,
      accessibilityRole: 'button' as const,
      accessibilityState: { expanded: isOpen, disabled },
    }),
    getMenuProps: () => ({
      visible: isOpen,
      triggerLayout,
      onDismiss: handleDismiss,
    }),
  }
}
