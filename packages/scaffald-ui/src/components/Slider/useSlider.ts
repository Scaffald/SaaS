import { useState, useRef, useCallback, useMemo, useEffect } from 'react'
import { PanResponder, Platform, type LayoutChangeEvent } from 'react-native'
import type { GestureResponderEvent, View } from 'react-native'
import { useHaptics } from '../../platform/useHaptics'

export interface UseSliderProps {
  value?: number
  range?: [number, number]
  min?: number
  max?: number
  step?: number
  disabled?: boolean
  onValueChange?: (value: number) => void
  onRangeChange?: (range: [number, number]) => void
}

export function useSlider({
  value: valueProp,
  range: rangeProp,
  min = 0,
  max = 100,
  step = 1,
  disabled = false,
  onValueChange,
  onRangeChange,
}: UseSliderProps) {
  // Internal state for uncontrolled mode
  const [internalValue, setInternalValue] = useState(min)
  const [internalRange, setInternalRange] = useState<[number, number]>([min, max])

  // Determine if controlled
  const isControlled = valueProp !== undefined || rangeProp !== undefined
  const isRange = rangeProp !== undefined

  // Get current value(s)
  const currentValue = isControlled ? (valueProp ?? min) : internalValue
  const currentRange: [number, number] = isControlled
    ? (rangeProp ?? [min, max])
    : internalRange

  // Track layout state
  const [trackWidth, setTrackWidth] = useState(0)
  const trackRef = useRef<View>(null)

  // Haptics
  const haptics = useHaptics()

  // Drag state
  const [isDragging, setIsDragging] = useState(false)
  const [activeHandle, setActiveHandle] = useState<'start' | 'end' | 'single' | null>(null)

  // Calculate handle position(s)
  const calculatePosition = useCallback(
    (val: number): number => {
      if (trackWidth === 0) return 0
      const percentage = ((val - min) / (max - min)) * 100
      return (percentage / 100) * trackWidth
    },
    [trackWidth, min, max]
  )

  // Calculate value from position
  const calculateValue = useCallback(
    (x: number): number => {
      if (trackWidth === 0) return min
      const percentage = Math.max(0, Math.min(1, x / trackWidth))
      const rawValue = min + percentage * (max - min)
      // Snap to step
      return Math.round(rawValue / step) * step
    },
    [trackWidth, min, max, step]
  )

  // Clamp and snap value
  const clampValue = useCallback(
    (val: number): number => {
      const clamped = Math.max(min, Math.min(max, val))
      return Math.round(clamped / step) * step
    },
    [min, max, step]
  )

  // Handle track press (click/tap on track)
  const handleTrackPress = useCallback(
    (event: GestureResponderEvent | React.MouseEvent) => {
      if (disabled || trackWidth === 0) return

      const pageX = 'nativeEvent' in event ? event.nativeEvent.pageX : (event as React.MouseEvent).pageX

      trackRef.current?.measureInWindow((trackX) => {
        const relativeX = pageX - trackX
        const newValue = calculateValue(relativeX)
        haptics.impact('light')

        if (isRange) {
          // For range: determine which handle is closer and update that one
          const [start, end] = currentRange
          const distanceToStart = Math.abs(newValue - start)
          const distanceToEnd = Math.abs(newValue - end)

          if (distanceToStart < distanceToEnd) {
            // Update start handle, but don't cross end
            const clampedValue = Math.max(min, Math.min(newValue, end - step))
            const newRange: [number, number] = [clampedValue, end]

            if (!isControlled) {
              setInternalRange(newRange)
            }
            onRangeChange?.(newRange)
          } else {
            // Update end handle, but don't cross start
            const clampedValue = Math.max(start + step, Math.min(newValue, max))
            const newRange: [number, number] = [start, clampedValue]

            if (!isControlled) {
              setInternalRange(newRange)
            }
            onRangeChange?.(newRange)
          }
        } else {
          const clampedValue = clampValue(newValue)

          if (!isControlled) {
            setInternalValue(clampedValue)
          }
          onValueChange?.(clampedValue)
        }
      })
    },
    [disabled, trackWidth, calculateValue, isRange, currentRange, min, max, step, isControlled, onRangeChange, onValueChange, clampValue, haptics]
  )

  // Handle drag start
  const handleDragStart = useCallback(
    (handleType: 'start' | 'end' | 'single') => {
      if (disabled) return
      setIsDragging(true)
      setActiveHandle(handleType)
      haptics.selection()
    },
    [disabled, haptics]
  )

  // Handle drag move
  const handleDragMove = useCallback(
    (gestureX: number, handleType: 'start' | 'end' | 'single') => {
      if (disabled || trackWidth === 0 || !isDragging) return

      trackRef.current?.measureInWindow((trackX) => {
        const relativeX = gestureX - trackX
        const newValue = calculateValue(relativeX)

        if (isRange && handleType !== 'single') {
          const [start, end] = currentRange

          if (handleType === 'start') {
            // Update start handle, don't cross end
            const clampedValue = Math.max(min, Math.min(newValue, end - step))
            const newRange: [number, number] = [clampedValue, end]

            if (!isControlled) {
              setInternalRange(newRange)
            }
            onRangeChange?.(newRange)
          } else if (handleType === 'end') {
            // Update end handle, don't cross start
            const clampedValue = Math.max(start + step, Math.min(newValue, max))
            const newRange: [number, number] = [start, clampedValue]

            if (!isControlled) {
              setInternalRange(newRange)
            }
            onRangeChange?.(newRange)
          }
        } else {
          const clampedValue = clampValue(newValue)

          if (!isControlled) {
            setInternalValue(clampedValue)
          }
          onValueChange?.(clampedValue)
        }
      })
    },
    [disabled, trackWidth, calculateValue, isRange, currentRange, min, max, step, isControlled, onRangeChange, onValueChange, clampValue, isDragging]
  )

  // Handle drag end
  const handleDragEnd = useCallback(() => {
    setIsDragging(false)
    setActiveHandle(null)
  }, [])

  // Create PanResponder for a specific handle
  const createHandlePanResponder = useCallback(
    (handleType: 'start' | 'end' | 'single') => {
      if (Platform.OS === 'web' || disabled) return null

      return PanResponder.create({
        onStartShouldSetPanResponder: () => !disabled,
        onMoveShouldSetPanResponder: () => !disabled,
        onPanResponderGrant: () => {
          handleDragStart(handleType)
        },
        onPanResponderMove: (_, gesture) => {
          handleDragMove(gesture.moveX, handleType)
        },
        onPanResponderRelease: handleDragEnd,
        onPanResponderTerminate: handleDragEnd,
      })
    },
    [disabled, handleDragStart, handleDragMove, handleDragEnd]
  )

  // PanResponders for each handle
  const singleHandlePanResponder = useMemo(() => createHandlePanResponder('single'), [createHandlePanResponder])
  const startHandlePanResponder = useMemo(() => createHandlePanResponder('start'), [createHandlePanResponder])
  const endHandlePanResponder = useMemo(() => createHandlePanResponder('end'), [createHandlePanResponder])

  // PanResponder for track (click to jump)
  const trackPanResponder = useMemo(
    () =>
      Platform.OS !== 'web'
        ? PanResponder.create({
            onStartShouldSetPanResponder: () => false,
            onMoveShouldSetPanResponder: () => false,
            onPanResponderTerminationRequest: () => true,
          })
        : null,
    []
  )

  // Track layout handler
  const handleTrackLayout = useCallback((event: LayoutChangeEvent) => {
    const { width } = event.nativeEvent.layout
    setTrackWidth(width)
  }, [])

  // Web mouse event handlers
  useEffect(() => {
    if (Platform.OS !== 'web' || disabled) return

    const handleMouseMove = (e: MouseEvent) => {
      if (!isDragging) return
      handleDragMove(e.pageX, activeHandle ?? (isRange ? 'end' : 'single'))
    }

    const handleMouseUp = () => {
      if (isDragging) {
        handleDragEnd()
      }
    }

    if (isDragging) {
      window.addEventListener('mousemove', handleMouseMove)
      window.addEventListener('mouseup', handleMouseUp)
    }

    return () => {
      window.removeEventListener('mousemove', handleMouseMove)
      window.removeEventListener('mouseup', handleMouseUp)
    }
  }, [isDragging, activeHandle, isRange, handleDragMove, handleDragEnd, disabled])

  // Handle web mouse down on handle
  const handleWebMouseDown = useCallback(
    (e: React.MouseEvent, handleType: 'start' | 'end' | 'single') => {
      if (disabled || e.button !== 0) return
      e.preventDefault()
      e.stopPropagation()
      handleDragStart(handleType)
    },
    [disabled, handleDragStart]
  )

  return {
    isRange,
    currentValue,
    currentRange,
    trackRef,
    isDragging,
    activeHandle,
    handleTrackPress,
    handleTrackLayout,
    handleWebMouseDown,
    singleHandlePanResponder,
    startHandlePanResponder,
    endHandlePanResponder,
    trackPanResponder,
    calculatePosition,
  }
}
