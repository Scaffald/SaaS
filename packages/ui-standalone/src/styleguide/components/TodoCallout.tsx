// @ts-nocheck

import { AlertTriangle } from '@tamagui/lucide-icons'
import { Paragraph, Text, View, XStack, YStack } from 'tamagui'
import { TODO_ITEMS } from '../data/todos'

type TodoCalloutProps = {
  id: string
}

export function TodoCallout({ id }: TodoCalloutProps) {
  const todo = TODO_ITEMS.find((item) => item.id === id)

  if (!todo) {
    return null
  }

  return (
    <YStack
      borderWidth={1}
      borderColor="$color9"
      borderRadius="$4"
      bg="$color3"
      padding="$4"
      gap="$3"
      nativeID={`todo-${id}`}
    >
      <XStack gap="$3" alignItems="center">
        <View bg="$color9" borderRadius={999} padding={8}>
          <AlertTriangle size={18} color="var(--color1)" />
        </View>
        <Text fontSize={15} fontWeight="600" color="$color11">
          {/* TODO: */} {todo.title}
        </Text>
      </XStack>
      <Paragraph fontSize={13} color="$color10">
        {todo.summary}
      </Paragraph>
      <Paragraph fontSize={13} color="$color10">
        Suggested default: {todo.suggestion}
      </Paragraph>
      <Text fontSize={12} color="$color9" fontWeight="600">
        This is net-new and requires approval.
      </Text>
    </YStack>
  )
}
