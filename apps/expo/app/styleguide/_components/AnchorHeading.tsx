import { useMemo } from 'react'
import { Anchor, H2, H3, Paragraph, XStack, YStack } from 'tamagui'
import { Link as LinkIcon } from '@tamagui/lucide-icons'

export type AnchorHeadingProps = {
  level?: 2 | 3
  children: string
  id?: string
  description?: string
}

export function AnchorHeading({ level = 2, children, id, description }: AnchorHeadingProps) {
  const anchorId = useMemo(() => {
    if (id) return id
    return children
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/(^-|-$)/g, '')
  }, [children, id])

  const HeadingComponent = level === 2 ? H2 : H3

  return (
    <YStack gap="$2" id={anchorId}>
      <XStack alignItems="center" gap="$2">
        <HeadingComponent>{children}</HeadingComponent>
        <Anchor href={`#${anchorId}`} accessibilityLabel={`Copy link to ${children}`}>
          <LinkIcon size={16} />
        </Anchor>
      </XStack>
      {description && <Paragraph color="$gray11">{description}</Paragraph>}
    </YStack>
  )
}
