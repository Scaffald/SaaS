/**
 * TaskListItem component
 * Task list item with colored icon and metadata
 *
 * @example
 * ```tsx
 * import { TaskListItem } from '@scaffald/ui'
 *
 * <TaskListItem
 *   title="Opportunity 4"
 *   metadata="Opportunity Pipeline"
 *   updatedText="Updated 10 min ago"
 *   iconColor="success"
 * />
 * ```
 */

import { View, Text } from 'react-native'
import { Check } from 'lucide-react-native'
import type { TaskProps } from '../ListItem.types'
import { getListItemStyles } from '../ListItem.styles'
import { useThemeContext } from '../../../theme'
import { colors } from '../../../tokens/colors'
import { spacing } from '../../../tokens/spacing'

export function TaskListItem({
  iconColor = 'success',
  icon,
  title,
  metadata,
  updatedText,
  onPress,
  style,
  accessibilityLabel,
}: Omit<TaskProps, 'variant'>) {
  const { theme } = useThemeContext()
  const styles = getListItemStyles('task', theme)

  const iconColors = {
    success: colors.success[500],
    error: colors.error[500],
    warning: colors.warning[500],
    info: colors.info[500],
  }

  return (
    <View style={[styles.container, style]}>
      {/* Colored icon */}
      <View style={styles.leftSection}>
        {icon || (
          <View
            style={{
              width: 24,
              height: 24,
              borderRadius: 12,
              backgroundColor: iconColors[iconColor],
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <Check size={16} color={colors.gray[0]} />
          </View>
        )}
      </View>

      {/* Content */}
      <View style={styles.contentSection}>
        <Text style={styles.title}>{title}</Text>
        {/* Metadata with dot separators */}
        {(metadata || updatedText) && (
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: spacing[2] }}>
            {metadata && (
              <>
                <Text style={styles.metadata}>{metadata}</Text>
                {updatedText && (
                  <>
                    <View
                      style={{
                        width: 8,
                        height: 8,
                        borderRadius: 4,
                        backgroundColor: colors.gray[700],
                      }}
                    />
                    <Text style={styles.metadata}>{updatedText}</Text>
                  </>
                )}
              </>
            )}
          </View>
        )}
      </View>
    </View>
  )
}
