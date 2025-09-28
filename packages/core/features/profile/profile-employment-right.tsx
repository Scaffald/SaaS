import { useState } from 'react'
import { YStack, XStack, Text, Button, Input, H4, Switch, Slider, Checkbox } from 'tamagui'
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

/**
 * Profile Employment Right Component
 * Form for editing employment preferences
 */
export function ProfileEmploymentRight() {
  const [isLoading, setIsLoading] = useState(false)

  const {
    control,
    handleSubmit,
    formState: { errors, isDirty },
    watch,
  } = useForm<EmploymentProfileFormData>({
    resolver: zodResolver(employmentProfileSchema),
    defaultValues: employmentProfileDefaults,
    mode: 'onChange',
  })

  const willingToTravel = watch('willing_to_travel')

  const onSubmit = async (data: EmploymentProfileFormData) => {
    setIsLoading(true)
    try {
      console.log('Saving employment data:', data)
      await new Promise((resolve) => setTimeout(resolve, 1000))
    } catch (error) {
      console.error('Error saving employment:', error)
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <YStack space="$4" padding="$4" flex={1}>
      <H4>Employment Preferences</H4>

      <YStack space="$4">
        {/* Home Address */}
        <YStack space="$3">
          <Text fontWeight="600">Home Address</Text>
          <YStack space="$2">
            <Controller
              name="address.street"
              control={control}
              render={({ field }) => (
                <Input
                  placeholder="Street address"
                  value={field.value || ''}
                  onChangeText={field.onChange}
                />
              )}
            />
            <XStack space="$2">
              <Controller
                name="address.city"
                control={control}
                render={({ field }) => (
                  <Input
                    placeholder="City"
                    value={field.value || ''}
                    onChangeText={field.onChange}
                    flex={1}
                  />
                )}
              />
              <Controller
                name="address.state"
                control={control}
                render={({ field }) => (
                  <Input
                    placeholder="State"
                    value={field.value || ''}
                    onChangeText={field.onChange}
                    flex={1}
                  />
                )}
              />
            </XStack>
            <XStack space="$2">
              <Controller
                name="address.zip"
                control={control}
                render={({ field }) => (
                  <Input
                    placeholder="ZIP Code"
                    value={field.value || ''}
                    onChangeText={field.onChange}
                    flex={1}
                  />
                )}
              />
              <Controller
                name="address.country"
                control={control}
                render={({ field }) => (
                  <Input
                    placeholder="Country"
                    value={field.value || ''}
                    onChangeText={field.onChange}
                    flex={2}
                  />
                )}
              />
            </XStack>
          </YStack>
        </YStack>

        {/* Travel Preferences */}
        <YStack space="$3">
          <Text fontWeight="600">Travel Preferences</Text>
          <XStack space="$3" alignItems="center">
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
            <YStack space="$2">
              <Text>Travel distance (miles)</Text>
              <Controller
                name="travel_distance_miles"
                control={control}
                render={({ field }) => (
                  <YStack space="$2">
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
        <YStack space="$3">
          <Text fontWeight="600">Residency</Text>
          <XStack space="$3" alignItems="center">
            <Text>US Resident</Text>
            <Controller
              name="us_resident"
              control={control}
              render={({ field }) => (
                <Switch checked={field.value} onCheckedChange={field.onChange} />
              )}
            />
          </XStack>
          <XStack space="$3" alignItems="center">
            <Text>US Passport</Text>
            <Controller
              name="us_passport"
              control={control}
              render={({ field }) => (
                <Switch checked={field.value} onCheckedChange={field.onChange} />
              )}
            />
          </XStack>
        </YStack>

        {/* Drivers License */}
        <YStack space="$3">
          <Text fontWeight="600">Drivers License Classes</Text>
          <Controller
            name="drivers_license_classes"
            control={control}
            render={({ field }) => (
              <YStack space="$2">
                {DRIVERS_LICENSE_OPTIONS.map((license) => (
                  <XStack key={license} space="$2" alignItems="center">
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
        <YStack space="$3">
          <Text fontWeight="600">Military Status</Text>
          <Controller
            name="military_status"
            control={control}
            render={({ field }) => (
              <YStack space="$2">
                {MILITARY_STATUS_OPTIONS.map((status) => (
                  <XStack key={status} space="$2" alignItems="center">
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
        <YStack space="$3">
          <Text fontWeight="600">Availability</Text>
          <Controller
            name="availability"
            control={control}
            render={({ field }) => (
              <YStack space="$2">
                {AVAILABILITY_OPTIONS.map((option) => (
                  <XStack key={option} space="$2" alignItems="center">
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
        <YStack space="$2">
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
          >
            {isLoading ? 'Saving...' : 'Save Changes'}
          </Button>
        </XStack>
      </YStack>
    </YStack>
  )
}
