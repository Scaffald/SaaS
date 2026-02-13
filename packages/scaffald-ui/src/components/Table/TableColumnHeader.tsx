/**
 * TableColumnHeader component
 * Column header with sorting and selection support
 *
 * @example
 * ```tsx
 * import { TableColumnHeader } from '@scaffald/ui'
 *
 * // Sortable header
 * <TableColumnHeader
 *   title="Name"
 *   sortable
 *   sortDirection="asc"
 *   onSort={(direction) => console.log('Sort:', direction)}
 * />
 *
 * // Header with checkbox
 * <TableColumnHeader
 *   title="Select All"
 *   showCheckbox
 *   checked={allSelected}
 *   onCheckboxChange={setAllSelected}
 * />
 * ```
 */

import { useState } from 'react'
import { View, Text, Pressable, Platform } from 'react-native'
import { ChevronUp, ChevronDown } from 'lucide-react-native'
import type { TableColumnHeaderProps, SortDirection } from './TableColumnHeader.types'
import { getTableColumnHeaderStyles } from './TableColumnHeader.styles'
import { useThemeContext } from '../../theme'
import { Checkbox } from '../Checkbox'
import { colors } from '../../tokens/colors'
import { spacing } from '../../tokens/spacing'

/**
 * TableColumnHeader component
 */
export function TableColumnHeader({
  title,
  sortable = false,
  sortDirection = null,
  onSort,
  showCheckbox = false,
  checked = false,
  onCheckboxChange,
  showRightIcon = true,
  state = 'default',
  width,
  align = 'left',
  style,
  textStyle,
  children,
  ...pressableProps
}: TableColumnHeaderProps) {
  const { theme } = useThemeContext()
  const [_isHovered, setIsHovered] = useState(false)

  // Get styles for current state, alignment, and theme
  const styles = getTableColumnHeaderStyles(state, align, theme, width)

  // Handle sort click
  const handleSort = () => {
    if (!sortable || !onSort) return

    // Cycle through sort directions: null -> asc -> desc -> null
    let newDirection: SortDirection = null
    if (sortDirection === null) {
      newDirection = 'asc'
    } else if (sortDirection === 'asc') {
      newDirection = 'desc'
    } else {
      newDirection = null
    }

    onSort(newDirection)
  }

  // Handle checkbox change
  const handleCheckboxChange = (newChecked: boolean) => {
    onCheckboxChange?.(newChecked)
  }

  // Render empty state
  if (state === 'empty') {
    return <View style={[styles.container, style]} />
  }

  const Container = sortable && onSort ? Pressable : View

  return (
    <Container
      {...(Platform.OS === 'web' && sortable && {
        onMouseEnter: () => setIsHovered(true),
        onMouseLeave: () => setIsHovered(false),
      } as any)}
      onPress={sortable ? handleSort : undefined}
      style={({ pressed }) => [
        styles.container,
        sortable && pressed && Platform.OS !== 'web' && { opacity: 0.8 },
        style,
      ]}
      {...pressableProps}
    >
      {/* Checkbox */}
      {showCheckbox && (
        <Checkbox
          checked={checked}
          onChange={handleCheckboxChange}
          size="md"
          color="primary"
          style={{ margin: 0 }}
        />
      )}

      {/* Title or custom content */}
      <View style={{ flex: 1, flexDirection: 'row', alignItems: 'center', gap: spacing[8] }}>
        {children || (title && <Text style={[styles.text, textStyle]}>{title}</Text>)}
      </View>

      {/* Sort icon */}
      {showRightIcon && sortable && (
        <View style={{ width: 14, height: 14, alignItems: 'center', justifyContent: 'center' }}>
          {sortDirection === 'asc' ? (
            <ChevronUp size={14} color={styles.iconColor || colors.text[theme].secondary} />
          ) : sortDirection === 'desc' ? (
            <ChevronDown size={14} color={styles.iconColor || colors.text[theme].secondary} />
          ) : (
            <View style={{ flexDirection: 'column', gap: 1 }}>
              <ChevronUp size={7} color={colors.text[theme].tertiary} />
              <ChevronDown size={7} color={colors.text[theme].tertiary} />
            </View>
          )}
        </View>
      )}
    </Container>
  )
}
