/**
 * Spacer component
 * Flexible space that expands to fill available space
 *
 * Spacer is used to push elements apart or create fixed gaps in layouts.
 * By default, it flexes to fill available space. You can also specify
 * a fixed size for consistent spacing.
 *
 * @example
 * ```tsx
 * import { Row, Spacer, Button } from '@scaffald/ui'
 *
 * // Push items apart (flex mode)
 * <Row>
 *   <Button>Left</Button>
 *   <Spacer />
 *   <Button>Right</Button>
 * </Row>
 *
 * // Fixed size spacer
 * <Row>
 *   <Button>Left</Button>
 *   <Spacer size={24} />
 *   <Button>Right</Button>
 * </Row>
 *
 * // Multiple spacers with different weights
 * <Row>
 *   <Button>Left</Button>
 *   <Spacer flex={1} />
 *   <Button>Center</Button>
 *   <Spacer flex={2} />
 *   <Button>Right</Button>
 * </Row>
 *
 * // <Spacer /> or <Spacer size={16} />
 * ```
 */

import { useMemo } from 'react'
import { View, type ViewStyle } from 'react-native'
import type { SpacerProps } from './Spacer.types'
import type { SpacingValue } from './Box.types'
import { spacing } from '../../tokens/spacing'

/**
 * Resolve a spacing value to a number
 */
function resolveSpacing(value: SpacingValue | undefined): number | undefined {
  if (value === undefined) return undefined
  if (typeof value === 'number') return value
  const key = value as keyof typeof spacing
  return spacing[key]
}

export function Spacer({ size, flex = 1, style, ...viewProps }: SpacerProps) {
  const computedStyle = useMemo<ViewStyle>(() => {
    const resolvedSize = resolveSpacing(size)

    if (resolvedSize !== undefined) {
      // Fixed size mode
      return {
        width: resolvedSize,
        height: resolvedSize,
        flexGrow: 0,
        flexShrink: 0,
      }
    }

    // Flex mode (default)
    return {
      flex,
    }
  }, [size, flex])

  return <View style={[computedStyle, style]} {...viewProps} />
}

export type { SpacerProps } from './Spacer.types'
