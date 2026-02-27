import type { AppRouter } from '@scf/supabase/client-types'
import type { inferRouterOutputs } from '@trpc/server'
import { memo } from 'react'
import { Button, Card, ScrollView, Text, Row, Stack } from '@scaffald/ui'

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
  return (
    <Card
      elevate
      bordered
      backgroundColor={isSelected ? '$blue3' : '$background'}
      borderColor={isSelected ? '$blue8' : '$borderColor'}
      borderWidth={2}
      radius="lg"
      padding="md"
      style={{ gap: 12 }}
      onPress={onSelect}
    >
      <Stack gap={8}>
        <Text color="$gray11">{pkg.display_name}</Text>
        <Text color="$gray11">{pkg.description}</Text>
        <Row gap={12} align="center">
          <Text color="$gray11">{formatCurrency(pkg.retail_cost_cents)}</Text>
          <Text color="$gray11">Platform cost: {formatCurrency(pkg.platform_cost_cents)}</Text>
        </Row>
        <Stack gap={4}>
          <Text color="$gray11">Components</Text>
          {pkg.components?.length ? (
            pkg.components.map((component: BackgroundCheckPackage['components'][number]) => (
              <Text key={component.id} color="$gray11">
                • {component.display_name}
              </Text>
            ))
          ) : (
            <Text color="$gray11">Component list coming soon</Text>
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
  const hasSelection = Boolean(selectedPackageId)

  return (
    <Stack gap={16} flex={1}>
      <Stack gap={8}>
        <Text color="$gray11">Choose a background check package</Text>
        <Text color="$gray11">
          Select the screening package that best fits your role. You can review the included
          components and pricing before continuing.
        </Text>
      </Stack>

      <ScrollView style={{ flex: 1 }}>
        <Stack gap={12} paddingBottom={24}>
          {isLoading && <Text color="$gray11">Loading packages…</Text>}
          {!isLoading && (!packages || packages.length === 0) && (
            <Text color="$gray11">Packages will be available soon. Please check back later.</Text>
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
