import { ChevronRight } from '@tamagui/lucide-icons'
import { Anchor, Text, XStack, YStack } from 'tamagui'
import { AnchorHeading, ExampleBlock, StyleguidePage } from '../_components'

export default function BreadcrumbsPage() {
  return (
    <StyleguidePage
      title="Breadcrumbs"
      description="Simple inline navigation mirroring Bootstrap 2 breadcrumb styles."
    >
      <YStack gap="$6">
        <AnchorHeading description="Compose breadcrumbs with XStack and separators.">
          Inline breadcrumbs
        </AnchorHeading>
        <ExampleBlock
          title="Chevron separators"
          code={`<XStack gap="$2" alignItems="center">\n  <Anchor href="/styleguide">Home</Anchor>\n  <ChevronRight size={12} />\n  <Anchor href="/styleguide/components">Components</Anchor>\n  <ChevronRight size={12} />\n  <Text color="$gray11">Breadcrumbs</Text>\n</XStack>`}
        >
          <XStack gap="$2" alignItems="center">
            <Anchor href="/styleguide">Home</Anchor>
            <ChevronRight size={12} />
            <Anchor href="/styleguide/components">Components</Anchor>
            <ChevronRight size={12} />
            <Text color="$gray11">Breadcrumbs</Text>
          </XStack>
        </ExampleBlock>
      </YStack>
    </StyleguidePage>
  )
}
