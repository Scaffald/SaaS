/**
 * Popover component
 * Floating container for interactive content
 *
 * @example
 * ```tsx
 * import { Popover, PopoverHeader, PopoverContent, PopoverFooter } from '@scaffald/ui'
 *
 * <Popover
 *   placement="bottom"
 *   content={
 *     <>
 *       <PopoverHeader title="Settings" />
 *       <PopoverContent>
 *         <Text>Popover content here</Text>
 *       </PopoverContent>
 *       <PopoverFooter>
 *         <Button size="sm">Save</Button>
 *       </PopoverFooter>
 *     </>
 *   }
 * >
 *   <Button>Open Popover</Button>
 * </Popover>
 * ```
 */

import {
  useState,
  useEffect,
  useCallback,
  useRef,
  cloneElement,
  isValidElement,
  createContext,
  useContext,
} from 'react'
import {
  View,
  Pressable,
  Modal,
  Platform,
  Dimensions,
  StyleSheet,
} from 'react-native'
import type { LayoutChangeEvent } from 'react-native'
import type {
  PopoverProps,
  PopoverHeaderProps,
  PopoverContentProps,
  PopoverFooterProps,
  PopoverPlacement,
  TriggerLayout,
} from './Popover.types'
import { useThemeContext } from '../../theme'
import { colors } from '../../tokens/colors'
import { H4 } from '../Typography'
import { Button } from '../Button'
import {
  getPopoverStyles,
  getPopoverHeaderStyles,
  getPopoverContentStyles,
  getPopoverFooterStyles,
} from './Popover.styles'

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window')

// ============================================================================
// Context
// ============================================================================

interface PopoverContextValue {
  onClose: () => void
}

const PopoverContext = createContext<PopoverContextValue | null>(null)

function usePopoverContext() {
  return useContext(PopoverContext)
}

// ============================================================================
// Position Calculation
// ============================================================================

interface Position {
  top: number
  left: number
  arrowLeft?: number
  arrowTop?: number
}

function calculatePosition(
  triggerLayout: TriggerLayout,
  popoverSize: { width: number; height: number },
  placement: PopoverPlacement,
  offset: number,
  showArrow: boolean
): Position {
  const arrowSize = showArrow ? 8 : 0
  const totalOffset = offset + arrowSize

  let top = 0
  let left = 0
  let arrowLeft: number | undefined
  let arrowTop: number | undefined

  // Calculate base position
  switch (placement) {
    case 'top':
    case 'top-start':
    case 'top-end':
      top = triggerLayout.pageY - popoverSize.height - totalOffset
      break
    case 'bottom':
    case 'bottom-start':
    case 'bottom-end':
      top = triggerLayout.pageY + triggerLayout.height + totalOffset
      break
    case 'left':
    case 'left-start':
    case 'left-end':
      left = triggerLayout.pageX - popoverSize.width - totalOffset
      break
    case 'right':
    case 'right-start':
    case 'right-end':
      left = triggerLayout.pageX + triggerLayout.width + totalOffset
      break
  }

  // Calculate horizontal alignment
  switch (placement) {
    case 'top':
    case 'bottom':
      left = triggerLayout.pageX + (triggerLayout.width - popoverSize.width) / 2
      arrowLeft = popoverSize.width / 2 - arrowSize
      break
    case 'top-start':
    case 'bottom-start':
      left = triggerLayout.pageX
      arrowLeft = Math.min(triggerLayout.width / 2, 24)
      break
    case 'top-end':
    case 'bottom-end':
      left = triggerLayout.pageX + triggerLayout.width - popoverSize.width
      arrowLeft = popoverSize.width - Math.min(triggerLayout.width / 2, 24) - arrowSize * 2
      break
    case 'left':
    case 'right':
      top = triggerLayout.pageY + (triggerLayout.height - popoverSize.height) / 2
      arrowTop = popoverSize.height / 2 - arrowSize
      break
    case 'left-start':
    case 'right-start':
      top = triggerLayout.pageY
      arrowTop = Math.min(triggerLayout.height / 2, 16)
      break
    case 'left-end':
    case 'right-end':
      top = triggerLayout.pageY + triggerLayout.height - popoverSize.height
      arrowTop = popoverSize.height - Math.min(triggerLayout.height / 2, 16) - arrowSize * 2
      break
  }

  // Clamp to screen bounds
  const padding = 8
  left = Math.max(padding, Math.min(left, SCREEN_WIDTH - popoverSize.width - padding))
  top = Math.max(padding, Math.min(top, SCREEN_HEIGHT - popoverSize.height - padding))

  return { top, left, arrowLeft, arrowTop }
}

function getArrowStyleWithColor(placement: PopoverPlacement, position: Position, bgColor: string) {
  const arrowSize = 8
  const transparent = 'rgba(0,0,0,0)'
  const base = {
    position: 'absolute' as const,
    width: 0,
    height: 0,
    borderStyle: 'solid' as const,
  }

  switch (placement) {
    case 'top':
    case 'top-start':
    case 'top-end':
      return {
        ...base,
        bottom: -arrowSize,
        left: position.arrowLeft,
        borderLeftWidth: arrowSize,
        borderRightWidth: arrowSize,
        borderTopWidth: arrowSize,
        borderTopColor: bgColor,
        borderLeftColor: transparent,
        borderRightColor: transparent,
      }
    case 'bottom':
    case 'bottom-start':
    case 'bottom-end':
      return {
        ...base,
        top: -arrowSize,
        left: position.arrowLeft,
        borderLeftWidth: arrowSize,
        borderRightWidth: arrowSize,
        borderBottomWidth: arrowSize,
        borderBottomColor: bgColor,
        borderLeftColor: transparent,
        borderRightColor: transparent,
      }
    case 'left':
    case 'left-start':
    case 'left-end':
      return {
        ...base,
        right: -arrowSize,
        top: position.arrowTop,
        borderTopWidth: arrowSize,
        borderBottomWidth: arrowSize,
        borderLeftWidth: arrowSize,
        borderLeftColor: bgColor,
        borderTopColor: transparent,
        borderBottomColor: transparent,
      }
    case 'right':
    case 'right-start':
    case 'right-end':
      return {
        ...base,
        left: -arrowSize,
        top: position.arrowTop,
        borderTopWidth: arrowSize,
        borderBottomWidth: arrowSize,
        borderRightWidth: arrowSize,
        borderRightColor: bgColor,
        borderTopColor: transparent,
        borderBottomColor: transparent,
      }
    default:
      return base
  }
}

// ============================================================================
// Popover Component
// ============================================================================

export function Popover({
  children,
  content,
  placement = 'bottom',
  trigger = 'press',
  open: controlledOpen,
  defaultOpen = false,
  onOpenChange,
  closeOnBackdropPress = true,
  closeOnEscapeKey = true,
  showArrow = true,
  offset = 8,
  width,
  maxWidth = 320,
  style,
  contentStyle,
  testID,
}: PopoverProps) {
  const { theme } = useThemeContext()
  const triggerRef = useRef<View>(null)

  // Controlled/uncontrolled state
  const [internalOpen, setInternalOpen] = useState(defaultOpen)
  const isControlled = controlledOpen !== undefined
  const isOpen = isControlled ? controlledOpen : internalOpen

  // Layout state
  const [triggerLayout, setTriggerLayout] = useState<TriggerLayout | null>(null)
  const [popoverSize, setPopoverSize] = useState({ width: 0, height: 0 })
  const [position, setPosition] = useState<Position>({ top: 0, left: 0 })

  // Handle open/close
  const handleOpen = useCallback(() => {
    if (!isControlled) {
      setInternalOpen(true)
    }
    onOpenChange?.(true)
  }, [isControlled, onOpenChange])

  const handleClose = useCallback(() => {
    if (!isControlled) {
      setInternalOpen(false)
    }
    onOpenChange?.(false)
  }, [isControlled, onOpenChange])

  const handleToggle = useCallback(() => {
    if (isOpen) {
      handleClose()
    } else {
      handleOpen()
    }
  }, [isOpen, handleOpen, handleClose])

  // Measure trigger on open
  useEffect(() => {
    if (isOpen && triggerRef.current) {
      triggerRef.current.measureInWindow((x, y, w, h) => {
        setTriggerLayout({
          x: 0,
          y: 0,
          width: w,
          height: h,
          pageX: x,
          pageY: y,
        })
      })
    }
  }, [isOpen])

  // Calculate position when layout changes
  useEffect(() => {
    if (triggerLayout && popoverSize.width > 0) {
      const newPosition = calculatePosition(
        triggerLayout,
        popoverSize,
        placement,
        offset,
        showArrow
      )
      setPosition(newPosition)
    }
  }, [triggerLayout, popoverSize, placement, offset, showArrow])

  // Handle Escape key (web only)
  useEffect(() => {
    if (!closeOnEscapeKey || !isOpen || Platform.OS !== 'web') {
      return
    }

    const handleEscape = (event: KeyboardEvent) => {
      if (event.key === 'Escape' || event.keyCode === 27) {
        handleClose()
      }
    }

    if (typeof document !== 'undefined') {
      document.addEventListener('keydown', handleEscape)
      return () => {
        document.removeEventListener('keydown', handleEscape)
      }
    }
  }, [isOpen, closeOnEscapeKey, handleClose])

  // Handle popover layout
  const handlePopoverLayout = (event: LayoutChangeEvent) => {
    const { width: w, height: h } = event.nativeEvent.layout
    setPopoverSize({ width: w, height: h })
  }

  // Clone trigger with press handlers
  const triggerElement = isValidElement(children)
    ? cloneElement(children as React.ReactElement<any>, {
        ref: triggerRef,
        ...(trigger === 'press' && { onPress: handleToggle }),
        ...(trigger === 'longPress' && { onLongPress: handleToggle }),
      })
    : children

  const styles = getPopoverStyles(theme, maxWidth, width, triggerLayout?.width)
  const arrowStyle = showArrow
    ? getArrowStyleWithColor(placement, position, colors.bg[theme].default)
    : null

  return (
    <>
      <View ref={triggerRef} collapsable={false}>
        {trigger === 'manual' ? children : triggerElement}
      </View>

      {isOpen && (
        <Modal
          visible={isOpen}
          transparent
          animationType="fade"
          onRequestClose={handleClose}
          testID={testID}
        >
          {/* Backdrop */}
          <Pressable
            style={StyleSheet.absoluteFill}
            onPress={closeOnBackdropPress ? handleClose : undefined}
          />

          {/* Popover */}
          <View
            style={[
              styles.container,
              style,
              {
                top: position.top,
                left: position.left,
              },
            ]}
            onLayout={handlePopoverLayout}
            {...(Platform.OS === 'web' && {
              role: 'dialog',
            } as any)}
          >
            {/* Arrow */}
            {showArrow && arrowStyle && <View style={arrowStyle} />}

            {/* Content */}
            <PopoverContext.Provider value={{ onClose: handleClose }}>
              <View style={[styles.content, contentStyle]}>{content}</View>
            </PopoverContext.Provider>
          </View>
        </Modal>
      )}
    </>
  )
}

// ============================================================================
// PopoverHeader Component
// ============================================================================

export function PopoverHeader({
  title,
  showCloseButton = false,
  onClose,
  children,
  style,
  testID,
}: PopoverHeaderProps) {
  const { theme } = useThemeContext()
  const context = usePopoverContext()
  const styles = getPopoverHeaderStyles(theme)

  const handleClose = onClose || context?.onClose

  return (
    <View style={[styles.header, style]} testID={testID}>
      {children ? (
        children
      ) : (
        <View style={styles.headerContent}>
          {title && <H4>{title}</H4>}
          {showCloseButton && handleClose && (
            <Button
              variant="text"
              size="sm"
              onPress={handleClose}
              accessibilityLabel="Close popover"
            >
              Close
            </Button>
          )}
        </View>
      )}
    </View>
  )
}

// ============================================================================
// PopoverContent Component
// ============================================================================

export function PopoverContent({
  children,
  style,
  testID,
}: PopoverContentProps) {
  const styles = getPopoverContentStyles()

  return (
    <View style={[styles.content, style]} testID={testID}>
      {children}
    </View>
  )
}

// ============================================================================
// PopoverFooter Component
// ============================================================================

export function PopoverFooter({
  children,
  align = 'right',
  style,
  testID,
}: PopoverFooterProps) {
  const { theme } = useThemeContext()
  const styles = getPopoverFooterStyles(theme, align)

  return (
    <View style={[styles.footer, style]} testID={testID}>
      {children}
    </View>
  )
}

// Styles are now in Popover.styles.ts
