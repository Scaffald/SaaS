import type { AppRouter } from '@scf/supabase/client-types'
import type { inferRouterOutputs } from '@trpc/server'
import { memo } from 'react'
import { Button, Card, ScrollView, Text, Row, Stack, useThemeContext } from '@scaffald/ui'
import { colors } from '@scaffald/ui/tokens'

type RouterOutputs = inferRouterOutputs<AppRouter>
type BackgroundCheckPackage = RouterOutputs['backgroundChecks']['listPackages'][number]

interface PackageSelectionStepProps {
  packages: BackgroundCheckPackage[] | undefined
  selectedPackageId?: string
  onSelect: (packageId: string) => void
  isLoading: boolean
  onContinue: () => void
}

const formatCurrency = (cents: number | null | undefined) => {
  if (cents == null) return '—'
  return new Intl.NumberFormat(undefined, {
    style: 'currency',
    currency: 'USD',
  }).format(cents / 100)
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

  return (
    <Card
      elevate
      bordered
      backgroundColor={isSelected ? (t === 'dark' ? colors.blue[900] : colors.blue[100]) : colors.bg[t].default}
      borderColor={isSelected ? (t === 'dark' ? colors.blue[300] : colors.blue[600]) : colors.border[t].default}
      borderWidth={2}
      radius="lg"
      padding="md"
      style={{ gap: 12 }}
      onPress={onSelect}
    >
      <Stack gap={8}>
        <Text color={colors.text[t].secondary}>{pkg.display_name}</Text>
        <Text color={colors.text[t].secondary}>{pkg.description}</Text>
        <Row gap={12} align="center">
          <Text color={colors.text[t].secondary}>{formatCurrency(pkg.retail_cost_cents)}</Text>
          <Text color={colors.text[t].secondary}>Platform cost: {formatCurrency(pkg.platform_cost_cents)}</Text>
        </Row>
        <Stack gap={4}>
          <Text color={colors.text[t].secondary}>Components</Text>
          {pkg.components?.length ? (
            pkg.components.map((component: BackgroundCheckPackage['components'][number]) => (
              <Text key={component.id} color={colors.text[t].secondary}>
                • {component.display_name}
              </Text>
            ))
          ) : (
            <Text color={colors.text[t].secondary}>Component list coming soon</Text>
          )}
        </Stack>
      </Stack>
    </Card>
  )
})

export const PackageSelectionStep = memo(function PackageSelectionStep({
  packages,
  selectedPackageId,
  onSelect,
  isLoading,
  onContinue,
}: PackageSelectionStepProps) {
  const { theme } = useThemeContext()
  const t = theme === 'dark' ? 'dark' : 'light'
  const hasSelection = Boolean(selectedPackageId)

  return (
    <Stack gap={16} flex={1}>
      <Stack gap={8}>
        <Text color={colors.text[t].secondary}>Choose a background check package</Text>
        <Text color={colors.text[t].secondary}>
          Select the screening package that best fits your role. You can review the included
          components and pricing before continuing.
        </Text>
      </Stack>

      <ScrollView style={{ flex: 1 }}>
        <Stack gap={12} paddingBottom={24}>
          {isLoading && <Text color={colors.text[t].secondary}>Loading packages…</Text>}
          {!isLoading && (!packages || packages.length === 0) && (
            <Text color={colors.text[t].secondary}>Packages will be available soon. Please check back later.</Text>
          )}
          {packages?.map((pkg) => (
            <PackageCard
              key={pkg.id}
              pkg={pkg}
              isSelected={pkg.id === selectedPackageId}
              onSelect={() => onSelect(pkg.id)}
            />
          ))}
        </Stack>
      </ScrollView>

      <Button size="md" color="primary" disabled={!hasSelection} onPress={onContinue}>
        Continue
      </Button>
    </Stack>
  )
})
