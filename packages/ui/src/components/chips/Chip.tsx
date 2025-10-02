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
  } as const,

  defaultVariants: {
    variant: 'default',
  },
})
