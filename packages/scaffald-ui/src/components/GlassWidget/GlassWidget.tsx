/**
 * GlassWidget — Liquid Glass dashboard widget tile
 *
 * A larger widget container with standardized header layout (icon + title + subtitle)
 * and Control Center inset shadow effect. Matches the iOS 26 expanded tiles.
 *
 * @example
 * ```tsx
 * <GlassWidget
 *   title="Floor Lamp"
 *   subtitle="Living Room"
 *   icon={<Lightbulb size={15} color="white" />}
 *   size="lg"
 * />
 *
 * <GlassWidget
 *   title="Focus"
 *   subtitle="Do Not Disturb"
 *   icon={<Moon size={15} color="white" />}
 *   size="md"
 *   pressable
 *   onPress={() => toggleFocus()}
 * />
 * ```
 */

import type React from 'react'
import { View, Pressable } from 'react-native'
import { Text } from '../Typography'
import { GlassSurface } from '../GlassSurface'
import type { GlassWidgetProps, GlassWidgetSize } from './GlassWidget.types'
import { spacing } from '../../tokens/spacing'
import type { CardRadius } from '../Card/Card.types'

const SIZE_CONFIG: Record<GlassWidgetSize, { width: number; height: number; radius: CardRadius }> = {
  sm: { width: 68, height: 68, radius: 'xl' },
  md: { width: 151, height: 68, radius: 'xl' },
  lg: { width: 151, height: 151, radius: '2xl' },
}

export function GlassWidget({
  children,
  title,
  subtitle,
  icon,
  material = 'regular',
  size = 'lg',
  pressable = false,
  onPress,
  style,
  testID,
}: GlassWidgetProps): React.ReactElement {
  const config = SIZE_CONFIG[size]

  const widgetContent = (
    <GlassSurface
      material={material}
      variant="control-center"
      radius={config.radius}
      padding="md"
      insetShadow
      specularBorder
      style={[{ width: config.width, height: config.height }, style]}
      testID={testID}
    >
      {/* Icon badge */}
      {icon && (
        <View
          style={{
            width: 40,
            height: 40,
            borderRadius: 20,
            backgroundColor: 'rgba(255, 255, 255, 0.06)',
            alignItems: 'center',
            justifyContent: 'center',
            marginBottom: size === 'lg' ? spacing[8] : 0,
          }}
        >
          {icon}
        </View>
      )}

      {/* Custom content */}
      {children}

      {/* Title + subtitle (rendered at bottom for lg, inline for md) */}
      {(title || subtitle) && (
        <View
          style={
            size === 'lg'
              ? { position: 'absolute', bottom: 14, left: 16, right: 16 }
              : { flex: 1, justifyContent: 'center' }
          }
        >
          {title && (
            <Text
              size="sm"
              color="quaternary"
              weight="semibold"
              numberOfLines={1}
            >
              {title}
            </Text>
          )}
          {subtitle && (
            <Text
              size="xs"
              style={{ color: 'rgba(255, 255, 255, 0.33)' }}
              numberOfLines={1}
            >
              {subtitle}
            </Text>
          )}
        </View>
      )}
    </GlassSurface>
  )

  if (pressable && onPress) {
    return (
      <Pressable
        onPress={onPress}
        accessibilityRole="button"
        style={({ pressed }) =>
          pressed ? { opacity: 0.8, transform: [{ scale: 0.97 }] } : undefined
        }
      >
        {widgetContent}
      </Pressable>
    )
  }

  return widgetContent
}
