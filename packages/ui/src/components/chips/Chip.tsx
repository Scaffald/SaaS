import { styled, Text } from 'tamagui'

export const Chip = styled(Text, {
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
  } as const,

  defaultVariants: {
    variant: 'default',
  },
})
