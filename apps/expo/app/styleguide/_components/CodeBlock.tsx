import { useCallback, useState } from 'react'
import { Button, Paragraph, Text, XStack, YStack } from 'tamagui'
import { Clipboard, Check } from '@tamagui/lucide-icons'

export type CodeBlockProps = {
  code: string
  language?: string
}

export function CodeBlock({ code, language = 'tsx' }: CodeBlockProps) {
  const [copied, setCopied] = useState(false)

  const handleCopy = useCallback(async () => {
    try {
      if (typeof navigator === 'undefined' || !navigator.clipboard) {
        throw new Error('Clipboard API not available')
      }
      await navigator.clipboard.writeText(code)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    } catch (error) {
      console.error('Failed to copy code', error)
    }
  }, [code])

  return (
    <YStack
      borderWidth={1}
      borderColor="$gray5"
      borderRadius="$5"
      overflow="hidden"
      backgroundColor="$color"
    >
      <XStack justifyContent="space-between" alignItems="center" padding="$3" backgroundColor="$gray2">
        <Text fontSize={12} fontWeight="600">
          {language.toUpperCase()}
        </Text>
        <Button size="$2" chromeless icon={copied ? Check : Clipboard} onPress={handleCopy}>
          {copied ? 'Copied' : 'Copy'}
        </Button>
      </XStack>
      <Paragraph
        fontFamily="monospace"
        backgroundColor="$gray1"
        padding="$4"
        whiteSpace="pre-wrap"
        fontSize={13}
      >
        {code}
      </Paragraph>
    </YStack>
  )
}
