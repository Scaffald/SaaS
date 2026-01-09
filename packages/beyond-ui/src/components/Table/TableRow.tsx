/**
 * TableRow component
 * Table row container with selection and expansion support
 *
 * @example
 * ```tsx
 * <TableRow
 *   selected={selected}
 *   expanded={expanded}
 *   onExpand={(expanded) => setExpanded(expanded)}
 *   onPress={() => handleRowPress(row)}
 * >
 *   <TableCell>Cell 1</TableCell>
 *   <TableCell>Cell 2</TableCell>
 * </TableRow>
 * ```
 */

import { useState } from 'react'
import { Pressable, View } from 'react-native'
import type { TableRowProps } from './Table.types'
import { getTableStyles, getRowStyles } from './Table.styles'
import { useThemeContext } from '../../playground/ThemeProvider'

export function TableRow({
  children,
  selected = false,
  expanded: controlledExpanded,
  onExpand,
  onPress,
  style,
  ...pressableProps
}: TableRowProps) {
  const { theme } = useThemeContext()
  const [internalExpanded, setInternalExpanded] = useState(false)

  // Use controlled or internal state
  const expanded =
    controlledExpanded !== undefined ? controlledExpanded : internalExpanded

  const styles = getTableStyles(theme)
  const rowStyles = getRowStyles(selected, expanded, theme)

  const handlePress = () => {
    if (onPress) {
      onPress()
    }

    if (onExpand) {
      const newExpanded = !expanded
      if (controlledExpanded === undefined) {
        setInternalExpanded(newExpanded)
      }
      onExpand(newExpanded)
    }
  }

  return (
    <Pressable
      {...pressableProps}
      onPress={onPress || onExpand ? handlePress : undefined}
      style={({ pressed }) => [
        styles.row,
        rowStyles,
        pressed && { opacity: 0.7 },
        style,
      ]}
    >
      {children}
    </Pressable>
  )
}
