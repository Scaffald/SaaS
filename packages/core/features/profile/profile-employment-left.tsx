import React, { useState } from 'react'
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
  employmentProfileSchema,
  type EmploymentProfileFormData,
  employmentProfileDefaults,
  DRIVERS_LICENSE_OPTIONS,
  MILITARY_STATUS_OPTIONS,
  AVAILABILITY_OPTIONS,
} from './config'
import { api } from '@app/core/utils/api'
import { DashboardWidget, AddressForm } from '@app/ui'

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
    setValue,
    trigger,
  } = useForm<EmploymentProfileFormData>({
    resolver: zodResolver(employmentProfileSchema),
    defaultValues: employmentProfileDefaults,
    mode: 'onChange', // Real-time validation
  })

  const willingToTravel = watch('willing_to_travel')

  // Reset form when employment data is loaded
  React.useEffect(() => {
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
      <YStack gap="$4" padding="$4" flex={1} justifyContent="center" alignItems="center">
        <Spinner size="large" />
        <Text>Loading employment preferences...</Text>
      </YStack>
    )
  }

  return (
    <ScrollView showsVerticalScrollIndicator={false}>
      <DashboardWidget>
        <YStack gap="$4" padding="$4" flex={1}>
          <H4>Employment Preferences</H4>

          <YStack gap="$4">
            {/* Home Address with Smart Autocomplete */}
            <YStack gap="$3">
              <AddressForm
                mode="hybrid"
                placeholder="Search for your home address..."
                formMethods={{
                  setValue: setValue as (name: string, value: any) => void,
                  trigger: trigger as (name: string) => void,
                }}
                fieldMapping={{
                  street: 'address.street',
                  city: 'address.city',
                  state: 'address.state',
                  zip: 'address.zip',
                  country: 'address.country',
                }}
                error={errors.address?.street?.message || errors.address?.city?.message}
                provider="google"
                zoomLevel="street"
                searchOptions={{
                  types: ['address'],
                  country: 'US',
                }}
              />
            </YStack>

            {/* Preferred Work Locations */}
            <YStack gap="$3">
              <Text fontWeight="600">Preferred Work Locations (up to 3)</Text>
              <Controller
                name="preferred_work_locations"
                control={control}
                render={({ field }) => (
                  <YStack gap="$2">
                    {[0, 1, 2].map((index) => (
                      <Input
                        key={index}
                        placeholder={`Work location ${index + 1}`}
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

            {/* Travel Preferences */}
            <YStack gap="$3">
              <Text fontWeight="600">Travel Preferences</Text>
              <XStack gap="$3" alignItems="center">
                <Text>Willing to travel</Text>
                <Controller
                  name="willing_to_travel"
                  control={control}
                  render={({ field }) => (
                    <Switch checked={field.value} onCheckedChange={field.onChange} />
                  )}
                />
              </XStack>
              {willingToTravel && (
                <YStack gap="$2">
                  <Text>Travel distance (miles)</Text>
                  <Controller
                    name="travel_distance_miles"
                    control={control}
                    render={({ field }) => (
                      <YStack gap="$2">
                        <Slider
                          value={[field.value]}
                          onValueChange={(value) => field.onChange(value[0])}
                          min={10}
                          max={100}
                          step={5}
                        >
                          <Slider.Track>
                            <Slider.TrackActive />
                          </Slider.Track>
                          <Slider.Thumb index={0} />
                        </Slider>
                        <Text fontSize="$2" color="$gray11">
                          {field.value} miles
                        </Text>
                      </YStack>
                    )}
                  />
                </YStack>
              )}
            </YStack>

            {/* Residency */}
            <YStack gap="$3">
              <Text fontWeight="600">Residency</Text>
              <XStack gap="$3" alignItems="center">
                <Text>US Resident</Text>
                <Controller
                  name="us_resident"
                  control={control}
                  render={({ field }) => (
                    <Switch checked={field.value} onCheckedChange={field.onChange} />
                  )}
                />
              </XStack>
              <XStack gap="$3" alignItems="center">
                <Text>US Passport</Text>
                <Controller
                  name="us_passport"
                  control={control}
                  render={({ field }) => (
                    <Switch checked={field.value} onCheckedChange={field.onChange} />
                  )}
                />
              </XStack>

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
                      <XStack key={license} gap="$2" alignItems="center">
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
                      <XStack key={status} gap="$2" alignItems="center">
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
                      <XStack key={option} gap="$2" alignItems="center">
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
                    onChangeText={(text) => field.onChange(text ? parseFloat(text) : undefined)}
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
            <XStack justifyContent="flex-end" paddingTop="$4">
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
    </ScrollView>
  )
}
