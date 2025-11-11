import { memo } from "react";
import { Button, Card, ScrollView, Text, XStack, YStack } from "tamagui";

import type { BackgroundCheckPaidBy } from "../hooks/useBackgroundCheckForm";
import type { inferRouterOutputs } from "@trpc/server";
import type { AppRouter } from "@app/supabase/client-types";

type RouterOutputs = inferRouterOutputs<AppRouter>;
type BackgroundCheckPackage = RouterOutputs["backgroundChecks"]["listPackages"][number];

interface PackageSelectionStepProps {
  packages: BackgroundCheckPackage[] | undefined;
  selectedPackageId?: string;
  onSelect: (packageId: string) => void;
  isLoading: boolean;
  onContinue: () => void;
}

const formatCurrency = (cents: number | null | undefined) => {
  if (cents == null) return "—";
  return new Intl.NumberFormat(undefined, {
    style: "currency",
    currency: "USD",
  }).format(cents / 100);
};

const PackageCard = memo(function PackageCard({
  pkg,
  isSelected,
  onSelect,
}: {
  pkg: BackgroundCheckPackage;
  isSelected: boolean;
  onSelect: () => void;
}) {
  return (
    <Card
      elevate
      bordered
      backgroundColor={isSelected ? "$blue3" : "$background"}
      borderColor={isSelected ? "$blue8" : "$borderColor"}
      borderWidth={2}
      borderRadius="$4"
      padding="$4"
      gap="$3"
      onPress={onSelect}
    >
      <YStack gap="$2">
        <Text fontSize="$6" fontWeight="bold" color="$color12">
          {pkg.display_name}
        </Text>
        <Text fontSize="$3" color="$color11">
          {pkg.description}
        </Text>
        <XStack gap="$3" alignItems="center">
          <Text fontSize="$4" fontWeight="bold" color="$color12">
            {formatCurrency(pkg.retail_cost_cents)}
          </Text>
          <Text fontSize="$2" color="$color10">
            Platform cost: {formatCurrency(pkg.platform_cost_cents)}
          </Text>
        </XStack>
        <YStack gap="$1">
          <Text fontSize="$2" color="$color10" fontWeight="bold">
            Components
          </Text>
          {pkg.components?.length ? (
            pkg.components.map((component) => (
              <Text key={component.id} fontSize="$2" color="$color11">
                • {component.display_name}
              </Text>
            ))
          ) : (
            <Text fontSize="$2" color="$color9">
              Component list coming soon
            </Text>
          )}
        </YStack>
      </YStack>
    </Card>
  );
});

export const PackageSelectionStep = memo(function PackageSelectionStep({
  packages,
  selectedPackageId,
  onSelect,
  isLoading,
  onContinue,
}: PackageSelectionStepProps) {
  const hasSelection = Boolean(selectedPackageId);

  return (
    <YStack gap="$4" flex={1}>
      <YStack gap="$2">
        <Text fontSize="$6" fontWeight="bold" color="$color12">
          Choose a background check package
        </Text>
        <Text fontSize="$3" color="$color11">
          Select the screening package that best fits your role. You can review the included
          components and pricing before continuing.
        </Text>
      </YStack>

      <ScrollView flex={1}>
        <YStack gap="$3" paddingBottom="$6">
          {isLoading && (
            <Text fontSize="$3" color="$color10">
              Loading packages…
            </Text>
          )}
          {!isLoading && (!packages || packages.length === 0) && (
            <Text fontSize="$3" color="$color10">
              Packages will be available soon. Please check back later.
            </Text>
          )}
          {packages?.map((pkg) => (
            <PackageCard
              key={pkg.id}
              pkg={pkg}
              isSelected={pkg.id === selectedPackageId}
              onSelect={() => onSelect(pkg.id)}
            />
          ))}
        </YStack>
      </ScrollView>

      <Button
        size="$4"
        theme="blue"
        disabled={!hasSelection}
        onPress={onContinue}
      >
        Continue
      </Button>
    </YStack>
  );
});


