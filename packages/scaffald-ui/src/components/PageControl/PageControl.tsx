/**
 * PageControl — iOS 26 style page indicator dots
 *
 * Displays a row of dots indicating the current page in a paginated view.
 * Active dot is fully opaque, inactive dots are 30% opacity.
 *
 * @example
 * ```tsx
 * <PageControl totalPages={5} currentPage={2} onPageChange={setPage} />
 * ```
 */

import type React from 'react'
import { Pressable, View } from 'react-native'
import type { PageControlProps } from './PageControl.types'
import { getPageControlStyles } from './PageControl.styles'
import { useStyles } from '../../hooks'
import { useThemeContext } from '../../theme'

export function PageControl({
  totalPages,
  currentPage,
  onPageChange,
  style,
  testID,
}: PageControlProps): React.ReactElement {
  const { theme } = useThemeContext()
  const styles = useStyles(getPageControlStyles, [theme] as const)

  const dots = Array.from({ length: Math.min(totalPages, 8) }, (_, i) => i)

  return (
    <View style={[styles.container, style]} testID={testID}>
      <View style={styles.dotsRow}>
        {dots.map((index) => {
          const isActive = index === currentPage
          const dotElement = (
            <View
              key={index}
              style={isActive ? styles.activeDot : styles.dot}
              accessibilityLabel={`Page ${index + 1} of ${totalPages}`}
              accessibilityState={{ selected: isActive }}
            />
          )

          if (onPageChange) {
            return (
              <Pressable key={index} onPress={() => onPageChange(index)} hitSlop={8}>
                <View style={isActive ? styles.activeDot : styles.dot} />
              </Pressable>
            )
          }

          return dotElement
        })}
      </View>
    </View>
  )
}
