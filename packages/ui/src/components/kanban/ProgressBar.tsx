import { memo } from 'react'
import type { GetThemeValueForKey } from '@tamagui/core'
import { Progress } from '@tamagui/progress'

export interface ProgressBarProps {
  /** Progress value (0-100) */
  value: number
  /** Optional color for the progress indicator */
  color?: GetThemeValueForKey<'backgroundColor'>
  /** Optional size (height) of the progress bar */
  size?: number
  /** Optional background color */
  backgroundColor?: GetThemeValueForKey<'backgroundColor'>
}

/**
 * ProgressBar - Simple progress bar component for Kanban cards
 *
 * Displays a progress indicator with customizable color and size.
 * Used to visualize scores, completion percentages, or other metrics.
 *
 * @example
 * ```tsx
 * <ProgressBar value={75} color="$green9" />
 * <ProgressBar value={50} color="$blue9" size={6} />
 * ```
 */
export const ProgressBar = memo(
  ({ value, color = '$blue9', size = 4, backgroundColor = '$color4' }: ProgressBarProps) => {
    const clampedValue = Math.max(0, Math.min(100, value))

    return (
      <Progress
        value={clampedValue}
        max={100}
        background={backgroundColor as string}
        style={{ borderRadius: 4 }}
        height={size}
      >
        <Progress.Indicator background={color as string} style={{ borderRadius: 4 }} animation="quick" />
      </Progress>
    )
  }
)

ProgressBar.displayName = 'ProgressBar'
