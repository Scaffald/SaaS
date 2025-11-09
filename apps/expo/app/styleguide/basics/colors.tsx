// @ts-nocheck
import React from 'react'
import { Paragraph, Text, YStack } from '@app/ui'
import { StyleguidePage } from '@app/styleguide'
import { AnchorHeading } from '@app/styleguide'
import { BRAND_COLORS } from '@app/core/assets/brand-colors'

const VARIANT_MAP = [
  { variant: 'primary', hex: BRAND_COLORS.primary },
  { variant: 'info', hex: BRAND_COLORS.info },
  { variant: 'success', hex: BRAND_COLORS.success },
  { variant: 'warning', hex: BRAND_COLORS.warning },
  { variant: 'danger', hex: BRAND_COLORS.error },
]

export default function ColorsPage() {
  return (
    <StyleguidePage
      title="Color system"
      description="Bootstrap variant names mapped to Scaffald brand colors and Tamagui tokens."
    >
      <YStack gap="$6">
        <AnchorHeading
          id="color-variants"
          title="Semantic variants"
          description="Use these mappings for buttons, alerts, badges, and progress bars."
        />
        <YStack gap="$3">
          {VARIANT_MAP.map((item) => (
            <VariantRow key={item.variant} label={item.variant} hex={item.hex} />
          ))}
        </YStack>
        <AnchorHeading
          id="color-neutral"
          title="Neutral palette"
          description="Gray scale powering backgrounds, borders, and text."
        />
        <YStack gap="$2">
          {Object.entries(BRAND_COLORS.gray).map(([shade, hex]) => (
            <Text key={shade} fontSize={13} color="$color11">
              Gray {shade}: {hex}
            </Text>
          ))}
        </YStack>
        <Paragraph fontSize={12} color="$color10">
          ScaffaldLogo exports gradient tokens for hero components — see
          packages/core/assets/ScaffaldLogo.tsx.
        </Paragraph>
      </YStack>
    </StyleguidePage>
  )
}

type VariantRowProps = {
  label: string
  hex: string
}

const VariantRow = ({ label, hex }: VariantRowProps) => (
  <YStack
    borderWidth={1}
    borderColor="$color6"
    borderRadius="$4"
    overflow="hidden"
    backgroundColor="$color2"
  >
    <YStack height={60} backgroundColor={hex} />
    <YStack padding="$3" gap={4}>
      <Text fontSize={13} fontWeight="600" color="$color11">
        {label}
      </Text>
      <Text fontSize={12} color="$color10">
        {hex}
      </Text>
    </YStack>
  </YStack>
)
