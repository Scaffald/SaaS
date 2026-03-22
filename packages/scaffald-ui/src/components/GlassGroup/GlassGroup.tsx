/**
 * GlassGroup — Grouped Liquid Glass buttons sharing a single surface
 *
 * Wraps multiple GlassIconButtons in a single glass material surface,
 * similar to the iOS 26 Control Center connectivity module.
 *
 * @example
 * ```tsx
 * <GlassGroup direction="row" gap={12}>
 *   <GlassIconButton icon={<Wifi />} onPress={toggleWifi} accessibilityLabel="Wi-Fi" />
 *   <GlassIconButton icon={<Bluetooth />} onPress={toggleBT} accessibilityLabel="Bluetooth" />
 * </GlassGroup>
 * ```
 */

import type React from 'react'
import { Children, cloneElement, isValidElement } from 'react'
import { View } from 'react-native'
import { GlassSurface } from '../GlassSurface'
import type { GlassGroupProps } from './GlassGroup.types'
import { spacing } from '../../tokens/spacing'

export function GlassGroup({
  children,
  direction = 'row',
  material = 'regular',
  gap = spacing[8],
  radius = '2xl',
  style,
  testID,
}: GlassGroupProps): React.ReactElement {
  // Clone children to inject _skipSurface prop so they don't render their own glass
  const enhancedChildren = Children.map(children, (child) => {
    if (isValidElement(child) && typeof child.type !== 'string') {
      return cloneElement(child as React.ReactElement<{ _skipSurface?: boolean }>, {
        _skipSurface: true,
      })
    }
    return child
  })

  return (
    <GlassSurface
      material={material}
      variant="control-center"
      radius={radius}
      padding="md"
      insetShadow
      specularBorder
      style={style}
      testID={testID}
    >
      <View
        style={{
          flexDirection: direction,
          flexWrap: 'wrap',
          gap,
          alignItems: 'center',
        }}
      >
        {enhancedChildren}
      </View>
    </GlassSurface>
  )
}
