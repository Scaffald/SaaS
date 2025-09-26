import { H4, KVTable, Separator, SizableText, YStack, styled } from '@app/ui'

export type ContentSectionProps = {
  /**
   * Section title
   */
  title: string
  /**
   * Section content
   */
  children: React.ReactNode
  /**
   * Whether to show the separator under the title
   */
  showSeparator?: boolean
}

export const ContentSection = ({ title, children, showSeparator = true }: ContentSectionProps) => {
  return (
    <Section>
      <KVTable>
        <YStack gap="$4">
          <H4>{title}</H4>
          {showSeparator && <Separator />}
        </YStack>
        {children}
      </KVTable>
    </Section>
  )
}

const Section = styled(YStack, {
  boc: '$borderColor',
  bw: 1,
  p: '$4',
  br: '$4',
})
