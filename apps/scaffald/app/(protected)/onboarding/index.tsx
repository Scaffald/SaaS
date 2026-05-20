import { ROUTES } from "@scf/core/constants/routes";
import { US_STATES } from "@scf/core/constants/us-states";
import { ControlledAddressForm } from "@scf/core/forms";
import { useUserLocation } from "@scf/core/hooks";
import {
  usePrerequisites,
  useCompletePrerequisites,
  useIndustries,
} from "@scaffald/sdk/react";
import {
  Button,
  Checkbox,
  ResponsiveSelect,
  Input,
  Separator,
  Spinner,
  Text,
  Row,
  Stack,
  useResponsive,
  useToast,
} from "@scaffald/ui";
import { zodResolver } from "@hookform/resolvers/zod";
import { useRouter } from "expo-router";
import { useEffect, useRef, useState } from "react";
import { Controller, useForm } from "react-hook-form";
import { Pressable, ScrollView } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import {
  type PrerequisitesFormData,
  prerequisitesDefaults,
  prerequisitesSchema,
  USER_TYPE_OPTIONS,
  type UserType,
} from "@scf/core/features/prerequisites/config/prerequisites-schema";

/**
 * OnboardingPage - Full-page prerequisite completion experience
 *
 * Displays required profile information form including:
 * - First and last name
 * - Home address
 * - User types (worker/employer/customer)
 * - Primary industry
 *
 * @returns JSX element
 */
export default function OnboardingPage() {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [proximity, setProximity] = useState<{ lat: number; lng: number } | undefined>();
  const { isMobile } = useResponsive();
  const toast = useToast();
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { requestLocation } = useUserLocation();

  // Optionally bias address autocomplete by user location (after a short delay to avoid blocking or prompting immediately)
  useEffect(() => {
    const t = setTimeout(() => {
      requestLocation()
        .then((loc) => {
          if (!loc) return;
          setProximity({ lat: loc.latitude, lng: loc.longitude });
        })
        .catch(() => {});
    }, 1500);
    return () => clearTimeout(t);
  }, [requestLocation]);

  // Check prerequisites status
  const {
    data: statusData,
    isLoading: isCheckingStatus,
    refetch: refetchStatus,
  } = usePrerequisites();

  // Fetch industries for dropdown
  const { data: industriesData, isLoading: isLoadingIndustries } =
    useIndustries();

  // Complete prerequisites mutation
  const completeMutation = useCompletePrerequisites({
    onSuccess: () => {
      toast.show({
        title: "Profile Complete",
        message: "Your profile has been set up successfully!",
        variant: "success",
      });
      refetchStatus();
      // Redirect to dashboard immediately after completion
      router.replace(ROUTES.DASHBOARD.path);
    },
    onError: (error: { message?: string }) => {
      console.error("Error completing prerequisites:", error);
      toast.show({
        title: "Error",
        message: error.message || "Failed to save profile. Please try again.",
        variant: "error",
      });
    },
  });

  // Form setup
  const {
    control,
    handleSubmit,
    formState: { errors },
    setValue,
    trigger,
    reset,
  } = useForm<PrerequisitesFormData>({
    resolver: zodResolver(prerequisitesSchema),
    defaultValues: prerequisitesDefaults,
    mode: "onSubmit", // Validate on submit instead of onChange to prevent premature validation errors
  });

  const previousPrefillHashRef = useRef<string | null>(null);

  // Populate form with existing data when loaded
  useEffect(() => {
    if (!statusData?.data) {
      return;
    }

    const prefillData: PrerequisitesFormData = {
      first_name: statusData.data.first_name ?? "",
      last_name: statusData.data.last_name ?? "",
      address: {
        street:
          statusData.data.address?.street ??
          prerequisitesDefaults.address.street,
        city:
          statusData.data.address?.city ?? prerequisitesDefaults.address.city,
        state:
          statusData.data.address?.state ?? prerequisitesDefaults.address.state,
        zip: statusData.data.address?.zip ?? prerequisitesDefaults.address.zip,
        country:
          statusData.data.address?.country ??
          prerequisitesDefaults.address.country,
        latitude: statusData.data.address?.latitude,
        longitude: statusData.data.address?.longitude,
      },
      user_types: statusData.data.user_types ?? [],
      industry_id: statusData.data.industry_id ?? "",
      accepts_privacy_policy: prerequisitesDefaults.accepts_privacy_policy,
      accepts_terms_of_service: prerequisitesDefaults.accepts_terms_of_service,
    };

    const prefillHash = JSON.stringify(prefillData);

    if (previousPrefillHashRef.current === prefillHash) {
      return;
    }

    previousPrefillHashRef.current = prefillHash;
    reset(prefillData);
  }, [reset, statusData?.data]);

  // Handle form submission
  const onSubmit = async (data: PrerequisitesFormData) => {
    setIsSubmitting(true);
    try {
      await completeMutation.mutateAsync(data);
    } catch (error) {
      console.error("Submission error:", error);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Stack flex={1}>
      {/* SC-54: sticky header — sits outside the ScrollView so the title and
          subtitle stay anchored while the form scrolls beneath them. */}
      <Stack
        style={{
          paddingTop: insets.top + 16,
          paddingHorizontal: 16,
          paddingBottom: 16,
          borderBottomWidth: 1,
          borderBottomColor: "rgba(0, 0, 0, 0.08)",
          backgroundColor: "white",
        }}
      >
        <Stack maxWidth={600} width="100%" gap={4} style={{ alignSelf: "center" }}>
          <Text weight="semibold">Complete Your Profile</Text>
          <Text color="gray" size="sm">
            Please complete these required fields to continue using Scaffald
          </Text>
        </Stack>
      </Stack>
      <ScrollView style={{ flex: 1 }}>
        <Stack justify="center" align="center" padding={16}>
          <Stack maxWidth={600} width="100%" gap={12} padding={12}>
          {isCheckingStatus ? (
            <Stack gap={10} align="center">
              <Spinner size="lg" color="primary" />
              <Text color="gray">Loading...</Text>
            </Stack>
          ) : (
            <>
              {/* 1. Name Fields */}
              {isMobile ? (
                <Stack gap={12}>
                  <Stack gap={8}>
                    <Text>First Name *</Text>
                    <Controller
                      name="first_name"
                      control={control}
                      render={({ field }) => (
                        <Input
                          placeholder="First name"
                          value={field.value}
                          onChangeText={field.onChange}
                        />
                      )}
                    />
                    {errors.first_name && (
                      <Text color="red">{errors.first_name.message}</Text>
                    )}
                  </Stack>
                  <Stack gap={8}>
                    <Text>Last Name *</Text>
                    <Controller
                      name="last_name"
                      control={control}
                      render={({ field }) => (
                        <Input
                          placeholder="Last name"
                          value={field.value}
                          onChangeText={field.onChange}
                        />
                      )}
                    />
                    {errors.last_name && (
                      <Text color="red">{errors.last_name.message}</Text>
                    )}
                  </Stack>
                </Stack>
              ) : (
                <Row gap={12}>
                  <Stack flex={1} gap={8}>
                    <Text>First Name *</Text>
                    <Controller
                      name="first_name"
                      control={control}
                      render={({ field }) => (
                        <Input
                          placeholder="First name"
                          value={field.value}
                          onChangeText={field.onChange}
                        />
                      )}
                    />
                    {errors.first_name && (
                      <Text color="red">{errors.first_name.message}</Text>
                    )}
                  </Stack>
                  <Stack flex={1} gap={8}>
                    <Text>Last Name *</Text>
                    <Controller
                      name="last_name"
                      control={control}
                      render={({ field }) => (
                        <Input
                          placeholder="Last name"
                          value={field.value}
                          onChangeText={field.onChange}
                        />
                      )}
                    />
                    {errors.last_name && (
                      <Text color="red">{errors.last_name.message}</Text>
                    )}
                  </Stack>
                </Row>
              )}

              <Separator />

              {/* 2. Address */}
              <Stack gap={12}>
                <Text>Address *</Text>
                <Text color="gray">Search and select your home address</Text>
                <ControlledAddressForm
                  control={control}
                  name="address"
                  setValue={setValue}
                  trigger={trigger}
                  placeholder="Search for your address..."
                  manualFieldsVariant="expand"
                  proximity={proximity}
                  lockedCountry="United States"
                  stateOptions={US_STATES}
                  fieldErrors={{
                    street: errors.address?.street?.message,
                    city: errors.address?.city?.message,
                    state: errors.address?.state?.message,
                    zip: errors.address?.zip?.message,
                    country: errors.address?.country?.message,
                  }}
                />
              </Stack>

              <Separator />

              {/* 3. User Types */}
              <Stack gap={12}>
                <Text>I am a (select all that apply) *</Text>
                <Controller
                  name="user_types"
                  control={control}
                  render={({ field }) => (
                    <Stack gap={8}>
                      {USER_TYPE_OPTIONS.map((option) => (
                        <Row key={option.value} gap={12} align="center">
                          <Checkbox
                            checked={field.value?.includes(
                              option.value as UserType
                            )}
                            onChange={(checked: boolean) => {
                              const currentTypes = field.value || [];
                              const newValue = checked
                                ? [...currentTypes, option.value]
                                : currentTypes.filter(
                                    (t) => t !== option.value
                                  );
                              // Use setValue with shouldValidate: false to prevent form-wide validation
                              setValue("user_types", newValue, {
                                shouldValidate: false,
                              });
                            }}
                            size="md"
                          />
                          <Pressable
                            onPress={() => {
                              const currentTypes = field.value || [];
                              const isChecked = currentTypes.includes(
                                option.value as UserType
                              );
                              const newValue = isChecked
                                ? currentTypes.filter((t) => t !== option.value)
                                : [...currentTypes, option.value];
                              // Use setValue with shouldValidate: false to prevent form-wide validation
                              setValue("user_types", newValue, {
                                shouldValidate: false,
                              });
                            }}
                            accessibilityRole="button"
                            style={({ pressed }) => ({
                              flexShrink: 1,
                              opacity: pressed ? 0.7 : 1,
                              alignSelf: "flex-start",
                            })}
                          >
                            <Text
                              nativeID={`checkbox-user-type-${option.value}-label`}
                            >
                              {option.label}
                            </Text>
                          </Pressable>
                        </Row>
                      ))}
                    </Stack>
                  )}
                />
                {errors.user_types && (
                  <Text color="red">{errors.user_types.message}</Text>
                )}
              </Stack>

              <Separator />

              {/* 4. Primary Industry */}
              <Stack gap={12}>
                <Text>Primary Industry *</Text>
                <Controller
                  name="industry_id"
                  control={control}
                  render={({ field }) => (
                    <Stack gap={8}>
                      {isLoadingIndustries ? (
                        <Row gap={8} align="center">
                          <Spinner size="sm" />
                          <Text color="gray">Loading industries...</Text>
                        </Row>
                      ) : industriesData?.data &&
                        industriesData.data.length > 0 ? (
                        <ResponsiveSelect
                          value={field.value || ""}
                          onValueChange={field.onChange}
                          placeholder="Select your industry"
                          options={industriesData.data.map(
                            (industry: { id: string; name: string }) => ({
                              value: industry.id,
                              label: industry.name,
                            })
                          )}
                        />
                      ) : (
                        <Text color="gray">No industries available</Text>
                      )}
                    </Stack>
                  )}
                />
                {errors.industry_id && (
                  <Text color="red">{errors.industry_id.message}</Text>
                )}
              </Stack>

              {/* Submit Button */}
              <Button
                variant="filled"
                color="primary"
                onPress={handleSubmit(onSubmit)}
                disabled={isSubmitting}
                loading={isSubmitting}
                size="lg"
                style={{ marginTop: 8 }}
              >
                {isSubmitting ? "Completing..." : "Complete Profile"}
              </Button>
            </>
          )}
          </Stack>
        </Stack>
      </ScrollView>
    </Stack>
  );
}
