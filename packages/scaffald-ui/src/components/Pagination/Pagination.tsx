/**
 * Pagination component
 * Navigation component for paginated content with multiple display variants
 *
 * @example
 * ```tsx
 * import { Pagination } from '@scaffald/ui'
 *
 * // Basic pagination
 * <Pagination totalPages={10} />
 *
 * // Controlled pagination
 * <Pagination
 *   totalPages={50}
 *   currentPage={currentPage}
 *   onPageChange={setCurrentPage}
 * />
 *
 * // Label variant with navigation text
 * <Pagination
 *   totalPages={20}
 *   type="label"
 *   showNavText
 *   showNavBorder
 * />
 *
 * // Square page buttons with custom sibling count
 * <Pagination
 *   totalPages={100}
 *   pageRadius="square"
 *   siblingCount={2}
 *   boundaryCount={2}
 * />
 * ```
 */

import { useState } from 'react'
import { View, Text, Pressable, StyleSheet, Platform } from 'react-native'
import type { ViewStyle } from 'react-native'
import { ChevronLeft, ChevronRight } from 'lucide-react-native'
import type { PaginationProps } from './Pagination.types'
import { generatePageItems } from './Pagination.utils'
import { useThemeContext } from '../../theme'
import { colors } from '../../tokens/colors'
import { spacing } from '../../tokens/spacing'
import { borderRadius } from '../../tokens/borders'
import { typography } from '../../tokens/typography'

// Pagination-specific violet accent color (from Figma design)
const PAGINATION_ACCENT = '#8b5cf6'

/**
 * Internal component for navigation buttons (Previous/Next)
 */
interface PaginationNavButtonProps {
  direction: 'prev' | 'next'
  disabled: boolean
  onPress: () => void
  showText?: boolean
  showBorder?: boolean
  style?: ViewStyle
}

function PaginationNavButton({
  direction,
  disabled,
  onPress,
  showText = false,
  showBorder = false,
  style,
}: PaginationNavButtonProps) {
  const [isHovered, setIsHovered] = useState(false)
  const { theme } = useThemeContext()
  const isLight = theme === 'light'

  const Icon = direction === 'prev' ? ChevronLeft : ChevronRight
  const label = direction === 'prev' ? 'Previous' : 'Next'

  // Get icon color based on state
  const iconColor = disabled
    ? isLight
      ? colors.text.light.disabled
      : colors.text.dark.disabled
    : isLight
      ? colors.icon.light.default
      : colors.icon.dark.default

  // Get text color
  const textColor = disabled
    ? isLight
      ? colors.text.light.disabled
      : colors.text.dark.disabled
    : isLight
      ? colors.text.light.secondary
      : colors.text.dark.secondary

  return (
    <Pressable
      onPress={onPress}
      disabled={disabled}
      style={({ pressed }) => [
        styles.navButton,
        showBorder && {
          borderWidth: 1,
          borderColor: isLight ? colors.border.light['200'] : colors.border.dark['200'],
        },
        isHovered &&
          !disabled && {
            backgroundColor: isLight ? colors.bg.light.subtle : colors.bg.dark.subtle,
          },
        disabled && styles.navButtonDisabled,
        pressed && !disabled && { opacity: 0.8 },
        style,
      ]}
      {...(Platform.OS === 'web' && {
        onMouseEnter: () => setIsHovered(true),
        onMouseLeave: () => setIsHovered(false),
      })}
      accessibilityRole="button"
      accessibilityLabel={`${label} page`}
    >
      <Icon size={20} color={iconColor} />
      {showText && <Text style={[styles.navButtonText, { color: textColor }]}>{label}</Text>}
    </Pressable>
  )
}

/**
 * Internal component for page number buttons
 */
interface PaginationPageButtonProps {
  page: number
  active: boolean
  disabled: boolean
  radius: 'square' | 'rounded'
  onPress: () => void
  style?: ViewStyle
}

function PaginationPageButton({
  page,
  active,
  disabled,
  radius,
  onPress,
  style,
}: PaginationPageButtonProps) {
  const [isHovered, setIsHovered] = useState(false)
  const { theme } = useThemeContext()
  const isLight = theme === 'light'

  // Get text color based on state
  const textColor = active
    ? '#ffffff' // White text on violet background
    : disabled
      ? isLight
        ? colors.text.light.disabled
        : colors.text.dark.disabled
      : isLight
        ? colors.text.light.secondary
        : colors.text.dark.secondary

  return (
    <Pressable
      onPress={onPress}
      disabled={disabled}
      style={({ pressed }) => [
        styles.pageButton,
        {
          borderRadius: radius === 'square' ? borderRadius.s : borderRadius.max,
        },
        active && {
          backgroundColor: PAGINATION_ACCENT,
        },
        isHovered &&
          !active &&
          !disabled && {
            backgroundColor: isLight ? colors.bg.light.subtle : colors.bg.dark.subtle,
          },
        disabled && styles.pageButtonDisabled,
        pressed && !disabled && { opacity: 0.8 },
        style,
      ]}
      {...(Platform.OS === 'web' && {
        onMouseEnter: () => setIsHovered(true),
        onMouseLeave: () => setIsHovered(false),
      })}
      accessibilityRole="button"
      accessibilityLabel={`Page ${page}`}
      {...(active && { 'aria-current': 'page' })}
    >
      <Text style={[styles.pageButtonText, { color: textColor }]}>{page}</Text>
    </Pressable>
  )
}

/**
 * Main Pagination component
 */
export function Pagination({
  totalPages,
  currentPage,
  defaultPage = 1,
  onPageChange,
  type = 'numbers',
  position = 'center',
  pageRadius = 'rounded',
  showNavText = false,
  showNavBorder = false,
  siblingCount = 1,
  boundaryCount = 1,
  disabled = false,
  style,
  pageButtonStyle,
  navButtonStyle,
}: PaginationProps) {
  // Controlled/uncontrolled state pattern
  const [internalPage, setInternalPage] = useState(defaultPage)
  const currentPageValue = currentPage !== undefined ? currentPage : internalPage

  const { theme } = useThemeContext()
  const isLight = theme === 'light'

  // Handle page change
  const handlePageChange = (page: number) => {
    // Validate page range
    if (page < 1 || page > totalPages || disabled) return

    // Update internal state if uncontrolled
    if (currentPage === undefined) {
      setInternalPage(page)
    }

    // Call onChange handler
    onPageChange?.(page)
  }

  // Generate page items with ellipsis
  const pageItems = generatePageItems(currentPageValue, totalPages, siblingCount, boundaryCount)

  // Determine container alignment style
  const getPositionStyle = (): ViewStyle => {
    switch (position) {
      case 'left':
        return { alignSelf: 'flex-start' }
      case 'right':
        return { alignSelf: 'flex-end' }
      default:
        return { alignSelf: 'center' }
    }
  }

  // Get label text color
  const labelTextColor = disabled
    ? isLight
      ? colors.text.light.disabled
      : colors.text.dark.disabled
    : isLight
      ? colors.text.light.secondary
      : colors.text.dark.secondary

  // Get ellipsis text color
  const ellipsisTextColor = isLight ? colors.text.light.secondary : colors.text.dark.secondary

  return (
    <View style={[styles.container, getPositionStyle(), style]}>
      {type === 'numbers' ? (
        <View style={styles.numbersContainer}>
          {/* Previous button */}
          <PaginationNavButton
            direction="prev"
            disabled={currentPageValue === 1 || disabled}
            onPress={() => handlePageChange(currentPageValue - 1)}
            showText={showNavText}
            showBorder={showNavBorder}
            style={navButtonStyle}
          />

          {/* Page number buttons */}
          {pageItems.map((item, index, array) => {
            // For ellipsis, create a stable key based on adjacent page numbers
            if (item === 'ellipsis') {
              const prevItem = array[index - 1]
              const nextItem = array[index + 1]
              const ellipsisKey = `ellipsis-${prevItem}-${nextItem}`

              return (
                <View key={ellipsisKey} style={styles.ellipsis}>
                  <Text style={[styles.ellipsisText, { color: ellipsisTextColor }]}>...</Text>
                </View>
              )
            }

            return (
              <PaginationPageButton
                key={item}
                page={item}
                active={item === currentPageValue}
                disabled={disabled}
                radius={pageRadius}
                onPress={() => handlePageChange(item)}
                style={pageButtonStyle}
              />
            )
          })}

          {/* Next button */}
          <PaginationNavButton
            direction="next"
            disabled={currentPageValue === totalPages || disabled}
            onPress={() => handlePageChange(currentPageValue + 1)}
            showText={showNavText}
            showBorder={showNavBorder}
            style={navButtonStyle}
          />
        </View>
      ) : (
        <View style={styles.labelContainer}>
          {/* Previous button */}
          <PaginationNavButton
            direction="prev"
            disabled={currentPageValue === 1 || disabled}
            onPress={() => handlePageChange(currentPageValue - 1)}
            showText={showNavText}
            showBorder={showNavBorder}
            style={navButtonStyle}
          />

          {/* Label */}
          <Text style={[styles.label, { color: labelTextColor }]}>
            Page {currentPageValue} of {totalPages}
          </Text>

          {/* Next button */}
          <PaginationNavButton
            direction="next"
            disabled={currentPageValue === totalPages || disabled}
            onPress={() => handlePageChange(currentPageValue + 1)}
            showText={showNavText}
            showBorder={showNavBorder}
            style={navButtonStyle}
          />
        </View>
      )}
    </View>
  )
}

const styles = StyleSheet.create({
  container: {
    // Position is dynamic via getPositionStyle()
  },
  numbersContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing[8],
  },
  labelContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing[12],
  },

  // Navigation buttons
  navButton: {
    height: 36,
    minWidth: 36,
    paddingHorizontal: spacing[8],
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing[4],
    borderRadius: borderRadius.s,
  },
  navButtonText: {
    fontFamily: typography.small.fontFamily,
    fontSize: typography.small.fontSize,
    fontWeight: typography.bodyMedium.fontWeight,
    lineHeight: typography.small.lineHeight,
  },
  navButtonDisabled: {
    opacity: 0.5,
  },

  // Page buttons
  pageButton: {
    height: 36,
    minWidth: 36,
    paddingHorizontal: spacing[8],
    justifyContent: 'center',
    alignItems: 'center',
  },
  pageButtonText: {
    fontFamily: typography.small.fontFamily,
    fontSize: typography.small.fontSize,
    fontWeight: typography.bodyMedium.fontWeight,
    lineHeight: typography.small.lineHeight,
  },
  pageButtonDisabled: {
    opacity: 0.5,
  },

  // Ellipsis
  ellipsis: {
    width: 36,
    height: 36,
    justifyContent: 'center',
    alignItems: 'center',
  },
  ellipsisText: {
    fontFamily: typography.small.fontFamily,
    fontSize: typography.small.fontSize,
  },

  // Label type
  label: {
    fontFamily: typography.body.fontFamily,
    fontSize: typography.body.fontSize,
    fontWeight: typography.bodyMedium.fontWeight,
    lineHeight: typography.body.lineHeight,
  },
})
