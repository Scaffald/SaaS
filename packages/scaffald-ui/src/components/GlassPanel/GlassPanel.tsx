/**
 * GlassPanel — Liquid Glass content container
 *
 * A panel with Liquid Glass material for dashboard widgets, settings groups,
 * and content sections. Composes GlassSurface with header/footer slots.
 *
 * @example
 * ```tsx
 * <GlassPanel material="thick" padding="lg" radius="xl">
 *   <Text>Dashboard content</Text>
 * </GlassPanel>
 *
 * <GlassPanel header={<Text>Settings</Text>} padding="md">
 *   <SettingsRow label="Notifications" />
 * </GlassPanel>
 * ```
 */

import type React from 'react'
import { View, Pressable } from 'react-native'
import { GlassSurface } from '../GlassSurface'
import type { GlassPanelProps } from './GlassPanel.types'
import { spacing } from '../../tokens/spacing'

export function GlassPanel({
  children,
  material = 'regular',
  padding = 'lg',
  radius = 'xl',
  header,
  footer,
  pressable = false,
  onPress,
  style,
  testID,
}: GlassPanelProps): React.ReactElement {
  const content = (
    <>
      {header && (
        <View style={{ paddingBottom: spacing[8] }}>{header}</View>
      )}
      {children}
      {footer && (
        <View style={{ paddingTop: spacing[8] }}>{footer}</View>
      )}
    </>
  )

  if (pressable && onPress) {
    return (
      <Pressable onPress={onPress} testID={testID}>
        {({ pressed }) => (
          <GlassSurface
            material={material}
            radius={radius}
            padding={padding}
            specularBorder
            style={[pressed && { opacity: 0.9, transform: [{ scale: 0.98 }] }, style]}
          >
            {content}
          </GlassSurface>
        )}
      </Pressable>
    )
  }

  return (
    <GlassSurface
      material={material}
      radius={radius}
      padding={padding}
      specularBorder
      style={style}
      testID={testID}
    >
      {content}
    </GlassSurface>
  )
}
