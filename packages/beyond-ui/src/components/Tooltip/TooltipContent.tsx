/**
 * Tooltip Content component
 * Renders Default or Rich tooltip content with proper typography and layout
 */

import { View, Text, Pressable } from 'react-native'
import type { TooltipContentProps } from './Tooltip.types'
import { getTooltipStyles, getDefaultTooltipTextStyle } from './Tooltip.styles'

/**
 * Tooltip Content component
 */
export function TooltipContent({
  type,
  color,
  content,
  title,
  description,
  actions = [],
  showActions,
  style,
}: TooltipContentProps) {
  const styles = getTooltipStyles(type, color)
  const isRich = type === 'rich'

  // Limit actions to max 2 (matching Alert component pattern)
  const limitedActions = actions.slice(0, 2)

  if (isRich) {
    // Rich tooltip: Title + Description + Actions
    return (
      <View style={[styles.content, styles.richContent, style]}>
        {/* Title and Description Container */}
        <View style={{ flexDirection: 'column', gap: 4, alignItems: 'flex-start', width: '100%' }}>
          {title && (
            <Text style={styles.richTitle} numberOfLines={undefined}>
              {title}
            </Text>
          )}
          {description && (
            <Text style={styles.richDescription} numberOfLines={undefined}>
              {typeof description === 'string' ? description : description}
            </Text>
          )}
        </View>

        {/* Actions Container */}
        {showActions && limitedActions.length > 0 && (
          <View style={styles.richActions}>
            {limitedActions.map((action, index) => (
              <Pressable
                key={index}
                style={({ pressed }) => [
                  styles.actionButton,
                  pressed && { opacity: 0.7 },
                ]}
                onPress={action.onPress}
              >
                <Text style={styles.actionButtonText}>{action.label}</Text>
              </Pressable>
            ))}
          </View>
        )}
      </View>
    )
  }

  // Default tooltip: Simple content
  if (typeof content === 'string') {
    return (
      <View style={[styles.content, styles.defaultContent, style]}>
        <Text style={[getDefaultTooltipTextStyle(color), { flex: 1 }]} numberOfLines={undefined}>
          {content}
        </Text>
      </View>
    )
  }

  // If content is a ReactNode, render it in a container
  if (content) {
    return (
      <View style={[styles.content, styles.defaultContent, style]}>
        {content}
      </View>
    )
  }

  // No content provided
  return null
}

