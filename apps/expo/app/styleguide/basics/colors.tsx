import { BRAND_COLORS } from '@app/core/assets/brand-colors'
import { Paragraph, Text, XStack, YStack } from 'tamagui'
import { AnchorHeading, StyleguidePage } from '../_components'

const semanticStates = [
  { name: 'Primary', token: 'primary', usage: 'Primary buttons and links.' },
  { name: 'Info', token: 'info', usage: 'Informational banners and highlights.' },
  { name: 'Success', token: 'success', usage: 'Positive confirmations and toasts.' },
  { name: 'Warning', token: 'warning', usage: 'Caution messages and badge pills.' },
  { name: 'Danger', token: 'error', usage: 'Critical alerts and destructive actions.' },
]

export default function ColorsPage() {
  return (
    <StyleguidePage
      title="Color System"
      description="Bootstrap-style semantic aliases mapped to Scaffald brand colors."
    >
      <YStack gap="$6">
        <AnchorHeading description="Primary palettes derived from brand colors.">
          Semantic mapping
        </AnchorHeading>
        <XStack flexWrap="wrap" gap="$3">
          {semanticStates.map((state) => (
            <ColorCard key={state.name} name={state.name} hex={BRAND_COLORS[state.token as keyof typeof BRAND_COLORS] as string} usage={state.usage} />
          ))}
        </XStack>

        <AnchorHeading description="Neutral grays used for surfaces and typography.">
          Grayscale
        </AnchorHeading>
        <XStack flexWrap="wrap" gap="$3">
          {Object.entries(BRAND_COLORS.gray).map(([tone, hex]) => (
            <ColorCard key={tone} name={`gray.${tone}`} hex={hex} usage="Neutral surfaces and borders." />
          ))}
        </XStack>
      </YStack>
    </StyleguidePage>
  )
}

function ColorCard({ name, hex, usage }: { name: string; hex: string; usage: string }) {
  return (
    <YStack width={180} borderWidth={1} borderColor="$gray5" borderRadius="$5" overflow="hidden">
      <YStack height={80} backgroundColor={hex} borderBottomWidth={1} borderColor="$gray5" />
      <YStack padding="$3" gap="$2">
        <Text fontWeight="700">{name}</Text>
        <Text fontFamily="monospace">{hex}</Text>
        <Paragraph fontSize={12} color="$gray11">
          {usage}
        </Paragraph>
      </YStack>
    </YStack>
  )
}
