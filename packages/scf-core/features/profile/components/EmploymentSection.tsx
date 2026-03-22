import {
  EmploymentAvailabilityCard,
  EmploymentDriversLicenseCard,
  EmploymentHourlyRateCard,
  EmploymentLocationsCard,
  EmploymentMilitaryCard,
  EmploymentResidencyCard,
  EmploymentTravelCard,
} from "@scf/core/features/profile/components/employment-atoms";
import type { UpdateEmploymentParams } from "@scaffald/sdk";
import {
  useOfficeUserEmployment,
  useOfficeUpdateUserEmploymentMutation,
} from "@scf/core/utils/office-users-sdk-hooks";
import {
  useEmployment,
  useEmploymentUpdateMutationWithSync,
} from "@scf/core/utils/profile-employment-sdk-hooks";
import { DashboardWidget, Spinner, Stack, Text } from "@scaffald/ui";
import { useToast } from "@scaffald/ui";

interface EmploymentSectionProps {
  userId?: string;
  mode?: "user" | "admin";
  readOnly?: boolean;
}

/**
 * Shared Employment Section: atomic save-as-you-go.
 * Works in both user dashboard and admin office contexts.
 */
export function EmploymentSection({
  userId,
  mode = "user",
  readOnly = false,
}: EmploymentSectionProps) {
  const toast = useToast();
  const isAdmin = mode === 'admin' && Boolean(userId);

  const profileQuery = useEmployment({ enabled: !isAdmin });
  const officeQuery = useOfficeUserEmployment(userId, { enabled: isAdmin });

  const employmentData = isAdmin ? officeQuery.data : profileQuery.data;
  const isLoadingEmployment = isAdmin
    ? officeQuery.isLoading
    : profileQuery.isLoading;
  const refetch = isAdmin ? officeQuery.refetch : profileQuery.refetch;

  const profileMutation = useEmploymentUpdateMutationWithSync({
    onSuccess: () => {
      toast.show({
        title: "Employment Updated",
        message:
          "Your employment preferences have been saved successfully!",
      });
    },
  });

  const officeMutation = useOfficeUpdateUserEmploymentMutation({
    onSuccess: () => {
      toast.show({
        title: "Employment Updated",
        message: "Employment preferences have been saved successfully!",
      });
      void refetch();
    },
    onError: (error: unknown) => {
      console.error("Error saving employment:", error);
      toast.show({
        title: "Error",
        message:
          error instanceof Error
            ? error.message
            : "Failed to save employment preferences.",
        variant: "error",
      });
    },
  });

  const updateMutation = isAdmin ? officeMutation : profileMutation;
  const isSaving = updateMutation.isPending;

  const onSave = (payload: UpdateEmploymentParams) => {
    if (readOnly) return;
    if (isAdmin && userId) {
      officeMutation.mutate({ userId, data: payload });
    } else {
      profileMutation.mutate(payload);
    }
  };

  if (isLoadingEmployment) {
    return (
      <DashboardWidget>
        <Stack gap={16} padding="md" flex={1} justify="center" align="center">
          <Spinner variant="ios" size="lg" />
          <Text>Loading employment preferences...</Text>
        </Stack>
      </DashboardWidget>
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
  }

  const locations =
    Array.isArray(data.preferred_work_locations) &&
    data.preferred_work_locations.every((x): x is string => typeof x === 'string')
      ? data.preferred_work_locations
      : [];

  return (
    <DashboardWidget>
      <Stack gap={16}>
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
              Saving...
            </Text>
          </Stack>
        )}
        <EmploymentHourlyRateCard
          value={data.hourly_rate ?? 0}
          onSave={onSave}
          isSaving={isSaving}
          disabled={readOnly}
        />
        <EmploymentLocationsCard
          value={locations}
          onSave={onSave}
          isSaving={isSaving}
          disabled={readOnly}
        />
        <EmploymentTravelCard
          openToTravel={data.open_to_travel ?? true}
          travelDistanceMiles={data.travel_distance_miles ?? 25}
          onSave={onSave}
          isSaving={isSaving}
          disabled={readOnly}
        />
        <EmploymentResidencyCard
          usResident={data.us_resident ?? false}
          usPassport={data.us_passport ?? false}
          onSave={onSave}
          isSaving={isSaving}
          disabled={readOnly}
        />
        <EmploymentDriversLicenseCard
          value={data.drivers_license_classes ?? []}
          onSave={onSave}
          isSaving={isSaving}
          disabled={readOnly}
        />
        <EmploymentMilitaryCard
          value={data.military_status ?? []}
          onSave={onSave}
          isSaving={isSaving}
          disabled={readOnly}
        />
        <EmploymentAvailabilityCard
          value={data.availability ?? []}
          onSave={onSave}
          isSaving={isSaving}
          disabled={readOnly}
        />
      </Stack>
    </DashboardWidget>
  );
}
