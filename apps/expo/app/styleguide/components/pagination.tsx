import { Button, XStack, YStack } from 'tamagui'
import { AnchorHeading, ExampleBlock, StyleguidePage } from '../_components'

export default function PaginationPage() {
  return (
    <StyleguidePage
      title="Pagination"
      description="Numbered pagination controls styled after Bootstrap with Tamagui buttons."
    >
      <YStack gap="$6">
        <AnchorHeading description="Use chromeless buttons to achieve link-style numbers.">
          Numbers
        </AnchorHeading>
        <ExampleBlock
          title="Pagination"
          code={`<XStack gap="$2" alignItems="center">\n  <Button chromeless disabled>Prev</Button>\n  {[1,2,3].map((page) => (\n    <Button key={page} theme={page === 2 ? 'primary' : 'neutral'} chromeless={page !== 2}>\n      {page}\n    </Button>\n  ))}\n  <Button chromeless>Next</Button>\n</XStack>`}
        >
          <XStack gap="$2" alignItems="center">
            <Button chromeless disabled>
              Prev
            </Button>
            {[1, 2, 3].map((page) => (
              <Button key={page} theme={page === 2 ? 'primary' : 'neutral'} chromeless={page !== 2}>
                {page}
              </Button>
            ))}
            <Button chromeless>Next</Button>
          </XStack>
        </ExampleBlock>
      </YStack>
    </StyleguidePage>
  )
}
