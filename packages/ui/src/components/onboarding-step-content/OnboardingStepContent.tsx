import type { IconProps } from '@tamagui/helpers-icon'
import type { ComponentType } from 'react'
import { H2, Paragraph, YStack } from '@unicornlove/ui'

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
      alignItems="center"
      padding="$8"
      fullscreen
      marginHorizontal="auto"
      justifyContent="center"
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
        marginTop="$5"
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
        marginTop="$4"
        maxWidth={520}
        marginHorizontal="auto"
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
