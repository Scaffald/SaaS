import { YStack, H2, Paragraph } from 'tamagui'

export type ContentWrapperProps = {
  title?: string
  children: React.ReactNode
}

export const ContentWrapper = ({ title, children }: ContentWrapperProps) => (
  <YStack gap="$4" p="$4">
    {title && <H2>{title}</H2>}
    {children}
  </YStack>
)
