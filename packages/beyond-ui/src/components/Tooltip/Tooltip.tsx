/**
 * Tooltip component
 * Contextual information on hover/long press
 * Fully-featured tooltip component mapped from Figma Forsured Design System
 *
 * @example
 * ```tsx
 * import { Tooltip } from '@unicornlove/beyond-ui'
 *
 * // Default tooltip
 * <Tooltip content="This is a tooltip" arrowPosition="down-center">
 *   <Button>Hover me</Button>
 * </Tooltip>
 *
 * // Rich tooltip
 * <Tooltip
 *   type="rich"
 *   title="What is a tooltip?"
 *   description="A tooltip is a brief, informative message that appears when a user interacts with an element."
 *   actions={[
 *     { label: 'Learn more', onPress: () => console.log('Learn more') },
 *     { label: 'Dismiss', onPress: () => console.log('Dismiss') }
 *   ]}
 *   arrowPosition="up-center"
 * >
 *   <Button>Info</Button>
 * </Tooltip>
 * ```
 */

import { useState, useRef, useEffect, useCallback, useMemo, cloneElement, isValidElement, type ReactElement } from 'react'
import { View, Modal, Pressable, StyleSheet, Platform, type LayoutChangeEvent } from 'react-native'
import type { TooltipProps, TriggerLayout } from './Tooltip.types'
import { TooltipContent } from './TooltipContent'
import { TooltipArrow } from './TooltipArrow'
import { getTooltipStyles } from './Tooltip.styles'
import { spacing } from '../../tokens/spacing'

/**
 * Calculate tooltip position based on trigger layout and arrow position
 */
function calculateTooltipPosition(
  triggerLayout: TriggerLayout | undefined,
  arrowPosition: TooltipProps['arrowPosition'],
  tooltipWidth: number = 250,
  tooltipHeight: number = 70
): Record<string, number | string> {
  const positionStyle: Record<string, number | string> = {
    position: 'absolute' as const,
    zIndex: 9999,
    elevation: 9999, // Android
  }

  if (!triggerLayout) {
    // Fallback positioning
    positionStyle.top = 100
    positionStyle.left = 100
    return positionStyle
  }

  const { x, y, width, height } = triggerLayout
  const gap = spacing[8] // 8px gap between trigger and tooltip

  // Get viewport dimensions (web) or window dimensions (native)
  const viewportWidth = Platform.OS === 'web' && typeof window !== 'undefined' ? window.innerWidth : 375
  const viewportHeight = Platform.OS === 'web' && typeof window !== 'undefined' ? window.innerHeight : 667

  switch (arrowPosition) {
    case 'down-center':
    case 'down-left':
    case 'down-right': {
      // Tooltip appears BELOW trigger
      const tooltipTop = y + height + gap + 6 // +6 for arrow height
      positionStyle.top = tooltipTop

      // Handle horizontal alignment
      if (arrowPosition === 'down-center') {
        // Center arrow on trigger center
        const triggerCenterX = x + width / 2
        positionStyle.left = triggerCenterX - tooltipWidth / 2
        // Clamp to viewport
        if (positionStyle.left < 0) positionStyle.left = spacing[8]
        if ((positionStyle.left as number) + tooltipWidth > viewportWidth) {
          positionStyle.left = viewportWidth - tooltipWidth - spacing[8]
        }
      } else if (arrowPosition === 'down-left') {
        // Arrow on left side of tooltip, align with trigger left
        positionStyle.left = x
      } else if (arrowPosition === 'down-right') {
        // Arrow on right side of tooltip, align with trigger right
        positionStyle.left = x + width - tooltipWidth
        if ((positionStyle.left as number) < 0) positionStyle.left = spacing[8]
      }
      break
    }

    case 'up-center':
    case 'up-left':
    case 'up-right': {
      // Tooltip appears ABOVE trigger
      const tooltipBottom = viewportHeight - y + gap + 6 // +6 for arrow height
      if (Platform.OS === 'web') {
        positionStyle.bottom = tooltipBottom
        positionStyle.top = undefined
      } else {
        positionStyle.top = Math.max(0, y - tooltipHeight - gap - 6)
      }

      // Handle horizontal alignment (same logic as down positions)
      if (arrowPosition === 'up-center') {
        const triggerCenterX = x + width / 2
        if (Platform.OS === 'web') {
          positionStyle.left = triggerCenterX - tooltipWidth / 2
        } else {
          positionStyle.left = triggerCenterX - tooltipWidth / 2
        }
        if ((positionStyle.left as number) < 0) positionStyle.left = spacing[8]
        if ((positionStyle.left as number) + tooltipWidth > viewportWidth) {
          positionStyle.left = viewportWidth - tooltipWidth - spacing[8]
        }
      } else if (arrowPosition === 'up-left') {
        positionStyle.left = x
      } else if (arrowPosition === 'up-right') {
        positionStyle.left = x + width - tooltipWidth
        if ((positionStyle.left as number) < 0) positionStyle.left = spacing[8]
      }
      break
    }

    case 'left': {
      // Tooltip appears to LEFT of trigger
      positionStyle.top = y + height / 2 - tooltipHeight / 2
      positionStyle.right = viewportWidth - x + gap + 6 // +6 for arrow width
      if (Platform.OS === 'web') {
        positionStyle.right = viewportWidth - x + gap + 6
      } else {
        positionStyle.left = Math.max(0, x - tooltipWidth - gap - 6)
        positionStyle.right = undefined
      }
      break
    }

    case 'right': {
      // Tooltip appears to RIGHT of trigger
      positionStyle.top = y + height / 2 - tooltipHeight / 2
      positionStyle.left = x + width + gap + 6 // +6 for arrow width
      if ((positionStyle.left as number) + tooltipWidth > viewportWidth) {
        positionStyle.left = Math.max(0, viewportWidth - tooltipWidth - spacing[8])
      }
      break
    }

    case 'none':
    default: {
      // No arrow - position below by default
      positionStyle.top = y + height + gap
      positionStyle.left = x + width / 2 - tooltipWidth / 2
      if ((positionStyle.left as number) < 0) positionStyle.left = spacing[8]
      if ((positionStyle.left as number) + tooltipWidth > viewportWidth) {
        positionStyle.left = viewportWidth - tooltipWidth - spacing[8]
      }
      break
    }
  }

  return positionStyle
}

export function Tooltip({
  children,
  content,
  type = 'default',
  color = 'primary',
  arrowPosition = 'none',
  title,
  description,
  actions,
  showActions = true,
  delay = 200,
  visible: controlledVisible,
  defaultVisible = false,
  onVisibleChange,
  style,
  contentStyle,
}: TooltipProps) {
  const [internalVisible, setInternalVisible] = useState(defaultVisible)
  const [triggerLayout, setTriggerLayout] = useState<TriggerLayout>()

  const triggerRef = useRef<View>(null)
  const hasMeasuredRef = useRef(false)
  const hoverTimeoutRef = useRef<NodeJS.Timeout | null>(null)
  const isControlled = controlledVisible !== undefined
  const isVisible = isControlled ? controlledVisible : internalVisible

  // Validate props
  if (type === 'rich' && !title) {
    if (__DEV__) {
      console.warn('Tooltip: Rich tooltip type requires a title prop')
    }
  }

  // Measure trigger element - use requestAnimationFrame to avoid interrupting hover
  const measureTrigger = useCallback(() => {
    if (hasMeasuredRef.current) return // Don't re-measure if we already have layout
    
    hasMeasuredRef.current = true
    
    if (Platform.OS === 'web') {
      // Use requestAnimationFrame on web to measure after current render
      requestAnimationFrame(() => {
        if (!triggerRef.current) {
          hasMeasuredRef.current = false
          return
        }

        const element = triggerRef.current as unknown as HTMLElement
        if (element && typeof element.getBoundingClientRect === 'function') {
          const rect = element.getBoundingClientRect()
          setTriggerLayout({
            x: rect.left,
            y: rect.top,
            width: rect.width,
            height: rect.height,
          })
        } else {
          hasMeasuredRef.current = false
        }
      })
    } else {
      // Native: use measureInWindow
      if (triggerRef.current && typeof triggerRef.current.measureInWindow === 'function') {
        triggerRef.current.measureInWindow((fx, fy, fwidth, fheight) => {
          setTriggerLayout({
            x: fx || 0,
            y: fy || 0,
            width: fwidth || 100,
            height: fheight || 40,
          })
        })
      } else {
        hasMeasuredRef.current = false
      }
    }
  }, [])

  // Handle visibility change
  const handleVisibleChange = useCallback(
    (newVisible: boolean) => {
      if (!isControlled) {
        setInternalVisible(newVisible)
      }
      onVisibleChange?.(newVisible)

      // Don't measure here - it causes re-renders that interrupt hover events
      // Measurement happens on hover enter instead
    },
    [isControlled, onVisibleChange]
  )

  // Handle hover (web) - simplified, only called from handleMouseEnterWithMeasure
  // Removed - logic is now directly in handleMouseEnterWithMeasure

  const handleMouseLeave = useCallback(() => {
    if (Platform.OS !== 'web') return

    // Clear timeout to prevent tooltip from showing
    if (hoverTimeoutRef.current) {
      clearTimeout(hoverTimeoutRef.current)
      hoverTimeoutRef.current = null
    }
    
    // Reset measurement flag when leaving
    hasMeasuredRef.current = false
    
    // Hide tooltip
    handleVisibleChange(false)
  }, [handleVisibleChange])

  // Handle long press (native/mobile)
  const handleLongPress = useCallback(() => {
    if (Platform.OS === 'web') return
    handleVisibleChange(true)
  }, [handleVisibleChange])

  // Handle dismiss
  const handleDismiss = useCallback(() => {
    handleVisibleChange(false)
  }, [handleVisibleChange])

  // Cleanup timeout on unmount
  useEffect(() => {
    return () => {
      if (hoverTimeoutRef.current) {
        clearTimeout(hoverTimeoutRef.current)
        hoverTimeoutRef.current = null
      }
    }
  }, [])

  // Calculate tooltip position
  const tooltipPosition = calculateTooltipPosition(triggerLayout, arrowPosition)
  const styles = getTooltipStyles(type, color)

  // Handle layout measurement
  const handleLayout = useCallback(
    (event: LayoutChangeEvent) => {
      const { width, height } = event.nativeEvent.layout

      if (triggerRef.current) {
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
            return
          }
        }

        triggerRef.current.measureInWindow((fx, fy, fwidth, fheight) => {
          setTriggerLayout({
            x: fx || 0,
            y: fy || 0,
            width: fwidth || width,
            height: fheight || height,
          })
        })
      }
    },
    []
  )

  // Enhanced hover handler that measures immediately then shows tooltip
  const handleMouseEnterWithMeasure = useCallback(() => {
    if (Platform.OS !== 'web') return
    
    // Clear any existing timeout first to prevent duplicates
    if (hoverTimeoutRef.current) {
      clearTimeout(hoverTimeoutRef.current)
      hoverTimeoutRef.current = null
    }
    
    // Measure trigger immediately on hover start (async, won't interrupt hover)
    measureTrigger()
    
    // Set up timeout to show tooltip after delay
    hoverTimeoutRef.current = setTimeout(() => {
      handleVisibleChange(true)
      hoverTimeoutRef.current = null
    }, delay)
  }, [measureTrigger, handleVisibleChange, delay])

  // Clone children to add hover handlers directly if it's a single element
  // Use useMemo to prevent recreating on every render (which causes mouse event issues)
  const triggerElement = useMemo(() => {
    if (!isValidElement(children)) {
      return children
    }

    return cloneElement(children as ReactElement<any>, {
      // @ts-expect-error - web-specific props
      onMouseEnter: (e: any) => {
        // Call original handler if it exists
        const originalHandler = (children as ReactElement<any>).props?.onMouseEnter
        if (originalHandler && typeof originalHandler === 'function') {
          originalHandler(e)
        }
        // Handle tooltip hover
        if (Platform.OS === 'web') {
          handleMouseEnterWithMeasure()
        }
      },
      // @ts-expect-error - web-specific props
      onMouseLeave: (e: any) => {
        // Call original handler if it exists
        const originalHandler = (children as ReactElement<any>).props?.onMouseLeave
        if (originalHandler && typeof originalHandler === 'function') {
          originalHandler(e)
        }
        // Handle tooltip hover
        if (Platform.OS === 'web') {
          handleMouseLeave()
        }
      },
      ref: (node: any) => {
        // Set tooltip ref
        if (triggerRef) {
          // @ts-expect-error - ref assignment
          triggerRef.current = node
        }
        // Support child's ref if it exists
        const childRef = (children as ReactElement<any>).ref
        if (typeof childRef === 'function') {
          childRef(node)
        } else if (childRef && typeof childRef === 'object' && childRef !== null) {
          childRef.current = node
        }
      },
    } as any)
  }, [children, handleMouseEnterWithMeasure, handleMouseLeave])

  return (
    <>
      {/* Trigger wrapper - use View for layout measurement */}
      <View
        ref={triggerRef}
        onLayout={handleLayout}
        style={{
          display: 'inline-flex',
          position: 'relative' as const,
          alignSelf: 'flex-start' as const,
        }}
      >
        <Pressable 
          onLongPress={Platform.OS !== 'web' ? handleLongPress : undefined}
          delayLongPress={500}
        >
          {triggerElement}
        </Pressable>
      </View>

      {/* Tooltip overlay */}
      {isVisible && (
        <Modal visible={isVisible} transparent animationType="fade" onRequestClose={handleDismiss} statusBarTranslucent>
          <Pressable style={StyleSheet.absoluteFill} onPress={handleDismiss}>
            <View
              style={[
                styles.container,
                tooltipPosition,
                style,
              ]}
              onStartShouldSetResponder={() => true}
              onTouchEnd={(e) => {
                // Prevent touch events from bubbling to dismiss handler
                e.stopPropagation()
              }}
            >
              {/* Arrow - positioned above content for down, below for up, etc */}
              {arrowPosition !== 'none' && (
                <View
                  style={{
                    position: 'absolute',
                    ...(arrowPosition.startsWith('down') && {
                      top: -6,
                      alignSelf: arrowPosition === 'down-center' ? 'center' : arrowPosition === 'down-left' ? 'flex-start' : 'flex-end',
                      ...(arrowPosition === 'down-left' && { left: spacing[8] }),
                      ...(arrowPosition === 'down-right' && { right: spacing[8] }),
                    }),
                    ...(arrowPosition.startsWith('up') && {
                      bottom: -6,
                      alignSelf: arrowPosition === 'up-center' ? 'center' : arrowPosition === 'up-left' ? 'flex-start' : 'flex-end',
                      ...(arrowPosition === 'up-left' && { left: spacing[8] }),
                      ...(arrowPosition === 'up-right' && { right: spacing[8] }),
                    }),
                    ...(arrowPosition === 'left' && {
                      right: -6,
                      top: '50%',
                      transform: [{ translateY: -3 }],
                    }),
                    ...(arrowPosition === 'right' && {
                      left: -6,
                      top: '50%',
                      transform: [{ translateY: -3 }],
                    }),
                  }}
                >
                  <TooltipArrow position={arrowPosition} color={color} />
                </View>
              )}

              {/* Content */}
              <TooltipContent
                type={type}
                color={color}
                content={content}
                title={title}
                description={description}
                actions={actions}
                showActions={showActions}
                style={contentStyle}
              />
            </View>
          </Pressable>
        </Modal>
      )}
    </>
  )
}

// Export types
export type { TooltipProps, TooltipArrowPosition, TooltipAction, TooltipType, TooltipColor } from './Tooltip.types'

