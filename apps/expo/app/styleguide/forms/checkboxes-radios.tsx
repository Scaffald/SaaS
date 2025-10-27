import { Check } from '@tamagui/lucide-icons'
import { AnchorHeading, ExampleBlock, StyleguidePage } from '../_components'
import { Checkbox, Label, RadioGroup, XStack, YStack } from 'tamagui'

export default function CheckboxesRadiosPage() {
  return (
    <StyleguidePage
      title="Checkboxes & Radios"
      description="Binary inputs styled to match Bootstrap form controls."
    >
      <YStack gap="$6">
        <AnchorHeading description="Checkbox uses Tamagui Checkbox with animated check icon.">
          Checkbox
        </AnchorHeading>
        <ExampleBlock
          title="Checkbox"
          code={`<XStack gap="$2" alignItems="center">\n  <Checkbox id="remember">\n    <Checkbox.Indicator><Check size={12} /></Checkbox.Indicator>\n  </Checkbox>\n  <Label htmlFor="remember">Remember me</Label>\n</XStack>`}
        >
          <XStack gap="$2" alignItems="center">
            <Checkbox id="remember" defaultChecked>
              <Checkbox.Indicator>
                <Check size={12} />
              </Checkbox.Indicator>
            </Checkbox>
            <Label htmlFor="remember">Remember me</Label>
          </XStack>
        </ExampleBlock>

        <AnchorHeading description="RadioGroup supports arrow key navigation.">
          Radios
        </AnchorHeading>
        <ExampleBlock
          title="Radio group"
          code={`<RadioGroup defaultValue="weekly">\n  <RadioGroup.Item value="daily">Daily</RadioGroup.Item>\n  <RadioGroup.Item value="weekly">Weekly</RadioGroup.Item>\n  <RadioGroup.Item value="monthly">Monthly</RadioGroup.Item>\n</RadioGroup>`}
        >
          <RadioGroup defaultValue="weekly">
            <RadioGroup.Item value="daily">Daily</RadioGroup.Item>
            <RadioGroup.Item value="weekly">Weekly</RadioGroup.Item>
            <RadioGroup.Item value="monthly">Monthly</RadioGroup.Item>
          </RadioGroup>
        </ExampleBlock>
      </YStack>
    </StyleguidePage>
  )
}
