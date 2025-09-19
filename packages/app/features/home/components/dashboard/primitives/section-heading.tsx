import { Paragraph, SizableText, XStack, YStack } from '@my/ui'
import type { ComponentProps, ReactNode } from 'react'

export type SectionHeadingProps = {
  title: string
  subtitle?: string
  icon?: ReactNode
  action?: ReactNode
  titleProps?: ComponentProps<typeof SizableText>
}

export const SectionHeading = ({
  title,
  subtitle,
  icon,
  action,
  titleProps,
}: SectionHeadingProps) => {
  return (
    <XStack ai="flex-start" jc="space-between" gap="$3">
      <XStack ai="center" gap="$2" f={1}>
        {icon}
        <YStack gap="$1">
          <SizableText fontWeight="700" size="$5" lineHeight={20} {...titleProps}>
            {title}
          </SizableText>
          {subtitle ? (
            <Paragraph size="$2" color="$gray11">
              {subtitle}
            </Paragraph>
          ) : null}
        </YStack>
      </XStack>
      {action}
    </XStack>
  )
}
