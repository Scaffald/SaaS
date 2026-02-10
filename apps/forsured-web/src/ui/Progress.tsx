/**
 * Progress wrapper ProgressBar
 * Provides backwards-compatible API for existing code
 */
import React from 'react'
import { ProgressBar as BeyondProgressBar, type ProgressBarColor } from '@unicornlove/beyond-ui'
import { View, Text, StyleSheet } from 'react-native'

export type ProgressVariant = 'primary' | 'success' | 'warning' | 'error'
export type ProgressSize = 'sm' | 'md' | 'lg'

export interface ProgressProps {
  value: number
  max?: number
  variant?: ProgressVariant
  size?: ProgressSize
  showLabel?: boolean
  label?: string
  className?: string
}

// Map our variant to Beyond UI color
const variantToColor: Record<ProgressVariant, ProgressBarColor> = {
  primary: 'primary',
  success: 'success',
  warning: 'primary', // Beyond UI doesn't have warning, map to primary
  error: 'error',
}

export default function Progress({
  value,
  max = 100,
  variant = 'primary',
  size = 'md',
  showLabel = false,
  label,
  className = '',
}: ProgressProps) {
  const percentage = Math.min(Math.max((value / max) * 100, 0), 100)

  return (
    <BeyondProgressBar
      value={percentage}
      color={variantToColor[variant]}
      label={label}
      showLabel={showLabel || !!label}
      showIndicator={showLabel}
      indicatorIconType="none"
    />
  )
}

// CircularProgress - Beyond UI doesn't have a direct equivalent,
// so we keep a simplified version
export function CircularProgress({
  value,
  max = 100,
  variant = 'primary',
  size = 64,
  strokeWidth = 4,
  showLabel = true,
  className = '',
}: Omit<ProgressProps, 'size'> & { size?: number; strokeWidth?: number }) {
  const percentage = Math.min(Math.max((value / max) * 100, 0), 100)
  const radius = (size - strokeWidth) / 2
  const circumference = radius * 2 * Math.PI
  const offset = circumference - (percentage / 100) * circumference

  const variantColors: Record<ProgressVariant, string> = {
    primary: '#6366f1',
    success: '#22c55e',
    warning: '#f59e0b',
    error: '#ef4444',
  }

  const styles = StyleSheet.create({
    container: {
      position: 'relative',
      alignItems: 'center',
      justifyContent: 'center',
      width: size,
      height: size,
    },
    label: {
      position: 'absolute',
      fontSize: 14,
      fontWeight: '600',
      color: variantColors[variant],
    },
  })

  return (
    <View style={styles.container}>
      <svg width={size} height={size} style={{ transform: 'rotate(-90deg)' }}>
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          stroke="currentColor"
          strokeWidth={strokeWidth}
          fill="none"
          opacity={0.2}
        />
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          stroke={variantColors[variant]}
          strokeWidth={strokeWidth}
          fill="none"
          strokeDasharray={circumference}
          strokeDashoffset={offset}
          style={{ transition: 'stroke-dashoffset 0.3s ease-out' }}
        />
      </svg>
      {showLabel && <Text style={styles.label}>{Math.round(percentage)}%</Text>}
    </View>
  )
}
