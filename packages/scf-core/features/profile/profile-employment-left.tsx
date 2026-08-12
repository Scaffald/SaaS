import {
  EmploymentAvailabilityCard,
  EmploymentDriversLicenseCard,
  EmploymentHourlyRateCard,
  EmploymentLocationsCard,
  EmploymentMilitaryCard,
  EmploymentResidencyCard,
  EmploymentTravelCard,
} from "@scf/core/features/profile/components/employment-atoms";
import {
  useEmployment,
  useEmploymentUpdateMutationWithSync,
} from "@scf/core/utils/profile-employment-sdk-hooks";
import { DashboardWidget, SkeletonForm, Spinner, Stack, Text } from "@scaffald/ui";
import { useAdaptiveProfileSync } from "./utils/profile-sync-store";

/**
 * Profile Employment Left Component
 * Atomic save-as-you-go: each card saves its own slice on change.
 */
export function ProfileEmploymentLeft() {
  const syncStatus = useAdaptiveProfileSync(300);
  const isSyncing = syncStatus === "syncing";

  const {
    data: employmentData,
    isLoading: isLoadingEmployment,
  } = useEmployment();
  // No overrides: errors surface through the hook's own onError toast, and the
  // hook owns the invalidation. This used to pass an empty `onSuccess` as a
  // place to hang that comment, which — because options were merged by object
  // spread — replaced the hook's onSuccess and deleted the only working
  // invalidation on the page (#586).
  const updateMutation = useEmploymentUpdateMutationWithSync();

  const isSaving = updateMutation.isPending || isSyncing;

  if (isLoadingEmployment) {
    return (
      <Stack gap={16} padding="md">
        <SkeletonForm fields={5} />
      </Stack>
    );
  }

  const data = employmentData ?? {
    hourly_rate: 0,
    preferred_work_locations: [] as string[],
    open_to_travel: true,
    travel_distance_miles: 25,
    us_resident: false,
    us_passport: false,
    drivers_license_classes: [] as string[],
    military_status: [] as string[],
    availability: [] as string[],
  };

  const onSave = updateMutation.mutate;

  return (
    <Stack gap={20}>
      <DashboardWidget>
        <Stack gap={16} padding="md" flex={1}>
          <Text weight="semibold" size="lg">
            Work Preferences
          </Text>
          {isSaving && (
            <Stack
              style={{
                flexDirection: "row",
                alignItems: "center",
                gap: 8,
              }}
            >
              <Spinner variant="ios" size="sm" />
              <Text size="sm" style={{ color: "#637083" }}>
                Saving preferences...
              </Text>
            </Stack>
          )}
          <Stack gap={16}>
            <EmploymentHourlyRateCard
              value={data.hourly_rate ?? 0}
              onSave={onSave}
              isSaving={isSaving}
            />
            <EmploymentLocationsCard
              value={data.preferred_work_locations ?? []}
              onSave={onSave}
              isSaving={isSaving}
            />
            <EmploymentTravelCard
              openToTravel={data.open_to_travel ?? true}
              travelDistanceMiles={data.travel_distance_miles ?? 25}
              onSave={onSave}
              isSaving={isSaving}
            />
          </Stack>
        </Stack>
      </DashboardWidget>

      <DashboardWidget>
        <Stack gap={16} padding="md" flex={1}>
          <Text weight="semibold" size="lg">
            Work Qualifications
          </Text>
          <Stack gap={16}>
            <EmploymentResidencyCard
              usResident={data.us_resident ?? false}
              usPassport={data.us_passport ?? false}
              onSave={onSave}
              isSaving={isSaving}
            />
            <EmploymentDriversLicenseCard
              value={data.drivers_license_classes ?? []}
              onSave={onSave}
              isSaving={isSaving}
            />
            <EmploymentMilitaryCard
              value={data.military_status ?? []}
              onSave={onSave}
              isSaving={isSaving}
            />
            <EmploymentAvailabilityCard
              value={data.availability ?? []}
              onSave={onSave}
              isSaving={isSaving}
            />
          </Stack>
        </Stack>
      </DashboardWidget>
    </Stack>
  );
}
