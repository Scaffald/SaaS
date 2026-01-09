/**
 * Slider component
 * Interactive slider for single value or range selection
 */

import type React from 'react'
import { useState, useRef, useCallback, useMemo, useEffect } from 'react'
import { View, StyleSheet, PanResponder, Platform, type LayoutChangeEvent, Pressable } from 'react-native'
import type { GestureResponderEvent } from 'react-native'
import type { SliderProps } from './Slider.types'
import { SliderTrack } from './SliderTrack'
import { SliderHandle } from './SliderHandle'
import { SliderTooltip } from './SliderTooltip'

export function Slider({
  value: valueProp,
  range: rangeProp,
  min = 0,
  max = 100,
  step = 1,
  color = 'primary',
  indicatorPosition = 'top',
  showIndicator = true,
  disabled = false,
  onValueChange,
  onRangeChange,
  style,
  trackStyle,
  fillStyle,
  handleStyle,
  tooltipStyle,
}: SliderProps) {
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

  // Drag state
  const [isDragging, setIsDragging] = useState(false)
  const [activeHandle, setActiveHandle] = useState<'start' | 'end' | null>(null)

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

      trackRef.current?.measureInWindow((trackX, _pageY, _width, _height) => {
        const relativeX = pageX - trackX
        const newValue = calculateValue(relativeX)

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
    [disabled, trackWidth, calculateValue, isRange, currentRange, min, max, step, isControlled, onRangeChange, onValueChange, clampValue]
  )

  // Handle drag start
  const handleDragStart = useCallback(
    (handleType: 'start' | 'end' | 'single') => {
      if (disabled) return
      setIsDragging(true)
      setActiveHandle(handleType === 'single' ? null : handleType)
    },
    [disabled]
  )

  // Handle drag move
  const handleDragMove = useCallback(
    (gestureX: number, handleType: 'start' | 'end' | 'single') => {
      if (disabled || trackWidth === 0 || !isDragging) return

      trackRef.current?.measureInWindow((trackX, _pageY, _width, _height) => {
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

  // Determine indicator position
  const actualIndicatorPosition = showIndicator === false ? 'none' : indicatorPosition

  // Calculate handle positions
  const handlePosition = isRange ? undefined : calculatePosition(currentValue)
  const handleStartPosition = isRange ? calculatePosition(currentRange[0]) : undefined
  const handleEndPosition = isRange ? calculatePosition(currentRange[1]) : undefined

  // Determine handle state
  const handleState = isDragging ? 'active' : 'default'

  return (
    <View style={[styles.container, style]}>
      <View
        ref={trackRef}
        style={styles.trackContainer}
        onLayout={handleTrackLayout}
        {...(trackPanResponder?.panHandlers ?? {})}
      >
        <Pressable
          style={StyleSheet.absoluteFill}
          onPress={handleTrackPress}
          disabled={disabled || isDragging}
          hitSlop={{ top: 8, bottom: 8, left: 0, right: 0 }} // Increase touchable area
        >
          <View style={styles.trackPressArea} pointerEvents="box-only" />
        </Pressable>
        <SliderTrack
          value={isRange ? undefined : currentValue}
          range={isRange ? currentRange : undefined}
          min={min}
          max={max}
          color={color}
          disabled={disabled}
          style={trackStyle}
          fillStyle={fillStyle}
        />

        {/* Render handle(s) */}
        {isRange ? (
          <>
            {/* Start handle */}
            <View
              style={[
                styles.handleContainer,
                {
                  left: handleStartPosition,
                },
              ]}
              {...(startHandlePanResponder?.panHandlers ?? {})}
              {...(Platform.OS === 'web'
                ? {
                    onMouseDown: (e: any) => handleWebMouseDown(e, 'start'),
                  }
                : {})}
            >
              <SliderHandle
                state={activeHandle === 'start' ? handleState : 'default'}
                color={color}
                disabled={disabled}
                style={handleStyle}
              />
              {actualIndicatorPosition !== 'none' && (
                <SliderTooltip
                  value={currentRange[0]}
                  color={color}
                  position={actualIndicatorPosition}
                  style={tooltipStyle}
                />
              )}
            </View>

            {/* End handle */}
            <View
              style={[
                styles.handleContainer,
                {
                  left: handleEndPosition,
                },
              ]}
              {...(endHandlePanResponder?.panHandlers ?? {})}
              {...(Platform.OS === 'web'
                ? {
                    onMouseDown: (e: any) => handleWebMouseDown(e, 'end'),
                  }
                : {})}
            >
              <SliderHandle
                state={activeHandle === 'end' ? handleState : 'default'}
                color={color}
                disabled={disabled}
                style={handleStyle}
              />
              {actualIndicatorPosition !== 'none' && (
                <SliderTooltip
                  range={currentRange}
                  color={color}
                  position={actualIndicatorPosition}
                  style={tooltipStyle}
                />
              )}
            </View>
          </>
        ) : (
          <View
            style={[
              styles.handleContainer,
              {
                left: handlePosition,
              },
            ]}
            {...(singleHandlePanResponder?.panHandlers ?? {})}
            {...(Platform.OS === 'web'
              ? {
                  onMouseDown: (e: any) => handleWebMouseDown(e, 'single'),
                }
              : {})}
          >
            <SliderHandle
              state={handleState}
              color={color}
              disabled={disabled}
              style={handleStyle}
            />
            {actualIndicatorPosition !== 'none' && (
              <SliderTooltip
                value={currentValue}
                color={color}
                position={actualIndicatorPosition}
                style={tooltipStyle}
              />
            )}
          </View>
        )}
      </View>
    </View>
  )
}

const styles = StyleSheet.create({
  container: {
    width: '100%',
    paddingVertical: 8, // Space for handle to extend above/below track
  },
  trackContainer: {
    position: 'relative',
    width: '100%',
    height: 16, // Space for handle (16px) to extend above/below track (4px)
    justifyContent: 'center',
    alignItems: 'flex-start',
  },
  handleContainer: {
    position: 'absolute',
    top: '50%',
    marginTop: -8, // Half of handle size (16px / 2) to center vertically
    marginLeft: -8, // Half of handle size to center horizontally at position
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 10, // Ensure handles are above track
  },
  trackPressArea: {
    flex: 1,
    width: '100%',
  },
})

