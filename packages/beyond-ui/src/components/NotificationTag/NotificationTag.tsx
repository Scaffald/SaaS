/**
 * NotificationTag – small badge/tag for notification counts or labels.
 */

import { View } from 'react-native'
import { Row } from '../Layout'
import { Text } from '../Typography'
import { colors } from '../../tokens/colors'
import { spacing } from '../../tokens/spacing'
import { borderRadius } from '../../tokens/borders'
import type { NotificationTagProps } from './NotificationTag.types'

const sizeStyles = {
  sm: {
    paddingHorizontal: spacing[2],
    paddingVertical: spacing[1],
    fontSize: 12 as const,
  },
  md: {
    paddingHorizontal: spacing[3],
    paddingVertical: spacing[1],
    fontSize: 14 as const,
  },
}

export function NotificationTag({
  size = 'sm',
  children,
  style,
}: NotificationTagProps) {
  const s = sizeStyles[size]
  return (
    <Row
      align="center"
      style={{
        backgroundColor: colors.gray[100],
        borderRadius: borderRadius.m,
        paddingHorizontal: s.paddingHorizontal,
        paddingVertical: s.paddingVertical,
        ...style,
      }}
    >
      <Text
        style={{
          fontSize: s.fontSize,
          fontWeight: '600',
          color: colors.text.light.secondary,
        }}
      >
        {children}
      </Text>
    </Row>
  )
}
