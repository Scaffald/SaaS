import { useState } from 'react'
import { YStack, XStack, Text, Button, Input, H4, TextArea, ScrollView } from 'tamagui'
import { useForm, Controller, useFieldArray } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { Plus, X } from '@tamagui/lucide-icons'
import { DashboardWidget } from '@app/ui'
import {
  certificationsProfileSchema,
  type CertificationsProfileFormData,
  certificationsProfileDefaults,
  createNewCertification,
} from './config'

/**
 * Profile Certifications Left Component
 * Form for managing certifications and credentials
 */
export function ProfileCertificationsLeft() {
  const [isLoading, setIsLoading] = useState(false)

  const {
    control,
    handleSubmit,
    formState: { errors, isDirty },
  } = useForm<CertificationsProfileFormData>({
    resolver: zodResolver(certificationsProfileSchema),
    defaultValues: certificationsProfileDefaults,
    mode: 'onChange',
  })

  const { fields, append, remove } = useFieldArray({
    control,
    name: 'certifications',
  })

  const onSubmit = async (data: CertificationsProfileFormData) => {
    setIsLoading(true)
    try {
      console.log('Saving certifications data:', data)
      await new Promise((resolve) => setTimeout(resolve, 1000))
    } catch (error) {
      console.error('Error saving certifications:', error)
    } finally {
      setIsLoading(false)
    }
  }

  const addCertification = () => {
    append(createNewCertification())
  }

  return (
    <DashboardWidget>
      <H4>Certifications & Credentials</H4>

      <YStack gap="$4">
        {/* Certifications List */}
        <YStack gap="$3">
          <XStack justify="space-between" items="center">
            <Text fontWeight="600">Your Certifications</Text>
            <Button size="$3" onPress={addCertification} icon={Plus}>
              Add Certification
            </Button>
          </XStack>

          {fields.map((field, index) => (
            <YStack
              key={field.id}
              gap="$3"
              p="$3"
              borderWidth={1}
              borderColor="$borderColor"
              rounded="$4"
            >
              <XStack justify="space-between" items="center">
                <Text fontWeight="600">Certification {index + 1}</Text>
                <Button size="$2" variant="outlined" onPress={() => remove(index)} icon={X}>
                  Remove
                </Button>
              </XStack>

              {/* Certification Name */}
              <YStack gap="$2">
                <Text>Certification Name *</Text>
                <Controller
                  name={`certifications.${index}.name`}
                  control={control}
                  render={({ field }) => (
                    <Input
                      placeholder="e.g. AWS Certified Solutions Architect"
                      value={field.value}
                      onChangeText={field.onChange}
                      borderColor={errors.certifications?.[index]?.name ? '$red8' : '$borderColor'}
                    />
                  )}
                />
                {errors.certifications?.[index]?.name && (
                  <Text color="$red10" fontSize="$2">
                    {errors.certifications[index]?.name?.message}
                  </Text>
                )}
              </YStack>

              {/* Issuing Organization */}
              <YStack gap="$2">
                <Text>Issuing Organization *</Text>
                <Controller
                  name={`certifications.${index}.issuing_organization`}
                  control={control}
                  render={({ field }) => (
                    <Input
                      placeholder="e.g. Amazon Web Services"
                      value={field.value}
                      onChangeText={field.onChange}
                      borderColor={
                        errors.certifications?.[index]?.issuing_organization
                          ? '$red8'
                          : '$borderColor'
                      }
                    />
                  )}
                />
                {errors.certifications?.[index]?.issuing_organization && (
                  <Text color="$red10" fontSize="$2">
                    {errors.certifications[index]?.issuing_organization?.message}
                  </Text>
                )}
              </YStack>

              {/* Issue and Expiration Dates */}
              <XStack gap="$3">
                <YStack gap="$2" flex={1}>
                  <Text>Issue Date</Text>
                  <Controller
                    name={`certifications.${index}.issue_date`}
                    control={control}
                    render={({ field }) => (
                      <Input
                        placeholder="YYYY-MM-DD"
                        value={field.value || ''}
                        onChangeText={field.onChange}
                      />
                    )}
                  />
                </YStack>
                <YStack gap="$2" flex={1}>
                  <Text>Expiration Date</Text>
                  <Controller
                    name={`certifications.${index}.expiration_date`}
                    control={control}
                    render={({ field }) => (
                      <Input
                        placeholder="YYYY-MM-DD"
                        value={field.value || ''}
                        onChangeText={field.onChange}
                      />
                    )}
                  />
                </YStack>
              </XStack>

              {/* Credential ID and URL */}
              <XStack gap="$3">
                <YStack gap="$2" flex={1}>
                  <Text>Credential ID</Text>
                  <Controller
                    name={`certifications.${index}.credential_id`}
                    control={control}
                    render={({ field }) => (
                      <Input
                        placeholder="Certificate ID"
                        value={field.value || ''}
                        onChangeText={field.onChange}
                      />
                    )}
                  />
                </YStack>
                <YStack gap="$2" flex={1}>
                  <Text>Credential URL</Text>
                  <Controller
                    name={`certifications.${index}.credential_url`}
                    control={control}
                    render={({ field }) => (
                      <Input
                        placeholder="https://..."
                        value={field.value || ''}
                        onChangeText={field.onChange}
                        borderColor={
                          errors.certifications?.[index]?.credential_url ? '$red8' : '$borderColor'
                        }
                      />
                    )}
                  />
                  {errors.certifications?.[index]?.credential_url && (
                    <Text color="$red10" fontSize="$2">
                      {errors.certifications[index]?.credential_url?.message}
                    </Text>
                  )}
                </YStack>
              </XStack>

              {/* Description */}
              <YStack gap="$2">
                <Text>Description</Text>
                <Controller
                  name={`certifications.${index}.description`}
                  control={control}
                  render={({ field }) => (
                    <TextArea
                      placeholder="Describe what this certification covers..."
                      value={field.value || ''}
                      onChangeText={field.onChange}
                      minH={80}
                    />
                  )}
                />
              </YStack>
            </YStack>
          ))}

          {fields.length === 0 && (
            <YStack p="$4" items="center" gap="$2">
              <Text color="$color11">No certifications added yet</Text>
              <Button onPress={addCertification} icon={Plus}>
                Add Your First Certification
              </Button>
            </YStack>
          )}
        </YStack>

        {/* Save Button */}
        <XStack justify="flex-end" pt="$4">
          <Button
            onPress={handleSubmit(onSubmit)}
            disabled={!isDirty || isLoading}
            opacity={!isDirty || isLoading ? 0.5 : 1}
          >
            {isLoading ? 'Saving...' : 'Save Changes'}
          </Button>
        </XStack>
      </YStack>
    </DashboardWidget>
  )
}
