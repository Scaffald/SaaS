// @ts-nocheck

import { AnchorHeading, ExampleCard, StyleguidePage } from '@app/styleguide'
import { Button, Input, Text, XStack, YStack } from '@app/ui'

export default function FormInputGroupsPage() {
  return (
    <StyleguidePage
      title="Input groups"
      description="Prefix and suffix helpers to mirror Bootstrap 2 input groups using Tamagui stacks."
    >
      <YStack gap="$6">
        <AnchorHeading
          id="input-groups-basic"
          title="Inline addons"
          description="Wrap Input and helper Buttons in an XStack with border radii adjusted for grouping."
        />
        <ExampleCard
          title="URL composer"
          description="Shows prefix, suffix, and segmented button actions."
          code={`<XStack>
  <XStack bg="$color3" paddingHorizontal="$3" alignItems="center">
    <Text>https://</Text>
  </XStack>
  <Input flex={1} placeholder="domain" />
  <Button theme="active">.com</Button>
</XStack>`}
        >
          <YStack gap="$3">
            <XStack borderWidth={1} borderColor="$color6" borderRadius="$4" overflow="hidden">
              <XStack
                paddingHorizontal="$3"
                alignItems="center"
                bg="$color3"
                borderRightWidth={1}
                borderColor="$color6"
              >
                <Text fontSize={13} color="$color11">
                  https://
                </Text>
              </XStack>
              <Input flex={1} placeholder="domain" borderWidth={0} />
              <Button borderRadius={0}>.com</Button>
            </XStack>
            <XStack borderWidth={1} borderColor="$color6" borderRadius="$4" overflow="hidden">
              <Input flex={1} placeholder="Amount" borderWidth={0} keyboardType="numeric" />
              <XStack paddingHorizontal="$3" alignItems="center" bg="$color3">
                <Text fontSize={13} color="$color11">
                  USD
                </Text>
              </XStack>
            </XStack>
          </YStack>
        </ExampleCard>
      </YStack>
    </StyleguidePage>
  )
}
