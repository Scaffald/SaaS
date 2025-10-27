import { Info } from '@tamagui/lucide-icons'
import { Tooltip, Button, YStack } from 'tamagui'
import { AnchorHeading, ExampleBlock, StyleguidePage } from '../_components'

export default function TooltipPage() {
  return (
    <StyleguidePage
      title="Tooltip"
      description="Hover/focus tooltips built from Tamagui Tooltip with accessible delays."
    >
      <YStack gap="$6">
        <AnchorHeading description="Tooltips respond to both hover and keyboard focus.">
          Tooltip
        </AnchorHeading>
        <ExampleBlock
          title="Tooltip"
          code={`<Tooltip delay={150}><Tooltip.Trigger asChild><Button chromeless icon={Info} /></Tooltip.Trigger><Tooltip.Content>Helpful context</Tooltip.Content></Tooltip>`}
        >
          <Tooltip delay={150} placement="top">
            <Tooltip.Trigger asChild>
              <Button chromeless icon={Info} />
            </Tooltip.Trigger>
            <Tooltip.Content>
              Helpful context
              <Tooltip.Arrow />
            </Tooltip.Content>
          </Tooltip>
        </ExampleBlock>
      </YStack>
    </StyleguidePage>
  )
}
