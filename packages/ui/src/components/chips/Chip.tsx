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
  backgroundColor: '$background',
  borderColor: '$borderColor',
  borderWidth: 1,
  borderRadius: '$4',
  paddingHorizontal: '$3',
  paddingVertical: '$2',
  fontSize: '$3',
  color: '$color',

  variants: {
    variant: {
      default: {
        backgroundColor: '$background',
        borderColor: '$borderColor',
      },
      filled: {
        backgroundColor: '$blue9',
        color: '$blue1',
        borderColor: '$blue9',
      },
    },
    priority: {
      high: {
        backgroundColor: '$green3',
        color: '$green10',
        borderColor: '$green10',
      },
      medium: {
        backgroundColor: '$blue3',
        color: '$blue10',
        borderColor: '$blue10',
      },
      low: {
        backgroundColor: '$red3',
        color: '$red10',
        borderColor: '$red10',
      },
    },
  } as const,

  defaultVariants: {
    variant: 'default',
  },
})

export const Chip = ChipBase as unknown as typeof Text & ((props: ChipProps) => ReactElement)
