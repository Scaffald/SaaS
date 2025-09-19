import { Input, Label, Paragraph, SizableText, XStack, YStack } from '@my/ui'

import { DashboardCard, SectionHeading } from '../primitives'

export const ConcreteCalculatorCard = () => {
  return (
    <DashboardCard gap="$4">
      <SectionHeading title="Calculator" subtitle="Concrete slab" />
      <YStack gap="$3">
        <FieldRow label="Length" suffix="ft" />
        <FieldRow label="Width" suffix="ft" />
        <FieldRow label="Depth" suffix="in" />
        <XStack gap="$3" $sm={{ fd: 'column', gap: '$3' }}>
          <FieldRow label="Turndown depth" suffix="in" flex={1} />
          <FieldRow label="Turndown width" suffix="in" flex={1} />
        </XStack>
        <FieldRow label="Waste percentage" suffix="%" />
        <YStack gap="$1">
          <Label>Volume</Label>
          <SizableText size="$5" fontWeight="700">
            0 CY
          </SizableText>
        </YStack>
      </YStack>
    </DashboardCard>
  )
}

const FieldRow = ({
  label,
  suffix,
  flex = 0,
}: { label: string; suffix?: string; flex?: number }) => {
  return (
    <YStack gap="$1" f={flex}>
      <Label size="$1" color="$gray11">
        {label}
      </Label>
      <XStack ai="center" gap="$2" bw={1} boc="$borderColor" br="$4" px="$3">
        <Input flex={1} borderWidth={0} placeholder="0" keyboardType="numeric" />
        {suffix ? (
          <Paragraph size="$2" color="$gray11">
            {suffix}
          </Paragraph>
        ) : null}
      </XStack>
    </YStack>
  )
}
