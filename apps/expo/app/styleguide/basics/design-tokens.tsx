import { BRAND_COLORS } from '@app/core/assets/brand-colors'
import { config } from '@app/ui'
import { Paragraph, Text, XStack, YStack } from 'tamagui'
import { AnchorHeading, StyleguidePage } from '../_components'

const { tokens } = config
const colorTokens = Object.entries(tokens.color)
const spacingTokens = Object.entries(tokens.space)
const radiusTokens = Object.entries(tokens.radius)
const sizeTokens = Object.entries(tokens.size)

export default function DesignTokensPage() {
  return (
    <StyleguidePage
      title="Design Tokens"
      description="The canonical values surfaced from Tamagui configuration and Scaffald’s brand palette."
    >
      <YStack gap="$6">
        <AnchorHeading description="Brand colors with their semantic mappings." id="brand-colors">
          Brand palette
        </AnchorHeading>
        <XStack flexWrap="wrap" gap="$4">
          {Object.entries(BRAND_COLORS).map(([token, value]) => {
            if (typeof value === 'object' && value !== null && !Array.isArray(value)) {
              return Object.entries(value).map(([subToken, subValue]) => (
                <ColorSwatch key={`${token}-${subToken}`} name={`${token}.${subToken}`} value={subValue as string} />
              ))
            }
            return <ColorSwatch key={token} name={token} value={value as string} />
          })}
        </XStack>

        <AnchorHeading description="Raw tokens pulled from Tamagui’s config." id="semantic-tokens">
          Semantic tokens
        </AnchorHeading>
        <TokenGroup title="Color tokens" tokens={colorTokens} />
        <TokenGroup title="Spacing scale" tokens={spacingTokens} unit="px" />
        <TokenGroup title="Radius scale" tokens={radiusTokens} unit="px" />
        <TokenGroup title="Size scale" tokens={sizeTokens} unit="px" />
      </YStack>
    </StyleguidePage>
  )
}

function resolveTokenValue(raw: unknown) {
  if (raw && typeof raw === 'object' && 'val' in raw) {
    return String((raw as { val: unknown }).val)
  }
  return String(raw)
}

function ColorSwatch({ name, value }: { name: string; value: string }) {
  return (
    <YStack width={150} borderWidth={1} borderColor="$gray5" borderRadius="$5" overflow="hidden">
      <YStack height={64} backgroundColor={value} borderBottomWidth={1} borderColor="$gray5" />
      <YStack padding="$3">
        <Text fontWeight="700">{name}</Text>
        <Text fontFamily="monospace">{value}</Text>
      </YStack>
    </YStack>
  )
}

type TokenEntry = [string, string | number]

function TokenGroup({ title, tokens, unit }: { title: string; tokens: TokenEntry[]; unit?: string }) {
  return (
    <YStack gap="$3">
      <Text fontWeight="700">{title}</Text>
      <XStack flexWrap="wrap" gap="$3">
        {tokens.map(([token, value]) => (
          <YStack key={token} borderWidth={1} borderColor="$gray4" borderRadius="$4" padding="$3" minWidth={160}>
            <Text fontWeight="600">{token}</Text>
            <Paragraph color="$gray11">
              {formatTokenValue(value, unit)}
            </Paragraph>
          </YStack>
        ))}
      </XStack>
    </YStack>
  )
}

function formatTokenValue(value: unknown, unit?: string) {
  const resolved = resolveTokenValue(value)
  if (Number.isFinite(Number(resolved)) && unit) {
    return `${resolved}${unit}`
  }
  return resolved
}
