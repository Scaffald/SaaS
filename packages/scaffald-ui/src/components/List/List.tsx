/**
 * List component
 * Container component for displaying lists of items
 *
 * @example
 * ```tsx
 * import { List, ListItem } from '@scaffald/ui'
 *
 * <List title="List title">
 *   <ListItem variant="task" {...taskProps} />
 *   <ListItem variant="task" {...taskProps} />
 * </List>
 * ```
 */

import { View, Text } from 'react-native'
import type { ListProps } from './List.types'
import { getListStyles } from './List.styles'
import { useThemeContext } from '../../theme'

export function List({ title, children, style, gap = 10, accessibilityLabel }: ListProps) {
  const { theme } = useThemeContext()
  const styles = getListStyles(theme, gap)

  return (
    <View
      style={[styles.container, style]}
      accessibilityLabel={accessibilityLabel}
      accessibilityRole="list"
    >
      {title && <Text style={styles.title}>{title}</Text>}
      <View style={styles.content}>{children}</View>
    </View>
  )
}
