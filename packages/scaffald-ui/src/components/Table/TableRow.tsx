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
import { Pressable, } from 'react-native'
import { getTableStyles } from './Table.styles'
import { useStyles } from '../../hooks'
import { colors } from '../../tokens/colors'
import type { ThemeMode } from '../../tokens/colors'

// Legacy component - TableRowProps moved to Table component
interface TableRowProps {
  children?: React.ReactNode
  selected?: boolean
  expanded?: boolean
  onExpand?: (expanded: boolean) => void
  onPress?: () => void
  style?: any
}

// Helper function for row styles
function getRowStyles(selected: boolean, expanded: boolean, theme: ThemeMode = 'light') {
  return {
    backgroundColor: selected
      ? (theme === 'light' ? colors.primary[50] : colors.primary[900])
      : expanded
        ? colors.bg[theme].subtle || colors.gray[50]
        : colors.bg[theme].default,
  }
}
import { useThemeContext } from '../../theme'

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

  const _styles = useStyles(getTableStyles, [theme] as const)
  const rowStyles = useStyles(getRowStyles, [selected, expanded, theme] as const)

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
      onPress={onPress || onExpand ? handlePress : undefined}
      style={({ pressed }) => [
        {
          flexDirection: 'row',
          alignItems: 'center',
          minHeight: 68,
          borderBottomWidth: 1,
          borderBottomColor: colors.border[theme].default,
        },
        rowStyles,
        pressed && { opacity: 0.7 },
        style,
      ]}
    >
      {children}
    </Pressable>
  )
}
