/**
 * Slider component
 * Interactive slider for single value or range selection
 */

import { View, StyleSheet, Platform, Pressable } from 'react-native'
import type { SliderProps } from './Slider.types'
import { SliderTrack } from './SliderTrack'
import { SliderHandle } from './SliderHandle'
import { SliderTooltip } from './SliderTooltip'
import { useSlider } from './useSlider'

export function Slider({
  value,
  range,
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
  const slider = useSlider({
    value,
    range,
    min,
    max,
    step,
    disabled,
    onValueChange,
    onRangeChange,
  })

  // Determine indicator position
  const actualIndicatorPosition = showIndicator === false ? 'none' : indicatorPosition

  // Calculate handle positions
  const handlePosition = slider.isRange ? undefined : slider.calculatePosition(slider.currentValue)
  const handleStartPosition = slider.isRange ? slider.calculatePosition(slider.currentRange[0]) : undefined
  const handleEndPosition = slider.isRange ? slider.calculatePosition(slider.currentRange[1]) : undefined

  // Determine handle state
  const handleState = slider.isDragging ? 'active' : 'default'

  return (
    <View style={[styles.container, style]}>
      <View
        ref={slider.trackRef}
        style={styles.trackContainer}
        onLayout={slider.handleTrackLayout}
        {...(slider.trackPanResponder?.panHandlers ?? {})}
      >
        <Pressable
          style={StyleSheet.absoluteFill}
          onPress={slider.handleTrackPress}
          disabled={disabled || slider.isDragging}
          hitSlop={{ top: 8, bottom: 8, left: 0, right: 0 }} // Increase touchable area
        >
          <View style={styles.trackPressArea} pointerEvents="box-only" />
        </Pressable>
        <SliderTrack
          value={slider.isRange ? undefined : slider.currentValue}
          range={slider.isRange ? slider.currentRange : undefined}
          min={min}
          max={max}
          color={color}
          disabled={disabled}
          style={trackStyle}
          fillStyle={fillStyle}
        />

        {/* Render handle(s) */}
        {slider.isRange ? (
          <>
            {/* Start handle */}
            <View
              style={[
                styles.handleContainer,
                {
                  left: handleStartPosition,
                },
              ]}
              {...(slider.startHandlePanResponder?.panHandlers ?? {})}
              {...(Platform.OS === 'web'
                ? {
                    onMouseDown: (e: any) => slider.handleWebMouseDown(e, 'start'),
                  }
                : {})}
            >
              <SliderHandle
                state={slider.activeHandle === 'start' ? handleState : 'default'}
                color={color}
                disabled={disabled}
                style={handleStyle}
              />
              {actualIndicatorPosition !== 'none' && (
                <SliderTooltip
                  value={slider.currentRange[0]}
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
              {...(slider.endHandlePanResponder?.panHandlers ?? {})}
              {...(Platform.OS === 'web'
                ? {
                    onMouseDown: (e: any) => slider.handleWebMouseDown(e, 'end'),
                  }
                : {})}
            >
              <SliderHandle
                state={slider.activeHandle === 'end' ? handleState : 'default'}
                color={color}
                disabled={disabled}
                style={handleStyle}
              />
              {actualIndicatorPosition !== 'none' && (
                <SliderTooltip
                  range={slider.currentRange}
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
            {...(slider.singleHandlePanResponder?.panHandlers ?? {})}
            {...(Platform.OS === 'web'
              ? {
                  onMouseDown: (e: any) => slider.handleWebMouseDown(e, 'single'),
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
                value={slider.currentValue}
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

