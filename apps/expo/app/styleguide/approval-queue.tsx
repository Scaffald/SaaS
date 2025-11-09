// @ts-nocheck
import React from 'react'
import { Link } from 'expo-router'
import { Button, Paragraph, Text, View, XStack, YStack } from '@app/ui'
import { TODO_ITEMS } from '@app/styleguide'
import { StyleguidePage } from '@app/styleguide'

export default function ApprovalQueuePage() {
  return (
    <StyleguidePage
      title="Approval queue"
      description="Items flagged during the automated audit that require confirmation before implementation."
    >
      <YStack gap="$5">
        {TODO_ITEMS.map((todo) => (
          <YStack
            key={todo.id}
            borderWidth={1}
            borderColor="$color6"
            borderRadius="$4"
            padding="$4"
            gap="$3"
            nativeID={`todo-${todo.id}`}
          >
            <Text fontSize={18} fontWeight="600" color="$color12">
              {todo.title}
            </Text>
            <Paragraph fontSize={14} color="$color10">
              {todo.summary}
            </Paragraph>
            <Paragraph fontSize={13} color="$color10">
              Suggested implementation: {todo.suggestion}
            </Paragraph>
            <Link href={todo.href} asChild>
              <Text fontSize={13} color="$color9" textDecorationLine="underline">
                View TODO in context
              </Text>
            </Link>
            <XStack gap="$3">
              <Button size="$3">Approve</Button>
              <Button size="$3" bg="$color3" color="$color11">
                Defer
              </Button>
              <Button size="$3" bg="$color3" color="$color11">
                Reject
              </Button>
            </XStack>
          </YStack>
        ))}
        {TODO_ITEMS.length === 0 ? (
          <View padding="$5" borderWidth={1} borderColor="$color6" borderRadius="$4" bg="$color3">
            <Text fontSize={14} color="$color10">
              No pending approvals. 🎉
            </Text>
          </View>
        ) : null}
      </YStack>
    </StyleguidePage>
  )
}
