import { styled, Text } from 'tamagui'

export const Chip = styled(Text, {
  name: 'Chip',
  bg: '$background',
  borderColor: '$borderColor',
  borderWidth: 1,
  rounded: '$4',
  px: '$3',
  py: '$2',
  fontSize: '$3',
  color: '$color',

  variants: {
    variant: {
      default: {
        bg: '$background',
        borderColor: '$borderColor',
      },
      filled: {
        bg: '$blue9',
        color: '$blue1',
        borderColor: '$blue9',
      },
    },
    priority: {
      high: {
        bg: '$green3',
        color: '$green10',
        borderColor: '$green10',
      },
      medium: {
        bg: '$blue3',
        color: '$blue10',
        borderColor: '$blue10',
      },
      low: {
        bg: '$red3',
        color: '$red10',
        borderColor: '$red10',
      },
    },
  } as const,

  defaultVariants: {
    variant: 'default',
  },
})
