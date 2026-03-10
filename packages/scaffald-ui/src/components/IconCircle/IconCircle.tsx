/**
 * IconCircle component
 * Renders an icon inside a circular container with theme-aware background and shadow.
 * Used for consistent "icon in circle" treatment across preference cards and settings.
 *
 * @example
 * ```tsx
 * import { IconCircle } from '@scaffald/ui'
 * import { Plane } from 'lucide-react-native'
 *
 * <IconCircle icon={Plane} />
 * ```
 */

import { View } from 'react-native'
import type { IconCircleProps } from './IconCircle.types'
import { useThemeContext } from '../../theme'
import { colors } from '../../tokens/colors'
import { borderRadius } from '../../tokens/borders'
import { shadows } from '../../tokens/shadows'

const DEFAULT_SIZE = 40
const ICON_SIZE_RATIO = 0.5

export function IconCircle({
  icon: Icon,
  size = DEFAULT_SIZE,
  style,
}: IconCircleProps) {
  const { theme } = useThemeContext()
  const isLight = theme === 'light'
  const iconColor = isLight ? colors.gray[800] : colors.gray[100]
  const iconSize = Math.round(size * ICON_SIZE_RATIO)

  return (
    <View
      style={[
        {
          width: size,
          height: size,
          borderRadius: borderRadius.max,
          backgroundColor: isLight ? colors.gray[50] : colors.gray[800],
          justifyContent: 'center',
          alignItems: 'center',
          ...shadows.xs,
        },
        style,
      ]}
    >
      <Icon size={iconSize} color={iconColor} />
    </View>
  )
}
