import React, { useState, useEffect } from 'react'
import {
  YStack,
  XStack,
  Text,
  Button,
  Input,
  H4,
  Switch,
  Slider,
  Checkbox,
  ScrollView,
  Spinner,
  AnimatePresence,
} from 'tamagui'
import { useToastController } from '@tamagui/toast'
import { useForm, Controller } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import {
  api,
  type EmploymentProfileFormData,
  DRIVERS_LICENSE_OPTIONS,
  MILITARY_STATUS_OPTIONS,
  AVAILABILITY_OPTIONS,
  profileEmploymentDefaults,
  profileEmploymentInputSchema,
} from '@app/core/utils/api'
import { DashboardWidget, LocationListInput, ToggleCard } from '@app/ui'
import { Flag, MapPin, Plane } from '@tamagui/lucide-icons'

/**
 * Profile Employment Left Component
 * Form for editing employment preferences
 */
export function ProfileEmploymentLeft() {
  const [isLoading, setIsLoading] = useState(false)
  const toast = useToastController()

  // Use tRPC to fetch and update employment data
  const {
    data: employmentData,
    isLoading: isLoadingEmployment,
    refetch,
  } = api.profile.getEmployment.useQuery()
  const updateEmploymentMutation = api.profile.updateEmployment.useMutation({
    onSuccess: () => {
      toast.show('Employment Updated', {
        message: 'Your employment preferences have been saved successfully!',
      })
      refetch()
    },
    onError: (error) => {
      console.error('Error saving employment:', error)
      toast.show('Error', {
        message: error.message || 'Failed to save employment preferences. Please try again.',
      })
    },
  })

  const {
    control,
    handleSubmit,
    formState: { errors, isDirty },
    watch,
    reset,
  } = useForm<EmploymentProfileFormData>({
    resolver: zodResolver(profileEmploymentInputSchema),
    defaultValues: profileEmploymentDefaults,
    mode: 'onChange', // Real-time validation
  })

  const _willingToTravel = watch('willing_to_travel')

  // Reset form when employment data is loaded
  useEffect(() => {
    if (employmentData) {
      reset(employmentData)
    }
  }, [employmentData, reset])

  const onSubmit = async (data: EmploymentProfileFormData) => {
    setIsLoading(true)
    try {
      await updateEmploymentMutation.mutateAsync(data)
    } finally {
      setIsLoading(false)
    }
  }

  if (isLoadingEmployment) {
    return (
      <YStack gap="$4" p="$4" flex={1} justify="center" items="center">
        <Spinner size="large" />
        <Text>Loading employment preferences...</Text>
      </YStack>
    )
  }

  return (
    <YStack>
      <DashboardWidget>
        <YStack gap="$4" p="$4" flex={1}>
          <H4>Employment Preferences</H4>

          <YStack gap="$4">
            {/* Preferred Work Locations */}
            <YStack gap="$3" py="$3">
              <Text fontWeight="600">Preferred Work Locations</Text>
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
                  />
                )}
              />
            </YStack>

            {/* Travel Preferences */}
            <YStack gap="$3">
              <Text fontWeight="600">Travel Preferences</Text>
              <Controller
                name="willing_to_travel"
                control={control}
                render={({ field }) => (
                  <ToggleCard
                    icon={<Plane size="$2" color="$color11" />}
                    title="Willing to Travel"
                    description="I am available for work assignments that require travel"
                    checked={field.value || false}
                    onCheckedChange={field.onChange}
                    expandedContent={
                      <YStack gap="$3" pt="$2">
                        <Text fontSize="$3" fontWeight="500" color="$color11">
                          Maximum Travel Distance
                        </Text>
                        <Controller
                          name="travel_distance_miles"
                          control={control}
                          render={({ field: distanceField }) => (
                            <YStack gap="$3">
                              <Slider
                                value={[distanceField.value || 50]}
                                onValueChange={(value) => distanceField.onChange(value[0])}
                                min={5}
                                max={100}
                                step={5}
                              >
                                <Slider.Track>
                                  <Slider.TrackActive />
                                </Slider.Track>
                                <Slider.Thumb index={0} />
                              </Slider>
                              <XStack justify="space-between" items="center">
                                <Text fontSize="$2" color="$color9">
                                  5 miles
                                </Text>
                                <Text fontSize="$3" fontWeight="600" color="$color12">
                                  {distanceField.value} miles
                                </Text>
                                <Text fontSize="$2" color="$color9">
                                  100 miles
                                </Text>
                              </XStack>
                            </YStack>
                          )}
                        />
                      </YStack>
                    }
                  />
                )}
              />
            </YStack>

            {/* Residency */}
            <YStack gap="$3">
              <Text fontWeight="600">Residency</Text>
              <Controller
                name="us_resident"
                control={control}
                render={({ field }) => (
                  <ToggleCard
                    icon={<Flag size="$2" color="$color11" />}
                    title="US Resident"
                    description="I am a permanent resident of the United States"
                    checked={field.value || false}
                    onCheckedChange={field.onChange}
                  />
                )}
              />
              <Controller
                name="us_passport"
                control={control}
                render={({ field }) => (
                  <ToggleCard
                    icon={<MapPin size="$2" color="$color11" />}
                    title="US Passport"
                    description="I have a valid United States passport"
                    checked={field.value || false}
                    onCheckedChange={field.onChange}
                  />
                )}
              />

              {/* Additional Residency Countries */}
              <YStack gap="$2">
                <Text fontWeight="500">Additional Residency Countries (up to 3)</Text>
                <Controller
                  name="residency_countries"
                  control={control}
                  render={({ field }) => (
                    <YStack gap="$2">
                      {[0, 1, 2].map((index) => (
                        <Input
                          key={index}
                          placeholder={`Country ${index + 1}`}
                          value={field.value?.[index] || ''}
                          onChangeText={(text) => {
                            const current = field.value || []
                            const updated = [...current]
                            if (text) {
                              updated[index] = text
                            } else {
                              updated.splice(index, 1)
                            }
                            field.onChange(updated.filter(Boolean))
                          }}
                        />
                      ))}
                    </YStack>
                  )}
                />
              </YStack>
            </YStack>

            {/* Drivers License */}
            <YStack gap="$3">
              <Text fontWeight="600">Drivers License Classes</Text>
              <Controller
                name="drivers_license_classes"
                control={control}
                render={({ field }) => (
                  <YStack gap="$2">
                    {DRIVERS_LICENSE_OPTIONS.map((license) => (
                      <XStack key={license} gap="$2" items="center">
                        <Checkbox
                          checked={field.value?.includes(license) || false}
                          onCheckedChange={(checked) => {
                            const current = field.value || []
                            if (checked) {
                              field.onChange([...current, license])
                            } else {
                              field.onChange(current.filter((l) => l !== license))
                            }
                          }}
                        />
                        <Text>{license}</Text>
                      </XStack>
                    ))}
                  </YStack>
                )}
              />
            </YStack>

            {/* Military Status */}
            <YStack gap="$3">
              <Text fontWeight="600">Military Status</Text>
              <Controller
                name="military_status"
                control={control}
                render={({ field }) => (
                  <YStack gap="$2">
                    {MILITARY_STATUS_OPTIONS.map((status) => (
                      <XStack key={status} gap="$2" items="center">
                        <Checkbox
                          checked={field.value?.includes(status) || false}
                          onCheckedChange={(checked) => {
                            const current = field.value || []
                            if (checked) {
                              field.onChange([...current, status])
                            } else {
                              field.onChange(current.filter((s) => s !== status))
                            }
                          }}
                        />
                        <Text>{status}</Text>
                      </XStack>
                    ))}
                  </YStack>
                )}
              />
            </YStack>

            {/* Availability */}
            <YStack gap="$3">
              <Text fontWeight="600">Availability</Text>
              <Controller
                name="availability"
                control={control}
                render={({ field }) => (
                  <YStack gap="$2">
                    {AVAILABILITY_OPTIONS.map((option) => (
                      <XStack key={option} gap="$2" items="center">
                        <Checkbox
                          checked={field.value?.includes(option) || false}
                          onCheckedChange={(checked) => {
                            const current = field.value || []
                            if (checked) {
                              field.onChange([...current, option])
                            } else {
                              field.onChange(current.filter((a) => a !== option))
                            }
                          }}
                        />
                        <Text>{option}</Text>
                      </XStack>
                    ))}
                  </YStack>
                )}
              />
            </YStack>

            {/* Hourly Rate */}
            <YStack gap="$2">
              <Text fontWeight="600">Hourly Rate ($)</Text>
              <Controller
                name="hourly_rate"
                control={control}
                render={({ field }) => (
                  <Input
                    placeholder="Hourly rate"
                    value={field.value?.toString() || ''}
                    onChangeText={(text) =>
                      field.onChange(text ? Number.parseFloat(text) : undefined)
                    }
                    keyboardType="numeric"
                    borderColor={errors.hourly_rate ? '$red8' : '$borderColor'}
                  />
                )}
              />
              {errors.hourly_rate && (
                <Text color="$red10" fontSize="$2">
                  {errors.hourly_rate.message}
                </Text>
              )}
            </YStack>

            {/* Save Button */}
            <XStack justify="flex-end" pt="$4">
              <Button
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
                        enterStyle={{
                          scale: 0,
                        }}
                        exitStyle={{
                          scale: 0,
                        }}
                      />
                    </Button.Icon>
                  )}
                </AnimatePresence>
                <Button.Text>{isLoading ? 'Saving...' : 'Save Changes'}</Button.Text>
              </Button>
            </XStack>
          </YStack>
        </YStack>
      </DashboardWidget>
    </YStack>
  )
}
