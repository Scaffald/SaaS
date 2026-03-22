/**
 * PageControl — iOS 26 style page indicator dots
 *
 * Displays a row of dots indicating the current page in a paginated view.
 * Supports a "pill" variant with a glass capsule background and
 * dot size compression for 6+ pages.
 *
 * @example
 * ```tsx
 * <PageControl totalPages={5} currentPage={2} onPageChange={setPage} />
 * <PageControl totalPages={7} currentPage={3} variant="pill" />
 * ```
 */

import type React from 'react'
import { Pressable, View } from 'react-native'
import type { PageControlProps } from './PageControl.types'
import { getPageControlStyles } from './PageControl.styles'
import { useStyles } from '../../hooks'
import { useThemeContext } from '../../theme'

/**
 * Get the dot style based on distance from the active dot
 * For 6+ pages, edge dots progressively shrink
 */
function getDotStyle(
  index: number,
  currentPage: number,
  totalPages: number,
  styles: ReturnType<typeof getPageControlStyles>,
) {
  const isActive = index === currentPage

  if (isActive) return styles.activeDot

  // For <= 5 pages, all dots are the same size
  if (totalPages <= 5) return styles.dot

  // For 6+ pages, compress dots far from active
  const distance = Math.abs(index - currentPage)

  if (distance >= 3) return styles.tinyDot
  if (distance >= 2 && totalPages >= 7) return styles.smallDot

  return styles.dot
}

export function PageControl({
  totalPages,
  currentPage,
  onPageChange,
  variant = 'dots',
  style,
  testID,
}: PageControlProps): React.ReactElement {
  const { theme } = useThemeContext()
  const styles = useStyles(getPageControlStyles, [theme] as const)

  const dots = Array.from({ length: Math.min(totalPages, 8) }, (_, i) => i)

  const dotsContent = (
    <View style={styles.dotsRow}>
      {dots.map((index) => {
        const isActive = index === currentPage
        const dotStyle = getDotStyle(index, currentPage, totalPages, styles)

        if (onPageChange) {
          return (
            <Pressable key={index} onPress={() => onPageChange(index)} hitSlop={8}>
              <View
                style={dotStyle}
                accessibilityLabel={`Page ${index + 1} of ${totalPages}`}
                accessibilityState={{ selected: isActive }}
              />
            </Pressable>
          )
        }

        return (
          <View
            key={index}
            style={dotStyle}
            accessibilityLabel={`Page ${index + 1} of ${totalPages}`}
            accessibilityState={{ selected: isActive }}
          />
        )
      })}
    </View>
  )

  return (
    <View style={[styles.container, style]} testID={testID}>
      {variant === 'pill' ? (
        <View style={styles.pillContainer}>{dotsContent}</View>
      ) : (
        dotsContent
      )}
    </View>
  )
}
