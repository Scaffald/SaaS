import type { AppRouter } from '@scf/supabase/client-types'
import type { inferRouterOutputs } from '@trpc/server'
import { memo } from 'react'
import { Pressable, View } from 'react-native'
import { Card, Grid, H3, Text, Row, Stack, useThemeContext } from '@scaffald/ui'
import { colors, fontSize } from '@scaffald/ui/tokens'

type RouterOutputs = inferRouterOutputs<AppRouter>
type BackgroundCheckPackage = RouterOutputs['backgroundChecks']['listPackages'][number]

interface PackageSelectionStepProps {
  packages: BackgroundCheckPackage[] | undefined
  selectedPackageId?: string
  onSelect: (packageId: string) => void
  isLoading: boolean
}

const formatCurrency = (cents: number | null | undefined) => {
  if (cents == null) return '—'
  return new Intl.NumberFormat(undefined, {
    style: 'currency',
    currency: 'USD',
  }).format(cents / 100)
}

/** The provider's own turnaround, when the catalog has one. */
function turnaround(pkg: BackgroundCheckPackage): string | null {
  const days = (pkg as unknown as { estimated_completion_days?: number | null })
    .estimated_completion_days
  if (typeof days !== 'number' || days <= 0) return null
  return days === 1 ? 'Usually 1 day' : `Usually ${days} days`
}

/** A radio dot: hollow until chosen. */
function RadioDot({ checked, color }: { checked: boolean; color: string }) {
  return (
    <View
      style={{
        width: 12,
        height: 12,
        borderRadius: 6,
        borderWidth: 1.5,
        borderColor: color,
        backgroundColor: checked ? color : 'transparent',
      }}
    />
  )
}

const PackageCard = memo(function PackageCard({
  pkg,
  isSelected,
  onSelect,
}: {
  pkg: BackgroundCheckPackage
  isSelected: boolean
  onSelect: () => void
}) {
  const { theme } = useThemeContext()
  const t = theme === 'dark' ? 'dark' : 'light'

  // `platform_cost_cents` is what the platform pays the screening provider —
  // an internal margin shown only in the admin catalog, never to the worker.
  // The worker pays `retail_cost_cents`.
  const components = pkg.components ?? []
  const kicker = turnaround(pkg)
  const selectTone = isSelected ? colors.text[t].emphasis : colors.text[t].tertiary

  return (
    // The Card draws the surface; the Pressable around it carries the radio
    // semantics, which Card has no props for.
    <Pressable
      onPress={onSelect}
      accessibilityRole="radio"
      accessibilityState={{ checked: isSelected }}
      accessibilityLabel={`${pkg.display_name}, ${formatCurrency(pkg.retail_cost_cents)}${isSelected ? ', selected' : ''}`}
      style={{ height: '100%' }}
    >
      <Card
        bordered
        backgroundColor={isSelected ? colors.bg[t].selected : colors.bg[t].default}
        borderColor={isSelected ? colors.border[t].selected : colors.border[t].default}
        borderWidth={isSelected ? 2 : 1}
        radius="md"
        padding="md"
        style={{ height: '100%' }}
      >
        <Stack gap={10} flex={1}>
          {kicker ? (
            <Text
              style={{
                fontSize: fontSize.h6,
                letterSpacing: 1.4,
                textTransform: 'uppercase',
                color: colors.text[t].attention,
              }}
            >
              {kicker}
            </Text>
          ) : null}
          <Text size="lg" weight="semibold" color={colors.text[t].primary}>
            {pkg.display_name}
          </Text>
          <Text size="xl" weight="semibold" color={colors.text[t].primary}>
            {formatCurrency(pkg.retail_cost_cents)}
          </Text>
          {pkg.description ? (
            <Text size="sm" color={colors.text[t].secondary}>
              {pkg.description}
            </Text>
          ) : null}
          {components.length > 0 && (
            <Stack gap={4}>
              <Text size="sm" weight="medium" color={colors.text[t].secondary}>
                What's checked
              </Text>
              {components.map((component: BackgroundCheckPackage['components'][number]) => (
                <Text key={component.id} size="sm" color={colors.text[t].secondary}>
                  • {component.display_name}
                </Text>
              ))}
            </Stack>
          )}
          <Row gap={8} align="center" style={{ marginTop: 'auto', paddingTop: 4 }}>
            <RadioDot checked={isSelected} color={selectTone} />
            <Text size="sm" color={selectTone}>
              {isSelected ? 'Selected' : 'Select'}
            </Text>
          </Row>
        </Stack>
      </Card>
    </Pressable>
  )
})

/**
 * Choose a package (#1191).
 *
 * The step's title was plain secondary body text, the same as the paragraph
 * under it, and the packages were four full-width rows with no selected
 * affordance beyond a tint. Now: a real heading, and a grid of cards that
 * each say who they are for and what they check, with a radio that reads
 * Select / Selected. Continue lives in the wizard's footer.
 */
export const PackageSelectionStep = memo(function PackageSelectionStep({
  packages,
  selectedPackageId,
  onSelect,
  isLoading,
}: PackageSelectionStepProps) {
  const { theme } = useThemeContext()
  const t = theme === 'dark' ? 'dark' : 'light'

  return (
    <Stack gap={16}>
      <Stack gap={4}>
        <H3 style={{ color: colors.text[t].primary }}>Choose a package</H3>
        <Text style={{ color: colors.text[t].secondary, fontStyle: 'italic' }}>
          Every package is run by NationSearch, our screening partner, under the Fair Credit
          Reporting Act.
        </Text>
      </Stack>

      {isLoading && <Text color={colors.text[t].secondary}>Loading packages…</Text>}
      {!isLoading && (!packages || packages.length === 0) && (
        <Text color={colors.text[t].secondary}>
          Packages will be available soon. Please check back later.
        </Text>
      )}
      {packages && packages.length > 0 ? (
        <Grid columns={{ base: 1, md: 2 }} gap={16} rowGap={16} accessibilityRole="radiogroup">
          {packages.map((pkg) => (
            <PackageCard
              key={pkg.id}
              pkg={pkg}
              isSelected={pkg.id === selectedPackageId}
              onSelect={() => onSelect(pkg.id)}
            />
          ))}
        </Grid>
      ) : null}
    </Stack>
  )
})
