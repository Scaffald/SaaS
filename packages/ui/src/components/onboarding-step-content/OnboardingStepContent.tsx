import type { IconProps } from '@tamagui/helpers-icon'
import type { ComponentType } from 'react'
import { YStack } from '@tamagui/stacks'
import { H2, Paragraph } from 'tamagui'

export const StepContent = ({
  icon: Icon,
  title,
  description,
}: {
  icon: ComponentType<IconProps>
  title: string
  description: string
}) => {
  return (
    <YStack
      style={{ alignItems: 'center', justifyContent: 'center' }}
      p="$8"
      fullscreen
      mx="auto"
      animation="100ms"
      exitStyle={{ opacity: 0 }}
      opacity={1}
    >
      <YStack
        animation="lazy"
        y={0}
        enterStyle={{ scale: 0.8, y: -10, opacity: 0 }}
        exitStyle={{ scale: 0.8, y: -10, opacity: 0 }}
        opacity={1}
        scale={1}
      >
        <Icon color="$color9" size={96} />
      </YStack>
      <H2
        mt="$5"
        animation="bouncy"
        y={0}
        enterStyle={{ scale: 0.95, y: 4, opacity: 0 }}
        exitStyle={{ scale: 0.95, y: 4, opacity: 0 }}
        opacity={1}
        scale={1}
        size="$10"
        color="$color10"
        selectable={false}
        style={{ textAlign: 'center' }}
        $md={{
          size: '$10',
          marginTop: '$4',
          color: '$color10',
        }}
      >
        {title}
      </H2>
      <Paragraph
        mt="$4"
        style={{ maxWidth: 520 }}
        mx="auto"
        animation="bouncy"
        y={0}
        enterStyle={{ scale: 0.95, y: -2, opacity: 0 }}
        exitStyle={{ scale: 0.95, y: -2, opacity: 0 }}
        opacity={1}
        scale={1}
        size="$6"
        lineHeight="$8"
        textAlign="center"
        color="$color9"
        selectable={false}
        $md={{
          marginTop: '$3',
          color: '$color9',
        }}
      >
        {description}
      </Paragraph>
    </YStack>
  )
}
