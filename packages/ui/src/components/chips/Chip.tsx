import type { ReactElement, ReactNode } from 'react'
import { styled } from '@tamagui/core'
import { Text } from 'tamagui'
import type { TextProps } from 'tamagui'

export type ChipProps = TextProps & {
  variant?: 'default' | 'filled'
  priority?: 'high' | 'medium' | 'low'
  children?: ReactNode
}

const ChipBase = styled(Text, {
  name: 'Chip',
  background: '$background',
  borderColor: '$borderColor',
  borderWidth: 1,
  paddingHorizontal: '$3',
  paddingVertical: '$2',
  fontSize: '$3',
  color: '$color',

  variants: {
    variant: {
      default: {
        background: '$background',
        borderColor: '$borderColor',
      },
      filled: {
        background: '$blue9',
        color: '$blue1',
        borderColor: '$blue9',
      },
    },
    priority: {
      high: {
        background: '$green3',
        color: '$green10',
        borderColor: '$green10',
      },
      medium: {
        background: '$blue3',
        color: '$blue10',
        borderColor: '$blue10',
      },
      low: {
        background: '$red3',
        color: '$red10',
        borderColor: '$red10',
      },
    },
  } as const,

  defaultVariants: {
    variant: 'default',
  },
} as any)

export const Chip = ChipBase as unknown as typeof Text & ((props: ChipProps) => ReactElement)
