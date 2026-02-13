import {
  OpenToTravelCard,
  USPassportToggle,
  USResidentToggle,
} from '@scf/core/features/profile/components/employment-fields'
import { api } from '@scf/core/utils/api'
import {
  useEmployment,
  useUpdateEmploymentMutation,
} from '@scf/core/utils/profile-employment-sdk-hooks'
import {
  Button,
  CustomCheckbox,
  DashboardWidget,
  LocationListInput,
  ToggleCard,
} from '@scaffald/ui'
import { zodResolver } from '@hookform/resolvers/zod'
import { Calendar, Car, Shield } from 'lucide-react-native'
import { useToast } from '@scaffald/ui'
import { useEffect, useState } from 'react'
import { Controller, useForm, useWatch } from 'react-hook-form'
import { AnimatePresence, Input, Spinner, Text, Row, Stack } from '@scaffald/ui'
import {
  AVAILABILITY_OPTIONS,
  DRIVERS_LICENSE_OPTIONS,
  type EmploymentProfileFormData,
  employmentProfileDefaults,
  employmentProfileSchema,
  MILITARY_STATUS_OPTIONS,
} from '../config/employment-schema'

interface EmploymentSectionProps {
  /**
   * User ID to edit. If not provided, edits the current user's profile.
   */
  userId?: string
  /**
   * Mode determines which tRPC endpoints to use
   * - 'user': Uses profile.* endpoints (current user)
   * - 'admin': Uses office.* endpoints (any user)
   */
  mode?: 'user' | 'admin'
  /**
   * Read-only mode (view only)
   */
  readOnly?: boolean
}

/**
 * Shared Employment Section Component
 * Works in both user dashboard and admin office contexts
 */
export function EmploymentSection({
  userId,
  mode = 'user',
  readOnly = false,
}: EmploymentSectionProps) {
  const [isLoading, setIsLoading] = useState(false)
  const toast = useToast()

  // Determine which endpoints to use based on mode
  const useQueryHook =
    mode === 'admin' && userId
      ? () => api.office.getUserEmployment.useQuery({ userId })
      : useEmployment

  const useMutationHook =
    mode === 'admin' && userId
      ? () =>
          api.office.updateUserEmployment.useMutation({
            onSuccess: () => {
              toast.show({
                title: 'Employment Updated',
                message: 'Employment preferences have been saved successfully!',
              })
              refetch()
            },
            onError: (error: unknown) => {
              console.error('Error saving employment:', error)
              const _message =
                error instanceof Error ? error.message : 'Failed to save employment preferences.'
              toast.show({
                title: 'Error',
                variant: 'error',
              })
            },
          })
      : () =>
          useUpdateEmploymentMutation({
            onSuccess: () => {
              toast.show({
                title: 'Employment Updated',
                message: 'Your employment preferences have been saved successfully!',
              })
              refetch()
            },
            onError: (error: unknown) => {
              console.error('Error saving employment:', error)
              const _message =
                error instanceof Error ? error.message : 'Failed to save employment preferences.'
              toast.show({
                title: 'Error',
                variant: 'error',
              })
            },
          })

  const { data: employmentData, isLoading: isLoadingEmployment, refetch } = useQueryHook()

  const updateEmploymentMutation = useMutationHook()

  const {
    control,
    handleSubmit,
    formState: { errors, isDirty },
    reset,
    setValue,
  } = useForm<EmploymentProfileFormData>({
    resolver: zodResolver(employmentProfileSchema),
    defaultValues: employmentProfileDefaults,
    mode: 'onChange',
  })

  const travelDistanceMiles = useWatch({
    control,
    name: 'travel_distance_miles',
  })

  // Reset form when employment data is loaded
  useEffect(() => {
    if (employmentData) {
      reset(employmentData)
    }
  }, [employmentData, reset])

  const onSubmit = async (data: EmploymentProfileFormData) => {
    if (readOnly) return

    // Use the user's selection for open_to_travel (defaults to true if not set)
    const updatedData = {
      ...data,
      open_to_travel: data.open_to_travel ?? true,
    }

    setIsLoading(true)
    try {
      if (mode === 'admin' && userId) {
        // Form schema is compatible with API schema but has slightly different structure
        await updateEmploymentMutation.mutateAsync({
          userId,
          data: updatedData as unknown as Parameters<
            typeof updateEmploymentMutation.mutateAsync
          >[0]['data'],
        })
      } else {
        // Form schema is compatible with API schema but has slightly different structure
        await updateEmploymentMutation.mutateAsync(
          updatedData as unknown as Parameters<typeof updateEmploymentMutation.mutateAsync>[0]
        )
      }
    } finally {
      setIsLoading(false)
    }
  }

  if (isLoadingEmployment) {
    return (
      <Stack gap={16} padding="md" flex={1} justify="center" align="center">
        <Spinner size="lg" />
        <Text>Loading employment preferences...</Text>
      </Stack>
    )
  }

  return (
    <DashboardWidget>
      <Stack gap={16}>
        {/* Hourly Rate */}
        <Stack gap={8}>
          <Text>Hourly Rate ($)</Text>
          <Controller
            name="hourly_rate"
            control={control}
            render={({ field }) => (
              <Row gap={12} align="center">
                <Input
                  flex={1}
                  placeholder="Enter your hourly rate"
                  value={field.value?.toString() || '0'}
                  onChangeText={(text) => {
                    const numValue = text ? Number.parseFloat(text) : 0
                    field.onChange(Number.isNaN(numValue) ? 0 : numValue)
                  }}
                  keyboardType="numeric"
                  borderColor={errors.hourly_rate ? '$red8' : '$borderColor'}
                  editable={!readOnly}
                  opacity={readOnly ? 0.7 : 1}
                />
              </Row>
            )}
          />
          {errors.hourly_rate && <Text color="$red10">{errors.hourly_rate.message}</Text>}
        </Stack>

        {/* Preferred Work Locations */}
        <Stack gap={12} paddingVertical={12}>
          <Text>Preferred Work Locations</Text>
          <Controller
            name="preferred_work_locations"
            control={control}
            render={({ field }) => (
              <LocationListInput
                value={field.value || []}
                onChange={field.onChange}
                maxLocations={3}
                helpText="You can add up to three locations. This can be as broad as in a state or county, or specific to a city."
                placeholder="Search for a work location..."
                provider="mapbox"
                apiKey={process.env.EXPO_PUBLIC_MAPBOX_TOKEN}
                disabled={readOnly}
              />
            )}
          />
        </Stack>

        {/* Travel Preferences */}
        <Stack gap={12}>
          <Text>Travel Preferences</Text>
          <Controller
            name="open_to_travel"
            control={control}
            render={({ field: openToTravelField }) => (
              <OpenToTravelCard
                checked={openToTravelField.value ?? true}
                onChange={openToTravelField.onChange}
                travelDistanceValue={travelDistanceMiles ?? 25}
                onTravelDistanceChange={(value) => {
                  setValue('travel_distance_miles', value, { shouldValidate: true })
                }}
                disabled={readOnly}
              />
            )}
          />
          <Controller name="travel_distance_miles" control={control} render={() => <></>} />
        </Stack>

        {/* Residency */}
        <Stack gap={12}>
          <Text>Residency</Text>
          <Controller
            name="us_resident"
            control={control}
            render={({ field }) => (
              <USResidentToggle
                checked={field.value || false}
                onChange={field.onChange}
                disabled={readOnly}
              />
            )}
          />
          <Controller
            name="us_passport"
            control={control}
            render={({ field }) => (
              <USPassportToggle
                checked={field.value || false}
                onChange={field.onChange}
                disabled={readOnly}
              />
            )}
          />
        </Stack>

        {/* Drivers License */}
        <Stack gap={12}>
          <Text>Driver's License</Text>
          <Controller
            name="drivers_license_classes"
            control={control}
            render={({ field }) => {
              const [isExpanded, setIsExpanded] = useState(
                !!(field.value && field.value.length > 0)
              )

              return (
                <ToggleCard
                  iconStart={<Car size="xs" color="$gray11" />}
                  title="I have a valid driver's license"
                  description="Class D (standard license) is automatically selected. Add any additional classes below."
                  checked={isExpanded}
                  onChange={(checked: boolean) => {
                    if (readOnly) return
                    setIsExpanded(checked)
                    if (checked) {
                      // Auto-select Class D when toggle is checked
                      field.onChange(['Class D'])
                    } else {
                      field.onChange([])
                    }
                  }}
                  disabled={readOnly}
                  expandedContent={
                    <Stack gap={8} paddingTop={8}>
                      {DRIVERS_LICENSE_OPTIONS.map((license) => (
                        <Row key={license} gap={12} align="center">
                          <CustomCheckbox
                            checked={field.value?.includes(license) || false}
                            onChange={(checked: boolean) => {
                              if (readOnly) return
                              const current = field.value || []
                              if (checked) {
                                field.onChange([...current, license])
                              } else {
                                const filtered = current.filter((l) => l !== license)
                                field.onChange(filtered)
                              }
                            }}
                            disabled={readOnly}
                            aria-label={
                              license === 'Class D'
                                ? "Class D (standard driver's license)"
                                : `Class ${license}`
                            }
                          />
                          <Text
                            onPress={() => {
                              if (readOnly) return
                              const current = field.value || []
                              const isChecked = current.includes(license)
                              if (isChecked) {
                                const filtered = current.filter((l) => l !== license)
                                field.onChange(filtered)
                              } else {
                                field.onChange([...current, license])
                              }
                            }}
                          >
                            {license === 'Class D'
                              ? "Class D (standard driver's license)"
                              : `Class ${license}`}
                          </Text>
                        </Row>
                      ))}
                    </Stack>
                  }
                />
              )
            }}
          />
        </Stack>

        {/* Military Status */}
        <Stack gap={12}>
          <Text>Military Status</Text>
          <Controller
            name="military_status"
            control={control}
            render={({ field }) => {
              const [isExpanded, setIsExpanded] = useState(
                !!(field.value && field.value.length > 0)
              )

              return (
                <ToggleCard
                  iconStart={<Shield size="xs" color="$gray11" />}
                  title="Former/Current Military"
                  description="Select all that apply"
                  checked={isExpanded}
                  onChange={(checked: boolean) => {
                    if (readOnly) return
                    setIsExpanded(checked)
                    if (!checked) {
                      field.onChange([])
                    }
                  }}
                  disabled={readOnly}
                  expandedContent={
                    <Stack gap={8} paddingTop={8}>
                      {MILITARY_STATUS_OPTIONS.map((status) => (
                        <Row key={status} gap={12} align="center">
                          <CustomCheckbox
                            checked={field.value?.includes(status) || false}
                            onChange={(checked: boolean) => {
                              if (readOnly) return
                              const current = field.value || []
                              if (checked) {
                                field.onChange([...current, status])
                              } else {
                                field.onChange(current.filter((s) => s !== status))
                              }
                            }}
                            disabled={readOnly}
                            aria-label={status}
                          />
                          <Text>{status}</Text>
                        </Row>
                      ))}
                    </Stack>
                  }
                />
              )
            }}
          />
        </Stack>

        {/* Availability */}
        <Stack gap={12}>
          <Text>Availability</Text>
          <Controller
            name="availability"
            control={control}
            render={({ field }) => {
              const [isExpanded, setIsExpanded] = useState(
                !!(field.value && field.value.length > 0)
              )

              return (
                <ToggleCard
                  iconStart={<Calendar size="xs" color="$gray11" />}
                  title="I'm available for work"
                  description="Select all that apply"
                  checked={isExpanded}
                  onChange={(checked: boolean) => {
                    if (readOnly) return
                    setIsExpanded(checked)
                    if (!checked) {
                      field.onChange([])
                    }
                  }}
                  disabled={readOnly}
                  expandedContent={
                    <Stack gap={8} paddingTop={8}>
                      {AVAILABILITY_OPTIONS.map((option) => (
                        <Row key={option} gap={12} align="center">
                          <CustomCheckbox
                            checked={field.value?.includes(option) || false}
                            onChange={(checked: boolean) => {
                              if (readOnly) return
                              const current = field.value || []
                              if (checked) {
                                field.onChange([...current, option])
                              } else {
                                field.onChange(current.filter((a) => a !== option))
                              }
                            }}
                            disabled={readOnly}
                            aria-label={option}
                          />
                          <Text>{option}</Text>
                        </Row>
                      ))}
                    </Stack>
                  }
                />
              )
            }}
          />
        </Stack>

        {/* Save Button */}
        {!readOnly && (
          <Row justify="flex-end" paddingTop={16}>
            <Button
              variant="filled" color="primary"
              onPress={handleSubmit(onSubmit)}
              disabled={!isDirty || isLoading}
              opacity={!isDirty || isLoading ? 0.5 : 1}
              space={isLoading ? '$2' : 0}
            >
              <AnimatePresence>
                {isLoading && (
                  <Button.Icon>
                    <Spinner
                      animation="bouncy"
                      enterStyle={{ scale: 0 }}
                      exitStyle={{ scale: 0 }}
                    />
                  </Button.Icon>
                )}
              </AnimatePresence>
              <Button.Text>{isLoading ? 'Saving...' : 'Save Changes'}</Button.Text>
            </Button>
          </Row>
        )}
      </Stack>
    </DashboardWidget>
  )
}
