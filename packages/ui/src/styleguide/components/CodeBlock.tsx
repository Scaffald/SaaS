// @ts-nocheck

import { Copy } from '@tamagui/lucide-icons'
import { useCallback, useMemo } from 'react'
import { isWeb, ScrollView, Text, View, YStack } from 'tamagui'
import { Button } from '../../components/buttons/Button'

type CodeBlockProps = {
  code: string
  language?: string
  filename?: string
}

export function CodeBlock({ code, language = 'tsx', filename }: CodeBlockProps) {
  const formatted = useMemo(() => code.trim(), [code])

  const handleCopy = useCallback(() => {
    if (!isWeb || typeof navigator === 'undefined') return
    navigator.clipboard
      ?.writeText(formatted)
      .catch((error) => console.warn('Failed to copy code snippet', error))
  }, [formatted])

  return (
    <YStack
      bg="$color3"
      borderWidth={1}
      borderColor="$color6"
      borderRadius="$4"
      overflow="hidden"
      maxWidth="100%"
    >
      <YStack
        paddingHorizontal="$3"
        paddingVertical="$2"
        bg="$color4"
        borderBottomWidth={1}
        borderColor="$color6"
        alignItems="center"
        justify="space-between"
        flexDirection="row"
        gap="$3"
      >
        <Text fontSize={12} color="$color10" fontFamily="monospace">
          {filename ?? `snippet.${language}`}
        </Text>
        <Button size="$2" icon={Copy} onPress={handleCopy}>
          Copy
        </Button>
      </YStack>
      <ScrollView horizontal>
        <View padding="$4" minWidth="100%">
          <Text fontSize={13} fontFamily="monospace" color="$color11" whiteSpace="pre">
            {formatted}
          </Text>
        </View>
      </ScrollView>
    </YStack>
  )
}
