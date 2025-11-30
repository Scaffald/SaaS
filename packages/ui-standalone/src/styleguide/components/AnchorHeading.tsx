// @ts-nocheck

import { Link2 } from '@tamagui/lucide-icons'
import { useCallback } from 'react'
import { H2, H3, isWeb, Paragraph, Text, XStack, YStack } from 'tamagui'
import { Button } from '../../components/buttons/Button'

type AnchorHeadingProps = {
  id: string
  level?: 2 | 3
  title: string
  description?: string
}

export function AnchorHeading({ id, level = 2, title, description }: AnchorHeadingProps) {
  const handleCopy = useCallback(() => {
    if (!isWeb || typeof window === 'undefined') return
    const url = new URL(window.location.href)
    url.hash = id
    if (navigator.clipboard) {
      navigator.clipboard.writeText(url.toString()).catch((error) => {
        console.warn('Failed to copy anchor link', error)
      })
    } else {
      window.prompt('Copy link to section', url.toString())
    }
  }, [id])

  const HeadingComponent = level === 2 ? H2 : H3

  return (
    <YStack gap="$2" nativeID={id} aria-label={title}>
      <XStack alignItems="center" gap="$3">
        <HeadingComponent fontSize={level === 2 ? 32 : 24} lineHeight={level === 2 ? 36 : 28}>
          {title}
        </HeadingComponent>
        <Button
          size="$2"
          icon={Link2}
          unstyled
          paddingVertical={6}
          paddingHorizontal={6}
          borderRadius={6}
          hoverStyle={{ backgroundColor: '$color4' }}
          pressStyle={{ backgroundColor: '$color5' }}
          onPress={handleCopy}
          aria-label={`Copy link to ${title}`}
        >
          <Text fontSize={12} color="$color10">
            Copy
          </Text>
        </Button>
      </XStack>
      {description ? (
        <Paragraph fontSize={15} color="$color10">
          {description}
        </Paragraph>
      ) : null}
    </YStack>
  )
}
