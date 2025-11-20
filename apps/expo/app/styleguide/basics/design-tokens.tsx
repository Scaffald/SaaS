// @ts-nocheck

import { BRAND_COLORS } from '@app/core/assets/brand-colors'
import { AnchorHeading, StyleguidePage } from '@app/styleguide'
import { config, Paragraph, Text, View, XStack, YStack } from '@app/ui'
import { useMemo } from 'react'

export default function DesignTokensPage() {
  const colorTokens = useMemo(() => Object.entries(config.tokens.color ?? {}), [])
  const spaceTokens = useMemo(() => Object.entries(config.tokens.space ?? {}), [])
  const radiusTokens = useMemo(() => Object.entries(config.tokens.radius ?? {}), [])
  const sizeTokens = useMemo(() => Object.entries(config.tokens.size ?? {}), [])

  return (
    <StyleguidePage
      title="Design tokens"
      description="Live tokens pulled from Tamagui config plus Scaffald brand palette."
    >
      <YStack gap="$6">
        <AnchorHeading
          id="tokens-color"
          title="Color palette"
          description="Combines Tamagui semantic colors with Scaffald brand swatches."
        />
        <YStack gap="$4">
          <Text fontSize={15} fontWeight="600" color="$color11">
            Brand colors
          </Text>
          <XStack gap="$3" flexWrap="wrap">
            {Object.entries(BRAND_COLORS).map(([name, value]) => {
              if (typeof value === 'object') {
                return Object.entries(value).map(([shade, hex]) => (
                  <ColorSwatch
                    key={`${name}-${shade}`}
                    label={`${name}.${shade}`}
                    value={hex as string}
                  />
                ))
              }
              return <ColorSwatch key={name} label={name} value={value as string} />
            })}
          </XStack>
          <Text fontSize={15} fontWeight="600" color="$color11">
            Tamagui tokens
          </Text>
          <XStack gap="$3" flexWrap="wrap">
            {colorTokens.slice(0, 36).map(([token, value]) => (
              <ColorSwatch key={token} label={token} value={String(value)} />
            ))}
          </XStack>
          <Paragraph fontSize={12} color="$color10">
            Tokens source: packages/ui/src/tamagui.config.ts &
            packages/ui/src/themes/scaffald-theme.ts.
          </Paragraph>
        </YStack>
        <AnchorHeading
          id="tokens-space"
          title="Spacing scale"
          description="Map spacing tokens to rem sizes."
        />
        <TokenTable tokens={spaceTokens} unit="px" />
        <AnchorHeading
          id="tokens-radius"
          title="Radii"
          description="Rounded corners derived from Tamagui defaults."
        />
        <TokenTable tokens={radiusTokens} unit="px" />
        <AnchorHeading
          id="tokens-size"
          title="Size scale"
          description="Sizing tokens for icons, avatars, and controls."
        />
        <TokenTable tokens={sizeTokens} unit="px" />
      </YStack>
    </StyleguidePage>
  )
}

type TokenTableProps = {
  tokens: [string, unknown][]
  unit?: string
}

const TokenTable = ({ tokens, unit = '' }: TokenTableProps) => (
  <YStack gap="$3">
    <XStack gap="$3" flexWrap="wrap">
      {tokens.slice(0, 24).map(([token, value]) => (
        <YStack
          key={token}
          padding="$3"
          borderWidth={1}
          borderColor="$color6"
          borderRadius="$4"
          width={140}
          bg="$color2"
          gap={4}
        >
          <Text fontSize={13} fontWeight="600" color="$color11">
            {token}
          </Text>
          <Text fontSize={12} color="$color10">
            {formatTokenValue(value, unit)}
          </Text>
        </YStack>
      ))}
    </XStack>
  </YStack>
)

type ColorSwatchProps = {
  label: string
  value: string
}

const ColorSwatch = ({ label, value }: ColorSwatchProps) => (
  <YStack
    width={140}
    borderRadius="$4"
    borderWidth={1}
    borderColor="$color6"
    overflow="hidden"
    bg="$color2"
  >
    <View height={72} bg={value} />
    <YStack padding="$3" gap={4}>
      <Text fontSize={13} fontWeight="600" color="$color11">
        {label}
      </Text>
      <Text fontSize={12} color="$color10">
        {value}
      </Text>
    </YStack>
  </YStack>
)

const formatTokenValue = (value: unknown, unit: string) => {
  if (typeof value === 'string') {
    return value
  }
  if (typeof value === 'number') {
    return `${value}${unit}`
  }
  if (value && typeof value === 'object' && 'val' in (value as Record<string, unknown>)) {
    const raw = (value as { val?: unknown }).val
    if (typeof raw === 'string' || typeof raw === 'number') {
      return `${raw}${typeof raw === 'number' ? unit : ''}`.trim()
    }
  }
  return JSON.stringify(value)
}
