import { YStack, H3, Paragraph } from '@app/ui'

export type ContentSectionProps = {
  title?: string
  description?: string
  children: React.ReactNode
}

export const ContentSection = ({ title, description, children }: ContentSectionProps) => (
  <YStack gap="$3">
    {title && <H3>{title}</H3>}
    {description && (
      <Paragraph size="$3" color="$gray11">
        {description}
      </Paragraph>
    )}
    {children}
  </YStack>
)
